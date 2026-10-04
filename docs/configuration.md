# Configuration

The server reads environment variables at the first request. The browser never sees them. Each user also has Settings in the app, saved on the server.

## Environment variables

| Name | Required | Default | Value |
|---|---|---|---|
| `DATABASE_URL` | Yes | None | `postgresql://teslamate_ro:<password>@<host>:5432/teslamate`. The app refuses the users `teslamate` and `postgres`. Read [Connect to the TeslaMate database](teslamate-database.md). |
| `STATEMENT_TIMEOUT_MS` | No | `15000` | The longest time for one query, in milliseconds. A positive whole number. |
| `DATABASE_POOL_MAX` | No | `5` | The most database connections at the same time. A positive whole number. |
| `DISPLAY_TIME_ZONE` | No | `UTC` | An IANA time zone, such as `Europe/Berlin`. Settings shows it as "Automatic". |
| `PREFERENCES_FILE` | No | `.data/preferences.json` in the working folder. The container image sets `/data/preferences.json`. | The JSON file that holds the saved Settings. Keep it on a persistent volume. |
| `CF_ACCESS_TEAM_DOMAIN` | No | Empty | With `CF_ACCESS_AUD`, the app accepts only requests with a valid Cloudflare Access token. Read [Verify the Cloudflare Access token](authentication.md#verify-the-cloudflare-access-token). |
| `CF_ACCESS_AUD` | No | Empty | The Application Audience tag of the Cloudflare Access application |
| `IDENTITY_HEADER` | No | `cf-access-authenticated-user-email` | The request header that holds the user's email. Read [Protect the dashboard](authentication.md). |
| `SITE_URL` | No | `VERCEL_PROJECT_PRODUCTION_URL` on Vercel, else empty | The public address, such as `https://tesla.example.com`. Link previews, the canonical link, `robots.txt`, and the sitemap use it. Read [Link previews and icons](demo-site.md#link-previews-and-icons). |
| `OPEN_ANALYTICS_URL` | No | Empty | Demo mode only. The Open Analytics collector, such as `https://oa-c.example.com`. Read [Analytics on the demo site](demo-site.md#analytics-on-the-demo-site). |
| `OPEN_ANALYTICS_KEY` | No | Empty | Demo mode only. The public tracking key of the Open Analytics site. Both variables must be set. |
| `PORT` | No | `3000` | The port of the standalone server |
| `HOSTNAME` | No | `0.0.0.0` in the image | The address of the standalone server |
| `MQTT_URL` | No | Empty | The TeslaMate MQTT broker, such as `mqtt://mosquitto:1883`. Empty turns off the Live card. Read [Live status](live-status.md). |
| `MQTT_USERNAME` | No | Empty | A broker user that can only read `teslamate/#` |
| `MQTT_PASSWORD` | No | Empty | The password of that user. Set `MQTT_USERNAME` with it. |
| `MQTT_NAMESPACE` | No | Empty | The same value as `MQTT_NAMESPACE` in TeslaMate, if you set one there |
| `DEMO_MODE` | No | Empty | `1` runs the public demo: a built-in demo database, the landing page, and Settings in a cookie. Read [Demo site](demo-site.md). Never set it together with real data. |
| `ALLOWED_DEV_ORIGINS` | No | Empty | Development only. A comma-separated list of extra host names for `next dev`. |

[`.env.example`](../.env.example) lists the same names with safe values.

## Settings in the app

Open Settings from the tab bar. Each change saves at once, and a preview shows the result.

| Group | Settings |
|---|---|
| Units | Distance (km, mi), temperature (°C, °F), tire pressure (bar, psi, kPa), efficiency (Wh per distance, kWh per 100, distance per kWh), range (rated, ideal) |
| Date and time | Time zone, 24-hour or 12-hour clock, date order, first day of the week |
| Numbers | Number style (`1,234.5`, `1.234,5`, or `1 234,5`) |
| Charging cost | Currency, price per kWh, fast charging price. Read [Charging cost](#charging-cost). |
| Location | Place names (geofence or address), address detail (full, street, city), maps on or off, map theme |
| Display | Theme (system, light, dark), motion (full, reduced), start screen, live refresh, default period, start car |
| Tabs | Show or hide Drives, Charging, Battery, Stats, and Places |
| Overview | Show or hide the car image, Live status, Today, Tires, Location, and Last drive and charge |

The defaults come from the TeslaMate settings page: distance, temperature, tire pressure, preferred range, and theme. A saved value replaces a default. "Reset to defaults" removes your saved values.

## Charging cost

TeslaMate records a cost only for a charge in a geofence with a price. For the other charges, set a price in the app:

1. Open Settings, then Charging cost.
2. Choose the currency.
3. Type the price per kWh, then press Enter. Use a dot or a comma for the decimals.
4. Optional: type a separate price for DC fast chargers.

For each completed charge without a TeslaMate cost, the app multiplies the energy from the charger by the price. The energy from the charger is the larger of the energy added and the energy used, as in TeslaMate. A cost that TeslaMate recorded always stays.

The charge page shows the source of each cost and a breakdown: the energy billed, the price per kWh, the cost per kWh in the battery, the charging losses, and the cost per 100 km of range. The Stats chart and the CSV file also name the charges that use your price. Empty the field to remove a price. [Decision 0011](decisions/0011-charging-cost-from-a-price.md) explains the rule.

## Where Settings live

The server writes Settings to `PREFERENCES_FILE`, with one entry for each user. Writes go to a temporary file first, then the server renames it, so a crash cannot leave a half-written file.

The server keeps the Settings in memory for up to 1 minute, with Next.js Cache Components. A save clears your entry at once, so every device sees the change on the next page. A hand edit of the file shows after up to 1 minute. [Decision 0005](decisions/0005-cache-components.md) explains the cache.

Back up the file with the rest of your TeslaMate data. It holds only display choices, no car data and no secrets.
