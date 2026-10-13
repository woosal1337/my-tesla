# 0017: Trips from drives

Date: 2026-10-13

Status: Accepted.

## Context

TeslaMate ends a drive each time the car parks. A journey with a break and a charging stop is three drives. The Trip view listed every drive and every charge of a date range, so it did not show a journey as one item. teslamate-mcp has trip tools that join such drives, and the dashboard reads the same database.

## Decision

1. A trip is a run of drives of one car in time order. A drive continues the trip when the stop before it is 30 minutes or shorter. With a charge in the stop, the limit is 120 minutes. A longer stop starts a new trip, so a night ends a trip.
2. A stop has a charge when a charging session starts in it: at or after the end of the drive before, and before the start of the next drive.
3. These are the rule and the default limits of `get_trips` in teslamate-mcp. On a real database, the two queries put every closed drive in the same trip. A drive that TeslaMate left open is a leg too, by [decision 0018](0018-drives-left-open.md), so a trip does not split at such a drive.
4. The id of a trip is the id of its first drive. The id of any drive of the trip finds the same trip.
5. A date range selects the trips that start in it. A trip that starts before the range stays out, with all its drives. A trip that starts in the range stays whole, with the drives after the end of the range.
6. The grouping runs in SQL, in one pass over the drives from 7 days before the selection to 7 days after it. A trip cannot cross a stop above 2 hours, so no trip reaches that far. The page then loads the drives and the charges of the selected trips, and pure code joins them into trips with stops. `tripLegsQuery()` takes the `sql` tag as a parameter, so that a PGlite test can run it.
7. TeslaMate also ends a drive when the driver shifts to Park for a moment, and when TeslaMate restarts on the road. A stop under 2 minutes without a charge is a pause. The page joins the drives around a pause into one leg, and it does not count the pause as a stop.
8. A leg under 50 m is no movement. The page leaves it out and joins the stops around it into one stop. A trip starts and ends at a leg with movement, and a trip without such a leg does not show.
9. A round trip starts and ends at the same place. Its title names the place of its longest stop.
10. A trip of one drive links to the drive page. A trip of two or more drives has its own page. A leg of several drives links to its longest drive.

## Alternatives

1. The Continuous Trips dashboard of TeslaMate in Grafana. It splits at every charge, so a charging stop on the way ends the trip.
2. The grouping in TypeScript over the drives of the range. A trip can cross the edge of the range, so the page would need drives outside the range, and it cannot know how many.
3. Limits in Settings. No user asked for other limits, and teslamate-mcp uses the same defaults.

## Consequences

Points 7 and 8 run in the pure code of the page, after the grouping. The grouping in SQL keeps the rule of teslamate-mcp, so both projects still put a drive in the same trip. The pages show fewer legs and stops than `get_trip_details` for the same trip.

The totals of a range count whole trips, so they can differ from the CSV export of the same range by the drives of a trip that crosses an edge of the range.

A place gets its name from the geofence or the address. Two parking spots a few meters apart can have different addresses, and then a round trip does not show as one. A geofence in TeslaMate for that place fixes this.

The two projects hold the rule in two places. A change to the limits in teslamate-mcp needs the same change in `src/lib/trip-legs-sql.ts`.
