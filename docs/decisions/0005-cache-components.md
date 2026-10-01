# 0005: Cache Components for the saved settings

Date: 2026-10-01

Status: Accepted.

## Context

Every page reads the saved settings. Before this change, each page visit read the settings file and queried the TeslaMate `settings` table. The owner asked for a professional cache. Next.js 16 replaces `unstable_cache` with the `"use cache"` directive, which needs the `cacheComponents` flag.

## Decision

1. Turn on `cacheComponents` in `next.config.ts`.
2. Cache the settings file read in `"use cache"`, tagged `preferences:<user>`, with the `minutes` life: fresh for 1 minute, served stale while it refreshes, gone after 1 hour.
3. Cache the TeslaMate `settings` query in `"use cache"`, tagged `teslamate-settings`, with the same life.
4. The save and reset actions call `updateTag("preferences:<user>")`. The next render reads the new file, so the user sees the change at once on every device.
5. Read the request before a cached call. `getPreferences()` reads the user header first, and `baseline()` calls `connection()` first. The build then never runs a database query.
6. Mark the root layout and every page with `instant = false`. Every page reads per-user data, so each page renders at request time, as before.

## Alternatives

1. `unstable_cache`. Next.js 16 marks it as replaced by `"use cache"`.
2. A hand-written memory map. It needs its own expiry and invalidation code.
3. A browser cookie or `localStorage` copy. Each device keeps its own copy, so a change on a phone does not reach a laptop. Decision 0004 rejects this.
4. Suspense boundaries with skeletons on each page. Decision 0002 rejects route skeletons, because they flicker when the database answers in under 100 ms.

## Consequences

The cache lives in the memory of one server process. A second process, such as a second dev server, keeps its own copy, so a change made through one server shows on the other after up to 1 minute. A hand edit of the settings file also shows after up to 1 minute. The car routes build as partial prerenders with a static shell. Cache Components keeps hidden pages mounted in React `Activity`, so the Settings form syncs its state from the server value and clears its save status when hidden.
