import type postgres from "postgres";

type Part = postgres.PendingQuery<postgres.Row[]>;

const samePlaceM = 250;
const shortestDriveKm = 0.01;

function first(sql: postgres.Sql, column: Part) {
  return sql`(array_agg(${column} order by p.date)
    filter (where ${column} is not null))[1]`;
}

function last(sql: postgres.Sql, column: Part) {
  return sql`(array_agg(${column} order by p.date desc)
    filter (where ${column} is not null))[1]`;
}

function metersApart(sql: postgres.Sql, a: Part, b: Part) {
  return sql`(12742000 * asin(sqrt(
    power(sin(radians((${b}.latitude - ${a}.latitude)::float8) / 2), 2)
    + cos(radians(${a}.latitude::float8)) * cos(radians(${b}.latitude::float8))
      * power(sin(radians((${b}.longitude - ${a}.longitude)::float8) / 2), 2)
  )))`;
}

export function driveSessionsRelation(
  sql: postgres.Sql,
  carId: number,
  picked: Part = sql``,
) {
  return sql`(
    select
      b.id,
      b.car_id,
      b.start_date,
      coalesce(b.end_date, o.end_date) as end_date,
      coalesce(b.distance, o.distance) as distance,
      coalesce(b.duration_min, o.duration_min) as duration_min,
      coalesce(b.start_position_id, o.start_position_id) as start_position_id,
      coalesce(b.end_position_id, o.end_position_id) as end_position_id,
      coalesce(b.start_rated_range_km, o.start_rated_range_km)
        as start_rated_range_km,
      coalesce(b.end_rated_range_km, o.end_rated_range_km)
        as end_rated_range_km,
      coalesce(b.start_ideal_range_km, o.start_ideal_range_km)
        as start_ideal_range_km,
      coalesce(b.end_ideal_range_km, o.end_ideal_range_km)
        as end_ideal_range_km,
      coalesce(b.speed_max, o.speed_max) as speed_max,
      coalesce(b.power_max, o.power_max) as power_max,
      coalesce(b.power_min, o.power_min) as power_min,
      coalesce(b.ascent, o.ascent) as ascent,
      coalesce(b.descent, o.descent) as descent,
      coalesce(b.outside_temp_avg, o.outside_temp_avg) as outside_temp_avg,
      coalesce(b.start_address_id, came_from.address_id) as start_address_id,
      coalesce(b.start_geofence_id, came_from.geofence_id)
        as start_geofence_id,
      coalesce(b.end_address_id, went_to.address_id) as end_address_id,
      coalesce(b.end_geofence_id, went_to.geofence_id) as end_geofence_id,
      b.left_open
    from (
      select d.*, gate.left_open
      from drives d
      cross join lateral (
        select d.end_date is null and exists (
          select 1 from drives later
          where later.car_id = d.car_id and later.start_date > d.start_date
        ) as left_open
      ) gate
      where d.car_id = ${carId}
        and (d.end_date is not null or gate.left_open)
        ${picked}
    ) b
    left join lateral (
      select
        max(p.date) as end_date,
        ${last(sql, sql`p.odometer`)} - ${first(sql, sql`p.odometer`)}
          as distance,
        round(extract(epoch from max(p.date) - min(p.date)) / 60)
          as duration_min,
        (array_agg(p.id order by p.date))[1] as start_position_id,
        (array_agg(p.id order by p.date desc))[1] as end_position_id,
        ${first(sql, sql`p.rated_battery_range_km`)} as start_rated_range_km,
        ${last(sql, sql`p.rated_battery_range_km`)} as end_rated_range_km,
        ${first(sql, sql`p.ideal_battery_range_km`)} as start_ideal_range_km,
        ${last(sql, sql`p.ideal_battery_range_km`)} as end_ideal_range_km,
        max(p.speed) as speed_max,
        max(p.power) as power_max,
        min(p.power) as power_min,
        coalesce(sum(p.climb) filter (where p.climb > 0), 0) as ascent,
        coalesce(-sum(p.climb) filter (where p.climb < 0), 0) as descent,
        round(avg(p.outside_temp), 1) as outside_temp_avg
      from (
        select
          record.*,
          case when record.elevation is not null then
            record.elevation - lag(record.elevation) over (
              partition by record.elevation is not null
              order by record.date
            )
          end as climb
        from positions record
        where record.drive_id = b.id and b.left_open
      ) p
      having count(*) > 1
    ) o on true
    left join lateral (
      select previous.end_address_id as address_id,
        previous.end_geofence_id as geofence_id
      from (
        select earlier.*
        from drives earlier
        where b.left_open
          and earlier.car_id = b.car_id
          and earlier.start_date < b.start_date
        order by earlier.start_date desc
        limit 1
      ) previous
      join positions parked on parked.id = previous.end_position_id
      join positions set_off on set_off.id = o.start_position_id
      where ${metersApart(sql, sql`parked`, sql`set_off`)} <= ${samePlaceM}
    ) came_from on true
    left join lateral (
      select following.start_address_id as address_id,
        following.start_geofence_id as geofence_id
      from (
        select later.*
        from drives later
        where b.left_open
          and later.car_id = b.car_id
          and later.start_date > b.start_date
        order by later.start_date
        limit 1
      ) following
      join positions set_off on set_off.id = following.start_position_id
      join positions arrived on arrived.id = o.end_position_id
      where ${metersApart(sql, sql`arrived`, sql`set_off`)} <= ${samePlaceM}
    ) went_to on true
    where b.end_date is not null or o.distance >= ${shortestDriveKm}
  )`;
}
