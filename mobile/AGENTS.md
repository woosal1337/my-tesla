# Mobile app guidance

This file owns the rules for code in `mobile/`. The root `AGENTS.md` still applies: the product contract, no comments, the checks, and the delivery rules. `CLAUDE.md` in this folder imports this file.

Read these before a change:

1. `docs/mobile.md`: how to run, build, and connect the app.
2. `docs/decisions/0020-mobile-app-and-push-alerts.md`: why the app looks the way it does.
3. `research/mobile-ui.md`: the navigation, component, chart, and map choices, with sources.
4. `research/ui-stack.md`: the Tesla tokens that the web and the app share.
5. `src/lib/app/contract.ts` at the repository root: every answer that the app reads.

## Research before a shared change

Before you add or change a shared component, the navigation (tabs, stacks, headers, modals), a control (buttons, segmented controls, switches, fields), a list pattern, a chart, or a native package:

1. Search the current guidance: the Apple Human Interface Guidelines, Material Design 3, WCAG 2.2, the React Native docs, the Expo docs for the SDK in `package.json`, and the docs of the package.
2. Check the versions that the SDK bundles: `bundledNativeModules.json` of the `expo` package.
3. Write the decision, the reason, and the source links into `research/mobile-ui.md` in the same change.
4. Follow the existing component when the guidance agrees with it. Change the component, not each screen, when it does not.

## Architecture

The server formats, and the app draws.

1. The app reads only JSON from the My Tesla server, through the same login proxy as the browser. It never reads the database or the MQTT broker.
2. The app API at `/api/app/cars/{carId}/…` gives each screen ready to draw: text in the user's units, number style, clock, date order, currency, and time zone, the value tones, the notes that explain a tone, and charts with their ticks and labels.
3. `src/lib/app/contract.ts` defines every answer. The app imports it with `import type { … } from "@contract"`. Never copy a server type into the app.
4. The app keeps no formatter of its own. `src/format.ts` holds only the charge countdown, because it counts down on the device between two requests.
5. A new screen starts on the server. Read "Add a screen" below.

```
mobile/src/
  app/            Expo Router routes. A route file reads its params and renders a screen.
  screens/        Screens that more than one route shows, such as the charge screen in Drives and Charging
  components/     Shared components. One component, one file.
  api/            request(), the response shape checks, and one query hook for each endpoint
  car/            The chosen car, shared by every tab and saved on the device
  connection/     The server address and the phone token in the Keychain or the Keystore
  alerts/         Push tokens, Android channels, the alert choices, and the routes for a tapped alert
  navigation/     The header options and the link from a server target to a route
  theme/          The palette, the tokens, the tones, the stored theme choice, and reduced motion
  hooks/          Small shared hooks: refresh, the current time, the scroll to the top, the day swipe
```

## Navigation

