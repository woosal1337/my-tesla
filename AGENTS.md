# Agent guidance

Read `README.md`, `docs/architecture.md`, and `docs/quality.md` before a change.
This file owns the guidance for coding agents. `CLAUDE.md` imports it. Keep client bridges free of duplicate rules.

## Product contract

The app shows the data that TeslaMate records. It reads the TeslaMate PostgreSQL database and never writes to it. It can also read the TeslaMate MQTT feed, and it never publishes to it.

1. Connect only as a read-only role. Refuse the `teslamate` and `postgres` users.
2. Open every session with `default_transaction_read_only` on and a statement timeout.
3. Keep all database access on the server. No database value reaches the browser without a server module.
4. Treat the data as a location history. Every page and API call needs an account session, except `/api/health` and the sign-in pages. Read decision 0023 before a change to `src/lib/auth/` or `src/proxy.ts`.
5. Subscribe to MQTT only with a read-only broker user. Keep the values in memory, and send no car value through the live stream.
6. Follow the Tesla visual style. Read `research/ui-stack.md` and decision 0002 before a UI change.

## Architecture

Keep database access in `src/lib/`, behind the `server-only` import. Pages and route handlers call these modules. Put pure logic in small modules without I/O, so that `bun test` can check it without a database. Follow the query logic of the TeslaMate Grafana dashboards, because the TeslaMate team keeps them in step with the schema. Read the matching guide in `node_modules/next/dist/docs/` before you use a Next.js API.

Keep the selected framework's file conventions. Read `research/stack.md` before a dependency or framework change.
Use names, small functions, types, and documents to explain the code.
Do not add inline or block prose comments to authored source, tests, or configuration files.
Keep required tool directives and generated files in the explicit exception list in `docs/quality.md`.
Do not use an exception to hide authored comments.

## App API

The mobile app reads `/api/app/cars/{carId}/…`. Each answer is formatted on the server with the Settings of the person who asks.

1. Define every answer in `src/lib/app/contract.ts`. It imports nothing, so the mobile app can import its types.
2. Build each answer in a pure module in `src/lib/app/` with a test. It takes the query results and the formatter, and it calls the same helpers as the page.
3. When a page computes a value inline that the app also needs, move the computation into a shared module and use it in both. Compare the page text before and after.
4. Route handlers call `appContext()`, then the queries, then the builder, and answer with `appJson()`. Give the user's map setting to every location value.
5. Describe each endpoint in `docs/api.md`.
6. Give each list row and each day section a `label` for a screen reader with `spokenLabel()`.

## Mobile app

`mobile/` holds the Expo app. `mobile/AGENTS.md` owns its rules, and agents read it when they work in that folder. Read it before any change to the app.

## Research before a shared change

Before you add or change a shared component, the navigation, a control, a list pattern, a chart, or a dependency, on the web or in the app:

1. Search the current guidance: the platform guidelines (Apple, Material Design 3), WCAG 2.2, and the docs of the framework version in use.
2. Record the decision, the reason, and the source links in `research/ui-stack.md` for the web or in `research/mobile-ui.md` for the app, in the same change.

## Work

`PROJECT.json` names the maintainers' task board and the quality commands. Record each lasting decision in `docs/decisions/`. Keep heavy data and personal paths outside Git.

## Checks and delivery

Run `python3 tools/quality.py check` before completing a change.
Run the relevant integration, build, or device checks from `docs/quality.md`.
Run `python3 tools/quality.py hooks-install` after each clone.
Keep the local gates and CI commands equal.
Commit and push only when the current request authorizes them.
Report local checks, CI results, commits, pushes, and deployments as separate facts.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
