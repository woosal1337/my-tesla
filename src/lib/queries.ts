import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { chargeSessions } from "./charge-sessions";
import { database } from "./database";
import { rangeColumn } from "./range-columns";
import { sampleRoute, type LngLat } from "./route";
import {
  driveEnergy,
  sampleDrive,
  type DriveEnergy,
  type DrivePoint,
} from "./drive-series";
import { driveEfficiency, placeLabel, type RecordedState } from "./vehicle";
import { getPlaceStyle, getRangeKind } from "./viewer";

export type Car = {
  id: number;
  name: string;
  model: string | null;
  marketingName: string | null;
  exteriorColor: string | null;
  wheelType: string | null;
  trimBadging: string | null;
  efficiencyKwhPerKm: number | null;
};

export type CarSnapshot = {
  positionAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  batteryAt: Date | null;
  batteryLevel: number | null;
  usableBatteryLevel: number | null;
  rangeKm: number | null;
  odometerKm: number | null;
  outsideTemp: number | null;
  insideTemp: number | null;
  climateOn: boolean | null;
  tires: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  } | null;
  state: RecordedState | null;
  stateSince: Date | null;
  driving: boolean;
  charging: boolean;
  softwareVersion: string | null;
};

export type Drive = {
  id: number;
  startAt: Date;
  endAt: Date;
  from: string;
  to: string;
  distanceKm: number | null;
  durationMin: number | null;
  efficiencyWhPerKm: number | null;
  speedMaxKmh: number | null;
  powerMaxKw: number | null;
  powerMinKw: number | null;
  ascentM: number | null;
  descentM: number | null;
  outsideTempAvg: number | null;
  startLevel: number | null;
  endLevel: number | null;
};

export type Charge = {
  id: number;
  startAt: Date;
  endAt: Date | null;
  place: string;
  energyAddedKwh: number | null;
  startLevel: number | null;
  endLevel: number | null;
  durationMin: number | null;
  maxPowerKw: number | null;
  fastCharger: boolean;
  cost: number | null;
  costEstimated: boolean;
  latitude: number | null;
  longitude: number | null;
};