1. The tab bar is `NativeTabs` from `expo-router/native-tabs` with five tabs: Overview, Drives, Charging, Insights, Settings. The Overview is the group folder `(overview)/` with its own stack: `index` at `/`, `status`, and `location`. `index` has no header on a phone. On an iPad it keeps a navigation bar (`overviewHeaderShown`), because UIKit loses the inset of the top tab bar when the bar of the stack hides again. On iPadOS 27 with the tab bar at the top, this bar shows no title. No other iPadOS version or tab bar position was checked. Its menu rows open another tab with `router.navigate` to the tab root and then `router.dismissAll()`, because `navigate` pushes a second copy of the index when a detail screen is open; `requestInsight(kind)` in `src/navigation/insight-request.ts` tells Insights which kind to show, so the index never takes params. Insights switches Battery, Stats, and Places with a segmented control. The period control shows in the section that has `period: true`, or at the top when no section has it. Five is the limit: Android allows five tabs at most, and Apple asks for three to five. Add no tab without a decision record.
2. Every tab with more than one screen is a folder with a `_layout.tsx` that renders a `Stack` and exports `unstable_settings = { anchor: "index" }`.
3. The list screen of a tab uses a large title (`headerLargeTitleEnabled: true`). A detail screen sets its title from its data with `<Stack.Screen options={{ title }} />` inside the screen. The Timeline keeps the title "Timeline", because its `DayStepper` shows the date. Its `_layout.tsx` sets `fullScreenGestureEnabled: false` for the Timeline, so a swipe in the content changes the day and the back swipe works from the left edge only. On iOS 26 and later, the native stack turns the full-screen back swipe on by default.
4. Every `Stack` uses `screenOptions={useStackOptions()}` from `src/navigation/header.ts`, so the headers use Inter and the palette.
5. Connect lives in the root stack. It is the one screen with its own `ScrollView` and not `Screen`. Its start state shows the still T-mark at the place and the size of the launch splash mark, the title and the sign-in sentence under it, and the buttons at the bottom inside the safe area. `launchFrame()` keeps all content below the mark, so the buttons stay in the lower half, and the screen scrolls at a large text size. The waiting panel and the link panel show alone, centered vertically. [Decision 0041](../docs/decisions/0041-connect-continues-the-launch-mark.md) explains the layout. Its scan button reads the QR code from Settings on the web with `CameraView.launchScanner`, and a `mytesla://connect?…` link from the camera app opens Connect with the code, which waits for a press on **Connect**. `pairingOf()` and `pairingOfLink()` in `src/connection/server.ts` check the code, `/api/app/pair` trades it for a phone token, and the screen polls `/api/app/pair/status` until the person allows the phone on the web. The token stays in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. iOS keeps Keychain entries after a delete, so at the first start of a new install the connection provider deletes each key of `keychainKeys` before it reads the connection. `isNewInstall()` in `src/connection/install.ts` holds the rule: the kv-store holds no key. A 401 for a phone token throws `SignedOutError`, and the root layout then forgets the connection. Settings is a tab: its list screen shows the groups from `/api/app/settings`, and `settings/[key]` lists the options of one choice with a check mark. A choice list with more than 12 options gets `Stack.SearchBar`.
6. Build a link to a drive, a trip, or a charge with `targetHref(target, stack)`. Push it with `router.push(href)` in the same tab. From another tab, add `{ withAnchor: true }`.
7. Use the typed route objects (`{ pathname: "/drives/[driveId]", params }`). Typed routes are on, so the type check catches a wrong path. Run `bun run start` once after you add a route, so Expo writes the route types.
8. Never navigate to a string that comes from outside the app. `alertRoute()` in `src/alerts/use-alerts.ts` keeps the list of routes that an alert may open.

## Data

1. Read the server only through a hook in `src/api/queries.ts`. Each hook calls `useAppQuery`, which:
   - checks the answer with a shape function from `src/api/responses.ts`, and fails with a readable message when the server is not My Tesla or is too old;
   - sets `subscribed: useIsFocused()`, so a hidden tab does not poll;
   - keeps the server address in the query key, so two servers never share a cache.
2. Poll (`refetchInterval: 30_000`) only screens that show live values: Overview and a charge. They also call `useLiveChanges()` from `src/api/live.ts`, which reads the change stream of the server and refetches their query on a change. Lists refresh when the tab comes back into focus or the app returns to the foreground.
3. A screen with a filter, such as the period, sets `keepPrevious: true`, so the old panels stay while the next ones load.
4. A query that must show without a network sets `stored: <key>` in `useAppQuery`. The answer goes to `expo-sqlite/kv-store`, comes back as `initialData` through the same shape check, and is fetched again at once. Only the car list and the Settings use it: the tabs need the car list to open, and live values from a stored answer would mislead. Disconnect removes both with `forgetStored()`. The kv-store also holds the theme choice and the install mark. The mark stays after a disconnect, so the next start is not a new install.
5. Change a server setting with `useSettingChange()`. It shows the new value at once, puts the old one back when the server refuses, and refetches the other screens, because their units change.
6. Pull to refresh uses `useRefresh(query)`. Never pass `isRefetching` to a `RefreshControl`.
7. Render a query through `<QueryView query={…}>{(data) => …}</QueryView>`. It shows the breathing T-mark of the web while it loads. It shows the error with a retry button when there is no data, and a notice above the old data when a refresh fails. A screen that renders through `DayList` gives its `QueryView` to `DayList`: as `notice` in Drives and Charging, and inside `before` in the Report.
8. A list with sticky day headings renders through `DayList`: Drives, Charging, and the Report. The sticky indices must count the direct children of the ScrollView. Where the navigation bar covers the list, `DayList` gives the ScrollView `StickyHeading`, so the pinned heading stays below the bar.
9. Every answer from outside the app is untrusted: server JSON, notification data, and stored values. Check its shape before use.
10. Every Keychain key of the app comes from `keychainKeys` in `src/connection/install.ts`. Keep each name: a new name loses the stored value at the update. Add a new key there, so the first start of a new install deletes it too.

## Components

Use these components. Do not style a screen with raw colors or new text sizes.
Put an action of a screen above its long content, never after the last row.

