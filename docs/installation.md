# Installation

The dashboard is one Next.js server. It needs three things:

1. A network path to the TeslaMate PostgreSQL database.
2. A read-only database role. [Connect to the TeslaMate database](teslamate-database.md) gives the SQL.
3. An authenticating proxy in front of it. The app has no login. [Protect the dashboard](authentication.md) gives examples.

Pick one of the methods below. All of them use the same [environment variables](configuration.md).

## Container image

The image is `ghcr.io/woosal1337/my-tesla`. The [image workflow](../.github/workflows/image.yml) builds it for `linux/amd64` and `linux/arm64` on each version tag.

| Tag | Meaning |
|---|---|
| `latest` | The newest release |
| `0.1.0` | One exact release |
| `0.1` | The newest patch of a minor release |
| `sha-<commit>` | One commit |

Until the first release exists, build the image yourself:

```bash
git clone https://github.com/woosal1337/my-tesla.git
cd my-tesla
docker build -t my-tesla .
```

Then use `my-tesla` as the image name in the examples below.

The image:

- runs `node server.js` as the unprivileged user `dashboard` (uid 1001),
- listens on port 3000,
- keeps the saved settings in the volume `/data`,
- checks itself with `GET /api/health` every 30 seconds.

## Method 1: Add it to the TeslaMate Compose file

This is the simplest method. The dashboard joins the default network of the TeslaMate project, so it reaches the database at the host name `database`.

1. Create the read-only role. Follow [Connect to the TeslaMate database](teslamate-database.md).
2. Put the role password in the `.env` file next to `docker-compose.yml`:

   ```bash
   TESLAMATE_RO_PASSWORD=choose-a-long-random-password
   ```

3. Add the service to `docker-compose.yml`, at the same level as `teslamate`, `database`, and `grafana`:

   ```yaml
   dashboard:
     image: ghcr.io/woosal1337/my-tesla:latest
     restart: unless-stopped
     depends_on:
       - database
     environment:
       DATABASE_URL: postgresql://teslamate_ro:${TESLAMATE_RO_PASSWORD}@database:5432/teslamate
       DISPLAY_TIME_ZONE: Europe/Berlin
     volumes:
       - dashboard-data:/data
     ports:
       - "127.0.0.1:3000:3000"
   ```

4. Add the volume to the `volumes:` key at the end of the file:

   ```yaml
   volumes:
     dashboard-data:
   ```

5. Start the service:

   ```bash
   docker compose up -d dashboard
   ```

6. Check it:

   ```bash
   curl -s http://127.0.0.1:3000/api/health
   ```

   The answer is `{"status":"ok","database":"ok"}`.

7. Put your authenticating proxy in front of `127.0.0.1:3000`.

## Method 2: A separate Compose project

Use this method when you do not want to edit the TeslaMate Compose file. The file [`deploy/compose.yaml`](../deploy/compose.yaml) joins the external TeslaMate network.

1. Find the name of the TeslaMate network:

   ```bash
   docker network ls --filter name=teslamate
   ```

   A Compose project in the folder `teslamate` uses `teslamate_default`.

2. Copy `deploy/compose.yaml` to a new folder, and create `.env` next to it:

   ```bash
   TESLAMATE_RO_PASSWORD=choose-a-long-random-password
   TESLAMATE_NETWORK=teslamate_default
   DISPLAY_TIME_ZONE=Europe/Berlin
   ```

3. Start it:

   ```bash
   docker compose up -d
   ```

The database host name stays `database`, because the TeslaMate service has that name on the shared network. If your database service has another name, change the host in `DATABASE_URL`.

## Method 3: Coolify

1. Create the read-only role in the database container of the TeslaMate service. Use the terminal of that container in Coolify, and the SQL from [Connect to the TeslaMate database](teslamate-database.md).
2. Add a new resource of the type "Docker Image" with `ghcr.io/woosal1337/my-tesla:latest`, or a "Public Repository" resource that builds the Dockerfile.
3. Put it on the same Docker network as the TeslaMate database. In Coolify, turn on "Connect to Predefined Network" and choose the network of the TeslaMate service.
4. Set the environment variables. Use the container name of the database as the host in `DATABASE_URL`. Coolify gives each container a name such as `database-<id>`.
5. Add a persistent storage for `/data`. Without it, the saved settings reset on each deploy.
6. Set the port to 3000 and the health check path to `/api/health`.
7. Add your authentication in front of the domain. Do not publish the domain without it.

## Method 4: From source

You need Node.js 24 and Bun 1.3.14.

```bash
git clone https://github.com/woosal1337/my-tesla.git
cd my-tesla
bun install --frozen-lockfile
bun run build
```

The build writes a standalone server to `.next/standalone`. Copy the static files next to it, then start it:

```bash
cp -r .next/static .next/standalone/.next/static
cd .next/standalone
DATABASE_URL=postgresql://teslamate_ro:password@127.0.0.1:5432/teslamate \
PREFERENCES_FILE=/var/lib/my-tesla/preferences.json \
PORT=3000 HOSTNAME=127.0.0.1 \
node server.js
```

Run it under a process manager, such as a systemd service, so that it starts again after a failure or a reboot.

## After the installation

1. Open the dashboard through your proxy. The first page is the car that moved last.
2. Open Settings and choose your units, formats, and time zone. The defaults come from the TeslaMate settings page.
3. Read [Upgrading](upgrading.md) before the next TeslaMate upgrade.
