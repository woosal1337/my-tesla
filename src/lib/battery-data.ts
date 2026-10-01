import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { database } from "./database";
import type { CapacityPoint, IdlePeriod } from "./insights";
import { rangeColumn } from "./range-columns";
import { getRangeKind } from "./viewer";

export type BatteryCapacityPoint = CapacityPoint & {
  rangeKm: number;
  odometerKm: number | null;
};

export type BatteryTotals = {
  sessions: number;
  addedKwh: number;
  usedKwh: number;
  acKwh: number;
  dcKwh: number;
};

export type BatteryNow = {
  rangeAt100Km: number | null;
  at: Date | null;
};

const efficiency = (carId: number) => database()`
  select coalesce(derived, rated) as kwh_per_km
  from (
    select
      round(
        (cp.charge_energy_added
          / nullif(cp.end_rated_range_km - cp.start_rated_range_km, 0))::numeric,
        3
      )::float8 as derived,
      count(*) as samples,
      c.efficiency::float8 as rated
    from cars c
    left join charging_processes cp
      on cp.car_id = c.id
      and cp.duration_min > 10
      and cp.end_battery_level <= 95
      and cp.start_rated_range_km is not null
      and cp.end_rated_range_km is not null
      and cp.charge_energy_added > 0
    where c.id = ${carId}
    group by 1, 3
    order by 2 desc
    limit 1
  ) e
`;

export const capacityHistory = cache(
  async (carId: number): Promise<BatteryCapacityPoint[]> => {
    await connection();
    const kind = await getRangeKind();
    return database()<BatteryCapacityPoint[]>`
      with e as (${efficiency(carId)})
      select
        cp.end_date at time zone 'UTC' as at,
        (c.rated_battery_range_km * e.kwh_per_km * 100
          / c.usable_battery_level)::float8 as kwh,
        (c.preferred_range_km * 100.0
          / c.usable_battery_level)::float8 as "rangeKm",
        p.odometer::float8 as "odometerKm"
      from charging_processes cp
      cross join e
      join lateral (
        select
          charges.rated_battery_range_km,
          ${rangeColumn(kind, "charges", "battery")} as preferred_range_km,
          charges.usable_battery_level
        from charges
        where charging_process_id = cp.id and usable_battery_level > 0
        order by date desc
        limit 1
      ) c on true
      left join positions p on p.id = cp.position_id
      where cp.car_id = ${carId}
        and cp.end_date is not null
        and e.kwh_per_km is not null
        and cp.charge_energy_added >= e.kwh_per_km * 100
      order by cp.end_date
    `;
  },
);

export const batteryNow = cache(async (carId: number): Promise<BatteryNow> => {
  await connection();
  const kind = await getRangeKind();
  const range = rangeColumn(kind, "positions", "battery");
  const [row] = await database()<BatteryNow[]>`
    select
      (${range} * 100.0 / usable_battery_level)::float8 as "rangeAt100Km",
      date at time zone 'UTC' as at
    from positions
    where car_id = ${carId}
      and usable_battery_level > 0
      and ${range} is not null
    order by date desc
    limit 1
  `;
  return row ?? { rangeAt100Km: null, at: null };
});

export const chargeTotals = cache(
  async (carId: number): Promise<BatteryTotals> => {
    await connection();
    const [row] = await database()<BatteryTotals[]>`
      with sessions as (
        select
          cp.charge_energy_added as added,
          greatest(cp.charge_energy_added, cp.charge_energy_used) as used,
          coalesce((
            select bool_or(c.fast_charger_present)
            from charges c where c.charging_process_id = cp.id
          ), false) as fast
        from charging_processes cp
        where cp.car_id = ${carId} and cp.charge_energy_added > 0.01
      )
      select
        count(*)::int as sessions,
        coalesce(sum(added), 0)::float8 as "addedKwh",
        coalesce(sum(used), 0)::float8 as "usedKwh",
        coalesce(sum(added) filter (where not fast), 0)::float8 as "acKwh",
        coalesce(sum(added) filter (where fast), 0)::float8 as "dcKwh"
      from sessions
    `;
    return row;
  },
);

