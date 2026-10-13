# 0019: Drives lists trips

Date: 2026-10-13

Status: Accepted.

## Context

TeslaMate ends a drive each time the car parks, also for a short stop or a charge on the way. The Drives tab listed each of those drives, so one journey filled several rows, and short moves in a car park filled more. [Decision 0017](0017-trips-from-drives.md) joins the drives of one journey into a trip. Only the date range page showed the trips. The owners want the first list to give a general view, and the details to stay one level down.

## Decision

1. The Drives tab lists trips, not drives. It takes the last 50 drives, as before, and shows the trips that start in that time, newest first.
2. A row shows the start time, the total time, where the trip ends, where it starts, the number of stops, the distance, and the consumption. The columns stay the same as in the earlier drive rows and in the Charging rows.
3. Under a trip with stops, a thin bar shows the drives, the stops, and the charging stops in time order. The bar uses the colors of the Timeline: blue for driving, green for charging, and gray for a stop. A trip without stops has no bar.
4. A trip of one drive opens the drive page. Any other trip opens its trip page, which lists each leg and each stop and links to each drive and each charge. The trip page goes back to Drives.
5. The date range page keeps its address, `/drives/trip`, and its name is Report. It adds the totals and the map of a range, and the CSV exports. One name stays for one thing: a trip is one journey.

## Alternatives

1. A switch between trips and drives on the Drives tab. It gives two lists of the same records, and each needs its own empty state and summary.
2. Make the Report the Drives tab. The tab then loads the route of every drive in the range for the map, so it opens slower.
3. Hide the moves under 1 km. Decision 0017 already leaves out a leg under 50 m. A longer short move can be a real trip, so it stays.

## Consequences

The tab runs the trip query in addition to the drive query. On the real database, through an SSH tunnel, the dev server sent the whole tab in 0.25 s to 0.4 s.

The oldest trip of the list can start before the oldest of the 50 drives. Such a trip stays out, because the list shows the trips that start in that time. The Report shows it.

On a phone, a long place name cuts the stop count. The bar still shows the stops.
