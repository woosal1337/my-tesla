# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- A drives or charges CSV with only `from` exports everything since that day. The missing end became a date that PostgreSQL refuses, so the export failed with an error.
- The cost bars of Stats and of the year in review leave out sessions that added no energy, as the cost total above them does. A plug-in with a fee and no energy counted in the bars and not in the total, so the two disagreed.
- Energy and consumption follow the preferred range of TeslaMate, also when the range setting of the app differs. TeslaMate derives the car efficiency from its preferred range, so energy from the other range was off by the gap between rated and ideal range on drives, trips, Stats, frequent routes, and the parked drain. The range values on the screen still follow the setting.

## [2.3.0] - 2026-11-17

### Added

- The day headings of Drives, Charging, and the Report show the total of the day, on the web and in the mobile app: the trip count and the distance, and the energy added, for example "Wed 21 Oct · 4 trips · 64 km". `GET /api/app/cars/{carId}/drives`, `charges`, and `report` give `total` for each day. The app needs this server version for the total, and shows only the date with an older server.
- The hour strip has a key on the web and in the mobile app: Driving, Charging, Awake, Asleep, Offline, and "Now" on today. The key shows on the Timeline, on the Today card of the web car page, and on the Today panel of Status in the app. `GET /api/app/cars/{carId}/timeline` gives `strip.legend`, and `overview` gives `today.legend`. With an older server, the app shows no key.
- A day without a drive and a charge links to the last day with one, on the web Timeline and in the app. It shows only the share of sleep, not a row of zeros. The Timeline still opens on today. `GET /api/app/cars/{carId}/timeline` gives `lastActive`. With an older server, the app shows no link. [Decision 0034](docs/decisions/0034-the-timeline-opens-on-today-and-links-a-quiet-day.md) gives the reasons.

- The Location screen of the mobile app shows the place name or the address of a parked car and since when it is there, for example "Office" and "Parked since today at 16:25 · 1 h 35 min". The place is the end of the last drive, in the place style of the Settings. The Location row of the Overview shows the place. Location shows the age of the position with the same text as the Overview title, and its map is taller. `GET /api/app/cars/{carId}/overview` gives `location.place` and `location.since`. With an older server, the app shows no place. [Decision 0037](docs/decisions/0037-the-place-of-a-parked-car-and-a-map-cover.md) gives the reasons.

### Changed

- The mobile app keeps the content of a wide screen in a column of 672 pt in the middle, on an iPad in portrait and in landscape. Before, every screen except the Overview stretched the phone layout to the full width, and on an iPad Pro 11 a row of Drives was 1170 pt wide in landscape. The maps stay edge to edge, and the Overview keeps its sidebar. A phone does not change. This works with any server. [Decision 0043](docs/decisions/0043-a-readable-column-on-wide-screens.md)
- The Connect screen of the mobile app continues the launch splash. The T-mark stays at the center of the screen, where the splash draws it, and the title and the sign-in sentence sit under it. "Scan the code" and "Open the demo" sit at the bottom, in the lower half of the screen, with one sentence about the web under them. Before, all content sat in the top third, and the mark disappeared when the splash faded. A pairing link and the wait for the web show their panel alone, at the center. [Decision 0041](docs/decisions/0041-connect-continues-the-launch-mark.md) gives the reasons.
- The Live card says "Feed connected" or "Feed offline", on the web and in the mobile app. Before, it said "Connected" or "Offline", and "Offline" read as the state of the car. The demo now parks one day in seven offline, so the Timeline shows offline time.
- The Timeline of the mobile app steps the days in one row: the date, "Today" on an earlier day, and a chevron for the day before and the day after. A swipe to the right opens the day before, and a swipe to the left opens the day after. The back swipe of the Timeline starts at the left edge only. The navigation bar shows "Timeline".
- The mobile app shows the actions of a long screen at the top, as the web does. A charge has two chevrons at the right of its first row that open the older and the newer charge. A drive shows "Share GPX" under the trip line. The Report shows "Share Drives CSV" and "Share Charges CSV" under the totals, and turns them off while the next range loads. Before, these buttons came after all the charts or after up to 50 rows. On the newest charge, the off "Newer charge" chevron has no fill and a gray icon. A button that is off now has 38% opacity, and a pressed button keeps 60%. Before, both had 60%. [Decision 0036](docs/decisions/0036-actions-above-the-content-of-a-long-screen.md) gives the reasons.
- Without a saved currency, the web and the mobile app show costs in the currency of the country where the cars charged most often, for example "$59.93 spent". The demo shows US dollars. A saved currency stays, also "No symbol". A country without a listed currency keeps "No symbol".
- The Overview of the mobile app shows each value once. The title shows the state without the battery, the left callout shows the battery and the range, and the top callout shows the lock only with the MQTT feed. The right callout shows a charge only with its power or limit. The Battery row shows the health and the capacity, and the Stats row shows the distance and the efficiency of the default period. The Status row leaves out the values on the stage. The rows of the car switcher show the battery and the state of each car. `GET /api/app/cars/{carId}/overview` reads the capacity history and the drive totals for these summaries.
- The Places row of the Overview in the mobile app shows the count of the visited places in the default period, for example "12 places, last 30 days". This is the same count as the stat "Places" on the Places page. Before, the row showed "Visited and charging places". The app needs this server version for the count, and needs no update.
- The Settings tab of the mobile app names its last groups after the screens that they change. "Insights" holds "Default period", "Overview" holds "Car image" and "Last drive and charge", and "Status and Location" holds "Live status", "Today", "Tires", and "Location". Before, one group "Overview" held all seven, and most of them changed Status or Location. The hint of "Default period" names Charging insights too, on the web and in the app. The app needs this server version, and needs no update.
- A panel that does not follow the period names its own range in its title, on the web and in the mobile app. Charging insights shows "Charging time, last 2 years" in place of a small note on the right, and Stats shows "Software, last 12 updates". The Report keeps its four calendar ranges, and [decision 0033](docs/decisions/0033-a-panel-names-its-own-range.md) gives the reason. The app needs this server version, and needs no update.
- The Fastest and Slowest links of Frequent routes in the mobile app have a 48 pt touch target. They are underlined text in the secondary tone, not blue. Before, each link was about 16 pt high.
- A value of the mobile app that has an explanation, such as the battery health or a tire pressure, shows an info symbol after its label. A press opens the explanation. Before, nothing showed that the value can be pressed. This works with any server.

