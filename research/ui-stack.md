# My Tesla UI stack research

Research date: 2026-10-01

## Question

Which theme, components, and motion tools give a dashboard that feels like the official Tesla app, loads fast, and animates every change of screen?

## Sources

1. A curated catalog of web UI resources, build 2026-09-10: 741 resources, with a tier for each one.
2. The Tesla DESIGN.md in `VoltAgent/awesome-design-md` (`design-md/tesla/DESIGN.md`). The catalog lists that collection at tier S.
3. The Tesla site reference in the same catalog: 10 screenshots, the colors, and the font Universal Sans.
4. The Next.js 16.3.8 guides in `node_modules/next/dist/docs/`: view transitions, `useLinkStatus`, `loading.js`, and `connection()`.

## Tesla tokens

| Token | Value | Use here |
|---|---|---|
| Carbon Dark | `#171A20` | Text in the light theme, and the base for the dark surfaces |
| Electric Blue | `#3E6AE1` | The primary action only |
| Graphite, Pewter, Silver Fog | `#393C41`, `#5C5E62`, `#8E8E8E` | Secondary, muted, and subtle text |
| Light Ash, Cloud Gray | `#F4F4F4`, `#EEEEEE` | Card surface and dividers in the light theme |
| Radius | 4 px for controls, 12 px for cards | `--radius-md` and `--radius-xl` |
| Motion | 0.33 s, `cubic-bezier(0.5, 0, 0, 0.75)` | `--duration` and `--ease-tesla` |
| Depth | No shadows, no borders, no gradients | Surfaces separate by color and space |
| Type | Two weights only, 400 and 500, normal letter spacing | Inter with its optical sizes |

Universal Sans is Tesla's own typeface and has no public licence. Inter is the nearest free face in Index (tier S). It has text and display optical sizes, like the Universal Sans Text and Display split, and tabular figures for the numbers.

## Selected libraries

| Need | Selection | Index tier | Version |
|---|---|---|---|
| Components | shadcn/ui on Base UI, the shadcn 4 default | S | shadcn 4.21.0, `@base-ui/react` 1.8.0 |
| Class merging | `cn` by shadcn, added by the shadcn CLI | Not listed | 0.4.0 |
| Screen transitions | React `ViewTransition`, built into the Next.js App Router | Not a package | Next.js 16.3.8 |
| Small motion | Motion, for the sliding tab highlight | S | 13.4.6 |
| Animated numbers | NumberFlow, for battery, range, and odometer | S | 0.6.2 |
| Icons | Lucide, the shadcn default | Not needed | 1.49.0 |
| Charts | shadcn charts on Recharts | shadcn/ui, S | Recharts 3.8.0 |
| Maps | mapcn on MapLibre GL | S | MapLibre GL 6.11.2 |
| QR code | `uqr` encodes on the server, and the page draws the path of the dark modules | Not listed | 0.1.3 |

## Patterns

1. **Splash.** A client overlay in the root layout draws the T mark for at least 1.15 s, then fades in 0.33 s and unmounts. A CSS fallback hides it after 3 s if JavaScript fails. The root `loading.tsx` shows the same mark, so a slow first load looks the same.
2. **Tab changes.** Each tab link carries a `tab-forward` or `tab-back` transition type. The page content slides 32 px in that direction. The header and the phone tab bar have their own view transition names, so they stay still.
3. **Car changes.** The car menu links carry `car-swap`. The content fades and rises 8 px.
4. **Pending state.** The car routes have no `loading.tsx`, so React keeps the old screen until the new one is ready. No skeleton flashes. `useLinkStatus` drives a shimmer under the tab and makes the header T mark breathe while the server renders.
5. **Live data.** `LiveRefresh` calls `router.refresh()` every 30 s while the tab is visible. NumberFlow animates each changed number.
6. **Reduced motion.** One media query stops the view transitions, the shimmer, and the mark animations.

## Insight pages

Checked on 2026-10-01 against the demo database, on desktop, phone, dark, and light.

