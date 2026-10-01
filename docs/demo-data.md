# Demo data

The demo data covers 60 days for two cars, "Juniper" and "Highland", around Phoenix, Arizona. Use it to develop and test every page without a car.

There are two ways to use it:

| Way | Command | When |
|---|---|---|
| Built-in | `DEMO_MODE=1 bun run dev` | The fastest start. No database. Read [Demo site](demo-site.md). |
| PostgreSQL | The steps below | To test the real database driver against the TeslaMate schema |

[Decision 0003](decisions/0003-demo-database.md) explains the PostgreSQL demo database. [Decision 0006](decisions/0006-built-in-demo-database.md) explains the built-in one.

The generator makes:

- weekday commutes and errands, and weekend trips,
- a road trip with two Supercharger stops and a hotel night,
- home charges, Supercharger sessions, and idle drain,
- slow battery wear, two software updates, and a slow tire leak.

A fixed seed makes the same data on each run.

## 1. Start the demo database

The file [`tools/demo/compose.yaml`](../tools/demo/compose.yaml) starts PostgreSQL 18 on `127.0.0.1:5439`. Its `schema` service runs TeslaMate 4.3.0 once, which creates the TeslaMate tables and then stops. The demo has no Tesla account.

```bash
cd tools/demo
export DEMO_OWNER_PASSWORD=choose-a-password
docker compose up -d database
docker compose run --rm schema
```

## 2. Create the read-only role

```bash
docker compose exec -T database psql -U demo_owner -d teslamate_demo <<'SQL'
CREATE ROLE teslamate_ro WITH LOGIN PASSWORD 'demo-read-only';
GRANT CONNECT ON DATABASE teslamate_demo TO teslamate_ro;
GRANT USAGE ON SCHEMA public TO teslamate_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO teslamate_ro;
SQL
```

## 3. Fill the database

From the repository root:

```bash
DEMO_DATABASE_URL=postgresql://demo_owner:$DEMO_OWNER_PASSWORD@127.0.0.1:5439/teslamate_demo \
  bun run seed:demo
```

The seed tool deletes the old demo rows, then writes new ones. It refuses every database that is not `teslamate_demo` on a local host, so it cannot write to a real TeslaMate database.

| Variable | Default | Effect |
|---|---|---|
| `DEMO_DATABASE_URL` | None | The demo database. The tool needs the owner role, because it writes. |
| `DEMO_DAYS` | `60` | The number of days to generate |

## 4. Point the app at it

```bash
DATABASE_URL=postgresql://teslamate_ro:demo-read-only@127.0.0.1:5439/teslamate_demo
DISPLAY_TIME_ZONE=America/Phoenix
```

Then run `bun run dev` and open the second car, "Juniper". It has the full history.

## Remove it

```bash
cd tools/demo
docker compose down --volumes
```
