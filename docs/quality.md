# My Tesla quality gates

Run `python3 tools/quality.py check` before completing a change.
The runner reads ordered command arrays from `PROJECT.json` and stops on the first failure.
An absent required check fails the runner. A skipped check is not a pass.

## Gates

| Gate | Command |
|---|---|
| Format | `bun run format:check` (Prettier 3.9.9) |
| Source comments | `bun run check:source` |
| Lint | `bun run lint` (ESLint with the Next.js rules) |
| Types | `bun run typecheck` (`next typegen`, then `tsc --noEmit`) |
| Unused code | `bun run check:unused` (knip 6.39.0) |
| Tests | `bun test` |

The build is a product check. CI runs `bun run build` after the gates.

Use the same check command in the commit hook and CI.
The push hook runs the project test command. Add broader checks when the project requires them.
Install both hooks after each clone with `python3 tools/quality.py hooks-install`.
Read [pre-commit's hook documentation](https://pre-commit.com/) for hook installation and stages.

## Source comment policy

Do not add prose comments to authored source, tests, or configuration files.
Put explanations in names, types, small functions, and docs.
The `source-comments` gate must parse the selected languages and scan all authored file locations.
It must detect inline and block comments without flagging quoted URLs, regular expressions, or template text.
Record any mandatory directive, generated file, or third-party exclusion below.
Keep the exclusions narrow. Do not exclude a source directory merely because it contains one generated file.

`tools/check-source-policy.ts` lists the tracked and the untracked files with `git ls-files`, then sends each file to a parser:

| Files | Parser |
|---|---|
| `.ts`, `.tsx`, `.js`, `.mjs`, `.json` | The TypeScript compiler, through `tools/check-source-comments.mjs` |
| `.py` | Python `tokenize` and `ast`, through `tools/check-source-comments.py` |
| `.css` | PostCSS |
| `.yml`, `.yaml` | The `yaml` package CST |
| `.gitignore`, `.gitattributes`, `.editorconfig`, `.prettierignore`, `.env.example`, `.dockerignore`, `Dockerfile` | A line rule, because these formats allow only whole-line comments |

An unknown file type fails the gate.

Exceptions:

1. Markdown files and `LICENSE` are documents, not source.
2. `bun.lock` is generated.
3. Image and font files are assets.
4. `next-env.d.ts` is generated and ignored by Git.
5. `AGENTS.md` keeps the Next.js agent block with its HTML markers. `next dev` writes that block.
6. `src/app/icon.svg` is an asset. It holds a CSS media query for the dark theme and no comment.
7. `src/components/ui/` holds files from the shadcn CLI. The source gate checks them. The unused-code gate skips only their unused exports, through `ignoreIssues` in `knip.json`.
8. `src/components/ui/map.tsx` is the mapcn registry file, 2,696 lines of third-party code with its own comments. The source gate skips this one file so that `shadcn add @mapcn/map --overwrite` stays a clean update. The only local change is the MapLibre worker URL. It points at `/maplibre/<version>/maplibre-gl-worker.mjs`, which the app serves from `node_modules`, not at unpkg. ESLint also skips it, because the React Compiler rules flag 13 ref reads in the upstream code.

## Product validation

Checked on 2026-09-30 through an SSH tunnel to a TeslaMate database:

1. `GET /api/health` returned 200 with `{"status":"ok","database":"ok"}` as `teslamate_ro`.
2. The session showed `default_transaction_read_only = on` and `statement_timeout = 15s`. A `CREATE TABLE` failed with "cannot execute CREATE TABLE in a read-only transaction".
3. With the `teslamate` user, the route returned 503 and the refusal message.
4. `bun run build` passed. `/` is static, and `/api/health` is dynamic.

Record a real failure case for the source policy and an installed hook before accepting the foundation.
Restore the probe file after the check. Keep checks free of commits or pushes made only to test a hook.
Report device, integration, CI, and live checks separately.

## Continuous integration

`.github/workflows/checks.yml` installs Node.js 24 and Bun 1.3.14, runs `bun install --frozen-lockfile`, runs the gates, and runs `bun run build`. It needs only `contents: read`. The actions use full commit hashes.

`.github/workflows/image.yml` builds the container image for `linux/amd64` and `linux/arm64` on each `v*` tag, and pushes it to GitHub Container Registry. It needs `packages: write`. Its Docker actions also use full commit hashes: setup-qemu-action 4.4.0, setup-buildx-action 4.4.1, login-action 4.6.0, metadata-action 6.2.0, and build-push-action 7.4.0.

Give CI only its required permissions.
Pin third-party actions to full commit hashes and record their selected releases in the stack research.
Read [GitHub's action security guide](https://docs.github.com/en/actions/reference/security/secure-use) for action pins.
