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

## Lists and focus

Checked on 2026-10-13 against the Checklist Design checklists for a data table, a table, an empty state, settings, and a tab bar, on the demo at 1440 and 390 px, in dark and light.

1. **Day lists.** Drives, Charging, and Trip group their rows by day. The day heading sticks under the header and lines up with the row content. `DayHeading` and `rowLinkClass` in `src/components/day-list.tsx` hold the shared style.
2. **Whole values.** A line with several values uses `DotList`, which keeps each value on one line and breaks only between values.
3. **Focus.** Every control shows a 2 px ring in the ring color on keyboard focus. A list row draws the ring inside its edge, so the sticky day heading does not cover it.
4. **Tables.** A header cell has the same padding as the cells under it, so a right-aligned header ends where its numbers end.
5. **Charger badge.** `ChargerBadge` draws the AC or DC label on every page.
6. **Open.** The lists show the last 50 drives and charges without paging. The subtle text color is under 4.5:1 on the cards. Reset to defaults has no confirmation. Each needs a product decision.

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
5. Akamai returns 403 to curl and Node on a development machine, and 200 to Chrome. So the browser loads the render directly, with `unoptimized` on `next/image`. Tesla sees the browser address and the car configuration.
6. The codes `MTY68`, `MTY78`, and `MTY85` also render with the Aperture wheels, and look the same at this angle. One of them can be the Model Y Standard from late 2025. The table keeps the verified `MTY61`.
7. Checked on 2026-10-14 with the names that TeslaMate users report in [vide/matedroid](https://github.com/vide/matedroid/blob/main/docs/ASSETS.md). TeslaMate writes some names in two ways, such as `BlackDiamond` and `StealthGray`, and it can add an ending to a wheel name, such as `Pinwheel18CapKit` and `Apollo19MetallicShadow`. The table matches the start of the wheel name, the longest name first.
8. A wheel name can fit two generations: `Uberturbine21` is the 2020-2024 Model Y Performance and the 2025 one. The first generation with both the color and the wheel wins, and the older one comes first. A white 2025 Performance then shows the older body.
9. An unknown wheel shows the usual wheels of the generation, when the color fits one generation only. With a color of two generations, the car shows no image.
10. The 138 addresses that the table makes for these names were loaded: 136 gave a render. Marine Blue with the 18 inch wheels gives HTTP 412, and Tesla does not sell it.
11. `v1/compositor` answers 200 with a black shape for a color that it does not know, such as `PN01` on a Model S. Model S, Model X, and Cybertruck have no table: `v1/compositor` draws the body from before 2021.

