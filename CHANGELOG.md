# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Timeline keeps a late drive on its own day where the clock skips midnight for daylight saving time, as in Chile and Cuba. A drive at 23:30 on the evening before the change showed on the timeline of the next day. Lists also name the day before "Yesterday" in the first hour after a 23-hour day, where they showed its date.

## [2.2.2] - 2026-10-24

### Fixed

- Drives opens fast on a large database. PostgreSQL compiled the drive list with JIT on every request, and on a database with 2,244 drives the compilation took 1,174 ms of the 1,189 ms of the query. Every session now turns JIT off, and the query takes 3 ms.
- The Overview, the start page, and Battery no longer read every position of the car to find the newest one. TeslaMate has no plain index on the car and the date of a position, so each of these lookups read all 4.26 million positions of a large database, in 0.5 s to 1 s. They now take a few milliseconds.
- The capacity history of Battery reads the last charge of each session through the index of the session. The database walked the date index of all charges for each session, which took 885 ms for 115 sessions, and now takes 19 ms.

## [2.2.1] - 2026-10-22

### Fixed

- A row of the Overview menu opens its tab on the first screen. Before, with a detail screen open in that tab, the row stacked a second copy of the tab above it, with a back button to the detail. The Battery, Stats, and Places rows pass the kind to Insights without a route parameter for the same reason.
- The quick actions Timeline, Report, and Year open their screen once. A second press no longer stacks a second copy.
- A callout above the car keeps its width when the car name is long, and the link rows of Drives, Charging, and Insights line up with the panels.

## [2.2.0] - 2026-10-22

### Changed

- The Overview of the mobile app follows the Tesla app: the car on a lit stage with callouts for the battery and range, the lock and Sentry Mode, and the charge; the car name with a chevron that switches the car; a row of quick actions (Timeline, Report, Year, Maps); and a menu of rows with a one-line summary each, which open Drives, Charging, Battery, Stats, Places, Location, Status, and Settings. On a wide screen the menu is a sidebar beside the car. The Live card, the lock history, Today, the tires, and the car stats moved to the Status screen, and the map to the Location screen. The link rows of Drives, Charging, and Insights share the same menu row with an icon. `GET /api/app/cars/{carId}/overview` gains `callouts` and `menu`.

## [2.1.0] - 2026-10-22

### Added

- The calendar link can show drives and charges, drives only, or charges only. Settings, **Calendar**, has the choice, and the link keeps it as `show=`.

## [2.0.2] - 2026-10-21

### Fixed

- **Show fewer** under the lock history sits below the full list, not between the first rows and the rest.

## [2.0.1] - 2026-10-21

### Changed

- The Overview shows the last 5 lock and Sentry Mode changes, with a button under them that shows the rest of the last 7 days, up to 50, on the web and in the app.
- The invite link, the script token, and the calendar link show in a field with a copy button.

## [2.0.0] - 2026-10-21

### Added

- Accounts in the app itself. A new install prints a one-time setup link in its log, and the first account is the admin. Every page and API call then needs a sign-in. Passwords use Argon2id, sessions last 30 days, sign-in is rate limited, and **Account** lists every browser, phone, and script token with a sign-out button. Read [Accounts and sign-in](docs/authentication.md) and [decision 0023](docs/decisions/0023-native-accounts.md).
- Tokens for scripts in **Account**, for the API without Cloudflare Access.
- Phone pairing: the QR code in Settings holds a single-use code that changes every minute, and the web page asks to allow the phone before it signs in.
- Invites: the admin makes a link for one email under **Account**, **People**. It works once, for 3 days, and makes a member account. The admin can revoke an invite and remove a member, which signs the member out on every browser and phone at once.
- `docker exec my-tesla node reset-password.mjs EMAIL` prints a one-time link that resets the password of one account within 30 minutes, without email, and signs out its sessions.

- A mobile app for iOS and Android in `mobile/`, built with Expo SDK 58. It pairs with a My Tesla server from the QR code in Settings and shows the Overview, the trips and drives, the charges, and the Battery, Stats, and Places insights of each car in the style of the dashboard, with charts. It uses the units and formats from Settings. Read [Mobile app](docs/mobile.md).
- Push alerts for the mobile app: charging started, complete, or stopped, a car left unlocked for 10 minutes, a software update, and a tire warning. They need the MQTT feed. Each phone chooses its alerts. [Decision 0020](docs/decisions/0020-mobile-app-and-push-alerts.md) explains the design, and [Privacy](docs/privacy.md) lists what the alerts send.
- The launch animation of the web in the mobile app: the T-mark draws itself and fades into the app. While a screen loads, the mark breathes as on the web, instead of a spinner.
- Maps in the mobile app, drawn with MapLibre and the CARTO styles of the web: the car on the Overview, the route of a drive, a trip with its stops, the place of a charge, and the Places map. Map theme in the app Settings changes them. [Decision 0022](docs/decisions/0022-maps-in-the-mobile-app.md) explains the choice.
- A Settings tab in the mobile app. It changes the same Settings as the web, and the phone keeps the last Settings. The app starts in dark mode, and Settings has a theme choice for the phone.
- `GET /api/cars.json` lists the cars, `/api/push` registers a phone for alerts, `/api/app/cars/{carId}/` gives the app its screens, formatted for the user, and `/api/app/settings` reads and changes the Settings. Read [API](docs/api.md).

