import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { database } from "./database";

export type ChargeTypeTotals = {
  fast: boolean;
  sessions: number;
  addedKwh: number;
  cost: number | null;
  costedKwh: number;
};

export type DcCurve = {
  id: number;
  startAt: Date;
  points: { level: number; power: number }[];
};

function sinceOf(from: Date | null) {
  return (from ?? new Date(0)).toISOString();
}

function fastSession() {
  return database()`coalesce((
    select bool_or(c.fast_charger_present)
    from charges c where c.charging_process_id = cp.id
  ), false)`;
}

export const chargeStarts = cache(
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
        from charging_processes
        where car_id = ${carId}
          and charge_energy_added > 0.01
          and start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      ) t
      group by 1, 2
    `;
  },
);

export const chargeTypeTotals = cache(
  async (carId: number, from: Date | null): Promise<ChargeTypeTotals[]> => {
    await connection();
    const sql = database();
    return sql<ChargeTypeTotals[]>`
      select
        fast,
        count(*)::int as sessions,
        coalesce(sum(added), 0)::float8 as "addedKwh",
        sum(cost)::float8 as cost,
        coalesce(sum(added) filter (where cost is not null), 0)::float8 as "costedKwh"
      from (
        select
          cp.charge_energy_added as added,
          cp.cost,
          ${fastSession()} as fast
        from charging_processes cp
        where cp.car_id = ${carId}
          and cp.charge_energy_added > 0.01
          and cp.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
      ) sessions
      group by fast
      order by fast
    `;
  },
);

export const dcCurves = cache(
  async (carId: number, from: Date | null, limit = 6): Promise<DcCurve[]> => {
    await connection();
    const sql = database();
    const sessions = await sql<{ id: number; startAt: Date }[]>`
      select cp.id::int as id, cp.start_date at time zone 'UTC' as "startAt"
      from charging_processes cp
      where cp.car_id = ${carId}
        and cp.end_date is not null
        and cp.start_date >= (${sinceOf(from)}::timestamptz at time zone 'UTC')
        and ${fastSession()}
      order by cp.start_date desc
      limit ${limit}
    `;
    if (sessions.length === 0) return [];
    const points = await sql<{ id: number; level: number; power: number }[]>`
      select
        c.charging_process_id::int as id,
        c.battery_level::int as level,
        avg(c.charger_power)::float8 as power
      from charges c
      where c.charging_process_id = any(${sessions.map((session) => session.id)}::int[])
        and c.charger_power > 0
        and c.battery_level is not null
      group by 1, 2
      order by 1, 2
    `;
    return sessions
      .map((session) => ({
        ...session,
        points: points
          .filter((point) => point.id === session.id)
          .map(({ level, power }) => ({ level, power })),
      }))
      .filter((curve) => curve.points.length > 1);
  },
);
