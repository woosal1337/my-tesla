import "server-only";
import { connection } from "next/server";
import { database } from "./database";
import { rangeColumn } from "./range-columns";
import { placeLabel } from "./vehicle";
import { getPlaceStyle, getRangeKind } from "./viewer";

export type ChargeSession = {
  id: number;
  startAt: Date;
  endAt: Date | null;
  place: string;
  latitude: number | null;
  longitude: number | null;
  energyAddedKwh: number | null;
  energyUsedKwh: number | null;
  startLevel: number | null;
  endLevel: number | null;
  startRangeKm: number | null;
  endRangeKm: number | null;
  durationMin: number | null;
  outsideTempAvg: number | null;
  cost: number | null;
  fast: boolean;
  brand: string | null;
  connector: string | null;
  maxPowerKw: number | null;
  avgVoltage: number | null;
  maxCurrent: number | null;
  phases: number | null;
  previousId: number | null;
  nextId: number | null;
};

export type CurvePoint = {
  at: number;
  level: number | null;
  power: number | null;
  voltage: number | null;
  current: number | null;
  rangeKm: number | null;
};

type SessionRow = Omit<ChargeSession, "place"> & {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

export async function findChargeSession(
  carId: number,
  chargeId: number,
): Promise<ChargeSession | null> {
  await connection();
  const [kind, style] = await Promise.all([getRangeKind(), getPlaceStyle()]);
  const [row] = await database()<SessionRow[]>`
    select
      cp.id::int as id,
      cp.start_date at time zone 'UTC' as "startAt",
      cp.end_date at time zone 'UTC' as "endAt",
      coalesce(p.latitude, a.latitude)::float8 as latitude,
      coalesce(p.longitude, a.longitude)::float8 as longitude,
      cp.charge_energy_added::float8 as "energyAddedKwh",
      cp.charge_energy_used::float8 as "energyUsedKwh",
      cp.start_battery_level::int as "startLevel",
      cp.end_battery_level::int as "endLevel",
      ${rangeColumn(kind, "cp", "start")}::float8 as "startRangeKm",
      ${rangeColumn(kind, "cp", "end")}::float8 as "endRangeKm",
      cp.duration_min::int as "durationMin",
      cp.outside_temp_avg::float8 as "outsideTempAvg",
      cp.cost::float8 as cost,
      coalesce(stats.fast, false) as fast,
      stats.brand,
      stats.connector,
      stats."maxPowerKw",
      stats."avgVoltage",
      stats."maxCurrent",
      stats.phases,
      g.name as geofence,
      a.name,
      a.road,
      a.house_number as "houseNumber",
      a.city,
      (
        select id::int from charging_processes
        where car_id = cp.car_id and start_date < cp.start_date
        order by start_date desc limit 1
      ) as "previousId",
      (
        select id::int from charging_processes
        where car_id = cp.car_id and start_date > cp.start_date
        order by start_date asc limit 1
      ) as "nextId"
    from charging_processes cp
    left join positions p on p.id = cp.position_id
    left join addresses a on a.id = cp.address_id
    left join geofences g on g.id = cp.geofence_id
    left join lateral (
      select
        bool_or(c.fast_charger_present) as fast,
        max(c.fast_charger_brand) as brand,
        max(c.fast_charger_type) as connector,
        max(c.charger_power)::float8 as "maxPowerKw",
        avg(c.charger_voltage) filter (where c.charger_power > 0)::float8 as "avgVoltage",
        max(c.charger_actual_current)::float8 as "maxCurrent",
        max(c.charger_phases)::int as phases
      from charges c
      where c.charging_process_id = cp.id
    ) stats on true
    where cp.car_id = ${carId} and cp.id = ${chargeId}
  `;
  if (!row) return null;
  const { geofence, name, road, houseNumber, city, ...session } = row;
  return {
    ...session,
    place: placeLabel({ geofence, name, road, houseNumber, city }, style),
  };
}

export async function chargeCurve(
  chargeId: number,
  maxPoints = 360,
): Promise<CurvePoint[]> {
  await connection();
  const kind = await getRangeKind();
  return database()<CurvePoint[]>`
    with samples as (
      select
        date, battery_level, charger_power, charger_voltage,
        charger_actual_current,
        ${rangeColumn(kind, "charges", "battery")} as range_km,
        ntile(${maxPoints}) over (order by date) as bucket
      from charges
      where charging_process_id = ${chargeId}
    )
    select
      (extract(epoch from min(date) at time zone 'UTC') * 1000)::float8 as at,
      round(avg(battery_level))::int as level,
      round(avg(charger_power)::numeric, 1)::float8 as power,
      round(avg(charger_voltage))::float8 as voltage,
      round(avg(charger_actual_current)::numeric, 1)::float8 as current,
      round(avg(range_km)::numeric, 1)::float8 as "rangeKm"
    from samples
    group by bucket
    order by min(date)
  `;
}
