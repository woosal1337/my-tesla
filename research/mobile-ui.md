# My Tesla mobile UI research

Research date: 2026-10-17. Checked against Expo SDK 58 (React Native 0.88, React 19.3, expo-router 58.0.23), the Apple Human Interface Guidelines, Material Design 3, WCAG 2.2, and the package registries.

## Question

Which navigation, components, charts, and maps give a native iOS and Android app that follows the Tesla style of the web dashboard, stays small, and is accessible?

## Navigation

| Topic | Decision | Reason |
|---|---|---|
| Tabs | Five native tabs: Overview, Drives, Charging, Insights, Settings | Apple asks for the minimum number of tabs and, in general, three to five on iPhone. Material 3 and the Android navigation bar allow three to five destinations, and Android native tabs allow at most five. Battery, Stats, and Places already share one period control on the web, so they form Insights. |
| Settings | A tab, not a modal | Settings now changes the web Settings, with a picker for each choice. A tab keeps that stack of screens, and the gear button on Overview is gone. Five is the limit, so a new destination needs a decision record. |
| Choice lists | A pushed screen with one row for each option and a check mark on the chosen one. It stays open after a choice. | The Settings pattern of iOS: the check mark moves at once, and Back returns. A choice saves at once, with the old value back when the server refuses it. |
| Search in a long list | `Stack.SearchBar` on a choice list with more than 12 options, such as the time zone | The native search field of the header. SDK 55 and later replace `headerSearchBarOptions` with this component. |
| Stacks | A `Stack` inside each tab folder, with `unstable_settings = { anchor: "index" }` | `initialRouteName` is gone in SDK 58. The anchor puts the list under a deep link, so Back returns to it. |
| Status bar on Android | A screen without a native header adds the top safe-area inset on Android through `Screen withoutHeader`. | `contentInsetAdjustmentBehavior` works on iOS only. Android 15 and later draw every app edge to edge, so the first row of the Overview sat under the status bar on an Android 16 emulator until the inset was added. |
| Headers | Native large titles on the list screens, a small title on the detail screens | The ScrollView must be the first child for the large title to collapse. iOS 26 makes headers transparent with Liquid Glass by default, so the app adds no blur. |
| Header fonts | `headerTitleStyle` and `headerLargeTitleStyle` set Inter | iOS 26 headers ignore the theme fonts in SDK 58. |
| Lists | A ScrollView with sticky day headings | Native tabs scroll a ScrollView to the top and pop the stack when the active tab is pressed again. They do not do this for a FlatList. A list holds at most 50 rows. |
| Long list in a panel | The lock history shows 5 rows and a secondary **Show N more** button that extends the list in place; **Show fewer** folds it back | Apple and Material both prefer progressive disclosure over a menu for more of the same rows, and the rows stay in the scroll view, so VoiceOver reads them in order. The web uses a native `details` element for the same panel. |
| Overview structure | The car on a stage with callouts, the name with a chevron that switches the car, a row of quick actions, then a menu of rows with an icon, a title, and a short summary. On a wide screen the menu is a sidebar on the left and the car on the right. | Ege asked for the layout of Ian Zelbo's Tesla app concept (2026-10-22). The Tesla app itself stacks the car, the quick actions, and a list of sections on a phone; Apple's sidebar guidance puts a persistent sidebar on the leading edge of a wide window and a stacked layout in a compact width, and Material 3 uses a navigation rail or drawer at 840 dp and wider. The rows follow the Material 3 two-line list item (leading icon, headline, supporting text, 64 dp min height) and Apple's sidebar row (icon and title, the selected row filled). |
| Callouts | A small uppercase label over a bold value, with a 1 pt line down to the car, three at most: left, top, right. Values come formatted from the server. | The concept's callouts name a part and its state. Three keep the stage readable at 390 pt; more overlap the car. Uppercase labels at 12 pt with 1 pt tracking stay above the 4.5:1 contrast with `subtle` on the dark stage. A screen reader reads each callout as one element. |
| Stage glow | One radial gradient (`card` to transparent `background`) under the car in `CarStage`, drawn with `react-native-svg` | The only gradient in the app. The concept lights the car from below; a flat card looked like a broken image. SVG is already bundled for the charts, so no package. |
| Quick actions | Four icon buttons in a row (Timeline, Report, Year, Maps), 48 pt circles with a caption | The concept's Flash, Honk, Start, Vent row. The app is read-only, so the row holds the four places people open most. Apple: 44 pt targets; the caption gives each icon a name. |
| Car switcher | The car name with a chevron; a press expands the other cars as rows under it | The concept's name with a chevron. An inline list works the same on iOS and Android, needs no menu library, and reads as a disclosure (`accessibilityState.expanded`). The segmented control went away because the names did not fit at three cars. |
| Links from an alert | `router.navigate` to a known route only, after the car is chosen | The notification data comes from outside the app, so the app accepts only the routes in its own list. |
| More screens of a tab | Timeline and Report in Drives, Charging insights in Charging, and the year in review in Stats open from a `LinkRow` with a chevron at the top of the list, not from header buttons. | The Apple HIG uses a disclosure indicator for a row that opens another view, and Material 3 lists use a trailing icon for navigation. A header button would need `Stack.Toolbar`, which needs `@expo/ui` on Android. Five tabs stay the limit. |
| Year picker | A compact segmented control with the five newest years that have data | Apple suggests about five segments. An owner with more years sees the newest five; the web lists all. |
| Report range | The four presets of the web (7 days, 30 days, this month, this year) as a segmented control. No custom date range in the app. | A date picker needs a native package. The web keeps the free range. |
| Exports | `expo-file-system` downloads the CSV or GPX with the phone token into the cache, and `expo-sharing` opens the share sheet. | React Native `Share` shares only text on Android. A browser link would not carry the token. |
| Pairing link from the camera | The QR code is a `mytesla://connect?…` link. When the system camera opens it, Connect shows the server address with **Connect** and **Cancel**, and claims the code only after a press. | Expo Router opens a deep link as the route with its query as search params. A link can come from any app or web page, so the app never acts on it alone: the press, the single-use code, and the approval on the web with the matching number keep a stray link from signing the phone in somewhere else. |
| Two controls | One full-width segmented control for Battery, Stats, and Places. The period is a compact control in the section that it changes. | Apple uses a segmented control for closely related views. Two stacked controls of the same weight confuse. `Stack.Toolbar` would need `@expo/ui` on Android. |

