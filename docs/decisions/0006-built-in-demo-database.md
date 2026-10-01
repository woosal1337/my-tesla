# 0006: Built-in demo database for the public site

Date: 2026-10-01

Status: Accepted.

## Context

The owner wants a public site with a landing page and a live demo, deployed on Vercel from the GitHub repo. The real car data must stay private. The demo needs a PostgreSQL database that the Vercel functions can reach, and the owner asked for demo data inside the deployment, with no outside database.

## Decision

1. `DEMO_MODE=1` switches the app to a demo database inside the server process: PGlite, which is PostgreSQL compiled to WebAssembly.
2. At the first request, the server creates the TeslaMate tables from `src/lib/demo/schema.ts`, then fills them with the generator in `src/lib/demo/`. The data ends at the boot time. A server process builds new data after 6 hours, so the demo always shows recent days.
3. `src/lib/sql-template.ts` gives the subset of the postgres.js tag interface that the queries use: parameters, nested fragments, and identifiers. Every query runs unchanged on both databases.
4. In demo mode, Settings live in a cookie for each visitor, not in the shared settings file.
5. In demo mode, `/` shows the landing page, and the dashboard shows a demo banner.
6. Vercel builds the project from `main` for production and from other branches for previews.

## Alternatives

1. A hosted demo database, such as Neon or Supabase. It adds a service, a secret, and a seed job.
2. Static pages built from the demo data. Settings could not change the units for each visitor.
3. A separate data layer in JavaScript for the demo. Every query would need a second version.

## Consequences

Each cold start takes about 1 second to build the demo data. The server bundle carries PGlite, about 25 MB, also in the container image, but self-hosted installs never load it. The schema file follows TeslaMate 4.3.0. Update it from a `pg_dump --schema-only` of a demo database after a TeslaMate upgrade that changes the tables.
