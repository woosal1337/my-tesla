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
  hooks/          Small shared hooks: refresh, the current time
```

## Navigation

1. The tab bar is `NativeTabs` from `expo-router/native-tabs` with five tabs: Overview, Drives, Charging, Insights, Settings. The Overview is the group folder `(overview)/` with its own stack: `index` (no header) at `/`, `status`, and `location`. Its menu rows open another tab with `router.navigate` to the tab root and then `router.dismissAll()`, because `navigate` pushes a second copy of the index when a detail screen is open; `requestInsight(kind)` in `src/navigation/insight-request.ts` tells Insights which kind to show, so the index never takes params. Insights switches Battery, Stats, and Places with a segmented control. The period control shows in the section that has `period: true`, or at the top when no section has it. Five is the limit: Android allows five tabs at most, and Apple asks for three to five. Add no tab without a decision record.
2. Every tab with more than one screen is a folder with a `_layout.tsx` that renders a `Stack` and exports `unstable_settings = { anchor: "index" }`.
3. The list screen of a tab uses a large title (`headerLargeTitleEnabled: true`). A detail screen sets its title from its data with `<Stack.Screen options={{ title }} />` inside the screen.
4. Every `Stack` uses `screenOptions={useStackOptions()}` from `src/navigation/header.ts`, so the headers use Inter and the palette.
5. Connect lives in the root stack. Its scan button reads the QR code from Settings on the web with `CameraView.launchScanner`, and a `mytesla://connect?…` link from the camera app opens Connect with the code, which waits for a press on **Connect**. `pairingOf()` and `pairingOfLink()` in `src/connection/server.ts` check the code, `/api/app/pair` trades it for a phone token, and the screen polls `/api/app/pair/status` until the person allows the phone on the web. The token stays in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. A 401 for a phone token throws `SignedOutError`, and the root layout then clears the phone with `useForgetPhone()` from `src/connection/use-forget-phone.ts`: the same cleanup as **Sign out**, without the server calls, because the token is already dead. Settings is a tab: its list screen shows the groups from `/api/app/settings`, and `settings/[key]` lists the options of one choice with a check mark. A choice list with more than 12 options gets `Stack.SearchBar`.
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
4. A query that must show without a network sets `stored: <key>` in `useAppQuery`. The answer goes to `expo-sqlite/kv-store`, comes back as `initialData` through the same shape check, and is fetched again at once. Only the car list and the Settings use it: the tabs need the car list to open, and live values from a stored answer would mislead. Sign out and a 401 remove both through `useForgetPhone()`.
5. Change a server setting with `useSettingChange()`. It shows the new value at once, puts the old one back when the server refuses, and refetches the other screens, because their units change.
6. Pull to refresh uses `useRefresh(query)`. Never pass `isRefetching` to a `RefreshControl`.
7. Render a query through `<QueryView query={…}>{(data) => …}</QueryView>`. It shows the breathing T-mark of the web while it loads. It shows the error with a retry button when there is no data, and a notice above the old data when a refresh fails.
8. A list with sticky day headings renders through `DayList`, because the sticky indices must count the direct children of the ScrollView.
9. Every answer from outside the app is untrusted: server JSON, notification data, and stored values. Check its shape before use.

## Components

Use these components. Do not style a screen with raw colors or new text sizes.