### Fixed

- In the light theme of the web and the mobile app, the green, amber, and red text has a contrast of at least 4.5:1 on the page and on the card. Before, a green value had 2.62:1 and an amber value 1.96:1 on a light card. The bars, the strips, the map markers, and the chart lines in these colors are darker in light too. The dark theme does not change. The app needs a new build for the colors, and works with any server. [Decision 0044](docs/decisions/0044-light-tones-with-text-contrast.md) gives the new colors and the ratios.
- The Status row of the Overview in the mobile app names no live value when "Live status" is off. Before, the row still showed, for example, "All closed · Climate off". The fix is on the server, so the app needs no update.
- The Overview of the mobile app shows no Location row when the Overview card "Location" is off or the maps are hidden. Before, the row stayed and opened the empty screen "No map". The fix is on the server, so the app needs no update.
- Charging insights on the web and the Charging tab of the mobile app answer fast again. The charging time query looked up the charger type once for each charge sample. On a database with 31 charges it took 4.8 s, and it grew with each charge. It now takes 0.05 s and returns the same values. The app needs this server version, and needs no update.
- Every screen of the mobile app works at the large and the accessibility text sizes. From the text size XXXL, a row of Drives, Charging, and the Report shows the time on one line, then the title, then the values, so no clock and no place name breaks inside a word. The figures stand in one column, the quick actions in two, and panel notes, stat labels, and stat details wrap in full. Text stops growing at 2 times its size, and the labels of a segmented control and of the hour strip at 1.2 times. Icons grow with the text, and the value axes of a chart grow with their labels, so a tick such as "100%" is not cut. Before, at the largest size, the time broke one character on each line, labels showed "Dista…", and the fourth quick action was off the screen. [Decision 0042](docs/decisions/0042-large-text-layout.md). This works with any server.
- The mobile app shows the Connect screen after a person deletes it and installs it again. Before, iOS kept the server address and the phone token in the Keychain, and the new install opened the car at once. At the first start of a new install, the app now deletes the server address, the phone token, the chosen car, and the alert choices of the earlier install. An app update keeps the connection. The old token stays valid on the server until **Account** on the web signs the phone out, or for 90 days after its last use, so sign out in the Settings tab before you delete the app. This works with any server. [Decision 0040](docs/decisions/0040-a-new-install-starts-signed-out.md) gives the reasons.
- The screen reader labels of the rows of Drives, Charging, the Report, the Timeline, and a trip say each value in full words, for example "17:41, 18 minutes, Home, from Office, 18 kilometers, 134 watt-hours per kilometer". Before, a drive or charge row left out the duration, and the labels said "km" and "Wh/km". A day heading is one element with the heading role, and says its total in full words. `GET /api/app/cars/{carId}/drives`, `charges`, `report`, `timeline`, and `trips/{tripId}` give `label` for each row and each day. With an older server, the app says the duration and keeps the short units. [Decision 0039](docs/decisions/0039-screen-reader-labels-from-the-server.md) gives the reasons.
- Drives and Charging in the mobile app show a notice above the list when a refresh fails, and keep the old rows. Before, a failed refresh showed nothing. This works with any server.
- The maps of the mobile app no longer show a black box while they load. Each map shows the card color with the breathing T-mark until its tiles load, and then fades in. A map that does not load says so. This applies to Location, a charge, a drive, a trip, the Report routes, and Places, with any server.
- The explanation of the battery health uses the digits of the value, on the web and in the mobile app, for example "keeps 99.4%" and "About 99.6% at 4,120 km". Before, it said "99%" and "About 100%" next to "99.4%". A health within 1 point under the average now says "At average". The app needs this server version, and needs no update.
- Place names show above the route line of a drive, a trip, and the Report, on the web and in the mobile app. Before, the line covered the names of the cities on its way. The map of every road driven in the app does the same. The web keeps that map as it was.
- Offline time is amber on the hour strip and in its key, on the web Timeline, on the Today card of the car page, and on the Timeline and the Today panel of Status in the mobile app. Before, it had a faint gray that looked like a day without data. The app shows amber with any server. The day totals show "Offline 74%" when the car was offline longer than asleep, and "Asleep" otherwise. The detail names the other share when it is 1% or more, for example "of the recorded time · offline 30%". Before, a day offline showed "Asleep 0%". The app needs this server version for the new stat. [Decision 0035](docs/decisions/0035-offline-time-on-the-hour-strip.md) gives the reasons.
- A drive page shows a small recovered or used energy in watt-hours, for example "45 Wh", on the web and in the mobile app. Before, a drive with "Regen up to 5 kW" showed "0.0 kWh" recovered. A regen sample between two samples of positive power now counts as recovered energy. The app needs this server version, and needs no update.
- The charts read more clearly on the web and in the mobile app. The count axis of Battery "Charge start and end levels" shows only whole numbers, and the labels under its bars have equal gaps: 0%, 20%, 40%, 60%, and 80%. A month label shows the full year, for example "Aug 2026", so it does not read as 26 August. The horizontal axis of "Efficiency and temperature" in Stats and of "By outside temperature" in Battery shows the unit, for example "25 °C". The current of a charge is a blue line, so it does not look like a grid line. The "Usable" line of Battery has the same amber in the app as on the web. The app needs this server version, and needs no update.
- The bars of "By temperature" and "By speed" in Stats show the share of the distance and the share of the driving time, on the web and in the mobile app. Before, they showed the consumption, and the row text and the note gave the share. "By temperature" has the new note "Share of distance". The row text stays the same. The app needs this server version, and needs no update.
- A tire with a slow-leak warning shows in the amber warning tone on the Overview, on the web and in the mobile app. Before, it showed in green next to the warning. A tire with a red pressure stays red. The explanation of the tire gives the leak. The app needs this server version, and an older app shows the value in the default color.
- The time range of a Timeline row in the mobile app shows on one line above the title, as on the web at phone width. Before, a 12-hour range such as "11:06 AM – 11:58 AM" broke onto two lines on a 390 pt phone, and the title had less room.
- A duration of 10 hours or more and a 12-hour clock stay on one line in the rows of Drives, Charging, and the Report. The time column is now 76 pt wide.
- Long place names and summaries show in full in the rows of Drives, the Timeline, the Overview menu, Charging, and the record lists of Insights. The text wraps onto more lines. The summary line of Drives and Charging breaks only between its parts.
- A wrapped line in the mobile app keeps a number with its word, such as "1 stop" or "20 km", and starts a new line before the separator "·", not after it. The AC or DC badge of a charge stays on the first line of a long place name. This works with any server version.
- The day heading of Drives, Charging, and the Report stays below the navigation bar while the list scrolls. Before, it stuck behind the bar and the status bar. The day headings of the Report now stick too.
- The car on the Overview of the mobile app spans the width of the screen inside the margins. Before, it covered about half of it. `GET /api/app/cars/{carId}/overview` gives `car.imageFrame`, the part of the image that the car fills. With an older server, the app shows the whole image as before. The callouts keep the 20 pt screen margin and have no lines that point at nothing. Their labels have more contrast, and their values wrap at a large text size. The T-mark shows until the image loads, and the glow under the car shows in dark and in light. On an iPad, the car sits in the middle of the right pane.
- The Overview of the mobile app no longer scrolls under the status bar, on a phone and on an iPad. A strip in the page background covers the status bar, in dark and in light.
- On an iPad, the car name of the Overview stays below the tab bar after a return from Status or Location.
- A press on the active tab of Drives, Charging, Insights, or Settings scrolls the page to the top with the large title at its full size. Before, the title stayed small.
- The charts of the mobile app are easier to read. The labels under a chart keep a gap and no longer touch, for example the dates of Battery "Capacity" and the months of a year. A value axis fits its values more closely, so the line of "Elevation" and "Odometer" fills most of the chart, and each tick of the axis has its own label. The two charts of Battery "Projected range" have a caption that names the axis and the unit, "By outside temperature (°C)" and "By battery level (%)". The lines of "Tire pressure" and of the DC charging curves have different styles, so a line that lies on top of another no longer hides it, and the legend shows the styles. The heatmaps "When the car drives" and "When the car charges" have a key for the shades. The tick labels stop growing at a large text size, so they are not cut. The app needs this server version for the captions and the line styles, and draws solid lines without a caption with an older server.
- Two DC charges on the same day have different names in the legend of Charging insights, on the web and in the mobile app, for example "8 Nov 09:12" and "8 Nov 17:40". The second chart of Battery "Projected range" on the web has the heading "By battery level (%)".
- The detail screens of the mobile app leave out a value that is only "—". A trip without a charge no longer shows "Charging cost —", and a drive without a power record no longer shows "Peak power —". The same applies to a charge, the Report totals, the car figures of Status, and Charging insights. A "—" stays where a detail gives the reason, such as "Set a price in Settings on the web". The app needs this server version, and needs no update.
- The "Charging time" table of Charging insights in the mobile app shows "No record" for a leg without full records, as the web does. Before, it showed "—" two times. The app needs this server version, and needs no update.
- A charge shows the source of its cost one time, under the amount, on the web and in the mobile app. The panel below is now "Cost breakdown". An older app with this server shows the source one time, and keeps the panel title "Cost".
- "Climate on" and "Climate off" show under the cabin temperature, on the web Overview and on Status in the mobile app. Before, they showed under the outside temperature. The app needs this server version, and needs no update.
- The Report of the mobile app draws a charge as the Charging list does: the AC or DC badge, the levels, the level bar, the energy, and the cost. Before, it drew a full green strip. This needs the new app and this server version. Every other app and server pair draws the old row.
- The Overview card "Last drive and charge" in Settings hides the summaries of the Drives and Charging rows of the mobile app. Before, it changed nothing in the app. `GET /api/app/cars/{carId}/overview` no longer gives `lastDrive` and `lastCharge`, which no app screen read. The app needs this server version, and needs no update.