- `GET /api/cars/{carId}/calendar.ics`, a calendar feed of the drives and charges of the last year. Settings, **Calendar**, makes a private link for a calendar app, and Account can revoke it.
- A history of locks and Sentry Mode from the MQTT feed, in `history.sqlite`. The Overview shows the changes of the last 7 days. Read [decision 0024](docs/decisions/0024-lock-and-sentry-history.md).
- A year in review page under Stats: the totals, the distance per month, the records, and the top places of one calendar year, with a picker for each year that has data.
- Places shows the countries, states, and cities visited, and a map of every road driven over all records.
- Long-term trends: the charge level over time, time online, asleep, and offline, and the projected range at 100 % by outside temperature and by battery level on Battery, and the odometer over time on Stats.
- The car image of the Model S, Model X, and Cybertruck, and more of the wheel names and colors that TeslaMate reports. The model year in the VIN rules out a car generation that was not built that year. `research/car-images.md` lists each combination.
- `CARTO_BASEMAPS_KEY` adds a CARTO basemaps key to every map request of the web and the mobile app, ahead of the key rule that CARTO brings to vector maps.
- The charge page shows the cable type and whether the battery heater ran.
- The mobile app has the Timeline, the Report with CSV exports, Charging insights, and the year in review, shares a drive as GPX, and shows the lock history, the long-term trends, the visited areas, and the map of every road driven, as the web does.
- The mobile app refreshes the Overview and a charge within seconds of a change in the car, through the live change stream, and opens the pairing code from the camera app of the phone.
- Battery advice under the charge levels: a weekly full charge for an LFP battery, as Tesla recommends, and a daily limit of 80 to 90% for other cells, with the charges of the period.

### Changed

- Charges without a TeslaMate cost follow the rules of TeslaMate before the price in Settings: free Supercharging costs 0, and a geofence price per minute or per kWh, with its session fee, gives the cost. The charge page names the rule and shows the price of the place.
- **Breaking:** the app no longer reads the user from a proxy header. `IDENTITY_HEADER` is gone, and the Settings stay under the email of the account that signs in. Scripts that used a Cloudflare Access service token need a token from **Account**, and paired phones pair again.
- With `MQTT_URL` set, the server connects to the broker when it starts, not at the first page.

### Fixed

- A drive page said "1 points used". It now says "1 point used".

## [1.9.0] - 2026-10-14

### Added

- A page for each trip at `/cars/{car}/drives/trip/{tripId}`: the route of all legs on one map with the stops, the total, driving, and stopped time, the consumption, the battery at the start and at the end, the energy and the cost of the charges on the way, the average speed, and the list of legs and stops.

### Changed

- Report at `/cars/{car}/drives/trip`, before called Trip: the list now shows trips, not single drives. A trip joins the drives of one journey: a stop of up to 30 minutes keeps the trip together, and so does a stop of up to 2 hours with a charge in it. This is the rule of the trip tools in teslamate-mcp. A stop under 2 minutes is a pause: the drives around it show as one leg, and a drive under 50 m does not show. A charge during a stop belongs to its trip, and the other charges stay in the list. The newest day comes first. [Decision 0017](docs/decisions/0017-trips-from-drives.md) explains the rule.
- Drives lists the trips of the last 50 drives, not the single drives. A row shows where the trip ends and starts, the stops, the distance, and the consumption. Under a trip with stops, a bar shows the drives, the stops, and the charging stops in time order. A trip of one drive opens the drive page. Any other trip opens its trip page, and the trip page goes back to Drives. [Decision 0019](docs/decisions/0019-drives-list-trips.md) explains the choice.

### Fixed

- Overview: many cars showed no car image. The image now shows for a 2017-2023 Model 3, for the wheel names of a 2024 Model 3 such as `Photon18` and `Helix19`, for a 2020-2024 Model Y in Quicksilver, Stealth Grey, Ultra Red, or Midnight Cherry Red, for the Model Y wheels `Apollo19`, `Apollo19MetallicShadow`, and `Photon18`, for the colors `BlackDiamond`, Glacier Blue, and Marine Blue, and for a wheel name with an ending such as `Pinwheel18CapKit`. A car with an unknown wheel shows its usual wheels when the color fits one generation.
- Drives, a drive page, the drives CSV, and Report: a drive that TeslaMate left open was missing. This happens when TeslaMate restarts during a drive. The app now fills such a drive from its positions, so a trip no longer splits at it. The drive page shows a note. [Decision 0018](docs/decisions/0018-drives-left-open.md) explains the rule.