| Component | Use |
|---|---|
| `Text` | All text. Variants: `body`, `label`, `caption`, `strong`, `value`, `heading`, `title`, `display`, `hero`. Pass `tone` for a palette color or `color` for a computed one. `hero`, `display`, and `title` stop growing at 1.2 times the font scale, and every other variant at 2 times (`largeTextCap` and `textCap` in `src/theme/text-size.ts`). Pass `maxFontSizeMultiplier` only for a label of a repeated control or an axis. |
| `Screen` | The scroll container of every screen except Connect. It sets the insets for the transparent header and the tab bar, and the refresh control. It keeps the content in a column of at most 672 pt in the middle of a wide window: `useScreenInset()` gives the side padding from `screenInset()` in `screen-inset.ts`, at least 20 pt (`screenPadding`), so a phone keeps 20 pt. The column is padding, not a wrapper view, so the children stay direct children of the ScrollView. A screen that uses the width for more content, such as the Overview with its sidebar, passes `fullWidth` and keeps 20 pt. [Decision 0043](../docs/decisions/0043-a-readable-column-on-wide-screens.md) explains the column. A screen without a native header, such as the Overview on a phone, passes `withoutHeader`: a strip in the page background covers the status bar, and Android keeps the content below it. A screen with a header that leaves the status bar open, such as the Overview on an iPad, passes `coverStatusBar`: the strip shows where the screen lies under the header, which `headerCoversScreen()` decides. When the active tab is pressed again, iOS scrolls the screen back to the offset at rest, so a large title returns to its full size. `dimmed` fades the content while the next filter loads. `StickyHeaderComponent` goes to the ScrollView. `StatusBarStrip` is the strip alone, for Connect, which draws its own ScrollView. |
| `Panel` | A card: a muted title, an optional note on the right, and children. With large text, the note goes under the title and wraps. A `Button` inside a panel gets the page background. A server builder gives a panel that does not follow the period of its page a title that names its own range, for example "Charging time, last 2 years". |
| `Stat`, `StatGrid` | An `AppStat` from the server: a label, a value with its tone, and a detail. A value with a note shows an info symbol after its label and opens the explanation on press. The label and the detail wrap, and the detail goes through `dottedLine()`. Only the value keeps one line and shrinks to fit. With large text, `StatGrid` has one column. |
| `ListRow`, `RowTime` | A row of a list. Always pass `label`, the text that a screen reader says: the `label` of the server row, which holds each value of the row with the units in full words. When an older server sends no `label`, join the visible texts in the reading order with ", ". Pass `selected` for the chosen row of a choice list. The start column is 76 pt wide for `RowTime`. Pass `startWidth` only for an icon. With large text, a row with `RowTime` stacks: the clock and the duration on one line, then the title, the subtitle, and the accessory, then the end values on one line. A row with `startWidth` keeps its columns. The title and the subtitle wrap. Never set a line limit on a place name or a summary. The subtitle goes through `dottedLine()`, which keeps a number with its word and keeps the separator "·" with the part after it. Pass every other dotted line of the server through `dottedLine()` too. Keep `numberOfLines={1}` only for a short value in `end`. The `end` column is at most 35% of the row. Put a text that can be wider, such as the time range of a Timeline row, as a caption above the title. |
| `DayList` | A list grouped by day with sticky headings. It takes an optional `notice` above the summary, an optional summary, `actions` under the summary, and `before` the first day. Pass `largeTitle` when the screen has a large title. The summary line breaks only between its parts (`summaryLine`), and the separator "·" stays with the part after it. A heading shows the day and the `total` of the server through `headingLine()`, and shows only the day when the server sends no `total`. The heading is one element for a screen reader, with the role `header` and the `label` of the section, or the visible text when the server sends no `label`. |
| `StickyHeading` | The sticky wrapper of a day heading where the navigation bar covers the list. It pins the heading at the lower edge of the bar with the animated header height. `headerCoversScreen()` and `stickyRange()` in `sticky-geometry.ts` hold its logic. |
| `MenuRow`, `LinkRow` | A row with an icon, a title, and a summary that wraps when it is long, the row of the Overview menu and of the sidebar. The summary goes through `dottedLine()`, as in `ListRow`. `LinkRow` is the same row with a chevron, for another screen of the same tab, such as Timeline from Drives |
| `CarTitle`, `CarStage`, `QuickActions` | The head of the Overview: the car name with the chevron that switches the car, the state, and the switcher rows with the battery and the state of each other car; the car on its glow with the callouts from the server; and the row of icon buttons under it, in two columns with large text. The state and the caption under the car name wrap. `carSlot()` in `car-frame.ts` places the image from `car.imageFrame`, so the car spans the stage. Read [decision 0025](../docs/decisions/0025-the-tesla-app-layout.md) and [decision 0028](../docs/decisions/0028-the-car-fills-the-stage.md). |
| `InsightBody`, `PeriodControl` | The hero, the hero blocks, and the sections of an insight page, for Insights, Charging insights, and the year in review |
| `DriveListRow` | A trip row of a drive list, for Drives and the Report. A Report row with `charge` draws as `ChargeListRow`. |
| `ChargeListRow` | A charge row with the AC or DC badge, the levels, the level bar, the energy, and the cost, for Charging and the Report. It takes the tab stack, so the charge opens in the same tab. |
| `ExportButton` | Downloads an export of the server with the phone token and opens the share sheet. `src/api/export-file.ts` checks the path and the file name. Pass `disabled` while the screen shows the data of an earlier filter. |
| `SegmentedControl` | Two to five choices that switch a view or a filter. `size="compact"` for a filter inside a section. A regular segment is 40 pt high in a 48 pt track, and its `hitSlop` of 4 pt fills the padding of the track, so the target is 48 pt high. A compact segment is 32 pt high in a 40 pt track, and its `hitSlop` of 8 pt makes the target 48 pt high. Keep 8 pt between a compact control and the next control, and put it in no view that clips. Its labels stop growing at 1.2 times the font scale, and a long press shows the iOS Large Content Viewer. |
| `Button` | The primary button is the only blue control on a screen. Use `kind="secondary"` for every other action. A button that is off and not busy has 38% opacity, a pressed button 60%, and a busy button full opacity with its spinner. |
| `SwitchRow`, `Field` | An on and off setting with an optional detail, and a labelled text field |
| `Icon`, `icons` | A symbol with a name for each platform: an SF Symbol and a Material Symbol. The types reject a wrong name. Add new icons to `icons.ts`. An icon grows with the text to 1.5 times its size at most (`useIconScale()`). |
| `Chart` | An `AppChart` from the server. It draws areas, lines, and bars on one or two axes, and a scrubbing tooltip. It shows the `caption` of the server above the legend, and draws each line in the `dash` style of its series. When a series has a pattern, the legend shows a line sample for each series instead of the dot. The tick labels stop growing at 1.2 times the font scale, and the value axes grow with them (`useAxisScale()`). |
| `Block` | One block of an insight panel: stats, chart, shares, table, records, heatmap, progress, notice, or note. It takes the tab stack, so a record opens its target in the same tab. A note without a `role` is an empty state, centered and gray. A `heading`, `body`, or `caption` note is content and stays left-aligned. The right text of a `shares` row and the end of a `progress` block move to the next line when they do not fit. With large text, a `table` shows one stacked card for each row, with the column name before each value. |
| `Records`, `Heatmap` | A ranked list with a bar, a badge, links, and a target, and the drive or charge starts by weekday and hour, with a key for the shades under the hours. A link of a record is underlined caption text in the `secondaryForeground` tone, never blue, in a 48 pt box. With large text, the value of a record goes under its title, without the indent. The hour and weekday labels stop growing at 1.2 times the font scale. |
| `LocationMap`, `RouteMap`, `PlacesMap` | The maps of the web: the car, a route with its markers, and the places sized by visits, on the CARTO styles. `LocationMap` takes a `size`: `hero` on Location, `card` on a charge. A cover in the card color with the breathing T-mark lies above each map until the map renders. It shows "The map did not load." when the map fails, and lifts after 8 s in any case. `coverAfter()` in `map-cover.ts` holds the rule. |
| `Notice` | A warning line with an icon, for a server notice |
| `EmptyState`, `Problem` | A list without records, and an error with a retry button |
| `TeslaMark`, `LaunchSplash` | The T-mark of the web, drawn at launch (`draw`), breathing while a screen loads (`breathe`), or still on Connect (`still`). Never switch one mounted mark to another kind. The splash and Connect use `launchMarkSize`, and `launchFrame()` in `launch-frame.ts` places the mark of Connect at the center of the window, where the splash draws it. `src/theme/mark.ts` copies the path of `src/lib/logo.ts`, and a test fails when they differ. |
| `DayStepper` | One row with the date as a heading, "Today" when the day is not today, and a 44 pt chevron for the day before and the day after. The buttons move under the date when the row is too narrow, and the date stops growing at 2 times the font scale, the limit of `Text`. A `null` handler disables the chevron or hides "Today". `useSwipe()` in `src/hooks/use-swipe.ts` gives the same steps to a horizontal swipe, and `swipeStep()` holds its rule. |
| `StepButton` | A 44 pt chevron with a label for a screen reader, for the day stepper and the older and newer charge. A `null` handler turns it off: no fill and the `subtle` icon. |
| `TripStrip`, `LevelBar`, `ChargerBadge`, `DayStrip`, `Battery`, `LivePanel` | The small parts of the dashboard, drawn the same way as on the web. The box of `ChargerBadge` is one 22 pt line, the line of a `strong` name, and a row that puts it beside a name aligns to the top, so the badge stays on the first line of a long name. `DayStrip` draws the key of the server (`legend`) under the hours, and draws no key when an older server sends none. Its hour labels stop growing at 1.2 times the font scale, and its key keeps the full scale. With large text, the Live tiles have one column and wrap. Offline time is amber (`palette.warning`). |

