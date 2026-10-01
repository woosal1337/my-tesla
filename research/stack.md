# My Tesla stack research

Research date: 2026-09-30

## Requirements and selected versions

| Component | Selection | Reason |
|---|---|---|
| Runtime | Node.js 24 LTS | Next.js 16.3.8 needs 20.9 or newer. 24 is the active LTS line. |
| Framework | Next.js 16.3.8, App Router, `src/` directory | The current release. Server components keep the database on the server. |
| Package manager and tests | Bun 1.3.14 | The owner's choice for the whole project. `bun test` removes the need for Vitest. |
| Language | TypeScript 5.9.3 | `create-next-app` pins `^5`. TypeScript 7.0.2 is out, but the source gate needs the compiler API of version 5. |
| Styles | Tailwind CSS 4.3.3 | Chosen by the scaffolder. The Tesla theme builds on it. |
| Database client | postgres 3.4.9 | Pure JavaScript, runs on Node.js and Bun, and sets session options at connect time. |
| Later | shadcn/ui, Recharts, MapLibre GL | Add each one with its first view, so the unused-code gate stays true. |

Choose compatible stable versions. Do not choose each component's newest version independently.
Record a version constraint when the framework controls a runtime or peer dependency.

## Framework conventions

1. Next.js 16 removed `next lint`. Run the ESLint CLI with `eslint-config-next`.
2. `next build` no longer runs the linter.
3. `create-next-app` adds `AGENTS.md` with a Next.js block, and `next dev` writes the block again if it is missing. The block tells agents to read `node_modules/next/dist/docs/`.
4. Route handlers are not cached by default. `GET /api/health` runs at request time.
5. Environment values without the `NEXT_PUBLIC_` prefix stay on the server, and a server read at request time uses the runtime value.
6. `tsc --noEmit` needs the route types. Run `next typegen` first on a fresh clone.

## Quality and delivery

The gates run through `tools/quality.py`, which reads `PROJECT.json`. The commit hook runs all gates. The push hook runs `bun test`. CI runs the gates and the build. The source-comment gate uses a parser for each file type.

## Sources and open questions

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), version 16.3.8, updated 2026-07-21
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), updated 2026-08-25
- Next.js route handler guide in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- [Node.js release index](https://nodejs.org/dist/index.json): 24.21.0 is the newest LTS release, and 26.10.0 is the newest release
- [Bun releases](https://github.com/oven-sh/bun/releases): 1.4.2 on 2026-09-05
- npm registry, checked 2026-09-30: next 16.3.8, react 19.3.0, typescript 7.0.2 (5.9.3 in the 5 line), tailwindcss 4.3.3, eslint 10.11.0 (9.39.5 in the 9 line), postgres 3.4.9, knip 6.39.0, prettier 3.9.9
- [pre-commit on PyPI](https://pypi.org/project/pre-commit/): 4.6.2
- Actions: `actions/checkout` v7.0.1 at `3d3c42e5aac5ba805825da76410c181273ba90b1`, `actions/setup-node` v7.0.0 at `820762786026740c76f36085b0efc47a31fe5020`, `oven-sh/setup-bun` v2.2.0 at `0c5077e51419868618aeaa5fe8019c62421857d6`

Open questions:

1. Upgrade Bun to 1.4.2 on every machine and in CI together.
2. ESLint 10 is out. `create-next-app` still installs ESLint 9.
3. The image uses `node:24-bookworm-slim` with the Bun binary from `oven/bun:1.3.14-slim` for the build.
