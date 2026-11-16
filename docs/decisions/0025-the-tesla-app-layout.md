# 0025: The Tesla app layout in the mobile app

Date: 2026-10-22

Status: Accepted. Since [decision 0028](0028-the-car-fills-the-stage.md), the callouts have no lines. The server also sends the place of the car in the image.

## Context

The Overview of the mobile app was the web Overview in cards: the car image, the battery, a stat grid, the Live card, the lock history, Today, the tires, the map, and the last drive and charge, one under the other. Ege asked for the structure of Ian Zelbo's Tesla app concept: the car on a lit stage with callouts, the car name with a chevron, a row of quick actions, and a menu of rows with an icon, a title, and a one-line summary, which becomes a sidebar on a wide screen. The Tesla app itself stacks the car, the quick actions, and a list of sections on a phone, so the pattern is familiar to every owner.

## Decision

1. The Overview is `CarTitle`, `CarStage`, `QuickActions`, and a menu of `MenuRow`s, in that order on a phone. At 720 pt and wider, the title and the menu form a sidebar of 320 pt on the left and the stage sits on the right, as a sidebar does on an iPad.
2. The server builds the callouts and the menu in `GET /api/app/cars/{carId}/overview`: `callouts` with a side, a label, a value, and a tone, and `menu` with a key, a title, and a summary. The app maps each menu key to a route and an icon in one table, so a new key needs an app change and the server cannot send a route.
3. Three callouts at most: the battery and range on the left; the lock and Sentry Mode on top, or the last seen time without the MQTT feed; the charge on the right, or the charge port, or the odometer. The server keeps them short, because the stage has no room for more at 390 pt.
4. The menu rows open the other tabs and two new screens of the Overview stack (`/status` and `/location`): Status (the Live card, the lock history, Today, the tires, the car stats) and Location (the map and Open in Maps). The last drive and charge stay in the summaries of the Drives and Charging rows.
5. `CarStage` draws one radial glow under the car with `react-native-svg`. It is the only gradient in the app, as an exception to the style rule, because the car render has no ground of its own.
6. `MenuRow` is the shared row for the Overview menu, the sidebar, and the link rows of Drives, Charging, and Insights, so every tab uses the same row.

## Alternatives

1. A sidebar on the phone too, as a drawer. The tabs already hold the sections, and a drawer hides them behind a gesture.
2. A sixth tab for Status. Five is the limit of the native tab bars, and Status is a detail of the Overview.
3. Callouts drawn at the parts of the car (frunk, trunk, charge port). The compositor image has no fixed anchor points across models and angles, so the lines would miss.
4. A gradient library (`expo-linear-gradient`). SVG is already bundled for the charts and draws the radial glow.

## Consequences

- `research/mobile-ui.md` records the rows, the callouts, the glow, the quick actions, and the car switcher with their sources.
- The Overview answer of the app API carries two more fields, and an older server without them fails the shape check with the "server is too old" message.
- The Settings for the Overview cards still hide the parts they name: the car image, the Live card, Today, the tires, the location, and the recent records.