## Components

| Topic | Decision | Source |
|---|---|---|
| Pressables | `Pressable`, with `accessibilityRole`, an explicit `accessibilityLabel`, and `accessibilityState` for disabled, busy, and selected | React Native docs recommend Pressable over the Touchable components. A busy button replaces its text with a spinner, so the label must stay on the Pressable. |
| Touch targets | 48 pt high buttons, 44 pt icon buttons with `hitSlop` | Apple: 44 × 44 pt. Material 3: 48 × 48 dp. WCAG 2.2 rule 2.5.8: at least 24 px. |
| Android feedback | `android_ripple` with the accent color, `overflow: "hidden"` on rounded controls | Material ripple, clipped to the radius |
| Haptics | None | The app is read-only. Apple asks to use haptics only for their system meaning. |
| `@expo/ui` | Not used | It needs a `Host` wrapper, ignores flexbox inside it, draws the system look over the flat Tesla style, and SDK 58 changed its API. |
| Styling | `StyleSheet.create` for layout, colors from `usePalette()` inline | Expo's color-theme guide shows this pattern, and the React Compiler memoizes the inline objects. NativeWind 5 is a release candidate, and Unistyles adds native packages. |
| Numbers | `fontVariant: ["tabular-nums"]` | The Inter 400 and 500 files of `@expo-google-fonts/inter` 0.4.2 contain the `tnum` feature. React Native passes it on both platforms. |
| List row time column | The start column of `ListRow` is 76 pt wide for `RowTime`. A row with an icon passes `startWidth`. The width does not scale with the text size. | HarfBuzz with the Inter files of the app measures `10:00 AM` (strong, 15 pt) at 71.3 pt and `99 h 59 min` (caption, 12 pt) at 68.4 pt. The old 64 pt column broke both onto two lines. 72 pt leaves 0.7 pt, and Android can round each glyph to a whole pixel, so 76 pt is the next step on the 4 pt grid. A fixed width aligns the clock, the duration, and the titles of all rows without a layout pass. Material 3 lists have a leading slot, a content slot, and a trailing slot, and the leading slot stays narrower than the content. Apple's Larger Text criteria and WCAG 2.2 rule 1.4.4 ask for no loss of content when text grows, and a later change handles that with a stacked layout. A width measured from the rows needs a second layout pass, and the titles move after the first frame. A short duration from the server gives the web and the app two texts for one value, and the 12-hour clock still breaks. |
| Long text in rows | The title and the subtitle of `ListRow`, `MenuRow`, and `Records` wrap onto as many lines as the text needs. No row cuts a place name or a summary. Only a short value in the end slot keeps `numberOfLines={1}`. The summary line of `DayList` goes through `summaryLine()`, which puts a no-break space between the words of each part, so the line breaks only between its parts. | HarfBuzz with the Inter files of the app measures a place name of 35 characters at 267 to 272 pt in `strong` (15 pt) and 247 to 252 pt in `label` (14 pt). The text column of a Drives row is 197 pt on a 402 pt phone and 155 pt on a 360 pt phone. On the 402 pt phone, "round trip from NAME · 2 stops, 1 with a charge" needs 4 lines, and a year record "Longest drive: NAME → NAME" needs 4 lines. A limit of two lines still cuts five of eight measured rows. The server puts the place before the stop count and the time, so a cut hid these facts first. Without a cut, nothing hides them. Apple's typography guidance says: "Keep text truncation to a minimum as font size increases", and "Avoid truncating text in scrollable regions unless people can open a separate view to read the rest of the content". Apple's lists guidance asks to preserve text that might otherwise get clipped or truncated, and the Larger Text criteria ask to wrap text to two or more lines instead of truncation. Material 3 list items have one, two, or three lines. WCAG 2.2 rule 1.4.10 asks for content without loss of information. In React Native 0.88, `numberOfLines` defaults to 0, which sets no limit. Unicode UAX #14 names the no-break space as the character that keeps two words on the same line. Rejected: a two-line limit, because it still cuts a name of 35 characters. The stop count before the place name, because the web shows the place first, so the app would have a second text for one value, and a cut then hides the place. A shorter Overview summary from the server, because the shortest useful text, "South Mountain Lookout · 20 km · Yesterday 17:05", is 331 pt wide in a 318 pt column and wraps anyway. |
| Large text | Body text scales freely. The hero, display, and title sizes stop at 1.2 times. | A 64 pt number at full Dynamic Type no longer fits a phone. |
| Reduce motion | `AccessibilityInfo.isReduceMotionEnabled()` plus the `reduceMotionChanged` event | Reanimated's hook reads the setting only at start. |
| Loading | The T-mark of the web breathes in the middle of the screen: it fades in, then pulses between full and 35% opacity every 1.4 s. Old data stays on screen with a notice when a refresh fails. | The web shows the same breathing mark in `loading.tsx`, so a screen change looks the same in both. The fade-in hides a short load, as the 400 ms delay of the spinner did. The web keeps the old screen instead of a skeleton (decision 0002). |
| Launch | The native splash is the plain dark background. Then the T-mark draws its outline and fills in 1.1 s, as the web splash does, and the splash fades out after at least 1.15 s. With Reduce Motion, the mark shows filled and the splash goes without a fade. | A static logo in the native splash would jump when the drawing starts. `react-native-svg` has no `pathLength`, so the dash length is the measured outline of the mark, 134 units. |
| Map mount | A map mounts 330 ms after its screen, and the frame shows the card color until then. | Creating the native map during the push animation dropped frames. |
| Pull to refresh | A `refreshing` state of its own, not `isRefetching` | `isRefetching` is true for every background refetch, so the spinner would flash every 30 s. |
| Polling | `subscribed: useIsFocused()` on every query | Tab screens stay mounted. A hidden tab must not poll. |
| Theme | Dark at first. System, Light, or Dark, kept on the phone and set with `Appearance.setColorScheme` before the first screen. | `setColorScheme` overrides the scheme for the app only. React Native 0.88 takes `'auto'` to follow the system again and marks `'unspecified'` as old. The API keeps no choice, so the app stores it. The splash is dark, because the native splash cannot read the stored choice. |
| Stored values | `expo-sqlite/kv-store` for the theme, the car list, and the last Settings answer. `expo-secure-store` stays for the server address, the token, and the alert choices. | Expo's storage guide names `expo-sqlite/kv-store` as the AsyncStorage replacement, and it reads synchronously, so the theme applies before the first frame. A stored answer passes the same shape check as a server answer, and it is shown at once and fetched again. |
| QR scanner | `CameraView.launchScanner` from `expo-camera`, with one listener on `onModernBarcodeScanned` for the Connect screen | The system scanner: VisionKit `DataScannerViewController` on iOS 16 and later, and the Google code scanner on Android. The app draws no camera screen. On iOS the scanner reports a code again on every frame, so the app takes the first one and closes it with `dismissScanner()`. iOS needs the camera permission first, and Android needs none. The plugin leaves out the microphone and `RECORD_AUDIO`. |
| Remote images | `expo-image` with `cachePolicy="memory-disk"` and a 330 ms fade on the first load only | The car image comes from the Tesla compositor with `max-age=60`. React Native `Image` follows that header on iOS and fetched the 290 KB image again after a minute and at each start. `expo-image` keeps it in memory and on disk. |
| Period changes | `placeholderData: keepPreviousData` | The old panels stay while the next period loads. |

