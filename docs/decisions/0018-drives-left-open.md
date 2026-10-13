# 0018: Drives that TeslaMate leaves open

Date: 2026-10-13

Status: Accepted.

## Context

When TeslaMate restarts during a drive, it starts a new drive and never closes the old one. The old drive keeps `end_date` empty, and its distance, duration, places, and ranges stay empty. Every drive query asked for a closed drive, so the app did not show the old drive at all. On a real database, one night trip lost a 218 km leg, and the Trips page split the trip in two at that hole. That database has 74 such drives with 1,674 km, about 6% of the recorded distance. Decision 0012 covers the same fault for charges.

## Decision

1. An open drive with a later drive for the same car is a drive that TeslaMate left open. The newest open drive of a car is a drive in progress, and it stays out, as before.
2. `driveSessionsRelation()` fills a left open drive from its `positions` rows, with the rules of the TeslaMate `close_drive`: the last position as the end, the distance from the odometer, the first and the last known range, the top speed, the power limits, the average outside temperature, and the climb from the elevation.
3. A left open drive with fewer than two positions, or with under 10 m, stays out. TeslaMate deletes such a drive when it closes it.
4. TeslaMate finds the address when it closes a drive, so a left open drive has no place. The relation takes the end place of the drive before it, and the start place of the drive after it, when that drive has its position within 250 m. Without such a drive, the place shows as "Unknown place".
5. The caller picks the drives first, by id, date range, or limit. The fill then runs only for the left open drives among them.
6. The Drives list, a drive page, the drives CSV, and the trips read the relation. The drive page shows a note for a drive that TeslaMate left open.

## Alternatives

1. Close the drive in the database. This breaks the read-only rule. An owner can still run the TeslaMate command for it, and the app then shows the values of TeslaMate.
2. Bridge the hole only in the trip grouping. The trip would stay whole, but its distance, its energy, and its map would miss the leg.
3. An address lookup for the open end. The app has no geocoder, and the car position must not leave the server.

## Consequences

The fill of one long drive reads about 20,000 position rows. On that database, the six drives around the lost leg take about 30 ms. A fill of all left open drives takes 90 ms to 400 ms, so no query asks for all of them.

Stats, Places, Timeline, Battery, and the frequent routes still read only the closed drives. Their totals leave out the left open drives until they read the relation too.
