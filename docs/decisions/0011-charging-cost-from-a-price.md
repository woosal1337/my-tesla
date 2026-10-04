# 0011: Charging cost from a price in Settings

Date: 2026-10-05

Status: Accepted.

## Context

TeslaMate records a cost for a charge only when the charge is in a geofence with a price. Many owners never set a geofence price, so the cost pages stay empty. The app reads the database and never writes to it, so it cannot fill the `cost` column.

## Decision

1. Settings has a price per kWh and an optional fast charging price. Each user has their own prices, in the same file as the other Settings.
2. One SQL relation, `chargeSessionsRelation()` in `src/lib/charge-sessions-sql.ts`, gives every charge query its cost. A cost that TeslaMate recorded always stays.
3. For a completed charge without a recorded cost, the cost is the price times the energy from the charger. The energy from the charger is the larger of `charge_energy_added` and `charge_energy_used`, which is the same rule that TeslaMate uses for a geofence price.
4. A DC fast charge uses the fast charging price when it is set. Otherwise it uses the price per kWh.
5. The relation also gives `cost_estimated`, so the charge page, the Stats chart, and the CSV file can name the source of each cost.

## Alternatives

1. Write the cost into TeslaMate. This breaks the read-only rule.
2. Compute the cost in each page. Each total would need the same rule again, and the totals could disagree.

## Consequences

A price change applies to all old charges at once, because the app computes the cost at each request. A user who wants a price for each place must still set it on the TeslaMate geofence.
