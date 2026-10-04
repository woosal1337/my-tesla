import type postgres from "postgres";
import type { ChargePrices } from "./charge-cost";

function priceOf(sql: postgres.Sql, prices: ChargePrices) {
  if (prices.fastPerKwh === null) {
    return sql`${prices.perKwh}::numeric`;
  }
  return sql`case
    when exists (
      select 1 from charges fc
      where fc.charging_process_id = cp.id and fc.fast_charger_present
    ) then ${prices.fastPerKwh}::numeric
    else ${prices.perKwh}::numeric
  end`;
}

export function chargeSessionsRelation(
  sql: postgres.Sql,
  carId: number,
  prices: ChargePrices,
) {
  return sql`(
    select
      s.*,
      coalesce(s.recorded_cost, round(s.price * s.billed_kwh, 2)) as cost,
      s.recorded_cost is null
        and s.price is not null
        and s.billed_kwh is not null as cost_estimated
    from (
      select
        cp.id,
        cp.car_id,
        cp.position_id,
        cp.address_id,
        cp.geofence_id,
        cp.start_date,
        case
          when gate.unclosed then coalesce(o.end_date, cp.start_date)
          else cp.end_date
        end as end_date,
        coalesce(cp.charge_energy_added, o.charge_energy_added)
          as charge_energy_added,
        coalesce(cp.charge_energy_used, o.charge_energy_used)
          as charge_energy_used,
        coalesce(cp.start_battery_level, o.start_battery_level)
          as start_battery_level,
        coalesce(cp.end_battery_level, o.end_battery_level)
          as end_battery_level,
        coalesce(cp.start_rated_range_km, o.start_rated_range_km)
          as start_rated_range_km,
        coalesce(cp.end_rated_range_km, o.end_rated_range_km)
          as end_rated_range_km,
        coalesce(cp.start_ideal_range_km, o.start_ideal_range_km)
          as start_ideal_range_km,
        coalesce(cp.end_ideal_range_km, o.end_ideal_range_km)
          as end_ideal_range_km,
        coalesce(cp.duration_min, o.duration_min) as duration_min,
        coalesce(cp.outside_temp_avg, o.outside_temp_avg) as outside_temp_avg,
        cp.cost as recorded_cost,
        gate.unclosed,
        ${priceOf(sql, prices)} as price,
        greatest(
          coalesce(cp.charge_energy_added, o.charge_energy_added),
          coalesce(cp.charge_energy_used, o.charge_energy_used)
        ) as billed_kwh
      from charging_processes cp
      cross join lateral (
        select cp.end_date is null and exists (
          select 1 from charging_processes later
          where later.car_id = cp.car_id and later.start_date > cp.start_date
        ) as unclosed
      ) gate
      left join lateral (
        select
          t.end_date,
          t.start_battery_level,
          t.end_battery_level,
          t.start_rated_range_km,
          t.end_rated_range_km,
          t.start_ideal_range_km,
          t.end_ideal_range_km,
          t.duration_min,
          t.outside_temp_avg,
          case
            when t.added_last - t.added_first >= 0
              then t.added_last - t.added_first
          end as charge_energy_added,
          (
            select sum(u.kwh)
            from (
              select
                coalesce(
                  uc.charger_phases * uc.charger_actual_current
                    * uc.charger_voltage / 1000.0,
                  uc.charger_power
                ) * extract(epoch from
                  uc.date - lag(uc.date) over (order by uc.date)
                ) / 3600 as kwh
              from charges uc
              where uc.charging_process_id = cp.id
            ) u
            where u.kwh >= 0
          ) as charge_energy_used
        from (
          select
            max(c.date) as end_date,
            (array_agg(c.battery_level order by c.date))[1]
              as start_battery_level,
            (array_agg(c.battery_level order by c.date desc))[1]
              as end_battery_level,
            (array_agg(c.rated_battery_range_km order by c.date))[1]
              as start_rated_range_km,
            (array_agg(c.rated_battery_range_km order by c.date desc))[1]
              as end_rated_range_km,
            (array_agg(c.ideal_battery_range_km order by c.date))[1]
              as start_ideal_range_km,
            (array_agg(c.ideal_battery_range_km order by c.date desc))[1]
              as end_ideal_range_km,
            round(extract(epoch from max(c.date) - min(c.date)) / 60)
              as duration_min,
            round(avg(c.outside_temp), 1) as outside_temp_avg,
            coalesce(
              nullif((array_agg(c.charge_energy_added order by c.date desc))[1], 0),
              max(c.charge_energy_added)
            ) as added_last,
            (array_agg(c.charge_energy_added order by c.date))[1] as added_first
          from charges c
          where c.charging_process_id = cp.id and gate.unclosed
          having count(*) > 0
        ) t
      ) o on true
      where cp.car_id = ${carId}
    ) s
  )`;
}
