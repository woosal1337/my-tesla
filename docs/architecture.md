# My Tesla architecture

A Next.js App Router app that reads the TeslaMate PostgreSQL database on the server. TeslaMate logs the cars. teslamate-mcp gives chat access. This app gives the web view. The three parts share one database, and this app has read-only access to it.

## Modules and boundaries

| Boundary | Responsibility |
|---|---|
| `src/lib/database-config.ts` | Reads and checks `DATABASE_URL`, `STATEMENT_TIMEOUT_MS`, and `DATABASE_POOL_MAX`. Refuses privileged users. |
| `src/lib/database.ts` | One lazy `postgres` client. Read-only sessions with a statement timeout. Server only. |
| `src/lib/health.ts` | Turns one database ping into a health result, with a timeout. No I/O of its own. |
| `src/app/api/health/route.ts` | `GET /api/health`. Returns 200 or 503 with `Cache-Control: no-store`. |
| `src/lib/queries.ts` | The read queries: cars, the car snapshot, drives, and charges. Each one calls `connection()`, so every page renders at request time. Server only. |
| `src/lib/car-route.ts` | Turns the `carId` route parameter into a car, or calls `notFound()`. |
| `src/lib/car-image.ts` | Maps the TeslaMate model, color, wheel, and badge to a Tesla compositor URL. No I/O. |
| `src/lib/preferences.ts`, `units.ts`, `date-format.ts`, `format.ts` | Pure logic for the settings: the option lists, the parser that drops unknown values, unit conversion, date and clock text, and `createFormatter`, which turns the settings into one formatter for every page and chart. No I/O, full test cover. |
| `src/lib/preferences-store.ts` | Reads and writes the settings file at `PREFERENCES_FILE`, one entry for each user. Writes go through one queue, to a temporary file, then a rename. Server only. |
| `src/lib/viewer.ts`, `identity.ts` | The user key from the identity header (`IDENTITY_HEADER`, Cloudflare Access by default), or `owner`. Merges the TeslaMate settings table and the saved settings, both through `"use cache"` with tags, and gives `getPreferences()` and `getFormatter()` for each request. Server only. Read [decision 0005](decisions/0005-cache-components.md). |
| `src/lib/range-columns.ts` | Picks the rated or the ideal range column for a query, from the Range setting. Server only. |
| `src/app/cars/[carId]/settings/` | The Settings page and its two server actions, `savePreferences` and `resetPreferences`. Each action parses the input again on the server. |
| `src/lib/vehicle.ts`, `time-zone.ts` | Pure logic: place labels, efficiency, tab order, and the time zone check. No I/O, full test cover. |
| `src/app/layout.tsx` | Inter, the viewport, and the splash. |
| `src/app/loading.tsx` | The first-load T mark. The only route-level loading file. |
| `src/app/cars/[carId]/layout.tsx` | The header, the car switcher, the tabs, the phone tab bar, and the live refresh. |
| `src/app/cars/[carId]/page.tsx`, `drives/`, `charging/` | Overview, Drives, and Charging. Server components read through `src/lib/queries.ts`. Overview also shows the day strip for today. |
| `src/app/cars/[carId]/battery/`, `stats/`, `places/` | The three insight tabs. Each one reads the `period` search parameter: 7 days, 30 days, 90 days, 1 year, or all. |
| `src/app/cars/[carId]/timeline/` | One local day: the 24 h strip, the day totals, and the list of drives, charges, and parked times. Reads the `day` search parameter. |
| `src/app/cars/[carId]/charging/[chargeId]/` | The charge page: the power curve by battery level, battery and power, voltage and current, and the place. |
| `src/lib/charge-data.ts`, `timeline-data.ts`, `battery-data.ts`, `stats-data.ts`, `places-data.ts` | The read queries for the insight pages. The SQL follows the TeslaMate Grafana dashboards. Server only. |
| `src/lib/insights.ts` | Pure logic for the insight pages: local day windows, the timeline, battery health, level shares, idle drain, temperature bands, and the week grid. No I/O, full test cover. |
| `src/components/charts/` | `SeriesChart` and `ScatterPoints` on Recharts through the shadcn chart part, the axis formats, and `niceDomain`, which gives five even ticks. |
| `src/lib/demo/` | The demo data generator, the demo schema, the PGlite database for `DEMO_MODE`, and the Settings cookie. Read [decision 0006](decisions/0006-built-in-demo-database.md). |
| `src/lib/live/` | The optional MQTT feed. `topics.ts`, `view.ts`, and `config.ts` are pure, with tests. `subscriber.ts` holds one read-only MQTT.js connection for each server process. `live.ts` gives `getLive()` and `watchLive()`, with demo values in demo mode. Read [decision 0008](decisions/0008-mqtt-live-status.md). |
| `src/app/api/cars/[carId]/live/route.ts` | `GET` server-sent events: a change signal for the open Overview, with no car values. 204 without a feed. |
| `src/lib/site.ts`, `src/app/manifest.ts`, `robots.ts`, `sitemap.ts`, `opengraph-image.jpg` | The public address from `SITE_URL`, the link preview metadata, the JSON-LD data, the manifest, and the crawler rules. Read [Link previews and icons](demo-site.md#link-previews-and-icons). |
| `tools/brand/render.ts` | Builds the preview images and icons from the T mark with headless Chrome and `sips`. |
| `src/lib/sql-template.ts` | The postgres.js tag interface on top of PGlite: parameters, nested fragments, and identifiers. Pure, with tests. |
| `src/components/landing/`, `src/lib/github.ts`, `src/lib/project.ts` | The landing page of the demo site, the cached GitHub star count, and the project links. |
| `tools/demo/` | The seed tool for the PostgreSQL demo database. Read [decision 0003](decisions/0003-demo-database.md). |
| `src/lib/route.ts`, `maplibre-asset.ts` | Pure logic: route sampling and bounds, and the allowed MapLibre worker files. |
| `src/app/maplibre/[version]/[file]/route.ts` | Serves the MapLibre worker and its shared chunk from `node_modules`, with an immutable cache for the installed version only. |
| `src/app/cars/[carId]/drives/[driveId]/page.tsx` | The drive page with the route map. |
| `src/components/maps.tsx` | The location map, the route map, and the places map on mapcn. |
| `src/components/` | Client parts: splash, tab navigation, car switcher, pending state, animated numbers, and live refresh. `ui/` holds generated shadcn/ui files. |

## Data flow

TeslaMate writes car data into PostgreSQL. A request reaches this app through an authenticating proxy. A server component or route handler calls a `src/lib/` module. The module runs a read-only query as `teslamate_ro` and returns typed rows. The page renders the rows on the server.

With `MQTT_URL` set, the server also reads the TeslaMate MQTT feed. It keeps the last values in memory, and a change sends a signal to the open Overview, which renders again on the server. Read [Live status](live-status.md).

The settings change how the server renders, not what it reads. The root layout and each page call `getPreferences()`. The page formats every value with `getFormatter()` before it sends HTML or chart data to the browser. The Settings page saves a change through a server action, which writes the settings file and calls `updateTag()` for that user, so the next render reads the new file. The TeslaMate database stays read-only. Read [decision 0004](decisions/0004-saved-settings.md).

## Runtime and deployment

The `Dockerfile` builds a Next.js standalone server on `node:24-bookworm-slim`. It runs as an unprivileged user on port 3000, keeps the saved settings in `/data`, and checks `/api/health`. The container joins the Docker network of the TeslaMate database. An authenticating proxy sits in front of it. [Installation](installation.md) gives the methods, and `.github/workflows/image.yml` publishes the image to GitHub Container Registry on each version tag.

## Decisions

Read [the foundation decision](decisions/0001-project-foundation.md), [the UI decision](decisions/0002-ui-stack-and-motion.md), [the demo database decision](decisions/0003-demo-database.md), [the saved settings decision](decisions/0004-saved-settings.md), [the cache decision](decisions/0005-cache-components.md), [the built-in demo decision](decisions/0006-built-in-demo-database.md), [the logo decision](decisions/0007-silver-logo.md), [the live status decision](decisions/0008-mqtt-live-status.md), [the stack research](../research/stack.md), and [the UI stack research](../research/ui-stack.md).
Add a decision record when a choice changes a boundary or creates a lasting tradeoff.
Keep operational steps in [Installation](installation.md) and [Troubleshooting](troubleshooting.md).
