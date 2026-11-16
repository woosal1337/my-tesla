# 0043: A readable column on wide screens

Date: 2026-11-16

Status: Accepted. It adds the row "Wide screens" to `research/mobile-ui.md`. Rule 4 of [decision 0022](0022-maps-in-the-mobile-app.md) and the wide Overview of [decision 0025](0025-the-tesla-app-layout.md) stay.

## Context

Only the Overview of the mobile app had a wide layout. Every other screen was the phone layout at the full width of the window. On the iPad Pro 11 simulator, a row of Drives was 794 pt wide in portrait and 1170 pt wide in landscape, so the clock on the left and the distance on the right lay far apart. The panels and the stat grids of Status, Insights, Settings, a drive, a charge, the Timeline, the Report, Location, and a trip spanned the full width too.

`Screen` gave its content a side padding of 20 pt and no width limit. Every screen except Connect renders through `Screen`.

## Decision

1. The content of `Screen` is at most 672 pt wide (`readableWidth`), in the middle of the window. `screenInset()` in `src/components/screen-inset.ts` gives the side padding: half of the window width minus 672 pt, and at least 20 pt. A window of 712 pt or less keeps 20 pt, so a phone does not change. `useScreenInset()` in `screen.tsx` reads the window width with `useWindowDimensions()`.
2. The column is the side padding of the ScrollView content. `Screen` adds no wrapper view, so `DayList` still counts the direct children of the ScrollView for the sticky headings.
3. A map stays edge to edge. `MapCanvas` takes the negative inset as its side margin, so a map reaches both window edges.
4. The Overview passes `fullWidth` and keeps the 20 pt padding. Its wide layout already uses the width for more content: the sidebar and the stage.

672 pt is the readable width that UIKit gives an iPad at the default text size. Apple does not publish the number. The column has the same width in portrait and in landscape, so a rotation moves no line break and no chart.

## Alternatives

1. A split view for the lists, with the list on the left and the selected drive or charge on the right. It needs a second navigation structure in each tab.
2. Two columns of panels on Status, Insights, a drive, and a charge. The panels have different heights, so each screen needs its own pairing rule. A chart is readable at 632 pt.
3. Four stat columns, as the web has from 768 px. Two columns of tire pressures match the car, and a hero value such as "+21.2 kWh" does not fit 150 pt.
4. Small titles on an iPad, so that the title aligns with the column. The title then repeats the selected tab under the tab bar, and a live change of `headerLargeTitleEnabled` puts the large title fixes of the app at risk.
5. A width limit with `maxWidth` and `alignSelf` on the content. A map with a negative margin then lies outside its container. Padding keeps all content inside.

## Consequences

- A row, a panel, and a stat grid on an iPad are at most 672 pt wide. The press margin of a row adds 12 pt on each side.
- The large title of Drives, Charging, Insights, and Settings stays at the window margin. UIKit draws it, and the app cannot move it.
- The column does not grow with the text size. UIKit widens its readable width at the large sizes.
- A swipe on the Timeline changes the day only inside the column. The chevrons work everywhere.
- A `StatGrid` can keep the column count of the old width after a resize to a window narrower than 712 pt. Only an iPad window in a split shows this.
- In portrait, the rows shrink only from 794 pt to 672 pt. The large gain is in landscape.
- A list and detail layout in landscape can come later.

## Sources

- [Apple HIG: layout](https://developer.apple.com/design/human-interface-guidelines/layout), read on 2026-11-16: the system layout guides "restrict the width of text for optimal readability", and a layout follows the size class, not the device or the orientation.
- [UIKit `readableContentGuide`](https://developer.apple.com/documentation/uikit/uiview/readablecontentguide) and [`cellLayoutMarginsFollowReadableWidth`](https://developer.apple.com/documentation/uikit/uitableview/celllayoutmarginsfollowreadablewidth), read on 2026-11-16
- [Use Your Loaf: readable content guides](https://useyourloaf.com/blog/readable-content-guides/) (672 pt on an iPad at the default text size) and [Apple forum: readable widths on iPadOS 18 and 26](https://developer.apple.com/forums/thread/812856) (664 pt on iPadOS 18), read on 2026-11-16
- [Android: adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) and [window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes), read on 2026-11-16
- [WCAG 2.2 Understanding 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) and [1.3.4 Orientation](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html), read on 2026-11-16
- [React Native `useWindowDimensions`](https://reactnative.dev/docs/usewindowdimensions), read on 2026-11-16