## [2.2.2] - 2026-10-24

### Fixed

- Drives opens fast on a large database. PostgreSQL compiled the drive list with JIT on every request, and on a database with 2,244 drives the compilation took 1,174 ms of the 1,189 ms of the query. Every session now turns JIT off, and the query takes 3 ms.
- The Overview, the start page, and Battery no longer read every position of the car to find the newest one. TeslaMate has no plain index on the car and the date of a position, so each of these lookups read all 4.26 million positions of a large database, in 0.5 s to 1 s. They now take a few milliseconds.
- The capacity history of Battery reads the last charge of each session through the index of the session. The database walked the date index of all charges for each session, which took 885 ms for 115 sessions, and now takes 19 ms.

## [2.2.1] - 2026-10-22

### Fixed

- A row of the Overview menu opens its tab on the first screen. Before, with a detail screen open in that tab, the row stacked a second copy of the tab above it, with a back button to the detail. The Battery, Stats, and Places rows pass the kind to Insights without a route parameter for the same reason.
- The quick actions Timeline, Report, and Year open their screen once. A second press no longer stacks a second copy.
- A callout above the car keeps its width when the car name is long, and the link rows of Drives, Charging, and Insights line up with the panels.

## [2.2.0] - 2026-10-22

### Changed

- The Overview of the mobile app follows the Tesla app: the car on a lit stage with callouts for the battery and range, the lock and Sentry Mode, and the charge; the car name with a chevron that switches the car; a row of quick actions (Timeline, Report, Year, Maps); and a menu of rows with a one-line summary each, which open Drives, Charging, Battery, Stats, Places, Location, Status, and Settings. On a wide screen the menu is a sidebar beside the car. The Live card, the lock history, Today, the tires, and the car stats moved to the Status screen, and the map to the Location screen. The link rows of Drives, Charging, and Insights share the same menu row with an icon. `GET /api/app/cars/{carId}/overview` gains `callouts` and `menu`.

