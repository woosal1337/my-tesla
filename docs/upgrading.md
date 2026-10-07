# Upgrading

## Upgrade the dashboard

1. Read the [changelog](../CHANGELOG.md) for the new version.
2. Pull the new image and start it again:

   ```bash
   docker compose pull dashboard
   docker compose up -d dashboard
   ```

3. Check `GET /api/health`.

The saved Settings stay in the `/data` volume. A new version reads the old file. An unknown or removed setting falls back to its default.

To pin one version, use a tag such as `ghcr.io/woosal1337/my-tesla:1.0.0` instead of `latest`.

## Upgrade TeslaMate

The dashboard reads the TeslaMate tables directly. A TeslaMate migration can rename or change a column. The dashboard then shows an error on the pages that read that column.

1. Read the TeslaMate release notes for database changes.
2. Upgrade TeslaMate.
3. Open each tab of the dashboard once: Overview, Drives, a drive, Charging, a charge, Timeline, Battery, Stats, Places, and Settings.
4. If a page fails, open an issue with the TeslaMate version and the server log.

The read-only role keeps its access to new tables, because of the `ALTER DEFAULT PRIVILEGES` statement in [Connect to the TeslaMate database](teslamate-database.md).

## Tested versions

| Dashboard | TeslaMate |
|---|---|
| 1.6.0 | 4.3.0 |
| 1.5.3 | 4.3.0 |
| 1.5.2 | 4.3.0 |
| 1.5.1 | 4.3.0 |
| 1.5.0 | 4.3.0 |
| 1.4.0 | 4.3.0 |
| 1.3.0 | 4.3.0 |
| 1.2.0 | 4.3.0 |
| 1.1.0 | 4.3.0 |
| 1.0.0 | 4.3.0 |
