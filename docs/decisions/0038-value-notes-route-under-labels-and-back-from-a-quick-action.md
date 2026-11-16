# 0038: Value notes, the route under the labels, and the back target of a quick action

Date: 2026-11-16

Status: Accepted.

## Context

A UI pass of the mobile app on 2026-11-15 found six small faults, on an iPhone with real data and on the simulator with the demo.

1. A value with a note, such as "Health 99.4%", gave no sign that a press opens an explanation.
2. The note of that value said "keeps 99% of its capacity" and "About 100% at 4,120 km". The stat said "99.4%". `assessBatteryHealth()` wrote whole numbers, and the stat writes one digit. The web popover reads the same text.
3. VoiceOver seemed to read the age of the data on the Overview two times.
4. The route line of the Report covered the city names. MapLibre draws the layers in the order of the style, and a layer without `beforeId` goes on top of all of them. The web drive and trip maps had the same fault.
5. The map of Places and the map of the Report do not pan. [Decision 0022](0022-maps-in-the-mobile-app.md) turns panning off inside a scrolling screen. The dots of one city lie on top of each other.
6. The quick actions Timeline, Report, and Year of the Overview open another tab. Back then goes to Drives or Insights, not to the Overview. [Decision 0025](0025-the-tesla-app-layout.md) does not say why.

## Decision

1. A `Stat` with a note shows the `info` symbol at 14 pt in the `mutedForeground` tone after its label. A press still opens the note in an `Alert`. A stat without a note has no symbol. The web keeps its dotted underline.
2. The health note writes the health and the fleet average with one digit, as the stat does. With one digit, the note can say "keeps 99.4%" next to "About 99.6%", so the green band gets two texts: "At or above average" when the health is at or above the average, and "At average" when it is within 1 point under it. The bands and the tones do not change. The web and the app change together.
3. The Overview needs no change for VoiceOver. Since 2026-11-16, the Overview shows each value once, and the label "75% · Online, Updated 3 min ago" is gone. On the simulator, the word "updated" is in one label only. The accessibility tree lists the parent and the child node of one React Native `Text` with the same bounds, which is one element for VoiceOver.
4. The route line goes under the label layers of the CARTO style. `RouteMap` in the app and `MapRoute` of the drive, trip, and Report maps on the web get `beforeId` with the layer `watername_ocean`. In Dark Matter and Positron, this layer starts the last block of 27 `symbol` layers of 95. The markers stay on top. The web `DrivenMap` keeps its layer on top.
5. A full-screen map is decided, and not built in this change. A press on the map of Places, the Report, a drive, a trip, and "Every road driven" will open the same map on its own screen of the same tab stack. One finger pans there, and the native back button closes it. The screen reads its data again from the same query hook, so no coordinate goes through a route parameter. The stack turns `fullScreenGestureEnabled` off for it, as for the Timeline. The inline map keeps panning off. Pinch zoom already zooms at the fingers and separates the dots of one city.
6. A quick action keeps the tab of its screen. Timeline and Report belong to Drives, and the year in review belongs to Insights. The tab bar shows that tab as selected, and Back goes to the parent of the screen in that tab. The Overview is one press away on the tab bar.

## Alternatives

1. An underline on a noted value. `textDecorationStyle` of React Native works on iOS only, so the dotted underline of the web is not possible on Android. A solid underline on a 20 pt value reads as a link to another screen.
2. A check for the layer id in the app, as `resolveBeforeId` does on the web. It needs a second download of the style in JavaScript and a prop change on a mounted layer, for a layer id that both styles share.
3. `layerIndex` in place of `beforeId`. The number of layers can change with each version of a style.
4. The Overview as the back target of a quick action. The same screens then live in the Overview stack and in their own tab, with two states, and `targetHref(target, stack)` no longer gives one tab for each screen. Android asks that a synthetic back stack match one that people can reach by navigating through the app.
5. A modal for the full-screen map. It hides the tab bar and needs its own close button.
6. `DrivenMap` under the labels too. Its mapcn part `MapGeoJSON` passes `beforeId` to MapLibre without a check, and the repository does not edit `src/components/ui/map.tsx`.

## Consequences

- If CARTO removes the layer `watername_ocean`, the route line does not draw in the app until the constant `labelLayer` changes. The native code of `@maplibre/maplibre-react-native` 11.5.0 waits for that layer. The web then draws the line on top.
- The river names of the layer `waterway_label` lie under the route line, because they come before `watername_ocean` in both styles.
- On the web, "Every road driven" still draws over the names. In the app, it draws under them.
- The full-screen map is open work. Clustering the place dots is an option for it.
- The symbol does not grow with the text size, and the label next to it does.

## Sources

- [Apple HIG: alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), read on 2026-11-16: "Avoid using an alert merely to provide information", and Mail shows an indicator that people can choose to learn more.
- [Apple HIG: buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), read on 2026-11-16 (change log 2025-12-16): "Ensure that each button clearly communicates its purpose."
- [WCAG 2.2 Understanding 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), read on 2026-11-16: color is not the only visual means of indicating an action.
- [React Native text style props](https://reactnative.dev/docs/text-style-props), read on 2026-11-16: `textDecorationStyle` and `textDecorationColor` are iOS only.
- [Apple HIG: maps](https://developer.apple.com/design/human-interface-guidelines/maps), read on 2026-11-16: "In general, make your map interactive", the overlay levels "Above roads" (the default) and "Above labels", and "Cluster overlapping points of interest to improve map legibility."
- [MapLibre style specification: layers](https://maplibre.org/maplibre-style-spec/layers/) and [MapLibre React Native `Layer`](https://maplibre.org/maplibre-react-native/docs/components/layer), read on 2026-11-16: the layers draw in the order of the array, and with `beforeId` "The layer will appear under this layer."
- [CARTO basemap styles](https://github.com/CartoDB/basemap-styles) with the [Dark Matter](https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json) and [Positron](https://basemaps.cartocdn.com/gl/positron-gl-style/style.json) style files, read on 2026-11-16: 95 layers each, and `watername_ocean` is the 69th.
- [Apple HIG: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), read on 2026-11-16 (change log 2026-06-08): a tab bar preserves "the current navigation state within each section", and stays visible when people navigate to different sections.
- [Android principles of navigation](https://developer.android.com/guide/navigation/principles), read on 2026-11-16: a synthetic back stack "should match a back stack that could have been achieved by organically navigating through the app."
- [Expo Router stack](https://docs.expo.dev/router/advanced/stack/) for `withAnchor`.
