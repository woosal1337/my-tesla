# 0042: A large text layout and a limit of 2 times

Date: 2026-11-16

Status: Accepted. It changes the row "Large text" of `research/mobile-ui.md`.

## Context

The text of the mobile app scales with Dynamic Type, up to 3.57 times at AX5, the largest accessibility size. The layouts kept their default geometry. At XXXL (1.353), the largest standard size, a Charging row broke "Supercharger" inside the word beside its DC badge, stat labels were cut ("Charging effici…"), and the period control showed "7 da…". At AX5, the 76 pt time column of Drives broke the clock one character on each line, two stat columns cut the labels ("Dista…"), the fourth quick action was off the screen, and the five segments of a control showed "S…".

Many texts also had a line limit, so they were cut and did not wrap: the label and the detail of a stat, the note of a panel, the caption of a quick action, the state and the caption under the car name, the title and the detail of a Live tile, and the account lines of Settings.

No layout holds one long word at 3.57 times. "Temperature" in `strong` is about 300 pt wide at AX5, and the title column of a Settings row on an iPhone 17 Pro is 296 pt wide.

## Decision

1. The app has one large text layout from a font scale of 1.3. XXXL and every accessibility size use it. `useLargeText()` reads `useWindowDimensions().fontScale`, and the pure `isLargeText()` holds the rule. In the large layout:
   - a `ListRow` with `RowTime` stacks: the clock and the duration on one line, then the title, the subtitle, and the accessory, then the end values on one line. A row with an icon keeps its columns;
   - `StatGrid` and the Live tiles have one column, and `QuickActions` has two;
   - the note of a `Panel` goes under the title, the value of a `Records` row goes under the title, and the time of a lock row goes under its title;
   - a `table` block shows one stacked card for each row, with the column name before each value.
2. Text stops growing at 2 times the font scale. `Text` sets `maxFontSizeMultiplier` to 2 for every variant, and to 1.2 for `hero`, `display`, and `title`, as before. A caller can still pass its own limit.
3. The labels of repeated controls and axes stop at 1.2 times: the labels of `SegmentedControl`, and the hour and weekday labels of `DayStrip` and `Heatmap`, as the chart ticks already do. Each segment shows the iOS Large Content Viewer on a long press. The value axes of a chart grow with their labels, to 1.2 times the 40 pt default, so a label such as `100%` is not cut.

Icons grow with the text to 1.5 times at most, so they still fit their 44 pt and 48 pt boxes. The texts above lose their line limits and wrap. Only a short value keeps one line.

## Alternatives

1. No limit on the text. One word at 3.57 times breaks inside in any layout.
2. Three layouts: default, XXXL, and the accessibility sizes. They need more branches to build and to check, and they meet no more criteria. The three-column row already fails at XXXL.
3. A vertical segmented control. The sliding pill then needs a second axis of motion.
4. `adjustsFontSizeToFit` on the segment labels. The labels of one control then have different sizes.
5. A rule that reads the width as well, for the iPad. Nobody asked for it.

## Consequences

- Two layouts to check on each screen: the default size and one size of 1.3 or more. Check XXXL and AX5.
- On an iPad, the large layout also has one stat column, because the rule reads only the font scale.
- At 2 times, a `heading` (48 pt) is larger than a `title` (38 pt).
- A single word of more than about 11 characters in `strong` can still break in a panel at 2 times.
- The segment labels and the axis labels do not grow past 1.2 times. The Large Content Viewer shows a segment label at a large size.
- Android was not checked. Android 14 scales fonts to 200% at most, so the limit of 2 changes little there.

## Sources

- [Apple HIG: typography](https://developer.apple.com/design/human-interface-guidelines/typography), read on 2026-11-16: "Consider adjusting your layout at large font sizes", "Reduce the number of columns", "Increase the size of meaningful interface icons", and "Keep text truncation to a minimum". People "don't expect the tab titles to increase in size".
- [Apple HIG: layout](https://developer.apple.com/design/human-interface-guidelines/layout), read on 2026-11-16: "horizontally adjacent views may need to stack vertically".
- [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), read on 2026-11-16: "enlarge text by at least 200 percent".
- [Apple Larger Text evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria), read on 2026-11-16: "at least 200% or the maximum font size for the system", tab bars that do not grow with Dynamic Type, and the Large Content Viewer.
- [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), read on 2026-11-16
- [Android 14 non-linear font scaling to 200%](https://developer.android.com/about/versions/14/features#non-linear-font-scaling), read on 2026-11-16
- [React Native `useWindowDimensions`](https://reactnative.dev/docs/usewindowdimensions), [`Text` `maxFontSizeMultiplier`](https://reactnative.dev/docs/text#maxfontsizemultiplier), and [`accessibilityShowsLargeContentViewer`](https://reactnative.dev/docs/accessibility#accessibilityshowslargecontentviewer-ios), read on 2026-11-16