## [2.1.0] - 2026-10-22

### Added

- The calendar link can show drives and charges, drives only, or charges only. Settings, **Calendar**, has the choice, and the link keeps it as `show=`.

## [2.0.2] - 2026-10-21

### Fixed

- **Show fewer** under the lock history sits below the full list, not between the first rows and the rest.

## [2.0.1] - 2026-10-21

### Changed

- The Overview shows the last 5 lock and Sentry Mode changes, with a button under them that shows the rest of the last 7 days, up to 50, on the web and in the app.
- The invite link, the script token, and the calendar link show in a field with a copy button.

## [2.0.0] - 2026-10-21

### Added

- Accounts in the app itself. A new install prints a one-time setup link in its log, and the first account is the admin. Every page and API call then needs a sign-in. Passwords use Argon2id, sessions last 30 days, sign-in is rate limited, and **Account** lists every browser, phone, and script token with a sign-out button. Read [Accounts and sign-in](docs/authentication.md) and [decision 0023](docs/decisions/0023-native-accounts.md).
- Tokens for scripts in **Account**, for the API without Cloudflare Access.
- Phone pairing: the QR code in Settings holds a single-use code that changes every minute, and the web page asks to allow the phone before it signs in.
- Invites: the admin makes a link for one email under **Account**, **People**. It works once, for 3 days, and makes a member account. The admin can revoke an invite and remove a member, which signs the member out on every browser and phone at once.
- `docker exec my-tesla node reset-password.mjs EMAIL` prints a one-time link that resets the password of one account within 30 minutes, without email, and signs out its sessions.

