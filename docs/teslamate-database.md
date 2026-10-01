# Connect to the TeslaMate database

The dashboard reads the PostgreSQL database that TeslaMate writes. It never writes to it. It connects with its own read-only role, so a fault in the dashboard cannot change or delete car data.

## 1. Create the read-only role

TeslaMate creates its database with the user `teslamate`. That user is a superuser, so the dashboard refuses it. Create a separate role instead.

1. Open a shell in the TeslaMate folder, next to `docker-compose.yml`.
2. Run this command. Replace the password with a long random value first:

   ```bash
   docker compose exec -T database psql -U teslamate -d teslamate <<'SQL'
   CREATE ROLE teslamate_ro WITH LOGIN PASSWORD 'choose-a-long-random-password';
   GRANT CONNECT ON DATABASE teslamate TO teslamate_ro;
   GRANT USAGE ON SCHEMA public TO teslamate_ro;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO teslamate_ro;
   ALTER DEFAULT PRIVILEGES FOR ROLE teslamate IN SCHEMA public
     GRANT SELECT ON TABLES TO teslamate_ro;
   ALTER ROLE teslamate_ro SET default_transaction_read_only = on;
   SQL
   ```

3. Check the role. This command must print the drive count, and the second statement must fail with "permission denied":

   ```bash
   docker compose exec -T database psql -U teslamate_ro -d teslamate \
     -c "select count(*) from drives" \
     -c "create table probe (id int)"
   ```

What the SQL does:

| Statement | Effect |
|---|---|
| `GRANT SELECT ON ALL TABLES IN SCHEMA public` | Reads the car data tables that exist now |
| `ALTER DEFAULT PRIVILEGES FOR ROLE teslamate` | Reads the tables that a later TeslaMate migration adds |
| `ALTER ROLE ... default_transaction_read_only` | Makes each session read-only, also outside the dashboard |

The role gets no access to the schema `private`. TeslaMate keeps the encrypted Tesla API tokens there.

If your TeslaMate database uses other names, change `teslamate` in the SQL to your database name and owner.

## 2. Reach the database

The TeslaMate Compose file does not publish the database port. Pick one path:

| Path | `DATABASE_URL` host | When to use it |
|---|---|---|
| Same Compose project or the same Docker network | `database` | The dashboard runs as a container next to TeslaMate. This is the recommended path. |
| A published port on the host | `127.0.0.1` | The dashboard runs from source on the same host. Publish the port only on `127.0.0.1`. |
| An SSH tunnel | `127.0.0.1` | You develop on another computer. Read [Development](development.md). |

Never publish the database port on a public address.

## 3. Set `DATABASE_URL`

```text
postgresql://teslamate_ro:<password>@<host>:5432/teslamate
```

If the password has special characters, encode them for a URL. For example, write `@` as `%40`.

The app checks the value at the first request:

| Problem | Message |
|---|---|
| No value | `Set DATABASE_URL to the read-only TeslaMate role.` |
| Wrong scheme | `Use the postgres or postgresql scheme in DATABASE_URL.` |
| The user `teslamate` or `postgres` | `Use the read-only role in DATABASE_URL, not the privileged user "teslamate".` |

## 4. Check the connection

```bash
curl -s http://127.0.0.1:3000/api/health
```

| Answer | Meaning |
|---|---|
| `200` and `{"status":"ok","database":"ok"}` | The app reads the database. |
| `503` and an error message | The app cannot read the database. Read [Troubleshooting](troubleshooting.md). |

## What the dashboard reads

| Table | Use |
|---|---|
| `cars`, `car_settings`, `settings` | Car names, models, efficiency, and the default units |
| `positions` | Last position, battery, range, temperatures, tire pressure, drive routes |
| `drives`, `addresses`, `geofences` | Drives, place names, and charging costs by place |
| `charging_processes`, `charges` | Charging sessions and charging curves |
| `states` | Online, asleep, and offline time |
| `updates` | Software versions |

Every session sets `default_transaction_read_only` and a statement timeout. [Configuration](configuration.md) sets the timeout and the pool size.
