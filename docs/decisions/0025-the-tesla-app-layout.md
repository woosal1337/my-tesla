# 0025: The Tesla app layout in the mobile app

Date: 2026-10-22

Status: Accepted. Since [decision 0028](0028-the-car-fills-the-stage.md), the callouts have no lines. The server also sends the place of the car in the image. Since 2026-11-16, each value has one place on the Overview (point 7), and the switch "Last drive and charge" hides the summaries of the Drives and Charging rows ([decision 0032](0032-no-empty-or-repeated-values-on-the-detail-screens.md)).

## Context

The Overview of the mobile app was the web Overview in cards: the car image, the battery, a stat grid, the Live card, the lock history, Today, the tires, the map, and the last drive and charge, one under the other. Ege asked for the structure of Ian Zelbo's Tesla app concept: the car on a lit stage with callouts, the car name with a chevron, a row of quick actions, and a menu of rows with an icon, a title, and a one-line summary, which becomes a sidebar on a wide screen. The Tesla app itself stacks the car, the quick actions, and a list of sections on a phone, so the pattern is familiar to every owner.

## Decision

1. The Overview is `CarTitle`, `CarStage`, `QuickActions`, and a menu of `MenuRow`s, in that order on a phone. At 720 pt and wider, the title and the menu form a sidebar of 320 pt on the left and the stage sits on the right, as a sidebar does on an iPad.
2. The server builds the callouts and the menu in `GET /api/app/cars/{carId}/overview`: `callouts` with a side, a label, a value, and a tone, and `menu` with a key, a title, and a summary. The app maps each menu key to a route and an icon in one table, so a new key needs an app change and the server cannot send a route.
3. Three callouts at most. The server keeps them short, because the stage has no room for more at 390 pt.
   - Left: the battery level and the range. The callout has the charge tone during a charge and the warning tone at 20% or less. The value is always text, so the tone never carries the meaning alone.
   - Top: the lock and Sentry Mode, only with the MQTT feed. Without the feed the stage has two callouts, because the title already gives the age of the data.
   - Right: the power and the limit of a charge. Without a power and a limit, the charge port ("Plugged in") with the feed, else the odometer. The word "Charging" is never a value next to the state "Charging".
4. The menu rows open the other tabs and two new screens of the Overview stack (`/status` and `/location`): Status (the Live card, the lock history, Today, the tires, the car stats) and Location (the map and Open in Maps). The last drive and charge stay in the summaries of the Drives and Charging rows.
5. `CarStage` draws one radial glow under the car with `react-native-svg`. It is the only gradient in the app, as an exception to the style rule, because the car render has no ground of its own.
6. `MenuRow` is the shared row for the Overview menu, the sidebar, and the link rows of Drives, Charging, and Insights, so every tab uses the same row.
7. Each value has one place. The space on a phone is small, so each value must earn its place.

   | Fact | Its one place |
   |---|---|
   | State (Online, Charging, …), variant, age of the data | Title |
   | Battery level and range | Left callout |
   | Lock and Sentry Mode | Top callout (MQTT only) |
   | Charge power and limit, or the charge port, or the odometer | Right callout |
   | Last drive | Drives row |
   | Last charge, also an open charge | Charging row |
   | Cold battery, health, capacity | Battery row |
   | Distance and efficiency of the default period of the person | Stats row |
   | Openings, the charge port when it is not on the stage, climate, software, route | Status row |

   - A menu summary gives a fact of the screen that it opens and that the title and the callouts do not show. The Battery row has the same health and capacity as the hero of the Battery page. The Stats row has the default period of the person, because the Stats page has no calendar month.
   - A static description (Places, Location) and an empty summary (Settings) repeat nothing. A real fact for these rows is follow-up work.
   - A label is not a value. The callout label "Charging" can stand with the state "Charging" in the title.
   - The Status row leaves out a live tile that the stage shows (the lock, the charge when the right callout shows it) and a tile with the same title as the state ("Driving").
   - The car switcher shows the battery and the state of each other car. The app reads the Overview answer of each other car when the list opens, so the API needs no new field.

## Alternatives

1. A sidebar on the phone too, as a drawer. The tabs already hold the sections, and a drawer hides them behind a gesture.
2. A sixth tab for Status. Five is the limit of the native tab bars, and Status is a detail of the Overview.
3. Callouts drawn at the parts of the car (frunk, trunk, charge port). The compositor image has no fixed anchor points across models and angles, so the lines would miss.
4. A gradient library (`expo-linear-gradient`). SVG is already bundled for the charts and draws the radial glow.

## Consequences

- `research/mobile-ui.md` records the rows, the callouts, the glow, the quick actions, and the car switcher with their sources.
- The Overview answer of the app API carries two more fields, and an older server without them fails the shape check with the "server is too old" message.
- The Settings for the Overview cards still hide the parts they name: the car image, the Live card, Today, the tires, and the location. The switch "Last drive and charge" changed no app screen until 2026-11-16. Since then, it hides the summaries of the Drives and Charging rows.
- The Overview route runs two more queries on each request: the capacity history and the drive totals of the default period. Measure the 30 s poll on a large database if it becomes slow.
- The open car switcher reads the Overview answer of each other car. This works with every released server, adds no query to the poll of the shown car, and fills the cache, so the chosen car shows at once.
