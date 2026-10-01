# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- First public version of the dashboard, tested with TeslaMate 4.3.0.
- Pages: Overview, Drives with route maps, Charging with power curves, Timeline, Battery, Stats, Places, and Settings.
- Settings for units, date and time formats, number style, currency, place names, maps, theme, motion, tabs, and Overview cards, saved on the server for each user.
- A container image with a Next.js standalone server, a health check, and a settings volume.
- An image workflow for GitHub Container Registry on version tags.
- A demo database with 60 days of synthetic data for development.
- Demo mode (`DEMO_MODE=1`): a built-in PGlite demo database, a landing page, and Settings in a cookie for each visitor. The public demo runs at https://mytesla.chele.bi on Vercel.
- Documentation for installation, the database role, authentication, configuration, privacy, upgrades, and troubleshooting.
