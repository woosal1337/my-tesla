# 0009: Analytics only on the demo site

Date: 2026-10-01

Status: Accepted.

## Context

The owner wants to know how people use the public demo: which pages they open, and how many go on to the install guide or the repository. The owner already runs Open Analytics on a self-hosted server for other sites. A self-hosted install of My Tesla shows a location history and must never send data to anyone.

## Decision

1. Only demo mode can load the tracker. A normal install never loads it, with or without the variables.
2. `OPEN_ANALYTICS_URL` and `OPEN_ANALYTICS_KEY` turn it on. The repository holds no key, so a fork sends nothing to the owner's server.
3. The tracker respects Do Not Track and Global Privacy Control. The landing page footer says that the site counts visits.
4. Event names live in `src/lib/analytics.ts`. Links carry `data-oa-event` attributes, so server components need no client code. Settings calls `trackEvent()`, which does nothing without the tracker.
5. The Open Analytics site allows only the demo domain, so a copied key from the page cannot count other sites.

## Alternatives

1. Vercel Web Analytics. It is a second analytics product next to the owner's Open Analytics, with separate reports.
2. No analytics. The owner then cannot see if the demo helps people to install the app.

## Consequences

The demo loads one more script from the collector. A change to an event name must also change the funnels in Open Analytics, because they match on the name.
