# 0045: An activity island for live activities

Date: 2026-11-25

Status: Accepted. It extends item 3 of [decision 0002](0002-ui-stack-and-motion.md): Motion now also animates the activity island.

## Context

The Live card shows a software update, a charge, and a drive only on the Overview. On the other pages, the owner cannot see that the car downloads an update or charges. Atlas web shows its live calls and walks in a black pill, the `ActivityIsland`, with a spring that changes its size. The owner asked for the same style in My Tesla, for example for an update.

## Decision

1. Each car page shows an activity island at the top center, in a second row of the sticky header. The row shows only while there is an activity.
2. The island shows one activity of the live feed: a drive, a charge, or a software update, in this order. Without an activity, it does not show.
3. `islandActivity()` in `src/lib/live/island.ts` picks the activity and formats its value on the server, with the same titles as the Live card. `src/components/activity-island.tsx` only draws it.
4. An update in download or in install shows its progress as a ring around the icon. A charge shows the time left with `ChargeCountdown`.
5. The island follows the Live status setting of the Overview and needs a connected feed.
6. The island keeps the look and the spring of Atlas. It leaves out the drag to an edge and the open view, because one activity at a time has no second line to show.

## Alternatives

1. The pill in the first row of the header. The header has no free space on a phone, and the tab navigation fills its center on a wide screen.
2. A fixed pill at the bottom center, above the tab bar. It covers the content and is far from the header status.
3. The Atlas island with the drag and the stored place. It adds about 80 lines for a need that the owner did not name.
4. The live stream on every page. The island then changes at once, but each feed change renders the whole page again, also a page with maps. The island changes with the page refresh of the Settings instead, and at once on the Overview.

## Consequences

The car layout reads the live feed on each render. The header grows by one row while there is an activity, so the content moves down when an activity starts. A page that is open without the Overview shows a change after the next page refresh. With the page refresh off, it shows the change after the next navigation.