1. **One panel shape.** Each section is a `Panel`: a 12 px card, a muted title, an optional note on the right, and "No record yet." when the data is empty.
2. **Large numbers first.** Each page opens with four large metrics. Secondary metrics use the small size.
3. **Charts.** Area for a trend, bars for counts per day, week, or month, and a line on the right axis for a second unit. Only a faint horizontal grid. A legend shows when a chart has more than one series. `niceDomain` gives five even ticks for a value axis that does not start at zero.
4. **Period.** Battery habits, Stats, and Places share one segmented control. The period lives in the URL, so a link keeps it.
5. **Phone width.** Every page grid uses `grid-cols-1`, which is `minmax(0, 1fr)`. Without it, a Recharts wrapper keeps its first width and pushes the page 11 px wider than the phone.
6. **Advice colors only with a reference.** The level bands use one color. An LFP battery and an NMC battery need different charge limits, and the app does not know which one the car has. Since [decision 0013](../docs/decisions/0013-value-colors.md), values with a known reference get a green, default, or red tone and a tooltip.

## Overview car on scroll

Checked on 2026-10-01 at 1440 x 900 and 390 x 844, in dark and light.

1. The name block sticks below the header while the car area collapses. The collapse distance equals the car area height, so the battery row meets the name block just when the block starts to scroll away.
2. A CSS scroll-driven animation on `scroll(root)` moves the car from its large centered place to the right of the name block, centered on that row. The range uses `100cqw` from the hero container, so it matches the car area at every width.
3. Browsers without `animation-timeline`, reduced motion in the system, and the Reduced setting all keep the static layout.
4. The glow under the car is a radial gradient. A blur filter showed a clipped rectangle at the small size.

## Settings

Checked on 2026-10-01 on the demo server, with miles, °F, psi, kPa, km/kWh, the 12-hour clock, US dates, Sunday weeks, the New York time zone, hidden maps, and the forced light theme.

