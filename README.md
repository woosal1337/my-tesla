<p align="center">
  <img src="docs/images/logo.svg" alt="My Tesla logo" width="112" height="112">
</p>

<h1 align="center">My Tesla</h1>

<p align="center">Your car data from TeslaMate, in the style of the Tesla app.</p>

<p align="center"><a href="https://mytesla.chele.bi">Live demo</a> · <a href="docs/installation.md">Install</a> · <a href="#documentation">Docs</a></p>

<p align="center">
  <a href="https://mytesla.chele.bi">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/images/screenshots/overview-dark.png">
      <img src="docs/images/screenshots/overview-light.png" alt="The My Tesla Overview page with a Model Y, its battery level, and its range" width="900">
    </picture>
  </a>
</p>

A self-hosted, read-only web dashboard for the car data that [TeslaMate](https://github.com/teslamate-org/teslamate) records. It runs next to your TeslaMate stack, reads its PostgreSQL database with a read-only role, and shows the data in a clean, fast interface that follows the Tesla visual style.

> This project is an unofficial community tool and is not affiliated with, endorsed by, or supported by the official TeslaMate project.
>
> "Tesla" and related marks are trademarks of Tesla, Inc. This project is not affiliated with Tesla, Inc.

## Features

| Page | Content |
|---|---|
| Overview | Battery and range, odometer, temperatures, software version, tire pressure with a slow-leak warning, last position on a map, today's activity strip, last drive and charge. With the optional MQTT feed: a Live card with locks, Sentry Mode, open doors and windows, charging with the end time, climate, software updates, driving, and navigation. |
| Drives | All drives by day, with distance, duration, and efficiency. Each drive has a route map, speed, power, elevation, and battery charts, the energy recovered, the climb, and a GPX export. All drives export as CSV. A trip view sums any date range on one map. |
| Charging | All charging sessions, with energy, levels, power, and cost. A price per kWh in Settings gives a cost to each charge that TeslaMate has no cost for. Each session has a cost breakdown and power, voltage, and current charts. All sessions export as CSV. An insights page shows the cost per kWh for AC and DC, the cost per 100 km, the DC curves, when the car charges, and the top places. |
| Timeline | One day at a time: driving, charging, parked, asleep, and offline time on a 24-hour strip |
| Battery | Estimated health, capacity from the first long charge, range at 100 %, charge cycles, AC and DC energy, time at each level, idle drain |
| Stats | Distance, energy, cost, efficiency against temperature and speed, charging cost for each week or month, drive times, longest drives, tire pressure trend with a slow-leak warning, software updates |
| Places | A map of visited and charging places, the most visited places, charging cost by place, geofences |
| Settings | Units, date and time formats, number style, currency, charging prices, place names, maps, theme, tabs, and Overview cards. Saved on the server for each user. |

Other properties:

- **Read-only.** The app connects with a separate role that can only read. It refuses the TeslaMate superuser.
- **Server-rendered.** Every value is read and formatted on the server. No database value reaches the browser without a server module.
- **Light and dark.** The theme follows the system, or you choose one in Settings.
- **Phone ready.** Every page works at 390 px wide, with a bottom tab bar.

## Screenshots

All screenshots show the synthetic data of the [live demo](https://mytesla.chele.bi).

<table>
  <tr>
    <td width="50%"><img src="docs/images/screenshots/drive-dark.png" alt="A drive with its route on the map, distance, duration, consumption, and battery use"></td>
    <td width="50%"><img src="docs/images/screenshots/charge-dark.png" alt="A Supercharger session with energy added, peak power, efficiency, cost, and the power curve"></td>
  </tr>
  <tr>
    <td align="center"><b>Drive</b>: the route map and the drive totals</td>
    <td align="center"><b>Charge</b>: energy, power curve, cost, and efficiency</td>
  </tr>
  <tr>
    <td><img src="docs/images/screenshots/battery-dark.png" alt="Battery health, capacity, range at 100 percent, and charge cycles"></td>
    <td><img src="docs/images/screenshots/stats-dark.png" alt="Distance, energy, and temperature charts for each week"></td>
  </tr>
  <tr>
    <td align="center"><b>Battery</b>: health, capacity, and idle drain</td>
    <td align="center"><b>Stats</b>: distance, energy, efficiency, and tire pressure</td>
  </tr>
  <tr>
    <td><img src="docs/images/screenshots/places-dark.png" alt="A map of visited places and charging places"></td>
    <td><img src="docs/images/screenshots/timeline-dark.png" alt="One day as a 24-hour strip of driving, charging, and parked time"></td>
  </tr>
  <tr>
    <td align="center"><b>Places</b>: where the car goes and charges</td>
    <td align="center"><b>Timeline</b>: one day, hour by hour</td>
  </tr>
  <tr>
    <td><img src="docs/images/screenshots/live-dark.png" alt="The Live card with the lock, the openings, charging, climate, and a software update"></td>
    <td><img src="docs/images/screenshots/settings-dark.png" alt="The Settings page with units, date and time, and display options"></td>
  </tr>
  <tr>
    <td align="center"><b>Live status</b>: locks, charging, and updates over MQTT</td>
    <td align="center"><b>Settings</b>: units, formats, theme, and tabs</td>
  </tr>
</table>

<p align="center">
  <img src="docs/images/screenshots/phone-overview.png" alt="The Overview page on a phone" width="260">
  &nbsp;&nbsp;
  <img src="docs/images/screenshots/phone-charging.png" alt="The Charging page on a phone" width="260">
</p>

## Quick start

You need a running TeslaMate stack with Docker Compose.

1. Create the read-only database role. Read [Connect to the TeslaMate database](docs/teslamate-database.md).
2. Add the dashboard service to your TeslaMate Compose file:

   ```yaml
   dashboard:
     image: ghcr.io/woosal1337/my-tesla:latest
     restart: unless-stopped
     environment:
       DATABASE_URL: postgresql://teslamate_ro:${TESLAMATE_RO_PASSWORD}@database:5432/teslamate
       DISPLAY_TIME_ZONE: Europe/Berlin
     volumes:
       - dashboard-data:/data
     ports:
       - "127.0.0.1:3000:3000"
   ```

   Add `dashboard-data:` under the `volumes:` key at the end of the file.

3. Start it with `docker compose up -d dashboard`.
4. Put an authenticating proxy in front of port 3000. The app has no login of its own. Read [Protect the dashboard](docs/authentication.md).
5. Open the dashboard through the proxy.

The full guide is [Installation](docs/installation.md).

## Documentation

| Topic | Document |
|---|---|
| Install with Docker, Docker Compose, Coolify, or from source | [Installation](docs/installation.md) |
| Create the read-only role and reach the database | [Connect to the TeslaMate database](docs/teslamate-database.md) |
| Put a login in front of the app | [Protect the dashboard](docs/authentication.md) |
| Environment variables and user settings | [Configuration](docs/configuration.md) |
| Show live locks, charging, and navigation from MQTT | [Live status](docs/live-status.md) |
| Get the car status as JSON, and the CSV and GPX exports | [API](docs/api.md) |
| Which outside services the browser contacts | [Privacy](docs/privacy.md) |
| Run or deploy the public demo | [Demo site](docs/demo-site.md) |
| Update the app and TeslaMate | [Upgrading](docs/upgrading.md) |
| Fix common problems | [Troubleshooting](docs/troubleshooting.md) |
| How the app is built | [Architecture](docs/architecture.md) and [decisions](docs/decisions/) |
| Run the app from source and contribute | [Development](docs/development.md), [demo data](docs/demo-data.md), [quality gates](docs/quality.md), and [CONTRIBUTING.md](CONTRIBUTING.md) |

## Requirements

| Part | Version |
|---|---|
| TeslaMate | 4.3.0 is tested. The app reads the TeslaMate schema directly, so check [Upgrading](docs/upgrading.md) after a TeslaMate upgrade. |
| PostgreSQL | The database that TeslaMate uses |
| Docker | Any version with Compose v2, for the container image |
| Node.js and Bun | Node.js 24 and Bun 1.3.14, only to run from source |

## Status

The pages work against TeslaMate 4.3.0 and against the [demo data](docs/demo-data.md). The [changelog](CHANGELOG.md) lists each release.

## License

[GNU Affero General Public License v3.0 or later](LICENSE). Some SQL in this project follows the logic of the TeslaMate Grafana dashboards, which use the same license.

## Thanks

- [TeslaMate](https://github.com/teslamate-org/teslamate) records the data that this dashboard shows.
- [shadcn/ui](https://ui.shadcn.com), [mapcn](https://mapcn.dev), [Recharts](https://recharts.org), [MapLibre GL JS](https://maplibre.org), and [NumberFlow](https://number-flow.barvian.me) give the interface parts.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [CARTO](https://carto.com/attributions) give the map data and tiles.
