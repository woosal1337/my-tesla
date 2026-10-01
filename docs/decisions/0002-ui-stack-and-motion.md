# 0002: UI stack and motion

Date: 2026-10-01

Status: Accepted for the first views.

## Context

The owner wants the dashboard to look like the official Tesla app, to load fast, and to animate each change of screen, with a Tesla mark as the splash. A curated catalog of web UI resources and the Tesla DESIGN.md give the options and the tokens. Read [the UI stack research](../../research/ui-stack.md).

## Decision

1. Use shadcn/ui on Base UI with the Tesla tokens in `src/app/globals.css`. The theme follows the system light or dark setting.
2. Use React `ViewTransition` from the Next.js App Router for tab, car, and loading transitions. Add no page-transition library.
3. Use Motion only for the sliding tab highlight, and NumberFlow for changing numbers.
4. Keep `loading.tsx` at the root only. Show pending navigation with `useLinkStatus` and the breathing T mark.
5. Use Inter as the stand-in for Universal Sans.

## Alternatives

1. A `loading.tsx` for each car route. It gives instant feedback, but the skeleton flickers when the database answers in under 100 ms.
2. A motion-heavy registry such as Aceternity UI or Magic UI. Its effects conflict with the Tesla rule of no decoration.
3. Tremor for the dashboard parts. It brings a second visual language.

## Consequences

A slow database shows the old screen and a pending shimmer, not a skeleton. If queries grow slow, add a `Suspense` boundary inside the slow page section, not a route-level `loading.tsx`. Browsers without view transition support switch screens without animation. The shadcn component files are generated, so the unused-code gate skips their unused exports.