A new shared component:

1. Do the research above first.
2. Give it one job, typed props, and no defaults that hide a missing value.
3. Make it work in light and dark, with large text, with a screen reader, and with reduced motion.
4. Put any logic that is not drawing into a pure function in its own file with a `bun:test` file next to it, such as `chart-geometry.ts`.

## Style

The app follows the Tesla style of the web. `research/ui-stack.md` has the tokens.

1. The app starts dark. `src/theme/appearance.ts` keeps the choice of the phone (System, Light, or Dark) and applies it with `Appearance.setColorScheme` before the first screen. `useColorScheme()` and `usePalette()` follow it.
2. Colors come only from `usePalette()`. `src/theme/palette.ts` copies `src/app/globals.css`, and `palette.test.ts` fails when they differ. Change the web token first.
3. Two font weights only: Inter 400 (`fonts.regular`) and Inter 500 (`fonts.medium`).
4. Cards have a 12 pt radius (`radius.card`) and `borderCurve: "continuous"`. Controls have a 4 pt radius (`radius.control`). No shadows, no card borders, no gradients, except the one radial glow of `CarStage` under the car, which [decision 0025](../docs/decisions/0025-the-tesla-app-layout.md) allows.
5. Numbers that change or line up use `fontVariant: ["tabular-nums"]`.
6. Spacing comes from `space` in `src/theme/tokens.ts`.
7. Keep `StyleSheet.create` for layout, and pass palette colors inline: `[styles.card, { backgroundColor: palette.card }]`.
8. A value tone is green for better than usual, red for worse, and amber for a warning about the value. The text always says the value. Never show meaning by color alone. Each tone color needs 4.5:1 on the page and on the card in both themes, and `palette.test.ts` checks it.

