# Development

## Tools

| Tool | Version | Source of the version |
|---|---|---|
| Bun | 1.3.14 | `packageManager` in `package.json` |
| Node.js | 24 | CI and the container image |
| Python | 3.11 or newer | Runs `tools/quality.py` and the Python comment check |
| pre-commit | 4.6.2 | Installs the Git hooks |
| Docker | Compose v2 | Only for the demo database and the image |

[The stack research](../research/stack.md) records the versions of every package and their sources.

## First setup

```bash
git clone https://github.com/woosal1337/my-tesla.git
cd my-tesla
bun install --frozen-lockfile
python3 tools/quality.py hooks-install
cp .env.example .env.local
```

Then point `DATABASE_URL` in `.env.local` at a database:

- the [demo database](demo-data.md), which needs no car, or
- your own TeslaMate database through an SSH tunnel, below.

## Daily commands

| Command | Effect |
|---|---|
| `bun run dev` | Starts `next dev` on port 3000 |
| `python3 tools/quality.py check` | Runs all gates: format, source comments, lint, types, unused code, tests |
| `bun test` | Runs the tests only |
| `bun run build` | Builds the standalone server |
| `bun run format` | Formats every file with Prettier |
| `bun run seed:demo` | Fills the demo database. Read [Demo data](demo-data.md). |

## Use your own TeslaMate database

The TeslaMate database has no published port. Open an SSH tunnel to the database container:

```bash
ssh your-teslamate-host \
  "docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' teslamate-database-1"
ssh -f -N -o ExitOnForwardFailure=yes -L 55432:<container-ip>:5432 your-teslamate-host
```

Replace `teslamate-database-1` with the name of your database container. Then set:

```bash
DATABASE_URL=postgresql://teslamate_ro:<password>@127.0.0.1:55432/teslamate
```

Create the read-only role first. Read [Connect to the TeslaMate database](teslamate-database.md).

## Run on another device in your network

`next dev` accepts requests only from known host names. To open the dev server from a phone, start it on a reachable address and list the host name:

```bash
ALLOWED_DEV_ORIGINS=my-laptop.local bun run dev -- -H 0.0.0.0
```

Keep the dev server on a private network. It has no login.

## Two servers on one folder

Each `next dev` process needs its own build folder. Set `NEXT_DIST_DIR`, for example `NEXT_DIST_DIR=.next-demo` for a second server on the demo database. `.gitignore` lists `.next-demo` and `.next-build`.

Build only into an ignored folder while a dev server runs, for example `NEXT_DIST_DIR=.next-build bun run build`. Tailwind CSS scans every file that Git does not ignore. A build folder outside `.gitignore` puts broken class names into the dev CSS, and every page then answers 500. To repair, stop the server, delete its `dev` cache folder, and start it again. The build also adds the folder to `tsconfig.json`, so restore that file after the build.

## Build and run the image

```bash
docker build -t my-tesla .
docker run --rm -p 127.0.0.1:3000:3000 \
  -e DATABASE_URL=postgresql://teslamate_ro:<password>@host.docker.internal:55432/teslamate \
  -v my-tesla-data:/data \
  my-tesla
```

## Project rules

Read [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](../AGENTS.md) before the first change. In short:

1. Keep all database access in `src/lib/`, behind the `server-only` import.
2. Put pure logic in small modules with tests next to them.
3. Write no prose comments in source files. [Quality gates](quality.md) explain the rule and its exceptions.
4. Read the matching guide in `node_modules/next/dist/docs/` before you use a Next.js API. This project uses Next.js 16 with Cache Components.
