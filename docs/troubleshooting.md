# Troubleshooting

Start with the health route and the server log:

```bash
curl -s http://127.0.0.1:3000/api/health
docker compose logs --tail 100 dashboard
```

## The health route answers 503

The `detail` field gives the database error.

| Detail | Cause | Fix |
|---|---|---|
| `Set DATABASE_URL to the read-only TeslaMate role.` | The variable is empty. | Set `DATABASE_URL`. |
| `Use the read-only role in DATABASE_URL, not the privileged user "teslamate".` | The URL uses the TeslaMate superuser. | Create `teslamate_ro` and use it. Read [Connect to the TeslaMate database](teslamate-database.md). |
| `password authentication failed for user "teslamate_ro"` | Wrong password | Set the password again with `ALTER ROLE teslamate_ro PASSWORD '...'`. Encode special characters in the URL. |
| `getaddrinfo ENOTFOUND database` | The container is not on the TeslaMate network. | Add the service to the TeslaMate Compose project, or join its network. |
| `The database did not answer in 3000 ms.` | The database is down or overloaded. | Check the TeslaMate database container. |

## A page shows "No record yet."

TeslaMate records only from the moment you sign in. Drives, charges, and statistics appear after the car drives and charges. TeslaMate can import older data from TeslaFi exports. Read the TeslaMate documentation for the import.

## Battery health shows a dash

The health estimate needs 3 long charges. A long charge adds enough energy for 100 km of range. Under Health, the page names how many long charges it still needs, and their minimum size in kWh. Capacity now and Charge cycles show from the first long charge.

## A charge shows "TeslaMate did not close this charge"

TeslaMate restarted during the charge, so it started a new charge and left the old one open. The app ends the old charge at its last record, and it counts its energy in the totals. Nothing needs a fix. [Decision 0012](decisions/0012-charges-left-open.md) explains the rule.

## A page shows an error after a TeslaMate upgrade

The new TeslaMate version can change a table. Read [Upgrading](upgrading.md).

## Settings show "Not saved"

| Cause | Fix |
|---|---|
| The server cannot write `PREFERENCES_FILE`. | Mount a writable volume at `/data`. The image runs as uid 1001. |
| The proxy changes the host name. | Forward the original `Host` or `X-Forwarded-Host` header. Read [Protect the dashboard](authentication.md). |

## Settings reset after each deploy

`PREFERENCES_FILE` is not on a persistent volume. Mount a volume at `/data`.

## Every user sees the same Settings

The app does not get an email header. Set `IDENTITY_HEADER` for your proxy. Read [Protect the dashboard](authentication.md).

## The map stays empty

The browser cannot reach the CARTO tile server. Check an ad blocker or a firewall. Settings, Location, Maps: Hide removes the maps.

## The car picture is missing

The app maps the TeslaMate model, color, wheels, and trim to Tesla image codes. An unknown combination shows no picture. Open an issue with the values from the TeslaMate car page.

## The tire pressure differs from the Tesla app

TeslaMate stores the tire pressure in bar with one decimal. One step of 0.1 bar is about 1.5 psi. The Tesla app reads the car with more precision, so it can show 40 psi where the dashboard shows 41 psi.

## Times are off by some hours

Set `DISPLAY_TIME_ZONE` to your time zone, or choose one in Settings, Date and time. The default is UTC.

## The Live card is missing or shows "Offline"

Read the troubleshooting table in [Live status](live-status.md#troubleshooting).
