# API

The app has six read-only `GET` endpoints for scripts, widgets, home automation, and the [mobile app](mobile.md), and one endpoint for push alerts. Each call needs an account: a script sends a token, the mobile app sends its phone token, and a browser sends its session cookie. Read [Accounts and sign-in](authentication.md) first.

| Endpoint | Gives |
|---|---|
| `/api/cars.json` | The cars, as JSON: `id`, `name`, `model`, and `trim` of each car, and `defaultCarId`, the car with the latest position |
| `/api/cars/{carId}/summary.json` | The car status now, as JSON. Add `?location=1` for the position and the navigation. |
| `/api/cars/{carId}/drives.csv` | All drives as CSV. Optional `from` and `to` dates, as `YYYY-MM-DD`. |
| `/api/cars/{carId}/charges.csv` | All charges as CSV, with the same optional dates. |
| `/api/cars/{carId}/drives/{driveId}.gpx` | One drive as a GPX track. |
| `/api/cars/{carId}/calendar.ics` | The drives and charges of the last year as an iCalendar feed. Read [Calendar feed](#calendar-feed). |

The car id is the TeslaMate number of the car. The dashboard address uses the car name, such as `/cars/red-rocket`, and the id address, such as `/cars/2`, opens the same car. The API takes only the id, so a new car name does not break a script. An unknown car gives status 404.

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
| `live.charging.fullAt` | The time at which the charge reaches the limit, from the estimate of the car. `null` when the car does not charge. |
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

## Calendar feed

A calendar app subscribes to `/api/cars/{carId}/calendar.ics` and shows each drive and each finished charge of the last year as an event, with the distance, the time, and the consumption, or the energy, the levels, and the cost. It asks for new events every hour.

A calendar app cannot send a header, so the feed takes a token in its address:

1. Open Settings for a car, then **Calendar**, choose what the calendar shows (drives and charges, drives only, or charges only), and press **Make a calendar link**.
2. Press **Subscribe in the calendar app**, or copy the `https` link into the calendar app, for example Google Calendar, **From URL**.

The choice travels in the link as `show=drives` or `show=charges`; without it the feed holds both, so one account can subscribe to a drives calendar and a charges calendar. The link holds a token for the feed of that account. It works only for `calendar.ics`, never as a bearer token for the other endpoints, and the events use the Settings of the account. Anyone with the link sees the drives and charges, and proxies and calendar services may log it, so keep it private. **Account** lists each link as **Calendar** with its last use, and signs it out. A new password signs out every calendar link too. A browser that is signed in can also open the feed without a token.

## Push alerts

`/api/push` registers a phone for push alerts. Only the [mobile app](mobile.md) uses it. Each request with a body needs `Content-Type: application/json`.

| Method | Body | Effect |
|---|---|---|
| `GET` | None | `{ "enabled": true, "events": [...] }`: whether the server can send alerts, and the events with `id`, `title`, and `description` |
| `PUT` | `{ "token": "ExponentPushToken[...]", "events": ["charging-complete"] }` | Saves the phone and its events. An empty list removes the phone. |
| `DELETE` | `{ "token": "ExponentPushToken[...]" }` | Removes the phone. Answers 204. |
| `POST` | `{ "token": "ExponentPushToken[...]" }` | Sends a test alert to a saved phone. Answers 204. |

`enabled` is `false` without `MQTT_URL` and in demo mode, and `PUT` and `POST` then answer 409. An unknown event or a token in another form gives 400.

## App API

The [mobile app](mobile.md) reads its screens from `/api/app/cars/{carId}/…`. Unlike the endpoints above, these answers are formatted for the person who asks: the server applies the units, the number style, the date and clock format, the currency, the time zone, the place names, and the map setting from Settings, as it does for the pages. Each answer uses the Settings of the signed-in account.

| Endpoint | Screen |
|---|---|
| `overview` | The Overview: the car with its callouts (battery and range, security or last seen, charging or odometer), `car.imageFrame` with the part of the image that the car fills (`left`, `top`, `width`, and `height` in fractions of the image width and height, `null` without an image), the menu rows with their summaries, the battery, stats, the Live card, the lock and Sentry Mode history, Today, tires, location, the last drive and charge |
| `drives`, `drives/{driveId}`, `trips/{tripId}` | The trip list by day, each day with its trip count and distance, a drive with its charts, and a trip with its legs and stops |
| `charges`, `charges/{chargeId}` | The charge list by day, each day with the energy added, and a charge with its figures, cost breakdown, and charts |
| `battery`, `stats`, `places`, `charging` | The Battery, Stats, Places, and Charging insights pages in panels. Add `?period=` with `7d`, `30d`, `90d`, `1y`, or `all`. Without it, the user's default period applies. |
| `year` | The year in review. Add `?year=2026`; without it, the current year in the user's time zone, or the newest year with data. `years` lists the years that have a drive or a charge. |
| `timeline` | One day: the totals, the hour-by-hour strip, and each drive, charge, and stop. Add `?day=YYYY-MM-DD`; without it, today. `previous` and `next` give the days around it, and `next` is `null` on today. |
| `report` | A date range: the totals, the routes and the charges on a map, the trips and charges by day with the total of each day, and the CSV exports. Add `?from=` and `?to=` as `YYYY-MM-DD`, up to 366 days; without them, the last 7 days. `presets` lists the usual ranges. |

`/api/app/settings` reads and changes the Settings of the person who asks, the same Settings as the web page. `GET` gives the groups, the choices, and a preview. `PUT` with `{ "key": "distance", "value": "mi" }` changes one setting and answers with the new page. A price takes a text such as `"4,857"`, and an Overview card takes `"overview.tires"` with `true` or `false`. The web-only settings, such as the theme and the tabs, stay on the web. In demo mode the Settings live in a cookie, as in the browser.

The app signs in through these endpoints, which need no session:

| Endpoint | Method | Use |
|---|---|---|
| `/api/app/pair` | `POST` `{ "code": "…", "name": "Ege's iPhone", "platform": "ios" }` | Trades the one-time code of the QR code for a phone token that waits for approval. Answers 201 `{ token, status: "pending", user: { name } }`, 400 for a used or expired code, and 429 after too many tries. |
| `/api/app/pair/status` | `GET` with the phone token | `{ status: "pending" }` until the person allows the phone on the web, then `{ status: "active", user }`. 401 once the pairing is denied or expired. |
| `/api/app/me` | `GET`, `DELETE` with the phone token | The signed-in account, and sign-out of the phone |

With maps on in Settings, the answers hold the positions for the maps of the app: the car on the Overview, the route of a drive, the legs of a trip with its start, stops, and end, the place of a charge, the places of the Places page with their weight, every road driven, and the routes of a report. With maps off, these fields are `null`, and the map panels say so. The map theme is a setting of `/api/app/settings`.

The lists of `drives`, `charges`, and `report` give their days in `sections`. Each day gives `title`, the date, and `total`, the parts of the day total in the units of the person, for example `["4 trips", "64 km"]` or `["+18.9 kWh"]`. The total of a report day counts only its rows, so a charge inside a trip does not add to the energy part. A server before this change omits `total`, and the app then shows only the date.

A drive gives `gpxPath`, and a report gives `exports`, each the path of an export of the section above. The app downloads them with its phone token and opens the share sheet of the phone.

`src/lib/app/contract.ts` defines every answer. A chart comes with its points in the user's units, the axis ticks, and the tooltip labels, so the app only draws it. The shape follows the app and can change in any release, so scripts should use `summary.json` and the exports.

## Call the API with a token

A script cannot sign in through a browser. Make a token for it:

1. Open **Account** from the round button in the header, then **Tokens for scripts**.
2. Name the token after the script, and copy it. It shows only once.
3. Send it as a header:

   ```bash
   curl -fsS -H "Authorization: Bearer $MY_TESLA_TOKEN" \
     https://tesla.example.com/api/cars/2/summary.json
   ```

The answers use the Settings of the account that made the token, so the CSV files use its units and time zone. A token lasts 90 days after its last use. To stop it, sign it out in **Account**. Give each script its own token, so that you can stop one without the others. A call without a valid token gets 401.