## [1.8.0] - 2026-10-13

### Changed

- The address names the car, such as `/cars/red-rocket/drives`, instead of its TeslaMate id. An id link, such as `/cars/2`, still opens the same car, and the browser then shows the name in the address. The API keeps the id. [Decision 0016](docs/decisions/0016-car-names-in-urls.md) explains the rules for the name.
- Drives, Charging, and Trip: the day heading stays under the header while you scroll a long list, and it lines up with the rows. On a phone, the rows use less side space, so a place name shows more of its letters.
- Drives and Charging: a car without a record shows "No drives yet" or "No charges yet", with a short explanation.
- The AC and DC label looks the same on every page.
- Battery, Stats, and a charge page: the chart titles name their unit, like the other charts.
- Every control shows a clear 2 px focus ring when you move with the keyboard.

### Fixed

- Drives and Charging: the summary under the title and the levels of a charge broke inside a value on a phone, such as "1,105" and "km" on two lines. A line now breaks only between values.
- Charging insights: "1 sessions" now reads "1 session".
- Battery: the headers of the idle drain table sat 16 px right of their numbers.
- Battery: "1 sessions" now reads "1 session".
- Settings: the Default period choice put "All" on a second line on a phone.
- Settings: a screen reader now announces "Saving", "Saved", and "Not saved".

## [1.7.0] - 2026-10-12

### Added

- Charging insights: a Charging time panel. It shows how long a charge takes from one battery level to another, for DC and for AC, with a typical and a slow time. The times come from the time that the charges of the last 2 years spent at each battery percent. [Decision 0014](docs/decisions/0014-charging-time.md) explains the rule.
- Places: a Frequent routes panel. It groups the drives of the period by start and end place, and it shows the number of drives, the typical distance and duration, the consumption, the usual departure hour, and links to the fastest and the slowest drive. [Decision 0015](docs/decisions/0015-frequent-routes.md) explains what counts as a place.

## [1.6.1] - 2026-10-07

### Fixed

- Overview: a tire pressure in psi wrapped to two lines in Safari. A value with a tooltip now stays on one line.
- Stats, Trip, and a charge page: a long duration overlapped the next value or ran off the screen on a tablet. The large values now scale with the screen width.
- A duration of 100 hours or more shows whole hours, such as "126 h".

### Added