## Live updates

| Topic | Decision | Reason |
|---|---|---|
| Change signal | The Overview and a charge read `/api/cars/{carId}/live`, the server-sent event stream of the web, through `expo/fetch` with the phone token, and refetch their query on an `event: change`, at most once every 2 s. | React Native has no `EventSource`, and a library would add a dependency for a few lines. SDK 58 installs `expo/fetch` as the global fetch with a streaming body on iOS and Android, and Hermes gives `TextDecoder`. The stream sends only "something changed", never a value, so the answer still comes from the formatted app API. |
| Life cycle | The stream runs only while the screen is focused and the app is active, reconnects after 5 s, and stops for good on 204 (no MQTT feed), 401, 403, or 404. | A hidden tab or a phone in the pocket should hold no connection. The 30 s poll stays as the fallback when the stream is closed. |

## Charts

A small `react-native-svg` chart (SDK 58 bundles 15.16.0), not a chart library.

| Option | Why not |
|---|---|
| victory-native 42 | It needs Skia, which adds about 6 MB on iOS and 4 MB on Android. It also computes its own ticks, while the server already gives the ticks and labels in the user's format. |
| react-native-gifted-charts 1.4 | One view per point, and an open issue reports slow rendering at 300 points. |
| @wuba/react-native-echarts | A large JavaScript bundle |

