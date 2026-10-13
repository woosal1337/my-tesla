import type postgres from "postgres";
import { driveSessionsRelation } from "./drive-sessions-sql";

const longestStopMin = { parked: 30, charging: 120 };

export type TripLegRow = {
  driveId: number;
  tripId: number;
  chargedBefore: boolean;
};

export type TripSelection =
  { range: { start: Date; end: Date } } | { driveId: number };

function utc(sql: postgres.Sql, at: Date) {
  return sql`(${at.toISOString()}::timestamptz at time zone 'UTC')`;
}

function withinReach(
  sql: postgres.Sql,
  carId: number,
  selection: TripSelection,
) {
  if ("driveId" in selection) {
    const chosen = sql`(
      select chosen.start_date from drives chosen
      where chosen.id = ${selection.driveId} and chosen.car_id = ${carId}
    )`;
    return sql`and d.start_date
      between ${chosen} - interval '7 days' and ${chosen} + interval '7 days'`;
  }
  const { start, end } = selection.range;
  return sql`and d.start_date >= ${utc(sql, start)} - interval '7 days'
    and d.start_date < ${utc(sql, end)} + interval '7 days'`;
}

function selected(sql: postgres.Sql, selection: TripSelection) {
  if ("driveId" in selection) {
    return sql`t.trip_id = (
      select trip_id from tripped where id = ${selection.driveId}
    )`;
  }
  const { start, end } = selection.range;
  return sql`t.trip_start >= ${utc(sql, start)}
    and t.trip_start < ${utc(sql, end)}`;
}

export function tripLegsQuery(
  sql: postgres.Sql,
  options: { carId: number; selection: TripSelection },
) {
  const { carId, selection } = options;
  const drives = driveSessionsRelation(
    sql,
    carId,
    withinReach(sql, carId, selection),
  );
  return sql<TripLegRow[]>`
    with scope as (
      select d.id, d.start_date, d.end_date
      from ${drives} d
    ),
    legs as (
      select
        s.*,
        lag(s.end_date) over (order by s.start_date, s.id) as prev_end
      from scope s
    ),
    last_charge as (
      select
        e.drive_id,
        max(e.charge_start) over (order by e.at, e.drive_id is null)
          as charge_start
      from (
        select
          s.start_date as at,
          s.id as drive_id,
          null::timestamp as charge_start
        from scope s
        union all
        select cp.start_date, null, cp.start_date
        from charging_processes cp
        where cp.car_id = ${carId}
      ) e
    ),
    stops as (
      select
        l.*,
        extract(epoch from (l.start_date - l.prev_end)) / 60.0
          as stop_before_min,
        coalesce(lc.charge_start >= l.prev_end, false) as charged_before
      from legs l
      join last_charge lc on lc.drive_id = l.id
    ),
    marked as (
      select
        st.*,
        case
          when st.prev_end is null then 1
          when st.stop_before_min > case
            when st.charged_before then ${longestStopMin.charging}::float8
            else ${longestStopMin.parked}::float8
          end then 1
          else 0
        end as starts_trip
      from stops st
    ),
    numbered as (
      select
        m.*,
        sum(m.starts_trip) over (order by m.start_date, m.id) as trip_seq
      from marked m
    ),
    tripped as (
      select
        n.*,
        first_value(n.id) over (
          partition by n.trip_seq order by n.start_date, n.id
        ) as trip_id,
        min(n.start_date) over (partition by n.trip_seq) as trip_start
      from numbered n
    )
    select
      t.id::int as "driveId",
      t.trip_id::int as "tripId",
      (t.starts_trip = 0 and t.charged_before) as "chargedBefore"
    from tripped t
    where ${selected(sql, selection)}
    order by t.start_date, t.id
  `;
}