## Accessibility

1. Touch targets: 48 pt for buttons, rows, text links, and the segments of a `SegmentedControl`, 44 pt for icon buttons. Give the control the size in its layout with `minHeight` and `minWidth`. `hitSlop` adds touch area that the view hierarchy does not show. On React Native 0.88, it reaches past the parent view unless an ancestor clips, although the React Native docs say that it does not. Only `SegmentedControl` gets its target from `hitSlop`: a regular segment inside its track, and a compact segment 4 pt past its track. Give no other control its size with it.
2. Every pressable has `accessibilityRole` and `accessibilityLabel`. Selected, disabled, and busy states go in `accessibilityState`.
3. Section and panel titles have `accessibilityRole="header"`.
4. Group the parts of one value or one row into one element with `accessible`, so a screen reader reads it as one.
5. Respect Reduce Motion with `useReducedMotion()`. Do not animate when it is on.
6. Check both themes and the largest text size before you finish a screen.
7. For a layout that changes with the text size, read `useLargeText()` from `src/theme/use-text-size.ts`. Never read `fontScale` in a component. Two layouts exist: the default, and the large text layout from a font scale of 1.3. [Decision 0042](../docs/decisions/0042-large-text-layout.md) explains them.
8. Set no line limit on a text of the server. Only a short value keeps `numberOfLines={1}`.
9. Check XXXL and AX5: `xcrun simctl ui <device> content_size extra-extra-extra-large` and `accessibility-extra-extra-extra-large`.

## Motion

1. One duration and one curve: `motion.durationMs` (330 ms) and `motion.easing` (`cubic-bezier(0.5, 0, 0, 0.75)`).
2. Animate only to show a change: a bar that fills, a pill that slides. No decoration.
3. Hold an `Animated.Value` in `useState(() => new Animated.Value(0))`, not in `useRef(...).current`. The React Compiler rules reject reading a ref during render.