- A mobile app for iOS and Android in `mobile/`, built with Expo SDK 58. It pairs with a My Tesla server from the QR code in Settings and shows the Overview, the trips and drives, the charges, and the Battery, Stats, and Places insights of each car in the style of the dashboard, with charts. It uses the units and formats from Settings. Read [Mobile app](docs/mobile.md).
- Push alerts for the mobile app: charging started, complete, or stopped, a car left unlocked for 10 minutes, a software update, and a tire warning. They need the MQTT feed. Each phone chooses its alerts. [Decision 0020](docs/decisions/0020-mobile-app-and-push-alerts.md) explains the design, and [Privacy](docs/privacy.md) lists what the alerts send.
- The launch animation of the web in the mobile app: the T-mark draws itself and fades into the app. While a screen loads, the mark breathes as on the web, instead of a spinner.
- Maps in the mobile app, drawn with MapLibre and the CARTO styles of the web: the car on the Overview, the route of a drive, a trip with its stops, the place of a charge, and the Places map. Map theme in the app Settings changes them. [Decision 0022](docs/decisions/0022-maps-in-the-mobile-app.md) explains the choice.
- A Settings tab in the mobile app. It changes the same Settings as the web, and the phone keeps the last Settings. The app starts in dark mode, and Settings has a theme choice for the phone.
- `GET /api/cars.json` lists the cars, `/api/push` registers a phone for alerts, `/api/app/cars/{carId}/` gives the app its screens, formatted for the user, and `/api/app/settings` reads and changes the Settings. Read [API](docs/api.md).