The server sends each chart as points in the user's units, the axis domains, the ticks, and the tooltip labels. The app scales and draws one path for each series, the bars, a faint horizontal grid, and a scrubbing tooltip. A vertical scroll takes over from scrubbing.

## Maps

| Topic | Decision | Reason |
|---|---|---|
| Engine | `@maplibre/maplibre-react-native` 11.5.0 with the CARTO Positron and Dark Matter styles | The engine and the styles of the web, so the maps look the same. Only CARTO sees the tile requests. `expo-maps` and `react-native-maps` would send them to Apple or Google, and Android would need a Google key. Version 11 runs on the new architecture only and has an Expo config plugin. Checked on React Native 0.88 in a development build on the iOS 27 simulator on 2026-10-18. |
| Layout | Edge to edge, square corners, outside the cards. A drive and a trip open with the map under the navigation bar. Height: 46% of the screen for a route or Places, 38% for one position, between 260 and 560 pt. | Apple's layout guidance asks to extend visual content to the edges of the display and keep controls in the safe area. The attribution button keeps the screen margin. A map in a card looked like a thumbnail. |
| Gestures | No pan, rotate, or tilt inside a scrolling screen. Pinch and double tap zoom. | One finger always scrolls the screen, as the cooperative gestures of the web do. Apple asks for interactive maps, so a full-screen map on tap is the next step. |
| Markers | Routes and dots are `Layer`s on a `GeoJSONSource`. The car is a `Marker` view that pulses, and it stops with Reduce Motion. | Style layers keep a map with many places fast. The dot colors and sizes copy the web: circle radius plus stroke equals the web size. |
| Ornaments | The attribution stays, at the bottom right. No logo and no compass. | OpenStreetMap and CARTO need the attribution. The compass has no use without rotation. |
| CARTO key | None | The vector styles of the web answer without a key on 2026-10-18. CARTO asks for a free key for raster tiles, and says that vector tiles come next. |

