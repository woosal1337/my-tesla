# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

- Trip view at `/cars/{carId}/drives/trip`: a date range with presets, the totals for distance, driving and charging time, energy, and cost, every route on one map with the charge stops, and a list of drives and charges. CSV buttons for the range.
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

[Unreleased]: https://github.com/woosal1337/my-tesla/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/woosal1337/my-tesla/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/woosal1337/my-tesla/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/woosal1337/my-tesla/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/woosal1337/my-tesla/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/woosal1337/my-tesla/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/woosal1337/my-tesla/releases/tag/v1.0.0