export const levelTime = cache(
  async (
    carId: number,
    from: Date | null,
  ): Promise<{ level: number; seconds: number }[]> => {
    await connection();
    const since = (from ?? new Date(0)).toISOString();
    return database()<{ level: number; seconds: number }[]>`
      select level, sum(seconds)::float8 as seconds
      from (
        select
          battery_level::int as level,
          least(
            extract(epoch from lead(date) over (order by date) - date),
            86400
          ) as seconds
        from positions
        where car_id = ${carId}
          and battery_level is not null
          and date >= (${since}::timestamptz at time zone 'UTC')
      ) t
      where seconds is not null
      group by level
      order by level
    `;
  },
);

export const chargeLevels = cache(
  async (
    carId: number,
    from: Date | null,
  ): Promise<{ startLevel: number; endLevel: number }[]> => {
    await connection();
    const since = (from ?? new Date(0)).toISOString();
    return database()<{ startLevel: number; endLevel: number }[]>`
      select
        start_battery_level::int as "startLevel",
        end_battery_level::int as "endLevel"
      from charging_processes
      where car_id = ${carId}
        and end_date is not null
        and charge_energy_added > 0.01
        and start_battery_level is not null
        and end_battery_level is not null
        and start_date >= (${since}::timestamptz at time zone 'UTC')
    `;
  },
);

export const idlePeriods = cache(
  async (
    carId: number,
    from: Date | null,
    minimumHours = 6,
  ): Promise<IdlePeriod[]> => {
    await connection();
    const since = (from ?? new Date(0)).toISOString();
    const kind = await getRangeKind();
    return database()<IdlePeriod[]>`
      with merged as (
        select
          c.start_date,
          c.end_date,
          ${rangeColumn(kind, "c", "start")} as start_range,
          ${rangeColumn(kind, "c", "end")} as end_range,
          c.start_battery_level as start_level,
          c.end_battery_level as end_level,
          p.usable_battery_level as start_usable,
          p.odometer as start_km,
          p.odometer as end_km
        from charging_processes c
        join positions p on p.id = c.position_id
        where c.car_id = ${carId}
          and c.start_date >= (${since}::timestamptz at time zone 'UTC')
        union all
        select
          d.start_date,
          d.end_date,
          ${rangeColumn(kind, "d", "start")},
          ${rangeColumn(kind, "d", "end")},
          sp.battery_level,
          ep.battery_level,
          sp.usable_battery_level,
          d.start_km,
          d.end_km
        from drives d
        join positions sp on sp.id = d.start_position_id
        join positions ep on ep.id = d.end_position_id
        where d.car_id = ${carId}
          and d.start_date >= (${since}::timestamptz at time zone 'UTC')
      ),
      v as (
        select
          lag(t.end_date) over w as start_date,
          t.start_date as end_date,
          lag(t.end_range) over w as start_range,
          t.start_range as end_range,
          lag(t.end_km) over w as start_km,
          t.start_km as end_km,
          extract(epoch from (t.start_date - lag(t.end_date) over w))
            as duration,
          lag(t.end_level) over w as start_level,
          t.start_level as end_level,
          t.start_level > coalesce(t.start_usable, t.start_level) as reduced
        from merged t
        window w as (order by t.start_date)
      )
      select
        v.start_date at time zone 'UTC' as start,
        v.end_date at time zone 'UTC' as "end",
        v.duration::float8 as "durationS",
        (coalesce(s.sleep, 0) / v.duration)::float8 as standby,
        greatest(v.start_level - v.end_level, 0)::int as "levelLost",
        case when v.reduced then null
          else (v.start_range - v.end_range)::float8 end as "rangeLostKm",
        case when v.reduced then null
          else ((v.start_range - v.end_range) * car.efficiency)::float8
        end as "energyKwh"
      from v
      cross join lateral (
        select extract(epoch from sum(
          least(st.end_date, v.end_date) - greatest(st.start_date, v.start_date)
        )) as sleep
        from states st
        where st.car_id = ${carId}
          and st.state in ('asleep', 'offline')
          and st.start_date < v.end_date
          and (st.end_date is null or st.end_date > v.start_date)
      ) s
      join cars car on car.id = ${carId}
      where v.duration > ${minimumHours * 3600}
        and v.start_range - v.end_range >= 0
        and v.end_km - v.start_km < 1
      order by v.start_date desc
    `;
  },
);
