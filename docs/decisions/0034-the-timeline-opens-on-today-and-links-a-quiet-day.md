# 0034: The Timeline opens on today and links a quiet day

Date: 2026-11-16

Status: Accepted.

## Context

The UI pass of 2026-10-23 found three faults on the Timeline of the mobile app.

1. The Timeline opens on today. When the car did not drive and did not charge today, the first screen shows "0 km", "0 drives", "0 min", and "0.0 kWh".
2. Two full-width buttons, "Day before" and "Day after", step the days. They take a row and look like a segmented control. A swipe does not change the day.
3. The hour strip has no key, on the Timeline and on the Today panel of Status. The web Timeline has a key for the five colors, but not for the "now" line, and the Today card of the web car page has none.

On iOS 26 and later, the native stack of `react-native-screens` 4.30 turns on the full-screen back swipe by default. A swipe to the right anywhere on a pushed screen returns to the screen before it.

## Decision

1. The Timeline still opens on today, on the web and in the app.
2. A quiet day is a day without a drive and a charge. On a quiet day, the server sends `lastActive`, the last earlier day with a drive or a charge, with the text "No drive and no charge on this day" and "Open the last day with one: …". The app shows it as a `LinkRow`, and the web as a card link. The stats show only "Asleep", or nothing when the day has no record. `lastActivityBefore()` in `src/lib/timeline-data.ts` reads the day with one query.
3. One row holds the date as a heading, "Today" on an earlier day, and a chevron for the day before and the day after, as the web header does. The navigation bar of the app keeps the title "Timeline".
4. A horizontal swipe on the content of the app Timeline changes the day. A swipe to the right opens the day before, and a swipe to the left opens the day after. `PanResponder` of React Native handles it, and the chevrons stay as the single-tap way.
5. The app Timeline sets `fullScreenGestureEnabled: false`. The back swipe then works from the left edge only, and a swipe in the content changes the day.
6. The server sends the key of the strip in `legend`: the five kinds and "Now" when the current time is inside the day. `dayLegend()` in `src/lib/timeline-view.ts` gives the same entries to the web and to the app.

## Alternatives

1. Open on the last day with a drive or a charge. The first screen then hides the "now" line and turns on "Day after", and the Today panel of Status, which links to the Timeline of today, opens another day.
2. The date between two chevrons. "Today" then needs a second row.
3. Chevrons in the navigation bar. The app has no header button pattern.
4. `react-native-gesture-handler` for the swipe. It needs a wrapper at the root and worklet callbacks for one swipe.
5. A pager with three pages. It reads three days for each step.
6. Keep the full-screen back swipe. A swipe to the right in the content then returns to Drives and never opens the day before.

## Consequences

- An older server sends no `legend` and no `lastActive`. The app then shows no key and no link, and the stepper and the swipe still work. An older app ignores both fields.
- On the app Timeline, the back swipe starts only at the left edge.
- A swipe on the empty area below a short page does nothing, because the swipe handlers sit on the content inside the ScrollView.
- A drive in progress has no end date and does not count, so a day with only that drive is a quiet day. The stats had the same limit before.
- The swipe on Android is not checked.

## Sources

- [Apple HIG: gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), read on 2026-11-16 (change log 2026-10-28): give people more than one way to interact, keep a visible control next to a shortcut gesture, and do not conflict with the system gestures.
- [Apple HIG: charts](https://developer.apple.com/design/human-interface-guidelines/charts) and [charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data), read on 2026-11-16: descriptive text helps people understand a chart.
- [Material 3 date pickers](https://m3.material.io/components/date-pickers/guidelines), read on 2026-11-16: previous and next buttons, and a horizontal swipe between months.
- [WCAG 2.2 Understanding 2.5.1 Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html), read on 2026-11-16: a path gesture needs a single-pointer way.
- [WCAG 2.2 Understanding 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), read on 2026-11-16: a text label next to each color.
- [React Native PanResponder](https://reactnative.dev/docs/panresponder) and [React Navigation native stack](https://reactnavigation.org/docs/native-stack-navigator/), read on 2026-11-16. The bundled types in `mobile/node_modules/expo-router/build/react-navigation/native-stack/types.d.ts` and `mobile/node_modules/react-native-screens/src/types.tsx` give the default of iOS 26 and later.