- `GET /api/cars/{carId}/calendar.ics`, a calendar feed of the drives and charges of the last year. Settings, **Calendar**, makes a private link for a calendar app, and Account can revoke it.
- A history of locks and Sentry Mode from the MQTT feed, in `history.sqlite`. The Overview shows the changes of the last 7 days. Read [decision 0024](docs/decisions/0024-lock-and-sentry-history.md).
- A year in review page under Stats: the totals, the distance per month, the records, and the top places of one calendar year, with a picker for each year that has data.
- Places shows the countries, states, and cities visited, and a map of every road driven over all records.
- Long-term trends: the charge level over time, time online, asleep, and offline, and the projected range at 100 % by outside temperature and by battery level on Battery, and the odometer over time on Stats.
- The car image of the Model S, Model X, and Cybertruck, and more of the wheel names and colors that TeslaMate reports. The model year in the VIN rules out a car generation that was not built that year. `research/car-images.md` lists each combination.
- `CARTO_BASEMAPS_KEY` adds a CARTO basemaps key to every map request of the web and the mobile app, ahead of the key rule that CARTO brings to vector maps.
- The charge page shows the cable type and whether the battery heater ran.
- The mobile app has the Timeline, the Report with CSV exports, Charging insights, and the year in review, shares a drive as GPX, and shows the lock history, the long-term trends, the visited areas, and the map of every road driven, as the web does.
- The mobile app refreshes the Overview and a charge within seconds of a change in the car, through the live change stream, and opens the pairing code from the camera app of the phone.
- Battery advice under the charge levels: a weekly full charge for an LFP battery, as Tesla recommends, and a daily limit of 80 to 90% for other cells, with the charges of the period.

### Changed

- Charges without a TeslaMate cost follow the rules of TeslaMate before the price in Settings: free Supercharging costs 0, and a geofence price per minute or per kWh, with its session fee, gives the cost. The charge page names the rule and shows the price of the place.
- **Breaking:** the app no longer reads the user from a proxy header. `IDENTITY_HEADER` is gone, and the Settings stay under the email of the account that signs in. Scripts that used a Cloudflare Access service token need a token from **Account**, and paired phones pair again.
- With `MQTT_URL` set, the server connects to the broker when it starts, not at the first page.

### Fixed

- A drive page said "1 points used". It now says "1 point used".

## [1.9.0] - 2026-10-14

### Added

- A page for each trip at `/cars/{car}/drives/trip/{tripId}`: the route of all legs on one map with the stops, the total, driving, and stopped time, the consumption, the battery at the start and at the end, the energy and the cost of the charges on the way, the average speed, and the list of legs and stops.

### Changed

- Report at `/cars/{car}/drives/trip`, before called Trip: the list now shows trips, not single drives. A trip joins the drives of one journey: a stop of up to 30 minutes keeps the trip together, and so does a stop of up to 2 hours with a charge in it. This is the rule of the trip tools in teslamate-mcp. A stop under 2 minutes is a pause: the drives around it show as one leg, and a drive under 50 m does not show. A charge during a stop belongs to its trip, and the other charges stay in the list. The newest day comes first. [Decision 0017](docs/decisions/0017-trips-from-drives.md) explains the rule.
- Drives lists the trips of the last 50 drives, not the single drives. A row shows where the trip ends and starts, the stops, the distance, and the consumption. Under a trip with stops, a bar shows the drives, the stops, and the charging stops in time order. A trip of one drive opens the drive page. Any other trip opens its trip page, and the trip page goes back to Drives. [Decision 0019](docs/decisions/0019-drives-list-trips.md) explains the choice.

### Fixed

- Overview: many cars showed no car image. The image now shows for a 2017-2023 Model 3, for the wheel names of a 2024 Model 3 such as `Photon18` and `Helix19`, for a 2020-2024 Model Y in Quicksilver, Stealth Grey, Ultra Red, or Midnight Cherry Red, for the Model Y wheels `Apollo19`, `Apollo19MetallicShadow`, and `Photon18`, for the colors `BlackDiamond`, Glacier Blue, and Marine Blue, and for a wheel name with an ending such as `Pinwheel18CapKit`. A car with an unknown wheel shows its usual wheels when the color fits one generation.
- Drives, a drive page, the drives CSV, and Report: a drive that TeslaMate left open was missing. This happens when TeslaMate restarts during a drive. The app now fills such a drive from its positions, so a trip no longer splits at it. The drive page shows a note. [Decision 0018](docs/decisions/0018-drives-left-open.md) explains the rule.

## [1.8.0] - 2026-10-13

### Changed

- The address names the car, such as `/cars/red-rocket/drives`, instead of its TeslaMate id. An id link, such as `/cars/2`, still opens the same car, and the browser then shows the name in the address. The API keeps the id. [Decision 0016](docs/decisions/0016-car-names-in-urls.md) explains the rules for the name.
- Drives, Charging, and Trip: the day heading stays under the header while you scroll a long list, and it lines up with the rows. On a phone, the rows use less side space, so a place name shows more of its letters.
- Drives and Charging: a car without a record shows "No drives yet" or "No charges yet", with a short explanation.
- The AC and DC label looks the same on every page.
- Battery, Stats, and a charge page: the chart titles name their unit, like the other charts.
- Every control shows a clear 2 px focus ring when you move with the keyboard.

