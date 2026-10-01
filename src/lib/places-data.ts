import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { database } from "./database";
import { placeLabel } from "./vehicle";
import { getPlaceStyle } from "./viewer";

type Place = {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

export type VisitedPlace = {
  key: string;
  label: string;
  city: string | null;
  geofenceId: number | null;
  visits: number;
  parkedS: number;
  lastAt: Date;
  latitude: number | null;
  longitude: number | null;
};

export type ChargingPlace = {
  key: string;
  label: string;
  geofenceId: number | null;
  sessions: number;
  addedKwh: number;
  cost: number | null;
  fast: boolean;
  lastAt: Date;
  latitude: number | null;
  longitude: number | null;
};

export type Geofence = {
  id: number;
  name: string;
  radius: number;
  costPerUnit: number | null;
  sessionFee: number | null;
  latitude: number;
  longitude: number;
};

function sinceOf(from: Date | null) {
  return (from ?? new Date(0)).toISOString();
}

export const visitedPlaces = cache(
  async (carId: number, from: Date | null): Promise<VisitedPlace[]> => {
    await connection();
    const style = await getPlaceStyle();
    const rows = await database()<
      (Omit<VisitedPlace, "label" | "city"> & { place: Place })[]
    >`
      with arrivals as (
        select
          d.end_date,
          lead(d.start_date) over (order by d.start_date) as next_departure,
          d.end_geofence_id,
          d.end_address_id,
          ep.latitude,
          ep.longitude
        from drives d
        left join positions ep on ep.id = d.end_position_id
        where d.car_id = ${carId} and d.end_date is not null
      )
      select
        coalesce('g' || a.end_geofence_id, 'a' || a.end_address_id) as key,
        max(a.end_geofence_id)::int as "geofenceId",
        count(*)::int as visits,
        sum(extract(epoch from (
          coalesce(a.next_departure, now() at time zone 'UTC') - a.end_date
        )))::float8 as "parkedS",
        max(a.end_date) at time zone 'UTC' as "lastAt",
        avg(a.latitude)::float8 as latitude,
        avg(a.longitude)::float8 as longitude,
        (array_agg(json_build_object(
          'geofence', g.name, 'name', ad.name, 'road', ad.road,
          'houseNumber', ad.house_number, 'city', ad.city
        ) order by a.end_date desc))[1] as place
      from arrivals a
      left join geofences g on g.id = a.end_geofence_id
      left join addresses ad on ad.id = a.end_address_id
      where a.end_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
        and (a.end_geofence_id is not null or a.end_address_id is not null)
      group by 1
      order by visits desc, "parkedS" desc
    `;
    return rows.map(({ place, ...row }) => ({
      ...row,
      label: placeLabel(place, style),
      city: place.city,
    }));
  },
);

export const chargingPlaces = cache(
  async (carId: number, from: Date | null): Promise<ChargingPlace[]> => {
    await connection();
    const style = await getPlaceStyle();
    const rows = await database()<
      (Omit<ChargingPlace, "label"> & { place: Place })[]
    >`
      select
        coalesce('g' || cp.geofence_id, 'a' || cp.address_id) as key,
        max(cp.geofence_id)::int as "geofenceId",
        count(*)::int as sessions,
        coalesce(sum(cp.charge_energy_added), 0)::float8 as "addedKwh",
        sum(cp.cost)::float8 as cost,
        bool_or(coalesce((
          select bool_or(c.fast_charger_present)
          from charges c where c.charging_process_id = cp.id
        ), false)) as fast,
        max(cp.start_date) at time zone 'UTC' as "lastAt",
        avg(p.latitude)::float8 as latitude,
        avg(p.longitude)::float8 as longitude,
        (array_agg(json_build_object(
          'geofence', g.name, 'name', ad.name, 'road', ad.road,
          'houseNumber', ad.house_number, 'city', ad.city
        ) order by cp.start_date desc))[1] as place
      from charging_processes cp
      left join positions p on p.id = cp.position_id
      left join geofences g on g.id = cp.geofence_id
      left join addresses ad on ad.id = cp.address_id
      where cp.car_id = ${carId}
        and cp.charge_energy_added > 0.01
        and cp.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
        and (cp.geofence_id is not null or cp.address_id is not null)
      group by 1
      order by "addedKwh" desc
      limit 8
    `;
    return rows.map(({ place, ...row }) => ({
      ...row,
      label: placeLabel(place, style),
    }));
  },
);

export const geofenceList = cache(async (): Promise<Geofence[]> => {
  await connection();
  return database()<Geofence[]>`
    select
      id::int as id,
      name,
      radius::int as radius,
      cost_per_unit::float8 as "costPerUnit",
      session_fee::float8 as "sessionFee",
      latitude::float8 as latitude,
      longitude::float8 as longitude
    from geofences
    order by name
  `;
});