## React and TypeScript

1. The React Compiler is on. Do not add `useMemo`, `useCallback`, or `memo` by hand.
2. TypeScript runs in strict mode with `noUncheckedIndexedAccess`. Handle the `undefined` of an index.
3. Use the `@/` path for app files and `@contract` for the server types.
4. No comments in the source, the tests, or the configuration. Use names, types, small functions, and documents.

## Lists, charts, and maps

1. Lists use a ScrollView, because native tabs scroll it to the top and pop the stack when the active tab is pressed again. On iOS, `Screen` completes the scroll, so a large title returns. The server sends at most 50 rows. Measure first, then switch a list to `@shopify/flash-list` 2 (bundled by SDK 58) only if it scrolls badly.
2. Charts take the `AppChart` that the server builds with `buildChart` in `src/lib/app/chart.ts`. Add a chart kind on the server first, then draw it in `Chart`. Do not add a chart library.
3. Show a remote image with `Image` from `expo-image` and `cachePolicy="memory-disk"`, never the React Native `Image`. The car image server sends `max-age=60`.
4. Draw a map with `LocationMap`, `RouteMap`, or `PlacesMap` from `src/components/map.tsx`. The server sends the positions, and `null` when maps are off. Draw routes and dots as style layers on a GeoJSON source, not as views. A route line goes under the labels of the style with `beforeId={labelLayer}`, and a dot layer stays on top. Keep the CARTO style URLs of the web, and keep panning off inside a scrolling screen. Never fade the native map itself: Android ignores the alpha of its `SurfaceView` before Android 14, so the cover of `MapCanvas` hides it until the tiles load. A map runs from edge to edge outside the cards: wrap it in `MapSection` for a titled map, or put a route map first on a detail screen with `marginTop: -space.lg`. `MapCanvas` takes the negative `useScreenInset()` as its side margin, so a map reaches both window edges outside the column of a wide screen. A `fullWidth` screen holds no map. [Decision 0022](../docs/decisions/0022-maps-in-the-mobile-app.md) explains why.

## Push alerts

1. The server decides the events. The app shows the list from `GET /api/push`, so a new event needs no app change.
2. Each event has its own Android notification channel, created before the app registers the event.
3. A tapped alert chooses its car, then opens a route from `alertRoute()`.

## Add a screen

1. Server: write a pure builder in `src/lib/app/`, with a test, that turns the query results and the user's formatter into a type of `contract.ts`.
2. Server: add the route under `src/app/api/app/cars/[carId]/`. It calls `appContext()`, then the queries, then the builder, and answers with `appJson()`.
3. Server: describe the endpoint in `docs/api.md`.
4. App: add a shape check to `src/api/responses.ts` with a test, and a hook to `src/api/queries.ts`.
5. App: add the route file and the screen. Use the components above.
6. Run the app on a simulator in light and dark, and with large text.

## Packages

1. Add a package with `bun x expo install <package>`, so that its version fits the SDK.
2. Check it against `bundledNativeModules.json` of the `expo` package, and run `bun x expo-doctor`. It must pass every check.
3. A package with native code needs a new development build: `APP_VARIANT=development bun run ios`.
4. Keep `mobile/bun.lock` in the format of Bun 1.4.3, the version in `packageManager` and in CI. A newer Bun can rewrite it to a format that CI cannot read: run `npx bun@1.4.3 install` in this folder to write it again.
5. Keep ESLint on version 9. ESLint 10 breaks the React plugin inside `eslint-config-expo` 58.
6. Do not add NativeWind, Unistyles, a chart library, another map library, or `@expo/ui` without a decision record. `research/mobile-ui.md` says why.

## Checks

| Command | Effect |
|---|---|
| `bun run --cwd mobile lint` | ESLint with the Expo rules and the React Compiler rules |
| `bun run --cwd mobile typecheck` | TypeScript, with the typed routes |
| `bun test mobile` | The pure tests of the app. The root `bun test` runs them too. |
| `bun x expo-doctor` in `mobile/` | The SDK and package checks |
| `bun x expo export --platform ios --platform android` in `mobile/` | Bundles both platforms without a device |

`python3 tools/quality.py check` runs the lint and the type check with the web gates, and the commit hook runs it. Before you finish a screen, run it in a development build on a simulator. Maestro can drive the simulator when you need to type or tap.