### Fixed

- Drives and Charging: the summary under the title and the levels of a charge broke inside a value on a phone, such as "1,105" and "km" on two lines. A line now breaks only between values.
- Charging insights: "1 sessions" now reads "1 session".
- Battery: the headers of the idle drain table sat 16 px right of their numbers.
- Battery: "1 sessions" now reads "1 session".
- Settings: the Default period choice put "All" on a second line on a phone.
- Settings: a screen reader now announces "Saving", "Saved", and "Not saved".

## [1.7.0] - 2026-10-12

### Added

- Charging insights: a Charging time panel. It shows how long a charge takes from one battery level to another, for DC and for AC, with a typical and a slow time. The times come from the time that the charges of the last 2 years spent at each battery percent. [Decision 0014](docs/decisions/0014-charging-time.md) explains the rule.
- Places: a Frequent routes panel. It groups the drives of the period by start and end place, and it shows the number of drives, the typical distance and duration, the consumption, the usual departure hour, and links to the fastest and the slowest drive. [Decision 0015](docs/decisions/0015-frequent-routes.md) explains what counts as a place.

## [1.6.1] - 2026-10-07

### Fixed

- Overview: a tire pressure in psi wrapped to two lines in Safari. A value with a tooltip now stays on one line.
- Stats, Trip, and a charge page: a long duration overlapped the next value or ran off the screen on a tablet. The large values now scale with the screen width.
- A duration of 100 hours or more shows whole hours, such as "126 h".

### Added

