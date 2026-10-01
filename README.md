<p align="center">
  <img src="docs/images/logo.svg" alt="My Tesla logo" width="112" height="112">
</p>

<h1 align="center">My Tesla</h1>

<p align="center">Your car data from TeslaMate, in the style of the Tesla app.</p>

<p align="center"><a href="https://mytesla.chele.bi">Live demo</a> · <a href="docs/installation.md">Install</a> · <a href="#documentation">Docs</a></p>

A self-hosted, read-only web dashboard for the car data that [TeslaMate](https://github.com/teslamate-org/teslamate) records. It runs next to your TeslaMate stack, reads its PostgreSQL database with a read-only role, and shows the data in a clean, fast interface that follows the Tesla visual style.

> This project is an unofficial community tool and is not affiliated with, endorsed by, or supported by the official TeslaMate project.
>
> "Tesla" and related marks are trademarks of Tesla, Inc. This project is not affiliated with Tesla, Inc.

## Features

| Page | Content |
|---|---|
| Overview | Battery and range, odometer, temperatures, software version, tire pressure, last position on a map, today's activity strip, last drive and charge |
| Drives | All drives by day, with distance, duration, and efficiency. Each drive has a route map. |
| Charging | All charging sessions, with energy, levels, power, and cost. Each session has power, voltage, and current charts. |
| Timeline | One day at a time: driving, charging, parked, asleep, and offline time on a 24-hour strip |
| Battery | Estimated health, capacity, range at 100 %, charge cycles, AC and DC energy, time at each level, idle drain |
| Stats | Distance, energy, cost, efficiency against temperature, drive times, longest drives, tire pressure trend, software updates |
| Places | A map of visited and charging places, the most visited places, charging cost by place, geofences |
| Settings | Units, date and time formats, number style, currency, place names, maps, theme, tabs, and Overview cards. Saved on the server for each user. |

Other properties:

- **Read-only.** The app connects with a separate role that can only read. It refuses the TeslaMate superuser.
- **Server-rendered.** Every value is read and formatted on the server. No database value reaches the browser without a server module.
- **Light and dark.** The theme follows the system, or you choose one in Settings.
- **Phone ready.** Every page works at 390 px wide, with a bottom tab bar.

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

The project is at version 0.1.0. The pages work against TeslaMate 4.3.0 and against the [demo data](docs/demo-data.md). The [changelog](CHANGELOG.md) lists each release.

## License

[GNU Affero General Public License v3.0 or later](LICENSE). Some SQL in this project follows the logic of the TeslaMate Grafana dashboards, which use the same license.

## Thanks

- [TeslaMate](https://github.com/teslamate-org/teslamate) records the data that this dashboard shows.
- [shadcn/ui](https://ui.shadcn.com), [mapcn](https://mapcn.dev), [Recharts](https://recharts.org), [MapLibre GL JS](https://maplibre.org), and [NumberFlow](https://number-flow.barvian.me) give the interface parts.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [CARTO](https://carto.com/attributions) give the map data and tiles.