1. **Save on change.** Each control saves at once through a server action. A small status chip shows "Saving", "Saved", or "Not saved". The page has no Save button.
2. **Preview first.** A preview card at the top shows a sample distance, speed, temperature, tire pressure, efficiency, cost, date, and time in the chosen formats.
3. **Controls.** A segmented control with a sliding pill for two to five choices, a native select for long lists, and a switch for on and off. Switch rows stay on one line on a phone.
4. **Theme.** Each color token uses `light-dark()`. `data-theme` on `html` forces light or dark. The `dark:` variant follows the same attribute and the system setting.
5. **Reduced motion.** `data-motion="reduced"` stops the view transitions, the CSS transitions, the chart animations, Motion, and NumberFlow.
6. **Mobile app code.** The QR code comes from a server action on a button press, so the page HTML never holds the service token. It is black on white with a quiet zone of 4 modules in both themes, because the QR standard asks for 4 modules and dark on light is the safe case for phone scanners. It hides after 2 minutes. Sources: [uqr](https://github.com/unjs/uqr), [quiet zone](https://2dtg.com/faq/quiet-zone), [QR design rules](https://www.qr-code-generator.com/blog/qr-code-design-rules/).

## Lists and focus

Checked on 2026-10-13 against the Checklist Design checklists for a data table, a table, an empty state, settings, and a tab bar, on the demo at 1440 and 390 px, in dark and light.

1. **Day lists.** Drives, Charging, and Trip group their rows by day. The day heading sticks under the header and lines up with the row content. `DayHeading` and `rowLinkClass` in `src/components/day-list.tsx` hold the shared style. A day heading shows the date and the total of the day through `DotList`, for example "Wed 21 Oct · 4 trips · 64 km", from `src/lib/day-total.ts`, the same module as the app. The date stays first and the parts stay short ([Apple HIG: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Apple HIG: writing](https://developer.apple.com/design/human-interface-guidelines/writing), [WCAG 2.2 Understanding 2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), read on 2026-11-16).
2. **Whole values.** A line with several values uses `DotList`, which keeps each value on one line and breaks only between values.
3. **Focus.** Every control shows a 2 px ring in the ring color on keyboard focus. A list row draws the ring inside its edge, so the sticky day heading does not cover it.
4. **Tables.** A header cell has the same padding as the cells under it, so a right-aligned header ends where its numbers end.
5. **Charger badge.** `ChargerBadge` draws the AC or DC label on every page.
6. **Open.** The lists show the last 50 drives and charges without paging. The subtle text color is under 4.5:1 on the cards. Reset to defaults has no confirmation. Each needs a product decision.

## Sign-in forms and the calendar panel

Checked on 2026-10-18 on the demo at 1280 and 390 px, in dark and light.

1. **One card.** `AuthCard` holds the setup, sign-in, invite, and reset forms: one column, the title and one sentence of intro, the form, and the error or the result under it. Apple's and Material's sign-in guidance both ask for one task per screen and no navigation around it, so the card has no tab bar and no car switcher.
2. **Fields.** `TextField` in `auth/fields.tsx` pairs each input with a visible label through `htmlFor` and `useId`, and puts the hint in `aria-describedby`, not inside the label, so a screen reader reads the name first (WCAG 2.2, 1.3.1 and 3.3.2). The `autoComplete` tokens `username`, `current-password`, and `new-password` let password managers fill and save. The password rule shows before the first try, because WCAG 3.3.2 asks for the instruction up front.
3. **Submit.** `SubmitButton` reads `useFormStatus` and disables itself while the action runs, with the same height and the Tesla blue of the other primary buttons. The result message is a live region (`role="status"`), the error an `alert`.
4. **Calendar panel.** `CalendarLinkPanel` follows the pairing panel of Settings: one button makes the link, the link shows once with a `webcal:` subscribe link, and a sentence says that the link is a key. The link is never kept in the page after a reload.

Sources: [Apple HIG, Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [Material 3, Text fields](https://m3.material.io/components/text-fields/guidelines), [WCAG 2.2, 3.3.2 Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions), [React, useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus).

## Disclosure and copy

Checked on 2026-10-21 on the demo at 1280 and 390 px, in dark and light.

1. **Lock history.** The Overview panel lists the latest 5 changes, then a **Show N more** button that extends the list in place and reads **Show fewer** once open. `ShowMore` is a small client component: the first rows, the rest when open, and the button always last, with `aria-expanded` as the WAI-ARIA disclosure pattern asks. A native `details` element was tried first and dropped, because its `summary` must precede the content, which left "Show fewer" in the middle of the open list. The app does the same with a secondary button and local state.
2. **Copy field.** `CopyField` shows a one-time value (an invite link, a script token, a calendar link) in a bordered mono field with a copy button. The button has a visible icon and an `aria-label`, swaps to a check mark for 2 seconds, and announces "Copied" in a live region (WCAG 4.1.3 status messages). The text stays selectable and breaks at any character, because the Clipboard API works only on `https` and `localhost`; when it fails, the button selects the text instead.

3. **Calendar scope.** The calendar panel asks what the feed shows (drives and charges, drives only, charges only) with the native `Select` of Settings, the same control as the time zone and the currency, in a `SettingRow` with a visible label and a hint. A select fits three mutually exclusive choices that rarely change; the segmented `Choice` of Settings is for choices the person flips often. The choice goes into the link, so each subscription keeps its own, and the calendar name carries it.

Sources: [MDN, details](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details), [WAI-ARIA APG, Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [WCAG 2.2, 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages), [MDN, Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API).

## Year in review

Checked on 2026-10-18 on the demo at 1280 and 390 px, in dark and light, with metric and with US settings.

1. **Place.** The page hangs off Stats at `/stats/year`, with a back link, like Charging insights and Report hang off their tabs. The tab bar keeps five data tabs. Stats links to it with a card button next to the period control, like the Insights and Report buttons.
2. **Year picker.** `SegmentedLinks` with one link for each year that has a drive or a charge, newest first. The current year in the user's time zone is the default, and the newest year with data stands in when the current year has none. The active year carries `aria-current="page"`, and each link is 32 px high, above the 24 px of WCAG 2.2 target size.
3. **Many years.** Apple suggests about five segments on iPhone, and a car that TeslaMate has logged since 2019 has eight years. `SegmentedLinks` now wraps its links inside the screen width with `max-w-full flex-wrap`, so no year moves off the screen and the page never scrolls sideways, which WCAG 2.2 reflow asks for at 320 px. The period control has five short links and stays on one line.
4. **Shared parts.** `StatsTotals` holds the eight figures of Stats, and `VisitedPlaces` holds the most visited list of Places. The year page uses both, so the figures read the same on the three pages.
5. **Month chart.** Bars for the distance of each month, the pattern for counts per day, week, or month. Records name the busiest month in full, because the axis label `Sep 26` can read as a date.
6. **Records.** One row each for the busiest month, the busiest day, the longest drive, and the biggest charge. A row links to the day in Timeline, the drive, or the charge, and a row without a page keeps the same right edge.
7. **Places.** A list without a map, so the map setting does not apply.

Sources: [Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [WCAG 2.2 reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow), [WCAG 2.2 target size (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [WAI-ARIA `aria-current`](https://www.w3.org/TR/wai-aria-1.2/#aria-current), and the Next.js 16.3.8 `page.md` guide on `searchParams` in `node_modules/next/dist/docs/`.

## Every road driven

Checked on 2026-10-18 on the demo at 1280 and 390 px, in dark and light, with maps on and off.

1. **One layer.** `DrivenMap` in `src/components/maps.tsx` draws all drives as one `MultiLineString` through the mapcn `MapGeoJSON` part: one GeoJSON source and one line layer, 2 px Electric Blue at 75% opacity, with no markers. The trip map keeps one `MapRoute` for each drive, which adds a source and a layer for each line and does not scale to a lifetime. MapLibre cuts a GeoJSON source into tiles in its worker and simplifies each line there with Douglas-Peucker, `tolerance` 0.375 by default.
2. **Sampled on the server.** The page never sends every position. Drives between the same two places, about 500 m cells in either direction, keep their three latest drives. The query then takes every nth position of those drives, so that about 10,000 remain, plus the start and end of each drive. The server drops points closer than 50 m to the last kept one and thins each drive by the same share until the map holds at most 10,000 points. A drive that falls under two points is left out. The demo sends 3,730 points, and a generated history of 2,400 days with 406,281 positions sends 3,754.
3. **Lifetime.** The map shows all records whatever the period of the page, and says so. The counts and lists of countries, states, and cities follow the period.
4. **Maps off.** With maps off in Settings, the page runs no position query and sends no coordinate. The card shows the same note as the other maps.
5. **Access.** The map is a picture of the roads. The counts and the lists of countries, states, and cities next to it carry its information as text, and the card heading names it (WCAG 1.1.1). The zoom buttons give a single-pointer way to zoom, and cooperative gestures keep one finger and the scroll wheel for the page (WCAG 2.5.7).
6. **Open.** Older roads between two places that the car now drives another way do not show. The query reads the positions of the chosen drives twice, once to count and once to sample.

Sources: [MapLibre style spec, sources](https://maplibre.org/maplibre-style-spec/sources/), [Mapbox, working with large GeoJSON sources](https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/), [WCAG 2.2 Understanding 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [WCAG 2.2 Understanding 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements), [TeslaMate Grafana dashboards Visited and Locations](https://github.com/teslamate-org/teslamate/tree/main/grafana/dashboards).

## Rejected

| Option | Reason |
|---|---|
| Aceternity UI, Magic UI, React Bits | Marketing effects. The Tesla style forbids decoration. |
| Tremor | A second design language on top of shadcn/ui |
| MUI, Ant Design, Mantine | Heavy, with their own visual language |
| GSAP, Lenis | View transitions and Motion cover the need. The dashboard has no long scroll. |
| A `loading.tsx` under each car route | It shows a skeleton for 50 to 100 ms on each tab change, which looks like a flicker |

## Measured

Local production build against a TeslaMate database through an SSH tunnel, 2026-10-01:

- A tab change from Overview to Drives took 120 ms from click to heading.
- Every route answered in 5 to 112 ms.
- The splash covered the header during the first transition after one fix.

## Open

2. `/cars/9` answers 200 with the not-found page, because the root `loading.tsx` starts the stream before `notFound()` runs.

## Car renders

Checked on 2026-10-01. Tesla's compositor draws a car from option codes: `https://static-assets.tesla.com/configurator/compositor`, and `https://static-assets.tesla.com/v1/compositor/` for the older cars. TeslaMate stores the model, exterior color, wheel type, trim badging, and marketing name, not the option codes. `src/lib/car-image.ts` maps those fields to codes with the verified tables of [tn9design/tesla-vehicle-config-decoder](https://github.com/tn9design/tesla-vehicle-config-decoder).

| Car | TeslaMate fields | Codes |
|---|---|---|
| A 2025 Model Y | Y, StealthGrey, Aperture18, badge 50 | `$MTY61,$PN01,$WY18P,$IBB3` |

1. The color and the wheel type pick the generation. Aperture, Photon, Crossflow, Helix, and Arachnid are the 2025 Model Y. Gemini, Apollo, Induction, and Uberturbine are the 2020-2024 Model Y on `v1/compositor`. Pinwheel, Stiletto, Sport, and the 20 inch Uberturbine are the 2017-2023 Model 3 on `v1/compositor`, with a paint and a wheel code only. Photon, Glider, Nova, Helix 19, Prismata, and Warp are the 2024 Model 3.
2. A badge that ends in `d` picks the all-wheel-drive trim.
3. `bkba_opt=1` gives a transparent PNG, 1440 x 810.
4. An unknown code returns HTTP 412. The page hides the image when it fails to load.
5. The browser loads the render directly, with `unoptimized` on `next/image`. Tesla sees the browser address and the car configuration. Akamai refuses a browser `User-Agent` sent by curl or Node.js, not the tools themselves. [Car images](car-images.md) explains why My Tesla keeps the direct link.
6. The codes `MTY68`, `MTY78`, and `MTY85` also render with the Aperture wheels, and look the same at this angle. One of them can be the Model Y Standard from late 2025. The table keeps the verified `MTY61`.
7. Checked on 2026-10-14 with the names that TeslaMate users report in [vide/matedroid](https://github.com/vide/matedroid/blob/main/docs/ASSETS.md). TeslaMate writes some names in two ways, such as `BlackDiamond` and `StealthGray`, and it can add an ending to a wheel name, such as `Pinwheel18CapKit` and `Apollo19MetallicShadow`. The table matches the start of the wheel name, the longest name first.
8. A wheel name can fit two generations: `Uberturbine21` is the 2020-2024 Model Y Performance and the 2025 one. The first generation with both the color and the wheel wins, and the older one comes first. A white 2025 Performance then shows the older body.
9. An unknown wheel shows the usual wheels of the newest generation that has the color.
10. The 138 addresses that the table makes for these names were loaded: 136 gave a render. Marine Blue with the 18 inch wheels gives HTTP 412, and Tesla does not sell it.
11. `v1/compositor` answers 200 with a black shape for a color that it does not know, such as `PN01` on a Model S. Checked on 2026-10-18: Model S, Model X, and the Cybertruck have tables too, and [Car images](car-images.md) lists every model, color, and wheel with its source and result.


## CARTO basemaps key

Checked on 2026-10-18. CARTO asks for a free key on its basemaps: a raster tile without a key shows "API KEY REQUIRED", and the vector styles and tiles that My Tesla uses still answer without one, but CARTO says the vector maps come next. The key goes in the `key` query parameter of every style, tile, glyph, and sprite request under `basemaps.cartocdn.com`. Keys registered before 23 September 2026 work as they are until 30 November 2026. The free tier allows 5 million requests a month for non-commercial use.

1. **Optional.** `CARTO_BASEMAPS_KEY` turns the key on. Without it nothing changes.
2. **Every request.** The style URL alone is not enough, because the style links to the tile list, the tiles, the glyphs, and the sprites. The web map adds the key with the MapLibre `transformRequest` option, and the app with `TransformRequestManager.addUrlSearchParam` of `@maplibre/maplibre-react-native` 11, both only for `https` URLs on `cartocdn.com`.
3. **Public.** The key reaches each browser through the car layout and each phone through the Settings answer of the app API. A basemap key is public by nature, as in the CARTO samples for MapLibre GL JS.
4. **Checked.** With a placeholder key, every CARTO request of the Places page (style, sprites, tile list, tiles, and glyphs) carried it, and CARTO still answered 200, so an unknown key is not refused yet. The maps of the app drew on iOS and Android with the key set.

Sources: [CARTO: request an API key for basemaps](https://www.carto.com/basemaps/apikey/), [CARTO basemaps docs](https://docs.carto.com/carto-for-developers/basemaps), [MapLibre GL JS `transformRequest`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#transformrequest), [Home Assistant report of the key message, August 2026](https://community.home-assistant.io/t/carto-com-maps-requires-an-api-key/1022703).