type PlaceColumns = {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

export const listCars = cache(async (): Promise<Car[]> => {
  await connection();
  return database()<Car[]>`
    select
      id::int as id,
      coalesce(nullif(name, ''), 'Tesla ' || id) as name,
      model,
      marketing_name as "marketingName",
      exterior_color as "exteriorColor",
      wheel_type as "wheelType",
      trim_badging as "trimBadging",
      efficiency::float8 as "efficiencyKwhPerKm"
    from cars
    order by display_priority nulls last, id
  `;
});

export const findCar = cache(async (carId: number) => {
  const cars = await listCars();
  return cars.find((car) => car.id === carId) ?? null;
});

export async function defaultCarId(): Promise<number | null> {
  await connection();
  const [row] = await database()<{ id: number }[]>`
    select c.id::int as id
    from cars c
    left join lateral (
      select date from positions p
      where p.car_id = c.id
      order by p.date desc
      limit 1
    ) latest on true
    order by latest.date desc nulls last, c.display_priority nulls last, c.id
    limit 1
  `;
  return row?.id ?? null;
}

type SnapshotRow = Omit<CarSnapshot, "tires"> & {
  tpmsFrontLeft: number | null;
  tpmsFrontRight: number | null;
  tpmsRearLeft: number | null;
  tpmsRearRight: number | null;
};

export const carSnapshot = cache(
  async (carId: number): Promise<CarSnapshot> => {
    await connection();
    const kind = await getRangeKind();
    const [row] = await database()<SnapshotRow[]>`
      select
        pos.date at time zone 'UTC' as "positionAt",
        pos.latitude::float8 as latitude,
        pos.longitude::float8 as longitude,
        bat.date at time zone 'UTC' as "batteryAt",
        bat.battery_level::int as "batteryLevel",
        bat.usable_battery_level::int as "usableBatteryLevel",
        ${rangeColumn(kind, "bat", "battery")}::float8 as "rangeKm",
        bat.odometer::float8 as "odometerKm",
        bat.outside_temp::float8 as "outsideTemp",
        bat.inside_temp::float8 as "insideTemp",
        bat.is_climate_on as "climateOn",
        tpms.tpms_pressure_fl::float8 as "tpmsFrontLeft",
        tpms.tpms_pressure_fr::float8 as "tpmsFrontRight",
        tpms.tpms_pressure_rl::float8 as "tpmsRearLeft",
        tpms.tpms_pressure_rr::float8 as "tpmsRearRight",
        st.state::text as state,
        st.start_date at time zone 'UTC' as "stateSince",
        coalesce((
          select d.end_date is null from drives d
          where d.car_id = ${carId}
          order by d.start_date desc
          limit 1
        ), false) as driving,
        coalesce((
          select cp.end_date is null from charging_processes cp
          where cp.car_id = ${carId}
          order by cp.start_date desc
          limit 1
        ), false) as charging,
        split_part(upd.version, ' ', 1) as "softwareVersion"
      from (select ${carId}::int as car_id) car
      left join lateral (
        select date, latitude, longitude from positions
        where car_id = car.car_id order by date desc limit 1
      ) pos on true
      left join lateral (
        select * from positions
        where car_id = car.car_id and battery_level is not null
        order by date desc limit 1
      ) bat on true
      left join lateral (
        select * from positions
        where car_id = car.car_id and tpms_pressure_fl is not null
        order by date desc limit 1
      ) tpms on true
      left join lateral (
        select state, start_date from states
        where car_id = car.car_id order by start_date desc limit 1
      ) st on true
      left join lateral (
        select version from updates
        where car_id = car.car_id order by start_date desc limit 1
      ) upd on true
    `;
    const {
      tpmsFrontLeft,
      tpmsFrontRight,
      tpmsRearLeft,
      tpmsRearRight,
      ...rest
    } = row;
    const tires =
      tpmsFrontLeft !== null &&
      tpmsFrontRight !== null &&
      tpmsRearLeft !== null &&
      tpmsRearRight !== null
        ? {
            frontLeft: tpmsFrontLeft,
            frontRight: tpmsFrontRight,
            rearLeft: tpmsRearLeft,
            rearRight: tpmsRearRight,
          }
        : null;
    return { ...rest, tires };
  },
);

type DriveRow = {
  id: number;
  startAt: Date;
  endAt: Date;
  distanceKm: number | null;
  durationMin: number | null;
  startRangeKm: number | null;
  endRangeKm: number | null;
  speedMaxKmh: number | null;
  powerMaxKw: number | null;
  powerMinKw: number | null;
  ascentM: number | null;
  descentM: number | null;
  outsideTempAvg: number | null;
  startLevel: number | null;
  endLevel: number | null;
  start: PlaceColumns;
  end: PlaceColumns;
};

type DateRange = { start: Date; end: Date };

const exportLimit = 100_000;

async function queryDrives(
  car: Car,
  options: { limit: number; driveId?: number; range?: DateRange | null },
): Promise<Drive[]> {
  await connection();
  const sql = database();
  const [kind, style] = await Promise.all([getRangeKind(), getPlaceStyle()]);
  const onlyDrive =
    options.driveId === undefined ? sql`` : sql`and d.id = ${options.driveId}`;
  const inRange = options.range
    ? sql`and d.start_date >= (${options.range.start.toISOString()}::timestamptz at time zone 'UTC') and d.start_date < (${options.range.end.toISOString()}::timestamptz at time zone 'UTC')`
    : sql``;
  const rows = await sql<DriveRow[]>`
    select
      d.id::int as id,
      d.start_date at time zone 'UTC' as "startAt",
      d.end_date at time zone 'UTC' as "endAt",
      d.distance::float8 as "distanceKm",
      d.duration_min::int as "durationMin",
      ${rangeColumn(kind, "d", "start")}::float8 as "startRangeKm",
      ${rangeColumn(kind, "d", "end")}::float8 as "endRangeKm",
      d.speed_max::int as "speedMaxKmh",
      d.power_max::int as "powerMaxKw",
      d.power_min::int as "powerMinKw",
      d.ascent::int as "ascentM",
      d.descent::int as "descentM",
      d.outside_temp_avg::float8 as "outsideTempAvg",
      sp.battery_level::int as "startLevel",
      ep.battery_level::int as "endLevel",
      json_build_object(
        'geofence', sg.name, 'name', sa.name, 'road', sa.road,
        'houseNumber', sa.house_number, 'city', sa.city
      ) as start,
      json_build_object(
        'geofence', eg.name, 'name', ea.name, 'road', ea.road,
        'houseNumber', ea.house_number, 'city', ea.city
      ) as "end"
    from drives d
    left join addresses sa on sa.id = d.start_address_id
    left join addresses ea on ea.id = d.end_address_id
    left join geofences sg on sg.id = d.start_geofence_id
    left join geofences eg on eg.id = d.end_geofence_id
    left join positions sp on sp.id = d.start_position_id
    left join positions ep on ep.id = d.end_position_id
    where d.car_id = ${car.id} and d.end_date is not null ${onlyDrive} ${inRange}
    order by d.start_date desc
    limit ${options.limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    startAt: row.startAt,
    endAt: row.endAt,
    from: placeLabel(row.start, style),
    to: placeLabel(row.end, style),
    distanceKm: row.distanceKm,
    durationMin: row.durationMin,
    speedMaxKmh: row.speedMaxKmh,
    powerMaxKw: row.powerMaxKw,
    powerMinKw: row.powerMinKw,
    ascentM: row.ascentM,
    descentM: row.descentM,
    outsideTempAvg: row.outsideTempAvg,
    startLevel: row.startLevel,
    endLevel: row.endLevel,
    efficiencyWhPerKm: driveEfficiency({
      startRangeKm: row.startRangeKm,
      endRangeKm: row.endRangeKm,
      distanceKm: row.distanceKm,
      carEfficiencyKwhPerKm: car.efficiencyKwhPerKm,
    }),
  }));
}

export function recentDrives(car: Car, limit = 50): Promise<Drive[]> {
  return queryDrives(car, { limit });
}

export async function tripRoutes(
  carId: number,
  driveIds: number[],
  pointsPerDrive = 150,
): Promise<Map<number, LngLat[]>> {
  const routes = new Map<number, LngLat[]>();
  if (driveIds.length === 0) return routes;
  await connection();
  const rows = await database()<
    { driveId: number; lng: number; lat: number }[]
  >`
    select "driveId", lng, lat
    from (
      select
        drive_id::int as "driveId",
        longitude::float8 as lng,
        latitude::float8 as lat,
        row_number() over (partition by drive_id order by date) as n,
        count(*) over (partition by drive_id) as total
      from positions
      where car_id = ${carId} and drive_id = any(${driveIds}::int[])
    ) points
    where (n - 1) % greatest(1, total / ${pointsPerDrive}) = 0 or n = total
    order by "driveId", n
  `;
  for (const row of rows) {
    const route = routes.get(row.driveId) ?? [];
    route.push([row.lng, row.lat]);
    routes.set(row.driveId, route);
  }
  return routes;
}

export function exportDrives(
  car: Car,
  range: DateRange | null,
): Promise<Drive[]> {
  return queryDrives(car, { limit: exportLimit, range });
}

export type DrivePositionRow = DrivePoint & { lng: number; lat: number };

export async function drivePositions(
  carId: number,
  driveId: number,
): Promise<DrivePositionRow[]> {
  await connection();
  return database()<DrivePositionRow[]>`
    select
      longitude::float8 as lng,
      latitude::float8 as lat,
      (extract(epoch from date) * 1000)::float8 as at,
      speed::float8 as "speedKmh",
      power::float8 as "powerKw",
      elevation::float8 as "elevationM",
      battery_level::int as battery
    from positions
    where car_id = ${carId} and drive_id = ${driveId}
    order by date
  `;
}

export async function findDriveRecord(
  car: Car,
  driveId: number,
): Promise<Drive | null> {
  const [drive] = await queryDrives(car, { limit: 1, driveId });
  return drive ?? null;
}

export async function findDrive(
  car: Car,
  driveId: number,
): Promise<{
  drive: Drive;
  route: LngLat[];
  series: DrivePoint[];
  energy: DriveEnergy;
} | null> {
  const drive = await findDriveRecord(car, driveId);
  if (!drive) return null;
  const points = await drivePositions(car.id, driveId);
  const series = points.map(
    ({ at, speedKmh, powerKw, elevationM, battery }) => ({
      at,
      speedKmh,
      powerKw,
      elevationM,
      battery,
    }),
  );
  return {
    drive,
    route: sampleRoute(points.map(({ lng, lat }) => [lng, lat])),
    series: sampleDrive(series),
    energy: driveEnergy(series),
  };
}

type ChargeRow = Omit<Charge, "place"> & { place: PlaceColumns };

export function exportCharges(
  carId: number,
  range: DateRange | null,
): Promise<Charge[]> {
  return recentCharges(carId, exportLimit, range);
}

export async function recentCharges(
  carId: number,
  limit = 50,
  range: DateRange | null = null,
): Promise<Charge[]> {
  await connection();
  const [style, { relation: sessions }] = await Promise.all([
    getPlaceStyle(),
    chargeSessions(carId),
  ]);
  const rows = await database()<ChargeRow[]>`
    select
      cp.id::int as id,
      cp.start_date at time zone 'UTC' as "startAt",
      cp.end_date at time zone 'UTC' as "endAt",
      cp.charge_energy_added::float8 as "energyAddedKwh",
      cp.start_battery_level::int as "startLevel",
      cp.end_battery_level::int as "endLevel",
      cp.duration_min::int as "durationMin",
      cp.cost::float8 as cost,
      cp.cost_estimated as "costEstimated",
      stats."maxPowerKw",
      coalesce(stats."fastCharger", false) as "fastCharger",
      cp_position.latitude::float8 as latitude,
      cp_position.longitude::float8 as longitude,
      json_build_object(
        'geofence', g.name, 'name', a.name, 'road', a.road,
        'houseNumber', a.house_number, 'city', a.city
      ) as place
    from ${sessions} cp
    left join addresses a on a.id = cp.address_id
    left join geofences g on g.id = cp.geofence_id
    left join positions cp_position on cp_position.id = cp.position_id
    left join lateral (
      select
        max(c.charger_power)::float8 as "maxPowerKw",
        bool_or(c.fast_charger_present) as "fastCharger"
      from charges c
      where c.charging_process_id = cp.id
    ) stats on true
    where cp.car_id = ${carId} ${
      range
        ? database()`and cp.start_date >= (${range.start.toISOString()}::timestamptz at time zone 'UTC') and cp.start_date < (${range.end.toISOString()}::timestamptz at time zone 'UTC')`
        : database()``
    }
    order by cp.start_date desc
    limit ${limit}
  `;
  return rows.map(({ place, ...row }) => ({
    ...row,
    place: placeLabel(place, style),
  }));
}
