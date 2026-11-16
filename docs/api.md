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

The [mobile app](mobile.md) reads its screens from `/api/app/cars/{carId}/…`. Unlike the endpoints above, these answers are formatted for the person who asks: the server applies the units, the number style, the date and clock format, the currency, the time zone, the place names, and the map setting from Settings, as it does for the pages. Each answer uses the Settings of the signed-in account. An answer leaves out a stat without a value, such as "—", unless its `detail` gives the reason.

| Endpoint | Screen |
|---|---|
| `overview` | The Overview: the car with its callouts (battery and range, security with the MQTT feed, the power and limit of a charge or the charge port or the odometer), `car.imageFrame` with the part of the image that the car fills (`left`, `top`, `width`, and `height` in fractions of the image width and height, `null` without an image), the menu rows with their summaries (the last drive and charge, the cold battery with the health and capacity, the distance and efficiency of the default period, the count of the visited places in the default period, the live values that the stage does not show), the battery, stats, the Live card, the lock and Sentry Mode history, Today with the key of its strip in `today.legend`, tires, and location. `location.place` is the place of a parked car in the place style of the Settings: the end of the last drive, else the place of the last charge. `location.since` says since when the car is there, for example "Parked since today at 16:25 · 1 h 35 min". Both are `null` while the car drives, `place` is `null` for an unknown place, and `since` is `null` without a drive. The Location row of the menu shows the place as its summary. The same place name can also show in the summaries of the Drives and Charging rows. `location.lastSeen` stays for older apps. The app shows the age of the position with `activity.updated`. The Overview card "Last drive and charge" off gives the Drives and Charging rows the summary `null`. The climate state is the detail of the stat "Cabin". A tire with a slow-leak warning has the tone `warning` and the leak sentence in its note, unless its tone is `bad` |
| `drives`, `drives/{driveId}`, `trips/{tripId}` | The trip list by day, each day with its trip count and distance, a drive with its charts, and a trip with its legs and stops |
| `charges`, `charges/{chargeId}` | The charge list by day, each day with the energy added, and a charge with its figures, cost breakdown, and charts. The stat "Cost" gives the source of the cost in its `detail`, and the cost breakdown has no `source` of its own. |
| `battery`, `stats`, `places`, `charging` | The Battery, Stats, Places, and Charging insights pages in panels. Add `?period=` with `7d`, `30d`, `90d`, `1y`, or `all`. Without it, the user's default period applies. In a `shares` block, `share` is the part of the whole from 0 to 1, and the first value of `text` gives the same quantity. A `note` block without a `role` is the empty state of its panel. A `note` with a `role` is content: `heading` names the block below it, `body` is text to read, and `caption` explains the block above it or the panel. Places leaves out an area ranking with fewer than two areas, and the stat of that area type names the one area in its `detail`. A panel that does not follow the period names its own range in its title, for example "Charging time, last 2 years". |
| `year` | The year in review. Add `?year=2026`; without it, the current year in the user's time zone, or the newest year with data. `years` lists the years that have a drive or a charge. |
| `timeline` | One day: the totals, the hour-by-hour strip, and each drive, charge, and stop. Add `?day=YYYY-MM-DD`; without it, today. `previous` and `next` give the days around it, and `next` is `null` on today. `strip.legend` gives the key of the strip: a `kind` and a `label` for each color, and `now` with the label "Now" when the current time is inside the day. On a day without a drive and a charge, `lastActive` gives the last earlier day with one (`day`, `title`, and `detail`), or `null` when no such day exists, and `stats` holds only the share of sleep or of offline time, or nothing when the day has no record. On another day, `lastActive` is `null`. The last stat is "Offline" when the car was offline longer than asleep, and "Asleep" otherwise. Its `detail` names the other share when it is 1% or more. An older server leaves out `legend` and `lastActive`, and always sends "Asleep". |
| `report` | A date range: the totals, the routes and the charges on a map, the trips and charges by day with the total of each day, and the CSV exports. Add `?from=` and `?to=` as `YYYY-MM-DD`, up to 366 days; without them, the last 7 days. `presets` lists the usual ranges. A charge row also has `charge`, the row of the charge list for the same charge, and a trip row has none. An older server leaves out `charge`. |

`/api/app/settings` reads and changes the Settings of the person who asks, the same Settings as the web page. `GET` gives the groups, the choices, and a preview. `PUT` with `{ "key": "distance", "value": "mi" }` changes one setting and answers with the new page. A price takes a text such as `"4,857"`, and a card takes `"overview.tires"` with `true` or `false`. The last groups follow the screens of the app: "Insights" holds the default period, "Overview" holds the car image and the last drive and charge, and "Status and Location" holds Live status, Today, Tires, and Location. The keys stay the same as on the web, for example `period` and `overview.tires`. The web-only settings, such as the theme and the tabs, stay on the web. In demo mode the Settings live in a cookie, as in the browser.

The app signs in through these endpoints, which need no session:

| Endpoint | Method | Use |
|---|---|---|
| `/api/app/pair` | `POST` `{ "code": "…", "name": "Ege's iPhone", "platform": "ios" }` | Trades the one-time code of the QR code for a phone token that waits for approval. Answers 201 `{ token, status: "pending", user: { name } }`, 400 for a used or expired code, and 429 after too many tries. |
| `/api/app/pair/status` | `GET` with the phone token | `{ status: "pending" }` until the person allows the phone on the web, then `{ status: "active", user }`. 401 once the pairing is denied or expired. |
| `/api/app/me` | `GET`, `DELETE` with the phone token | The signed-in account, and sign-out of the phone |

With maps on in Settings, the answers hold the positions for the maps of the app: the car on the Overview, the route of a drive, the legs of a trip with its start, stops, and end, the place of a charge, the places of the Places page with their weight, every road driven, and the routes of a report. With maps off, these fields are `null`, and the map panels say so. The map theme is a setting of `/api/app/settings`.

The lists of `drives`, `charges`, and `report` give their days in `sections`. Each day gives `title`, the date, and `total`, the parts of the day total in the units of the person, for example `["4 trips", "64 km"]` or `["+18.9 kWh"]`. The total of a report day counts only its rows, so a charge inside a trip does not add to the energy part. A server before this change omits `total`, and the app then shows only the date.

Each day section, each row of `drives`, `charges`, `report`, and `timeline`, and each step of `trips/{tripId}` gives `label`, the text that a screen reader says. It holds each value of the row in the visible order, with the units in full words, for example "17:41, 18 minutes, Home, from Office, 18 kilometers, 134 watt-hours per kilometer" or "Wed 21 Oct, 4 trips, 64 kilometers". `spokenLabel()` in `src/lib/app/spoken.ts` builds it from the visible texts. An older server leaves out `label`, and the app then joins the visible texts with their short units.

A drive gives `gpxPath`, and a report gives `exports`, each the path of an export of the section above. The app downloads them with its phone token and opens the share sheet of the phone.

`src/lib/app/contract.ts` defines every answer. A chart comes with its points in the user's units, the axis ticks, and the tooltip labels, so the app only draws it. The horizontal ticks keep a gap that fits a 390 pt phone. A chart can give a `caption`, which names its horizontal axis and the unit. A series can give a `dash` (`solid`, `dashed`, `dotted`, or `dashDot`) for its line. An older server omits both fields, and the app then draws solid lines and no caption. The shape follows the app and can change in any release, so scripts should use `summary.json` and the exports.

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