| Component | Use |
|---|---|
| `Text` | All text. Variants: `body`, `label`, `caption`, `strong`, `value`, `heading`, `title`, `display`, `hero`. Pass `tone` for a palette color or `color` for a computed one. `hero`, `display`, and `title` stop growing at 1.2 times the font scale. |
| `Screen` | The scroll container of every screen. It sets the insets for the transparent header and the tab bar, and the refresh control. A screen without a native header, such as the Overview, passes `withoutHeader`, so Android keeps it below the status bar. |
| `Panel` | A card: a muted title, an optional note on the right, and children. A `Button` inside a panel gets the page background. |
| `Stat`, `StatGrid` | An `AppStat` from the server: a label, a value with its tone, and a detail. A value with a note opens the explanation on press. |
| `ListRow`, `RowTime` | A row of a list. Always pass `label`, the text that a screen reader says, with the units written out by the server text. Pass `selected` for the chosen row of a choice list. |
| `DayList` | A list grouped by day with sticky headings, and optional `actions` under the summary |
| `MenuRow`, `LinkRow` | A row with an icon, a title, and a one-line summary, the row of the Overview menu and of the sidebar. `LinkRow` is the same row with a chevron, for another screen of the same tab, such as Timeline from Drives |
| `CarTitle`, `CarStage`, `QuickActions` | The head of the Overview: the car name with the chevron that switches the car, the battery glyph with the state; the car on its glow with the callouts from the server; and the row of icon buttons under it. Read [decision 0025](../docs/decisions/0025-the-tesla-app-layout.md). |
| `InsightBody`, `PeriodControl` | The hero, the hero blocks, and the sections of an insight page, for Insights, Charging insights, and the year in review |
| `DriveListRow` | A trip or a charge row of a drive list, for Drives and the Report |
| `ExportButton` | Downloads an export of the server with the phone token and opens the share sheet. `src/api/export-file.ts` checks the path and the file name, and deletes the previous export first. |
| `SegmentedControl` | Two to five choices that switch a view or a filter. `size="compact"` for a filter inside a section. |
| `Button` | The primary button is the only blue control on a screen. Use `kind="secondary"` for every other action. |
| `SwitchRow`, `Field` | An on and off setting with an optional detail, and a labelled text field |
| `Icon`, `icons` | A symbol with a name for each platform: an SF Symbol and a Material Symbol. The types reject a wrong name. Add new icons to `icons.ts`. |
| `Chart` | An `AppChart` from the server. It draws areas, lines, and bars on one or two axes, and a scrubbing tooltip. |
| `Block` | One block of an insight panel: stats, chart, shares, table, records, heatmap, progress, notice, or note. It takes the tab stack, so a record opens its target in the same tab. |
| `Records`, `Heatmap` | A ranked list with a bar, a badge, links, and a target, and the drive starts by weekday and hour |
| `LocationMap`, `RouteMap`, `PlacesMap` | The maps of the web: the car, a route with its markers, and the places sized by visits, on the CARTO styles |
| `Notice` | A warning line with an icon, for a server notice |
| `EmptyState`, `Problem` | A list without records, and an error with a retry button |
| `TeslaMark`, `LaunchSplash` | The T-mark of the web, drawn at launch or breathing while a screen loads. `src/theme/mark.ts` copies the path of `src/lib/logo.ts`, and a test fails when they differ. |
| `TripStrip`, `LevelBar`, `ChargerBadge`, `DayStrip`, `Battery`, `LivePanel` | The small parts of the dashboard, drawn the same way as on the web |

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
8. A value tone is green for better than usual and red for worse, and the text always says the value. Never show meaning by color alone.

## Accessibility

1. Touch targets: 48 pt for buttons and rows, 44 pt for icon buttons. Use `hitSlop` to reach the size, never a smaller control.
2. Every pressable has `accessibilityRole` and `accessibilityLabel`. Selected, disabled, and busy states go in `accessibilityState`.
3. Section and panel titles have `accessibilityRole="header"`.
4. Group the parts of one value or one row into one element with `accessible`, so a screen reader reads it as one.
5. Respect Reduce Motion with `useReducedMotion()`. Do not animate when it is on.
6. Check both themes and the largest text size before you finish a screen.

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

1. Lists use a ScrollView, because native tabs scroll it to the top and pop the stack when the active tab is pressed again. The server sends at most 50 rows. Measure first, then switch a list to `@shopify/flash-list` 2 (bundled by SDK 58) only if it scrolls badly.
2. Charts take the `AppChart` that the server builds with `buildChart` in `src/lib/app/chart.ts`. Add a chart kind on the server first, then draw it in `Chart`. Do not add a chart library.
3. Show a remote image with `Image` from `expo-image` and `cachePolicy="memory-disk"`, never the React Native `Image`. The car image server sends `max-age=60`.
4. Draw a map with `LocationMap`, `RouteMap`, or `PlacesMap` from `src/components/map.tsx`. The server sends the positions, and `null` when maps are off. Draw routes and dots as style layers on a GeoJSON source, not as views. Keep the CARTO style URLs of the web, and keep panning off inside a scrolling screen. A map runs from edge to edge outside the cards: wrap it in `MapSection` for a titled map, or put a route map first on a detail screen with `marginTop: -space.lg`. [Decision 0022](../docs/decisions/0022-maps-in-the-mobile-app.md) explains why.

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
