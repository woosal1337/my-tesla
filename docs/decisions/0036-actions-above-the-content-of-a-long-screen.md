# 0036: Actions above the content of a long screen

Date: 2026-11-16

Status: Accepted.

## Context

The UI pass of 2026-10-23 found three actions of the mobile app at the end of long screens.

1. The Report shows "Share Drives CSV" and "Share Charges CSV" after up to 50 rows.
2. A charge shows "Older" and "Newer" after the stats, five charts, and the map.
3. A drive shows "Share GPX" after all the charts.

A person must scroll past all the content to find them. The web shows all three at the top of the page: the GPX link beside the back link of a drive, the two CSV links beside the Report title, and the Older and Newer links beside the back link of a charge.

On the newest charge, "Newer" is off, but it looks almost the same as "Older". `Button` gave an off button and a pressed button the same 60% opacity.

`Stack.Toolbar` of `expo-router` 58.0.23 needs `@expo/ui` on Android, and the app does not install it. `unstable_headerRightItems` works on iOS only.

## Decision

1. An action of a screen sits above its long content, inside the content, never after the last row. No screen gets a header button for it.
2. A charge has two 44 pt chevrons at the right of its first row, the row with the AC or DC badge. The left chevron opens the older charge, and the right chevron opens the newer charge. They reuse `StepButton`, the chevron of the Timeline. At a large text size, the kind text wraps beside the chevrons, and the chevrons keep 44 pt at the right of the row.
3. A drive shows "Share GPX" under the trip line and the notice, above the figures.
4. The Report shows "Share Drives CSV" and "Share Charges CSV" in one row under the totals, above "Routes" and the rows. The row wraps, so the buttons stack at a large text size. The buttons are off while the Report shows the data of the earlier range.
5. A `Button` that is off and not busy has 38% opacity. A pressed `Button` keeps 60%. A busy `Button` keeps full opacity with its spinner.

## Alternatives

1. Header buttons. `Stack.Toolbar` needs `@expo/ui` on Android, and `mobile/AGENTS.md` forbids that package without a decision record. `unstable_headerRightItems` works on iOS only. A `headerRight` view has no place for the busy state and the error text of an export, and the two exports of the Report need a menu there. The app has no header button pattern.
2. A swipe between charges. On iOS 26 and later, the full-screen back swipe takes a swipe to the right, and the Timeline had to turn it off.
3. Two full-width "Older" and "Newer" buttons at the top. They read as a segmented control, and the Timeline removed that look.
4. A second copy of the actions at the end. One action then has two controls.

## Consequences

- A person at the end of a long charge scrolls back to the top to step. A tap on the status bar does this on iOS.
- The chevrons have no visible text. A screen reader depends on their labels "Older charge" and "Newer charge".
- An off `Button` is dimmer than before in dark and in light. A busy button no longer dims.
- Android is not checked.

## Sources

- [Apple HIG: buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), read on 2026-11-16 (change log 2025-12-16): a hit region of at least 44 x 44 pt, enough space around a button, and one or two prominent buttons in a view.
- [Apple HIG: toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), read on 2026-11-16 (change log 2025-12-16): a toolbar holds the title, navigation controls, and actions, and asks to choose items deliberately to avoid overcrowding.
- [Compose Material 3 `FilledButtonTokens`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/FilledButtonTokens.kt), read on 2026-11-16: `DisabledLabelTextOpacity = 0.38f` and `DisabledContainerOpacity = 0.1f`.
- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), read on 2026-11-16: an inactive component has no contrast requirement.
- [WCAG 2.2 Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) and [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [React Native accessibility](https://reactnative.dev/docs/accessibility), read on 2026-11-16: `accessibilityState.disabled`, and an `accessibilityLabel` for a control without text.
- [Expo Router Stack for SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/stack/) and [the router reference](https://docs.expo.dev/versions/v58.0.0/sdk/router/), read on 2026-11-16: `Stack.Toolbar` supports Android and iOS, and `headerRight` "Will be overriden by `headerRightItems` on iOS". The bundled files `mobile/node_modules/expo-router/build/toolbar/native.android.js` and `mobile/node_modules/expo-router/package.json` show the `@expo/ui` need on Android.
- [React Navigation native stack](https://reactnavigation.org/docs/native-stack-navigator/) for `headerRight`.
