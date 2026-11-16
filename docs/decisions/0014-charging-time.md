# 0014: Charging time from past charges

Date: 2026-10-12

Status: Accepted.

## Context

Charging insights showed the DC curves of past charges, but it gave no answer to "how long will the stop take?". teslamate-mcp is adding a tool for this question, and the dashboard reads the same database.

## Decision

1. For each charge, the query adds the seconds at each battery percent while power flows. A sample stands for the time until the next sample. A gap of more than 5 minutes is a hole in the record. The level where a charge stopped does not count, because the car did not charge through it.
2. The typical time of one percent is the median over the charges. The slow time is the 90th percentile. The time of a leg is the sum of its percents. The taper near the top and the AC losses are in these times, because the car measured them.
3. A leg shows a time only when each percent on the way has a record. If not, it shows "No record". Since 2026-11-16, the table of the mobile app shows "No record" too, in one cell after the levels.
4. The panel reads the charges of the last 2 years, not the period of the page. A short period has too few charges for each percent. Since 2026-11-16, the title of the panel names the range: "Charging time, last 2 years". [Decision 0033](0033-a-panel-names-its-own-range.md) explains the rule.
5. The panel shows DC and AC. A charge is DC when one of its samples has `fast_charger_present`, as on the other charging pages. The AC time mixes all AC chargers that the car used.
6. The legs are 10 % to 80 %, 20 % to 80 %, 80 % to 100 %, and one leg from the battery level now.
7. `chargeLevelTimesQuery()` takes the `sql` tag as a parameter, so that a PGlite test can run it.
8. Since 2026-11-16, the query keeps the charges of the window in a materialized CTE. PostgreSQL inlines a CTE with one reference, and it then looked up the charger type once for each sample, not once for each charge. For an AC charge each lookup read all samples of the charge. On a database with 31 charges and 30,836 charge samples, the query took 4.8 s and read 1.9 million buffers. It now takes 0.05 s and reads 2,210 buffers, and it returns the same rows.

## Alternatives

1. An estimate from the charger power and the battery capacity. It ignores the taper, and TeslaMate does not record the capacity.
2. A form for the two battery levels. The fixed legs answer the usual questions, and the page needs no input.
3. Separate times for Superchargers and other fast chargers, as in teslamate-mcp. Every other page of the dashboard has only AC and DC.

## Consequences

A new car shows "No record" for some legs until its charges cover each percent. A car that uses a slow and a fast AC charger gets one AC time between the two.

A query that computes a value for each charge and then joins `charges` keeps that value in a materialized CTE. `charge-time-sql.test.ts` checks the plan.
