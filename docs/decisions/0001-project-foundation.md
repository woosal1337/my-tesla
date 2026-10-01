# 0001: Project foundation

Date: 2026-09-30

Status: Accepted for the initial foundation.

## Context

TeslaMate logs the cars into PostgreSQL. Its own web UI holds only settings and a live status page. Grafana holds the charts. The owner wants a dashboard with the official Tesla look, built with current web components.

## Decision

Build a separate Next.js app that reads the TeslaMate database as `teslamate_ro`. Use Bun as the package manager, script runner, and test runner. Use Node.js 24 LTS to run Next.js. Keep TeslaMate and teslamate-mcp unchanged.

## Alternatives

1. Fork TeslaMate. Its UI is Elixir and Phoenix LiveView, and a fork needs a rebase for each monthly release.
2. Add views to teslamate-mcp. It is a Python MCP server, and its only UI is three chart widgets inside a chat.
3. Fork a community front end. About ten exist on GitHub, and the largest has 42 stars.
4. Style Grafana. Grafana panels cannot give the Tesla look.

## Consequences

The app depends on the TeslaMate schema, so a TeslaMate upgrade can break a query. Copy queries from the TeslaMate Grafana dashboards of the running version, and check them after each TeslaMate upgrade. The app needs its own deployment and its own Cloudflare Access application.

## Evidence

Read [the stack research](../../research/stack.md) for the dated sources and version compatibility.
