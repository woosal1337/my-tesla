# 0008: Live status from the TeslaMate MQTT feed

Date: 2026-10-01

Status: Accepted.

## Context

TeslaMate publishes 78 topics for each car to an MQTT broker. About 45 of them never reach the database: the lock state, Sentry Mode, doors and windows, the charge limit, the time to full, navigation, software update progress, and tire warnings. The owner asked to show them. The app must stay read-only, and the browser must never get broker access.

## Decision

1. The feed is optional. `MQTT_URL` turns it on. `MQTT_USERNAME`, `MQTT_PASSWORD`, and `MQTT_NAMESPACE` complete it.
2. The app uses a broker user that can only read `teslamate/#`. The broker ACL enforces this. The code has no publish call.
3. Each server process opens one MQTT connection with MQTT.js, stored on `globalThis`, so a development reload does not open a second one. It keeps the last value of each topic in memory and no history.
4. TeslaMate keeps the last value of each topic on the broker. The first request waits up to 1.5 seconds for these values, so the first page shows the current state.
5. `src/lib/live/` holds pure modules for the topic names, the value map, the view, and the settings, with tests. `subscriber.ts` is the only module with I/O.
6. A value change reaches the open Overview through a server-sent event stream. The stream sends only a change signal. The page then calls `router.refresh()`, at most one time in 2 seconds, so the server formats every value with the user's Settings as before.
7. While the feed is connected, the live state sets the header status, and the live tire pressure replaces the rounded database value.
8. In demo mode, fixed demo values feed the card, and the stream route answers 204.

## Alternatives

1. A browser connection to the broker over WebSocket. It needs a public broker and gives the broker password to the browser.
2. A store for the MQTT values, for a history of locks and Sentry Mode. The app must not write to the TeslaMate database, so this needs a second database. Add it only for a concrete need.
3. Only the 30-second page refresh. A change then shows up to 30 seconds late.

## Consequences

A self-hosted install needs one more service for the Live card: a broker. Each server instance holds one broker connection. A proxy in front of the app must not buffer `/api/cars/*/live`. [Live status](../live-status.md) gives the setup.
