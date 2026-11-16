# 0037: The place of a parked car and a map cover

Date: 2026-11-16

Status: Accepted.

## Context

A UI pass of the mobile app on 2026-10-23 found four faults on the Location screen.

1. For about one second, the map was a box darker than the card. Then the tiles showed. The frame showed the card color for the 330 ms before the map mounted. After that, the native map view drew near-black until its style and its first tiles arrived. The maps of a drive, a trip, a charge, and Places use the same frame.
2. The screen showed a dot on the map, but no place name and no address.
3. The Overview said "Updated 17 min ago", and Location said "Last seen today at 05:25". Both texts came from the same time, the last position or else the start of the last state. Location showed a clock in the display time zone of the server, so on a phone in another zone the two texts looked hours apart.
4. Under "Open in Maps", most of the screen was empty.

TeslaMate ties an address only to a drive or a charge. It has no address for the last position.

## Decision

1. A cover in the card color with the breathing T-mark lies above every map until the map sends `onDidFinishRenderingMapFully`. Then it fades out in 330 ms, or goes at once with Reduce Motion. When the map sends `onDidFailLoadingMap`, the cover shows "The map did not load." A map that renders after a failure lifts the cover. After 8 s, the cover lifts in any case. `coverAfter()` in `mobile/src/components/map-cover.ts` holds the rule.
2. The place of a parked car is the end of the last drive, else the place of the last charge. The Timeline uses the same rule for "Parked at". The answer of `GET /api/app/cars/{carId}/overview` gives `location.place` and `location.since`, for example "Office" and "Parked since today at 16:25 · 1 h 35 min". Both are `null` while the car drives. `place` is `null` for "Unknown place", and `since` is `null` without a drive. The place follows the place names and the address detail of the Settings, as the drive list does. The Location row of the Overview shows the place as its summary.
3. Location shows the age of the position with the same text as the title of the Overview, `activity.updated`. The answer keeps `location.lastSeen` for older apps.
4. The map of Location has 46% of the screen height, as a route and Places have. The map of a charge keeps 38%.

## Alternatives

1. Fade the map itself from 0 to 1. On Android the map draws into a `SurfaceView`, and before Android 14 a `SurfaceView` ignores an alpha between 0 and 1.
2. A longer mount delay. With an empty tile cache, the tiles take longer than any fixed delay.
3. A new query for the address of the last position. TeslaMate keeps no address for a position, so the server would need a reverse lookup with an outside service. That sends the location history out of the server.
4. A clock time on both screens. The Overview title has room for a short relative text only, and the clock of the server zone misleads on a phone in another zone.

## Consequences

- The place is wrong when the car moved without a recorded drive, as on the Timeline.
- An app of this version with an older server shows no place and no parked line. An older app with this server ignores the two new fields.
- The web Location card still shows "Last seen" and no place.
- A map that changes its theme while it is on screen gets no new cover.

## Sources

- [Apple HIG: loading](https://developer.apple.com/design/human-interface-guidelines/loading), read on 2026-11-16: "Show something as soon as possible", with placeholder graphics or animations that the content replaces.
- [Android `SurfaceView`](https://developer.android.com/reference/android/view/SurfaceView), read on 2026-11-16: platform versions before Android 14 ignore an alpha between 0 and 1 on a `SurfaceView`.
- [MapLibre React Native `Map`](https://maplibre.org/maplibre-react-native/docs/components/map), with the event list in `src/components/map/Map.tsx` of the bundled package, read on 2026-11-16.
- [WCAG 2.2 Understanding 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), read on 2026-11-16: an animation in a preload phase can be essential when people would be confused without a sign of progress.
- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): the failure text has the `label` tone, with 6.7:1 on the dark card and 5.9:1 on the light card.
- `research/mobile-ui.md`, rows "Map mount" and "Layout".
