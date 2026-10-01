# 0004: Saved settings in a server file

Date: 2026-10-01

Status: Accepted.

## Context

The owner asked for a Settings tab with detailed units and formats: distance, temperature, tire pressure, efficiency, range type, clock, date order, numbers, currency, time zone, place names, maps, theme, tabs, and Overview cards. The dashboard must follow the saved settings on every device. The app connects to TeslaMate as `teslamate_ro` and must never write to that database.

## Decision

1. Keep the settings in one JSON file on the server. `PREFERENCES_FILE` gives the path. Each user has one entry, keyed by the email in the identity header of the authenticating proxy, or `owner` without it. `IDENTITY_HEADER` names the header. The default is the Cloudflare Access header.
2. Take the defaults from the TeslaMate settings table: `unit_of_length`, `unit_of_temperature`, `unit_of_pressure`, `preferred_range`, and `theme_mode`. A saved value replaces a default.
3. Save through two server actions. Each action parses the input again and keeps only known values.
4. Format on the server. One formatter, built from the settings, gives every number, unit, date, and clock. Charts get converted values and a small serializable style.
5. Follow the theme with CSS `light-dark()` tokens and a `data-theme` attribute, so a forced theme needs no script.

## Alternatives

1. A browser cookie or `localStorage`. Each device keeps its own settings, and a new phone starts from the defaults again.
2. A table in the TeslaMate database. This breaks the read-only contract.
3. A second database for the app. It adds a service for a few hundred bytes of data.

## Consequences

The app now writes one file. A deployment needs a persistent volume for `PREFERENCES_FILE`, or the settings reset on each deploy. The user key trusts the identity header, so the app must stay behind a proxy that sets the header and removes it from client requests. Without the header, every viewer shares the `owner` entry. The TeslaMate defaults follow a change in the TeslaMate settings page until the user saves a value.
