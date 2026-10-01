# 0003: Demo database for design work

Date: 2026-10-01

Status: Accepted.

## Context

TeslaMate records only from the sign-in. A new installation has no drive and no charge, so the charts and the insight pages have nothing to show. The design work needs months of realistic data now. The production database must stay read-only for this app.

## Decision

1. Run a separate PostgreSQL 18 container on `127.0.0.1:5439` only, from `tools/demo/compose.yaml`. It holds the database `teslamate_demo`. TeslaMate 4.3.0 runs once against it to create the schema.
2. Generate 60 days of data with a fixed seed in `tools/demo/`: commutes and errands around Phoenix, Arizona, a road trip with Supercharger stops, home charges, idle drain, battery wear, two software updates, and a slow tire leak.
3. Seed with `bun run seed:demo` as the owner role `demo_owner`. The seed tool refuses every target that is not the database `teslamate_demo` on a local host.
4. Read the demo database with the app as `teslamate_ro`, the same as production. A second dev server can use it at the same time as the real database.

## Alternatives

1. Wait for real data. The design would wait weeks for a road trip or a fast charge.
2. Insert test rows into the production database. This breaks the read-only contract and mixes false rows into the car history.
3. Mock the query modules. The SQL would stay untested against the real schema.

## Consequences

The repo now holds one tool that writes to a database. `tools/demo/target.ts` and its tests keep it away from every other database. The demo data is synthetic, so a chart that looks right on the demo database can still look wrong on a real car. Check every page on the live data too, at least for the empty states.
