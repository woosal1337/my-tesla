# Agent guidance

Read `README.md`, `docs/architecture.md`, and `docs/quality.md` before a change.
This file owns the guidance for coding agents. `CLAUDE.md` imports it. Keep client bridges free of duplicate rules.

## Product contract

The app shows the data that TeslaMate records. It reads the TeslaMate PostgreSQL database and never writes to it. It can also read the TeslaMate MQTT feed, and it never publishes to it.

1. Connect only as a read-only role. Refuse the `teslamate` and `postgres` users.
2. Open every session with `default_transaction_read_only` on and a statement timeout.
3. Keep all database access on the server. No database value reaches the browser without a server module.
4. Treat the data as a location history. The app has no login, so the docs require an authenticating proxy.
5. Subscribe to MQTT only with a read-only broker user. Keep the values in memory, and send no car value through the live stream.
6. Follow the Tesla visual style. Read `research/ui-stack.md` and decision 0002 before a UI change.

## Architecture

Keep database access in `src/lib/`, behind the `server-only` import. Pages and route handlers call these modules. Put pure logic in small modules without I/O, so that `bun test` can check it without a database. Follow the query logic of the TeslaMate Grafana dashboards, because the TeslaMate team keeps them in step with the schema. Read the matching guide in `node_modules/next/dist/docs/` before you use a Next.js API.

Keep the selected framework's file conventions. Read `research/stack.md` before a dependency or framework change.
Use names, small functions, types, and documents to explain the code.
Do not add inline or block prose comments to authored source, tests, or configuration files.
Keep required tool directives and generated files in the explicit exception list in `docs/quality.md`.
Do not use an exception to hide authored comments.

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
