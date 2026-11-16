import type postgres from "postgres";

export function chargingCountry(sql: postgres.Sql) {
  return sql`
    select a.raw->'address'->>'country_code'
    from charging_processes cp
    join addresses a on a.id = cp.address_id
    where a.raw->'address'->>'country_code' is not null
    group by 1
    order by count(*) desc, 1
    limit 1
  `;
}
