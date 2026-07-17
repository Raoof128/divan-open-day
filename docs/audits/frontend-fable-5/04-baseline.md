# Fable 5 frontend audit — Phase 4 clean baseline

Date: 2026-07-17 (Australia/Sydney), branch `audit/fable-5-exhaustive-frontend` @ `e348048` (== `origin/main`).

## Toolchain (exact, measured)

| Tool | Version |
| --- | --- |
| Node | v22.16.0 (pinned; activated via nvm — login shell defaults to v26.5.0, not used) |
| pnpm | 10.33.0 (corepack) |
| Vite | 8.1.4 (darwin-arm64) |
| TypeScript | 6.0.3 |
| Vitest | 4.1.10 |
| Playwright | 1.61.1 |

## Commands (all run 2026-07-17 ~10:52–11:05 AEST from a clean tree)

| Command | Exit | Duration | Result summary |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | 0.5s | Lockfile up to date; no changes |
| `pnpm format:check` | 0 | ~6s | Prettier clean |
| `pnpm lint` | 0 | 7.2s | ESLint 0 warnings/errors (untracked `New_Frontend/**` etc. ignored by config) |
| `pnpm typecheck` | 0 | ~10s | tsc strict clean |
| `pnpm test` (all Vitest) | 0 | 16.5s | **62 files, 705/705 passed** |
| `pnpm test:e2e` | 0 | 25.1s | **5/5 Playwright (Chromium)** — keyboard+axe, motion precedence + audio failure, offline lifecycle, locked visual matrix, reveal choreography |
| `pnpm build:production` (env: `DIVAN_PUBLIC_ORIGIN=https://approved-origin.example`, `DIVAN_RELEASE_ID=fable5-audit-baseline`, `DIVAN_MIN_HAFEZ_COUNT=60`, `DIVAN_MIN_RUMI_COUNT=60`, `DIVAN_BRANDING_MODE=society_only`, `SOURCE_DATE_EPOCH=1784167200` — documented non-secret values; `.env` never read) | 0 | 1.4s | Production release built, **120 items** |
| `pnpm verify:dist` | 0 | ~1s | Exact dist set verified; public-bundle leak check passed |
| `pnpm verify:privacy` | 0 | <1s | No cookies/trackers/fingerprinting/geolocation; storage session/local-preference only |
| `bash scripts/check.sh --ci` | 0 | ~2m | Whole gate green: source locks 9/9, format, lint, typecheck, test 705/705, fixture build (40 items), verify:dist + leak, verify:privacy, OSV audit (429 packages, no issues), `build:production` (120 items, `ci-production-verification`), Playwright 5/5, `verify:qr` fail-closed as intended, Docker evidence skipped (no daemon) |

Individual suite counts within `pnpm test` (from check.sh log): components, accessibility, offline, share, performance, security, unit, content — all green (705 total).

## Pre-existing conditions (predate audit; not introduced here)

1. `pnpm audit --prod` (direct npm audit) is retired upstream (HTTP 410); `check.sh` uses OSV-Scanner instead, which passed (429 locked packages, no issues).
2. Docker-host ops evidence skipped (no daemon) — out of audit scope regardless.
3. `verify:qr` fail-closed — intended launch gate.

## Baseline verdict

The repository baseline is **fully green** before any audit change. Every failure discovered later is therefore attributable to audit findings, not environment drift. Evidence logs: `/tmp/base-*.log` (local, regenerable; not committed).