## Package versions

| Package | Version | Note |
|---|---|---|
| expo | 58.0.14 | |
| expo-router | 58.0.23 | Native tabs from `expo-router/native-tabs` |
| expo-symbols | 58.0.4 | Android tab icons need it. It is an optional peer of expo-router. |
| react-native-svg | 15.16.0 | |
| @maplibre/maplibre-react-native | 11.5.0 | Pinned. Not in `bundledNativeModules.json`, so check it at each SDK upgrade. |
| react-native-gesture-handler | 3.3.0 | Pinned. Bun had installed 3.4.0 as a peer, one day after its release. |
| react-native-reanimated, react-native-worklets | 4.7.1, 0.13.0 | Peers of expo-router, pinned to the SDK versions |
| @tanstack/react-query | 5.104 | `subscribed` and `keepPreviousData` |
| eslint | 9 | ESLint 10 breaks `eslint-plugin-react` inside `eslint-config-expo` 58. |

## Sources

- [Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/), [Expo Router stack](https://docs.expo.dev/router/advanced/stack/), [SDK 57 to 58 router migration](https://docs.expo.dev/router/migrate/sdk-57-to-58/), [router settings](https://docs.expo.dev/router/advanced/router-settings/), [SDK 58 changelog](https://expo.dev/changelog/sdk-58)
- [Expo bundled native modules for SDK 58](https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json)
- [Apple HIG: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- [Android navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar), [Material Components bottom navigation](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [React Native Pressable](https://reactnative.dev/docs/pressable), [accessibility](https://reactnative.dev/docs/accessibility), [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo), [text style props](https://reactnative.dev/docs/text-style-props)
- [Expo React Compiler guide](https://docs.expo.dev/guides/react-compiler/), [Expo color themes](https://docs.expo.dev/develop/user-interface/color-themes/)
- [TanStack Query for React Native](https://tanstack.com/query/latest/docs/framework/react/react-native), [query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Apple HIG: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Material 3 lists](https://m3.material.io/components/lists/guidelines), [Expo FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/), [Expo Sharing](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/)
- [Android edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge), [react-native-safe-area-context](https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/)
- [Expo `expo/fetch` streaming](https://docs.expo.dev/versions/latest/sdk/expo/), [Expo Router linking](https://docs.expo.dev/router/basics/navigation/), [server-sent events in the HTML standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [React Native Appearance](https://reactnative.dev/docs/appearance), [Expo storage guide](https://docs.expo.dev/develop/user-interface/store-data/), [Expo SQLite kv-store](https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/), [expo-image](https://docs.expo.dev/versions/v58.0.0/sdk/image/), [expo-camera](https://docs.expo.dev/versions/v58.0.0/sdk/camera/), [React Native image cache control](https://reactnative.dev/docs/images#cache-control-ios-only), [Expo Router stack search bar](https://docs.expo.dev/versions/v58.0.0/sdk/router/stack/)
- [Nielsen Norman Group: skeleton screens](https://www.nngroup.com/articles/skeleton-screens/)
- [victory-native releases](https://github.com/FormidableLabs/victory-native-xl/releases), [gifted-charts issue 789](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/issues/789), [Skia bundle size](https://github.com/wcandillon/react-native-skia/blob/2.x/apps/docs/docs/getting-started/bundle-size.md)
- [Apple HIG: maps](https://developer.apple.com/design/human-interface-guidelines/maps), [layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Material 3 lists: specs](https://m3.material.io/components/lists/specs), [Apple HIG: typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple Larger Text evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria/), [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [React Native Text](https://reactnative.dev/docs/text)
- [WCAG 2.2 Understanding 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Compose Material 3 `ListItem`](https://developer.android.com/reference/kotlin/androidx/compose/material3/ListItem.composable), [Unicode UAX #14 line breaking](https://www.unicode.org/reports/tr14/)
- [MapLibre React Native releases](https://github.com/maplibre/maplibre-react-native/releases), [v11 migration](https://maplibre.org/maplibre-react-native/docs/setup/migrations/v11), [its Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo), [CARTO basemap keys](https://www.carto.com/basemaps/apikey/)
