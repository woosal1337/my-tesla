# Privacy

The dashboard shows a location history. This page lists every place that data goes.

## What stays on your server

- The server reads the database and renders the pages. The browser gets HTML and chart data for the pages that you open.
- The saved Settings stay in `PREFERENCES_FILE` on your server.
- With [Live status](live-status.md), the server keeps the last MQTT values in memory only. It saves no history and never publishes to the broker.
- The app sends no analytics and no telemetry. The container image also sets `NEXT_TELEMETRY_DISABLED=1`, which turns off the build telemetry of Next.js.

## What the browser asks from outside services

| Service | Request | What the service can see | How to stop it |
|---|---|---|---|
| CARTO basemaps | Map tiles for the map views | Your IP address and the map area around the car, its routes, and your places | Settings, Location, Maps: Hide |
| Tesla image server (`static-assets.tesla.com`) | The picture of your car on Overview | Your IP address and the model, color, wheels, and trim of the car | Settings, Overview: turn off Car image |
| Apple Maps | Only when you press "Open in Maps" | The car position | Do not press the button |

The map library itself loads from your server, not from a CDN.

## Before you share your screen

1. Open Settings.
2. Set Maps to Hide.
3. Set Address detail to City, or Place names to Geofence first with geofences for your private places.

The maps, the route lines, and the place markers then disappear from every page.
