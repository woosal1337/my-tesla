import type postgres from "postgres";
import type { chargeSessionsRelation } from "./charge-sessions-sql";
import type { LevelTime } from "./charge-time";

const longestSampleGapS = 300;
const smallestChargeKwh = 1;

export function chargeLevelTimesQuery(
  sql: postgres.Sql,
  sessions: ReturnType<typeof chargeSessionsRelation>,
  carId: number,
  since: Date,
) {
  return sql<LevelTime[]>`
    with picked as materialized (
      select
        cp.id,
        exists (
          select 1 from charges fc
          where fc.charging_process_id = cp.id and fc.fast_charger_present
        ) as fast
      from ${sessions} cp
      where cp.car_id = ${carId}
        and cp.end_date is not null
        and cp.charge_energy_added >= ${smallestChargeKwh}
        and cp.start_date >= (${since.toISOString()}::timestamptz at time zone 'UTC')
    ),
    samples as (
      select
        p.id,
        p.fast,
        c.battery_level as level,
        c.charger_power,
        max(c.battery_level) over (partition by p.id) as top_level,
        extract(epoch from (
          lead(c.date) over (partition by p.id order by c.date) - c.date
        ))::float8 as seconds
      from picked p
      join charges c on c.charging_process_id = p.id
      where c.battery_level is not null
    ),
    per_session as (
      select id, fast, level, sum(seconds) as seconds
      from samples
      where charger_power > 0
        and seconds > 0
        and seconds <= ${longestSampleGapS}
        and level < top_level
      group by id, fast, level
    ),
    history as (
      select fast, count(distinct id)::int as sessions
      from per_session
      group by fast
    )
    select
      p.fast,
      p.level::int as level,
      h.sessions,
      percentile_cont(0.5) within group (order by p.seconds)::float8
        as "typicalS",
      percentile_cont(0.9) within group (order by p.seconds)::float8
        as "slowS"
    from per_session p
    join history h on h.fast = p.fast
    group by p.fast, p.level, h.sessions
    order by p.fast, p.level
  `;
}
