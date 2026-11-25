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

## Upgrade to 2.0

Version 2.0 signs people in itself. Read [Accounts and sign-in](authentication.md) first.

1. Pull and start the new image as above. Add `TRUSTED_IP_HEADER` when a proxy sits in front, for example `cf-connecting-ip` behind Cloudflare, so that the sign-in limits count each network.
2. Read the setup link from the log, `docker logs my-tesla 2>&1 | grep "setup?token"`, open it, and create the admin account. Use the email that your proxy sent before, so that your Settings stay yours. Settings saved under `owner` stay the fallback for every account.
3. Remove the authenticating proxy, or keep it as a second layer. `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` still work; `IDENTITY_HEADER`, `MOBILE_ACCESS_CLIENT_ID`, and `MOBILE_ACCESS_CLIENT_SECRET` are gone.
4. Make a token under **Account** for each script that used a service token, and pair each phone again from the QR code in Settings.

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
| 2.4.0 | 4.4.0 |
| 2.3.0 | 4.3.0 |
| 2.2.2 | 4.3.0 |
| 2.2.1 | 4.3.0 |
| 2.2.0 | 4.3.0 |
| 2.1.0 | 4.3.0 |
| 2.0.2 | 4.3.0 |
| 2.0.1 | 4.3.0 |
| 2.0.0 | 4.3.0 |
| 1.9.0 | 4.3.0 |
| 1.8.0 | 4.3.0 |
| 1.7.0 | 4.3.0 |
| 1.6.1 | 4.3.0 |
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
