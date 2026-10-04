# 0012: Charges that TeslaMate leaves open

Date: 2026-10-05

Status: Accepted.

## Context

When TeslaMate restarts during a charge, it starts a new charging process and never closes the old one. The old process keeps `end_date` empty, and its energy, levels, and duration stay empty. The app showed it as a charge in progress forever, and every total left out its energy. On the owner's car, one restart split a 9.5 kWh charge in two.

## Decision

1. An open charging process with a later process for the same car is a charge that TeslaMate left open.
2. `chargeSessionsRelation()` fills its values from its `charges` rows, with the same rules as the TeslaMate `complete_charging_process`: the first and last level and range, the last record as the end, the energy added from the counter, and the energy used from the power over time.
3. Only the newest open process of a car counts as a charge in progress. The Overview snapshot uses the same rule for drives.
4. The charge page shows a note for a charge that TeslaMate left open.

## Alternatives

1. Close the process in the database. This breaks the read-only rule.
2. Hide the open process. Its energy and cost would still be missing from every total.

## Consequences

Every charge query reads the relation instead of `charging_processes`. The fill runs only for open processes, so the cost stays low: about 1 ms on the owner's database.