- `bun run check:layout`: a layout check in WebKit and Chrome at five widths. Read [Quality](docs/quality.md#layout-check).

## [1.6.0] - 2026-10-07

### Added

- Value colors: consumption, charging efficiency, AC voltage, battery health, parked drain, tire pressure, and a low battery show green when better than usual and red when worse or a problem. A tooltip on hover or tap gives the meaning of the value and the expected value. [Value colors](docs/value-colors.md) lists the rules and their sources.

## [1.5.3] - 2026-10-07

### Fixed

- Live card: the Software tile showed "Installing update 1%" after an update ended. The Tesla API keeps the install value at 1 when no update runs. The tile now shows an update only when TeslaMate reports one, and an install only above that idle value.

## [1.5.2] - 2026-10-06

### Fixed

- Overview: the time left of a charge sits on the same line and at the same height as the range. The icon has the height of the text.

## [1.5.1] - 2026-10-06

### Changed

- The time left of a charge is easier to find. The Overview shows it in green next to the battery level, and the page of the charge in progress shows it in large green text. The battery caption names the charge limit. The Live card and the charge page show only the time left, not the end clock time.

## [1.5.0] - 2026-10-06

### Added

- End of a charge: while the car charges, the Live card and the page of the charge in progress show when the charge reaches the limit and the time left. The value is the estimate of the car, the same as in the Tesla app, and the time left counts down in the browser. `summary.json` gives `live.charging.fullAt`.

## [1.4.0] - 2026-10-05

### Added

- Charging prices in Settings: a price per kWh and an optional fast charging price. Each completed charge without a TeslaMate cost gets the price times the energy from the charger.
- Charge page: a cost panel with the energy billed, the price per kWh, the cost per kWh in the battery, the charging losses, and the cost per 100 km of range and per 1 % of battery.
- Cost totals: the Charging page sums the cost of the listed charges, Stats has a charging cost chart, and the insights cards show the total cost of AC and DC charging. The CSV file has a `Cost source` column.

### Changed

- Battery page: Capacity now and Charge cycles show from the first long charge. Health names how many long charges it still needs, and their minimum size.
- Demo data: the Flagstaff Supercharger geofence has no price, so the demo shows the price setting.

### Fixed

- A charge that TeslaMate leaves open after a restart now ends at its last charge record. Its energy, levels, duration, and cost count in every total. Only the newest open charge shows as in progress.

## [1.3.0] - 2026-10-02

### Added

- Trip view at `/cars/{car}/drives/trip`: a date range with presets, the totals for distance, driving and charging time, energy, and cost, every route on one map with the charge stops, and a list of drives and charges. CSV buttons for the range.
- Charging insights at `/cars/{carId}/charging/insights`: sessions, energy, cost per kWh, and cost per 100 km for a period, AC and DC compared, the curves of the last six DC sessions, a heatmap of charge starts, and the top charging places.
- Stats: consumption by speed band, with the share of driving time in each band, in km/h or mph.
- Slow-leak warning: when one tire loses at least 0.1 bar against the median of the other three over the last 14 days, the Overview tire card and the Stats tire panel show a warning.
- Car summary: `GET /api/cars/{carId}/summary.json` gives the Overview values and the live MQTT values as JSON, in metric units. The position and the navigation come only with `?location=1`. [API](docs/api.md) explains how a script calls it with a Cloudflare Access service token.

### Changed

- Demo data: a second slow leak in the rear left tire in the last two weeks, and no fixed tire values in the demo live feed.

## [1.2.0] - 2026-10-02

### Added

- Drive page: speed and power, elevation, and battery charts along the drive, the energy recovered, the energy used, the regen peak, the climb, and the descent.
- GPX export of a drive: `GET /api/cars/{carId}/drives/{driveId}.gpx`, with a GPX button on the drive page.
- CSV export of drives and charges: `GET /api/cars/{carId}/drives.csv` and `charges.csv`, with optional `from` and `to` dates, in the user's units and time zone. CSV buttons on the Drives and Charging pages.

### Changed

- Demo data: the elevation follows Arizona, from about 340 m in Phoenix to about 2,100 m in Flagstaff.

## [1.1.0] - 2026-10-01

### Added

- Cloudflare Access token check: with `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`, the app verifies the signed Access token on every request. A path that skips Cloudflare gets 403, and the email comes from the token.

## [1.0.0] - 2026-10-01

### Added

- First public release of the dashboard, tested with TeslaMate 4.3.0.
- Pages: Overview, Drives with route maps, Charging with power curves, Timeline, Battery, Stats, Places, and Settings.
- Settings for units, date and time formats, number style, currency, place names, maps, theme, motion, tabs, and Overview cards, saved on the server for each user.
- A container image with a Next.js standalone server, a health check, and a settings volume.
- An image workflow for GitHub Container Registry on version tags.
- A demo database with 60 days of synthetic data for development.
- Demo mode (`DEMO_MODE=1`): a built-in PGlite demo database, a landing page, and Settings in a cookie for each visitor. The public demo runs at https://mytesla.chele.bi on Vercel.
- Live status from the optional TeslaMate MQTT feed: a Live card on the Overview with locks, Sentry Mode, openings, charging, climate, software updates, driving, and navigation, updated through server-sent events.
- Link previews and icons: a 1200 × 630 preview image, Open Graph and X card tags, a canonical link, JSON-LD, an iPhone icon, a favicon, a web app manifest, `robots.txt`, a sitemap, and `SITE_URL`.
- Demo analytics: with `OPEN_ANALYTICS_URL` and `OPEN_ANALYTICS_KEY`, demo mode loads Open Analytics and sends named events for the demo, install, repository, docs, navbar, and Settings actions. A normal install never loads it.
- A light and dark switch on the landing page. The demo starts in dark mode.
- Security headers on every response: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`. The `X-Powered-By` header is off.
- README screenshots of every page.
- Documentation for installation, the database role, authentication, configuration, privacy, upgrades, and troubleshooting.

[Unreleased]: https://github.com/woosal1337/my-tesla/compare/v2.2.2...HEAD
[2.2.2]: https://github.com/woosal1337/my-tesla/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/woosal1337/my-tesla/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/woosal1337/my-tesla/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/woosal1337/my-tesla/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/woosal1337/my-tesla/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/woosal1337/my-tesla/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/woosal1337/my-tesla/compare/v1.9.0...v2.0.0
[1.9.0]: https://github.com/woosal1337/my-tesla/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/woosal1337/my-tesla/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/woosal1337/my-tesla/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/woosal1337/my-tesla/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/woosal1337/my-tesla/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/woosal1337/my-tesla/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/woosal1337/my-tesla/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/woosal1337/my-tesla/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/woosal1337/my-tesla/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/woosal1337/my-tesla/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/woosal1337/my-tesla/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/woosal1337/my-tesla/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/woosal1337/my-tesla/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/woosal1337/my-tesla/releases/tag/v1.0.0
