import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { database } from "./database";
import { rangeColumn, type RangeKind } from "./range-columns";
import type { SpeedBandRow } from "./speed-bands";
import { slowLeaks, type SlowLeak } from "./tire-leak";
import { placeLabel } from "./vehicle";
import { getPlaceStyle, getRangeKind } from "./viewer";

export type BucketUnit = "day" | "week" | "month";

export type StatsBucket = {
  at: Date;
  distanceKm: number;
  minutes: number;
  usedKwh: number;
  chargedKwh: number;
  cost: number | null;
  outsideC: number | null;
  cabinC: number | null;
};

export type DriveTotals = {
  drives: number;
  distanceKm: number;
  minutes: number;
  usedKwh: number;
  speedMaxKmh: number | null;
  longestKm: number | null;
};

export type ChargeTotals = {
  sessions: number;
  addedKwh: number;
  cost: number | null;
};

export type EfficiencyPoint = {
  temperature: number;
  distanceKm: number;
  usedKwh: number;
};

export type PressurePoint = {
  at: Date;
  frontLeft: number | null;
  frontRight: number | null;
  rearLeft: number | null;
  rearRight: number | null;
};

export type SoftwareUpdate = {
  version: string;
  startAt: Date;
  endAt: Date | null;
};

export type LongDrive = {
  id: number;
  startAt: Date;
  distanceKm: number;
  durationMin: number;
  from: string;
  to: string;
};

