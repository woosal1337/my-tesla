import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { chargeSessions } from "./charge-sessions";
import { database } from "./database";
import type { TimelineCharge, TimelineDrive, TimelineState } from "./insights";
import { placeLabel } from "./vehicle";
import { getPlaceStyle } from "./viewer";

type Place = {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

export type DayRecords = {
  states: TimelineState[];
  drives: TimelineDrive[];
  charges: TimelineCharge[];
};

export const dayRecords = cache(
  async (carId: number, start: Date, end: Date): Promise<DayRecords> => {
    await connection();
    const sql = database();
    const [style, { relation: sessions }] = await Promise.all([
      getPlaceStyle(),
      chargeSessions(carId),
    ]);
    const from = start.toISOString();
    const to = end.toISOString();
    const [states, drives, charges] = await Promise.all([
      sql<TimelineState[]>`
        select
          state::text as state,
          start_date at time zone 'UTC' as start,
          end_date at time zone 'UTC' as "end"
        from states
        where car_id = ${carId}
          and start_date < (${to}::timestamptz at time zone 'UTC')
          and coalesce(end_date, now() at time zone 'UTC')
            > (${from}::timestamptz at time zone 'UTC')
        order by start_date
      `,
      sql<(Omit<TimelineDrive, "from" | "to"> & { a: Place; b: Place })[]>`
        select
          d.id::int as id,
          d.start_date at time zone 'UTC' as start,
          d.end_date at time zone 'UTC' as "end",
          d.distance::float8 as "distanceKm",
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
          and d.start_date < (${to}::timestamptz at time zone 'UTC')
          and d.end_date > (${from}::timestamptz at time zone 'UTC')
        order by d.start_date
      `,
      sql<(Omit<TimelineCharge, "place"> & { at: Place })[]>`
        select
          cp.id::int as id,
          cp.start_date at time zone 'UTC' as start,
          cp.end_date at time zone 'UTC' as "end",
          cp.charge_energy_added::float8 as "energyAddedKwh",
          coalesce((
            select bool_or(c.fast_charger_present)
            from charges c where c.charging_process_id = cp.id
          ), false) as fast,
          json_build_object(
            'geofence', g.name, 'name', a.name, 'road', a.road,
            'houseNumber', a.house_number, 'city', a.city
          ) as at
        from ${sessions} cp
        left join addresses a on a.id = cp.address_id
        left join geofences g on g.id = cp.geofence_id
        where cp.car_id = ${carId}
          and cp.start_date < (${to}::timestamptz at time zone 'UTC')
          and coalesce(cp.end_date, now() at time zone 'UTC')
            > (${from}::timestamptz at time zone 'UTC')
        order by cp.start_date
      `,
    ]);
    return {
      states,
      drives: drives.map(({ a, b, ...drive }) => ({
        ...drive,
        from: placeLabel(a, style),
        to: placeLabel(b, style),
      })),
      charges: charges.map(({ at, ...charge }) => ({
        ...charge,
        place: placeLabel(at, style),
      })),
    };
  },
);