- `bun run check:layout`: a layout check in WebKit and Chrome at five widths. Read [Quality](docs/quality.md#layout-check).

## [1.6.0] - 2026-10-07

### Added

- Value colors: consumption, charging efficiency, AC voltage, battery health, parked drain, tire pressure, and a low battery show green when better than usual and red when worse or a problem. A tooltip on hover or tap gives the meaning of the value and the expected value. [Value colors](docs/value-colors.md) lists the rules and their sources.

## [1.5.3] - 2026-10-07

### Fixed

- Live card: the Software tile showed "Installing update 1%" after an update ended. The Tesla API keeps the install value at 1 when no update runs. The tile now shows an update only when TeslaMate reports one, and an install only above that idle value.

## [1.5.2] - 2026-10-06

### Fixed

- Overview: the time left of a charge sits on the same line and at the same height as the range. The icon has the height of the text.

## [1.5.1] - 2026-10-06

### Changed

- The time left of a charge is easier to find. The Overview shows it in green next to the battery level, and the page of the charge in progress shows it in large green text. The battery caption names the charge limit. The Live card and the charge page show only the time left, not the end clock time.

## [1.5.0] - 2026-10-06

### Added

- End of a charge: while the car charges, the Live card and the page of the charge in progress show when the charge reaches the limit and the time left. The value is the estimate of the car, the same as in the Tesla app, and the time left counts down in the browser. `summary.json` gives `live.charging.fullAt`.

## [1.4.0] - 2026-10-05

### Added

- Charging prices in Settings: a price per kWh and an optional fast charging price. Each completed charge without a TeslaMate cost gets the price times the energy from the charger.
- Charge page: a cost panel with the energy billed, the price per kWh, the cost per kWh in the battery, the charging losses, and the cost per 100 km of range and per 1 % of battery.
- Cost totals: the Charging page sums the cost of the listed charges, Stats has a charging cost chart, and the insights cards show the total cost of AC and DC charging. The CSV file has a `Cost source` column.

### Changed

- Battery page: Capacity now and Charge cycles show from the first long charge. Health names how many long charges it still needs, and their minimum size.
- Demo data: the Flagstaff Supercharger geofence has no price, so the demo shows the price setting.

### Fixed

- A charge that TeslaMate leaves open after a restart now ends at its last charge record. Its energy, levels, duration, and cost count in every total. Only the newest open charge shows as in progress.

## [1.3.0] - 2026-10-02

### Added

- Trip view at `/cars/{car}/drives/trip`: a date range with presets, the totals for distance, driving and charging time, energy, and cost, every route on one map with the charge stops, and a list of drives and charges. CSV buttons for the range.
- Charging insights at `/cars/{carId}/charging/insights`: sessions, energy, cost per kWh, and cost per 100 km for a period, AC and DC compared, the curves of the last six DC sessions, a heatmap of charge starts, and the top charging places.
- Stats: consumption by speed band, with the share of driving time in each band, in km/h or mph.
- Slow-leak warning: when one tire loses at least 0.1 bar against the median of the other three over the last 14 days, the Overview tire card and the Stats tire panel show a warning.
- Car summary: `GET /api/cars/{carId}/summary.json` gives the Overview values and the live MQTT values as JSON, in metric units. The position and the navigation come only with `?location=1`. [API](docs/api.md) explains how a script calls it with a Cloudflare Access service token.

### Changed

- Demo data: a second slow leak in the rear left tire in the last two weeks, and no fixed tire values in the demo live feed.

## [1.2.0] - 2026-10-02

### Added

- Drive page: speed and power, elevation, and battery charts along the drive, the energy recovered, the energy used, the regen peak, the climb, and the descent.
- GPX export of a drive: `GET /api/cars/{carId}/drives/{driveId}.gpx`, with a GPX button on the drive page.
- CSV export of drives and charges: `GET /api/cars/{carId}/drives.csv` and `charges.csv`, with optional `from` and `to` dates, in the user's units and time zone. CSV buttons on the Drives and Charging pages.

### Changed

- Demo data: the elevation follows Arizona, from about 340 m in Phoenix to about 2,100 m in Flagstaff.

## [1.1.0] - 2026-10-01

### Added

- Cloudflare Access token check: with `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`, the app verifies the signed Access token on every request. A path that skips Cloudflare gets 403, and the email comes from the token.

## [1.0.0] - 2026-10-01

### Added

- First public release of the dashboard, tested with TeslaMate 4.3.0.
- Pages: Overview, Drives with route maps, Charging with power curves, Timeline, Battery, Stats, Places, and Settings.
- Settings for units, date and time formats, number style, currency, place names, maps, theme, motion, tabs, and Overview cards, saved on the server for each user.
- A container image with a Next.js standalone server, a health check, and a settings volume.
- An image workflow for GitHub Container Registry on version tags.
- A demo database with 60 days of synthetic data for development.
- Demo mode (`DEMO_MODE=1`): a built-in PGlite demo database, a landing page, and Settings in a cookie for each visitor. The public demo runs at https://mytesla.chele.bi on Vercel.
- Live status from the optional TeslaMate MQTT feed: a Live card on the Overview with locks, Sentry Mode, openings, charging, climate, software updates, driving, and navigation, updated through server-sent events.
- Link previews and icons: a 1200 × 630 preview image, Open Graph and X card tags, a canonical link, JSON-LD, an iPhone icon, a favicon, a web app manifest, `robots.txt`, a sitemap, and `SITE_URL`.
- Demo analytics: with `OPEN_ANALYTICS_URL` and `OPEN_ANALYTICS_KEY`, demo mode loads Open Analytics and sends named events for the demo, install, repository, docs, navbar, and Settings actions. A normal install never loads it.
- A light and dark switch on the landing page. The demo starts in dark mode.
- Security headers on every response: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`. The `X-Powered-By` header is off.
- README screenshots of every page.
- Documentation for installation, the database role, authentication, configuration, privacy, upgrades, and troubleshooting.

[Unreleased]: https://github.com/woosal1337/my-tesla/compare/v2.3.0...HEAD
[2.3.0]: https://github.com/woosal1337/my-tesla/compare/v2.2.2...v2.3.0
[2.2.2]: https://github.com/woosal1337/my-tesla/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/woosal1337/my-tesla/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/woosal1337/my-tesla/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/woosal1337/my-tesla/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/woosal1337/my-tesla/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/woosal1337/my-tesla/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/woosal1337/my-tesla/compare/v1.9.0...v2.0.0
[1.9.0]: https://github.com/woosal1337/my-tesla/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/woosal1337/my-tesla/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/woosal1337/my-tesla/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/woosal1337/my-tesla/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/woosal1337/my-tesla/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/woosal1337/my-tesla/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/woosal1337/my-tesla/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/woosal1337/my-tesla/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/woosal1337/my-tesla/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/woosal1337/my-tesla/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/woosal1337/my-tesla/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/woosal1337/my-tesla/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/woosal1337/my-tesla/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/woosal1337/my-tesla/releases/tag/v1.0.0