type Place = {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

function sinceOf(from: Date | null) {
  return (from ?? new Date(0)).toISOString();
}

function usedEnergy(kind: RangeKind) {
  return database()`
    greatest(
      ${rangeColumn(kind, "d", "start")} - ${rangeColumn(kind, "d", "end")},
      0
    ) * car.efficiency
  `;
}

export const statsBuckets = cache(
  async (
    carId: number,
    from: Date | null,
    unit: BucketUnit,
    timeZone: string,
    weekStartsSunday = false,
  ): Promise<StatsBucket[]> => {
    await connection();
    const since = sinceOf(from);
    const shift = unit === "week" && weekStartsSunday ? 1 : 0;
    const used = usedEnergy(await getRangeKind());
    return database()<StatsBucket[]>`
      with first_drive as (
        select min(start_date) at time zone 'UTC' as at
        from drives where car_id = ${carId}
      ),
      bounds as (
        select
          date_trunc(
            ${unit},
            (greatest(
              ${since}::timestamptz,
              coalesce((select at from first_drive), now())
            ) at time zone ${timeZone}) + make_interval(days => ${shift})
          ) - make_interval(days => ${shift}) as first,
          date_trunc(
            ${unit},
            (now() at time zone ${timeZone}) + make_interval(days => ${shift})
          ) - make_interval(days => ${shift}) as last
      ),
      buckets as (
        select generate_series(first, last, ('1 ' || ${unit})::interval)
          as bucket
        from bounds
      ),
      d as (
        select
          date_trunc(
            ${unit},
            ((d.start_date at time zone 'UTC') at time zone ${timeZone})
              + make_interval(days => ${shift})
          ) - make_interval(days => ${shift}) as bucket,
          sum(d.distance) as distance,
          sum(d.duration_min) as minutes,
          sum(${used}) as used,
          sum(d.outside_temp_avg * d.duration_min)
            / nullif(sum(d.duration_min) filter (
              where d.outside_temp_avg is not null
            ), 0) as outside,
          sum(d.inside_temp_avg * d.duration_min)
            / nullif(sum(d.duration_min) filter (
              where d.inside_temp_avg is not null
            ), 0) as cabin
        from drives d
        join cars car on car.id = d.car_id
        where d.car_id = ${carId}
          and d.end_date is not null
          and d.start_date >= (${since}::timestamptz at time zone 'UTC')
        group by 1
      ),
      c as (
        select
          date_trunc(
            ${unit},
            ((start_date at time zone 'UTC') at time zone ${timeZone})
              + make_interval(days => ${shift})
          ) - make_interval(days => ${shift}) as bucket,
          sum(charge_energy_added) as charged,
          sum(cost) as cost
        from charging_processes
        where car_id = ${carId}
          and start_date >= (${since}::timestamptz at time zone 'UTC')
        group by 1
      )
      select
        b.bucket at time zone ${timeZone} as at,
        coalesce(d.distance, 0)::float8 as "distanceKm",
        coalesce(d.minutes, 0)::int as minutes,
        coalesce(d.used, 0)::float8 as "usedKwh",
        coalesce(c.charged, 0)::float8 as "chargedKwh",
        c.cost::float8 as cost,
        d.outside::float8 as "outsideC",
        d.cabin::float8 as "cabinC"
      from buckets b
      left join d on d.bucket = b.bucket
      left join c on c.bucket = b.bucket
      order by b.bucket
    `;
  },
);

export const driveTotals = cache(
  async (carId: number, from: Date | null): Promise<DriveTotals> => {
    await connection();
    const used = usedEnergy(await getRangeKind());
    const [row] = await database()<DriveTotals[]>`
      select
        count(*)::int as drives,
        coalesce(sum(d.distance), 0)::float8 as "distanceKm",
        coalesce(sum(d.duration_min), 0)::int as minutes,
        coalesce(sum(${used}), 0)::float8 as "usedKwh",
        max(d.speed_max)::int as "speedMaxKmh",
        max(d.distance)::float8 as "longestKm"
      from drives d
      join cars car on car.id = d.car_id
      where d.car_id = ${carId}
        and d.end_date is not null
        and d.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
    `;
    return row;
  },
);

export const periodChargeTotals = cache(
  async (carId: number, from: Date | null): Promise<ChargeTotals> => {
    await connection();
    const [row] = await database()<ChargeTotals[]>`
      select
        count(*)::int as sessions,
        coalesce(sum(charge_energy_added), 0)::float8 as "addedKwh",
        sum(cost)::float8 as cost
      from charging_processes
      where car_id = ${carId}
        and charge_energy_added > 0.01
        and start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
    `;
    return row;
  },
);

export const efficiencyPoints = cache(
  async (carId: number, from: Date | null): Promise<EfficiencyPoint[]> => {
    await connection();
    const kind = await getRangeKind();
    const used = usedEnergy(kind);
    return database()<EfficiencyPoint[]>`
      select
        d.outside_temp_avg::float8 as temperature,
        d.distance::float8 as "distanceKm",
        (${used})::float8 as "usedKwh"
      from drives d
      join cars car on car.id = d.car_id
      where d.car_id = ${carId}
        and d.end_date is not null
        and d.distance >= 1
        and d.outside_temp_avg is not null
        and ${rangeColumn(kind, "d", "start")} is not null
        and ${rangeColumn(kind, "d", "end")} is not null
        and d.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      order by d.start_date desc
      limit 2000
    `;
  },
);

export const driveStarts = cache(
  async (
    carId: number,
    from: Date | null,
    timeZone: string,
  ): Promise<{ weekday: number; hour: number; drives: number }[]> => {
    await connection();
    return database()<{ weekday: number; hour: number; drives: number }[]>`
      select
        extract(isodow from local)::int as weekday,
        extract(hour from local)::int as hour,
        count(*)::int as drives
      from (
        select (start_date at time zone 'UTC') at time zone ${timeZone} as local
        from drives
        where car_id = ${carId}
          and end_date is not null
          and start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      ) t
      group by 1, 2
    `;
  },
);

export const pressureTrend = cache(
  async (
    carId: number,
    from: Date | null,
    unit: BucketUnit,
    timeZone: string,
  ): Promise<PressurePoint[]> => {
    await connection();
    return database()<PressurePoint[]>`
      select
        date_trunc(
          ${unit},
          (date at time zone 'UTC') at time zone ${timeZone}
        ) at time zone ${timeZone} as at,
        avg(tpms_pressure_fl)::float8 as "frontLeft",
        avg(tpms_pressure_fr)::float8 as "frontRight",
        avg(tpms_pressure_rl)::float8 as "rearLeft",
        avg(tpms_pressure_rr)::float8 as "rearRight"
      from positions
      where car_id = ${carId}
        and tpms_pressure_fl is not null
        and date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      group by 1
      order by 1
    `;
  },
);

export const softwareUpdates = cache(
  async (carId: number): Promise<SoftwareUpdate[]> => {
    await connection();
    return database()<SoftwareUpdate[]>`
      select
        split_part(version, ' ', 1) as version,
        start_date at time zone 'UTC' as "startAt",
        end_date at time zone 'UTC' as "endAt"
      from updates
      where car_id = ${carId}
      order by start_date desc
      limit 12
    `;
  },
);

export const longestDrives = cache(
  async (carId: number, from: Date | null): Promise<LongDrive[]> => {
    await connection();
    const style = await getPlaceStyle();
    const rows = await database()<
      (Omit<LongDrive, "from" | "to"> & { a: Place; b: Place })[]
    >`
      select
        d.id::int as id,
        d.start_date at time zone 'UTC' as "startAt",
        d.distance::float8 as "distanceKm",
        d.duration_min::int as "durationMin",
        json_build_object(
          'geofence', sg.name, 'name', sa.name, 'road', sa.road,
          'houseNumber', sa.house_number, 'city', sa.city
        ) as a,
        json_build_object(
          'geofence', eg.name, 'name', ea.name, 'road', ea.road,
          'houseNumber', ea.house_number, 'city', ea.city
        ) as b
      from drives d
      left join addresses sa on sa.id = d.start_address_id
      left join addresses ea on ea.id = d.end_address_id
      left join geofences sg on sg.id = d.start_geofence_id
      left join geofences eg on eg.id = d.end_geofence_id
      where d.car_id = ${carId}
        and d.end_date is not null
        and d.distance is not null
        and d.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      order by d.distance desc
      limit 5
    `;
    return rows.map(({ a, b, ...drive }) => ({
      ...drive,
      from: placeLabel(a, style),
      to: placeLabel(b, style),
    }));
  },
);

export const speedBandRows = cache(
  async (
    carId: number,
    from: Date | null,
    edgesKmh: number[],
  ): Promise<SpeedBandRow[]> => {
    await connection();
    return database()<SpeedBandRow[]>`
      select
        width_bucket(speed::float8, ${edgesKmh}::float8[]) as band,
        count(*)::int as points,
        sum(power)::float8 as "powerSum",
        sum(speed)::float8 as "speedSum"
      from positions
      where car_id = ${carId}
        and drive_id is not null
        and speed::float8 >= ${edgesKmh[0]}::float8
        and power is not null
        and date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      group by 1
      order by 1
    `;
  },
);

const leakWindowMs = 14 * 86_400_000;

export const recentTireLeaks = cache(
  async (carId: number, timeZone: string): Promise<SlowLeak[]> => {
    const from = new Date(Date.now() - leakWindowMs);
    return slowLeaks(await pressureTrend(carId, from, "day", timeZone));
  },
);
