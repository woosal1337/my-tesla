FROM node:24-bookworm-slim AS base
COPY --from=oven/bun:1.3.14-slim /usr/local/bin/bun /usr/local/bin/bun
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PREFERENCES_FILE=/data/preferences.json
WORKDIR /app
RUN groupadd --system --gid 1001 dashboard \
    && useradd --system --uid 1001 --gid dashboard --no-create-home dashboard \
    && mkdir -p /data \
    && chown dashboard:dashboard /data
COPY --from=build --chown=dashboard:dashboard /app/.next/standalone ./
COPY --from=build --chown=dashboard:dashboard /app/.next/static ./.next/static
USER dashboard
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
