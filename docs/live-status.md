# Live status

TeslaMate can send the current state of each car to an MQTT broker. My Tesla reads that feed and shows a Live card on the Overview. The feed is optional. Without it, the Live card does not show, and the rest of the app works the same.

## What the Live card shows

| Tile | Values |
|---|---|
| Lock | Locked or unlocked, Sentry Mode, someone inside |
| Openings | All closed, or each open door, window, trunk, frunk, and the sunroof |
| Charging | Plugged in, charging state, power, the limit, the time left, a scheduled start |
| Climate | Climate on or off, preconditioning, Dog Mode, Camp Mode, cabin temperature |
| Software | Up to date, download progress, update ready, install progress |
| Driving | Gear, speed, and power, while the car is in D, R, or N |
| Navigation | Destination, time and distance to arrival, battery at arrival, traffic delay |

The card also shows a notice for a tire pressure warning, for Service Mode, and for a TeslaMate logger problem. While the feed is connected, the header status and the tire pressure card on the Overview use the live values. MQTT gives the tire pressure to 0.025 bar. The database keeps only 0.1 bar.

TeslaMate keeps most of these values only in MQTT. They are not in the database.

### End of a charge

While the car charges, the app shows the time left until the charge limit, such as "2 h 10 min left", in three places:

1. On the Overview, in green next to the battery level. The caption under the bar names the limit.
2. In large green text on the page of the charge in progress. This page updates by itself while the charge runs.
3. In the Charging tile of the Live card.

The value comes from `time_to_full_charge`, the estimate that the car calculates. The Tesla app shows the same estimate. The server records the time at which each value arrives, so the end does not move when another value changes. The browser counts the time left down every 15 seconds. `summary.json` gives the end time as `live.charging.fullAt`.

## How it works

1. TeslaMate publishes each change to a topic such as `teslamate/cars/1/locked`. The broker keeps the last value of each topic.
2. The My Tesla server subscribes with a broker user that can only read. It keeps the last values in memory. It never publishes.
3. When a value changes, the server sends a signal to the open Overview through `/api/cars/<id>/live`, a server-sent event stream. The page then renders again on the server, at most one time in 2 seconds.
4. The app keeps no history of these values. A restart of the server clears the memory, and the broker sends the last values again.

[Decision 0008](decisions/0008-mqtt-live-status.md) explains the design.

## Set up the broker

These steps add Mosquitto to the Docker Compose file of TeslaMate. Use two broker users: `teslamate` can write, and `mytesla` can only read.

1. Make a folder `mosquitto` next to the Compose file.
2. Write `mosquitto/mosquitto.conf`:

   ```text
   listener 1883
   allow_anonymous false
   password_file /mosquitto/config/passwd
   acl_file /mosquitto/config/acl
   persistence true
   persistence_location /mosquitto/data/
   ```

3. Write `mosquitto/acl`:

   ```text
   user teslamate
   topic readwrite teslamate/#

   user mytesla
   topic read teslamate/#
   ```

4. Make the two users. Each command asks for a password.

   ```bash
   docker run --rm -it -v "$PWD/mosquitto:/mosquitto/config" eclipse-mosquitto:2.0.22 mosquitto_passwd -c /mosquitto/config/passwd teslamate
   docker run --rm -it -v "$PWD/mosquitto:/mosquitto/config" eclipse-mosquitto:2.0.22 mosquitto_passwd /mosquitto/config/passwd mytesla
   ```

5. Add the broker to the Compose file. Do not publish its port.

   ```yaml
   services:
     mosquitto:
       image: eclipse-mosquitto:2.0.22
       restart: always
       volumes:
         - ./mosquitto:/mosquitto/config
         - mosquitto-data:/mosquitto/data

   volumes:
     mosquitto-data:
   ```

6. Turn on MQTT in the TeslaMate service:

   ```yaml
   environment:
     DISABLE_MQTT: "false"
     MQTT_HOST: mosquitto
     MQTT_USERNAME: teslamate
     MQTT_PASSWORD: <the teslamate password>
   ```

7. Start the stack with `docker compose up -d`. The TeslaMate log shows "MQTT connection has been established".

## Connect My Tesla

Set these variables on the My Tesla service:

```yaml
environment:
  MQTT_URL: mqtt://mosquitto:1883
  MQTT_USERNAME: mytesla
  MQTT_PASSWORD: <the mytesla password>
```

If you set `MQTT_NAMESPACE` in TeslaMate, set the same value in My Tesla. Restart My Tesla. The Live card shows "Connected" in its header.

## Security

- Keep the broker on the internal Docker network. The messages hold the car position, the lock state, and the navigation destination.
- Give My Tesla only the read-only user. The broker then drops any message that the user tries to send.
- The stream route sends only a change signal with a time. It sends no car values. The values reach the browser only in the rendered page, behind your authenticating proxy.

## Troubleshooting

| What you see | Cause and fix |
|---|---|
| No Live card | `MQTT_URL` is empty, or Settings, Overview, Live status is off. |
| "Offline" in the card header | My Tesla cannot reach or log in to the broker. The server log shows a line that starts with `MQTT:`. Check the host, the user, and the password. |
| "No live values yet" | The broker has no values for this car. TeslaMate sends them when the car is online. Check that TeslaMate has `DISABLE_MQTT=false`. |
| The page does not update by itself | A proxy holds back the event stream. Turn off response buffering for `/api/cars/*/live`. |
