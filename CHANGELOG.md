# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Trip view at `/cars/{carId}/drives/trip`: a date range with presets, the totals for distance, driving and charging time, energy, and cost, every route on one map with the charge stops, and a list of drives and charges. CSV buttons for the range.

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

[Unreleased]: https://github.com/woosal1337/my-tesla/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/woosal1337/my-tesla/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/woosal1337/my-tesla/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/woosal1337/my-tesla/releases/tag/v1.0.0
