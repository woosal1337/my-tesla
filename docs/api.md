# API

The app has four read-only `GET` endpoints for scripts, widgets, and home automation. They sit behind the same proxy as the pages. Read [Protect the dashboard](authentication.md) first.

| Endpoint | Gives |
|---|---|
| `/api/cars/{carId}/summary.json` | The car status now, as JSON. Add `?location=1` for the position and the navigation. |
| `/api/cars/{carId}/drives.csv` | All drives as CSV. Optional `from` and `to` dates, as `YYYY-MM-DD`. |
| `/api/cars/{carId}/charges.csv` | All charges as CSV, with the same optional dates. |
| `/api/cars/{carId}/drives/{driveId}.gpx` | One drive as a GPX track. |

The car id is the number in the dashboard address, such as `2` in `/cars/2`. An unknown car gives status 404.

## Car summary

`summary.json` gives the values of the Overview page: the state, the battery, the range, the odometer, the temperatures, the tire pressures, and the software version. With the [MQTT feed](live-status.md), it also gives the live values: locks, Sentry Mode, open doors and windows, charging, climate, driving, and a software update.

The units are always metric, so a script does not depend on the Settings page:

| Field suffix | Unit |
|---|---|
| `Km` | Kilometers |
| `Kmh` | Kilometers per hour |
| `C` | Degrees Celsius |
| `Bar` | Bar |
| `Kw` | Kilowatts |
| `Percent` | Percent |

Times are ISO 8601 in UTC. A value that TeslaMate does not have is `null`.

| Field | Meaning |
|---|---|
| `state` | `driving`, `charging`, `online`, `asleep`, `offline`, or `unknown`. A connected MQTT feed sets it first. |
| `updatedAt` | The time of the last position or state change |
| `battery.rangeKind` | `rated` or `ideal`, from the Settings of the shared `owner` user |
| `live` | `null` without `MQTT_URL`. `{ "connected": false }` when the feed is down. |
| `live.openParts` | The names of the open doors, windows, trunk, frunk, and sunroof. `null` when the feed has not sent them. |
| `location` | Only with `?location=1`: `latitude`, `longitude`, `at`, and `navigation` with the destination of the active route |

The response leaves out the position unless the request asks for it. A widget that shows only the battery and the lock does not need a location history.

```json
{
  "car": { "id": 2, "name": "Juniper", "model": "Model Y", "trim": "SR" },
  "state": "online",
  "updatedAt": "2026-10-01T22:58:16.660Z",
  "battery": { "levelPercent": 50, "usableLevelPercent": 50, "rangeKm": 220.7, "rangeKind": "rated", "at": "2026-10-01T22:58:16.660Z" },
  "odometerKm": 4286.7,
  "tiresBar": { "frontLeft": 2.9, "frontRight": 2.9, "rearLeft": 2.7, "rearRight": 2.9 },
  "live": { "connected": true, "locked": true, "sentryMode": true, "openParts": [] }
}
```

The example shows some of the fields. Each response has the header `Cache-Control: private, no-store`.

## Call the API through Cloudflare Access

A script cannot do the login in a browser. Give it a Cloudflare Access service token:

1. In Cloudflare Zero Trust, open Access, Service credentials, Service Tokens. Make a token, and keep the Client ID and the Client Secret in your password manager.
2. Open the Access application of the dashboard. Add a policy with the action **Service Auth**, and include only this service token.
3. Send the two values as headers:

   ```bash
   curl -fsS \
     -H "CF-Access-Client-Id: $CF_CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CF_CLIENT_SECRET" \
     https://tesla.example.com/api/cars/2/summary.json
   ```

The token check in the app accepts a service token. A service token has no email, so the request uses the Settings of the shared `owner` user. The CSV files use these units and this time zone.

To stop the access, delete the service token in Zero Trust. Give each script its own token, so that you can stop one without the others.

## Other proxies

With Authelia, Authentik, or oauth2-proxy, use the token or the API key feature of the proxy. With Tailscale, call the endpoint from a device on your tailnet.
