# 0007: The Tesla T mark in silver as the logo

Date: 2026-10-01

Status: Accepted.

## Context

The app uses the Tesla T mark for the splash, the loading screen, the header, and the empty states, as [decision 0002](0002-ui-stack-and-motion.md) says. The first README logo and the landing page tile showed the mark in Tesla red. The owner wants a logo in black, gray, and silver. Tesla, Inc. owns the T mark. The owner knows this and keeps the mark.

## Decision

1. The app keeps the T mark in one color, with the draw and breathe motion.
2. The logo is the T mark in a silver gradient on a black tile. The README, the landing page header, and the favicon use it.
3. `src/lib/logo.ts` holds the mark path and the silver colors. `TeslaMark` draws the mark in the app. `LogoTile` draws the logo on the landing page.
4. `src/app/icon.svg` and `docs/images/logo.svg` are static copies of the logo. A test makes sure that they use the same path and colors as `src/lib/logo.ts`.
5. The favicon and the landing tile use a larger mark than the README logo, so the mark stays clear at 16 pixels.

## Alternatives

1. An own mark, such as a gauge. The owner tried it and rejected it.
2. The mark in Tesla red. The owner wants the logo in silver.

## Consequences

Tesla can object to the mark in a public repository or on the demo site. The README and the landing page say that the project is not affiliated with Tesla, Inc. If Tesla objects, change the mark in `src/lib/logo.ts` and in the two static files.
