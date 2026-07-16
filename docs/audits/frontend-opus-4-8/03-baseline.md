# 03 — Baseline (pre-repair)

Established before any implementation edit, per goal Phase 3. Failures recorded, not repaired.

## Provenance

| Field | Value |
| --- | --- |
| Baseline SHA | `e3480481d09474849449cb504c9c2424e49e4fd3` |
| `origin/main` at fetch | `e3480481d09474849449cb504c9c2424e49e4fd3` (identical) |
| Audit branch | `audit/opus-4-8-exhaustive-frontend` |
| Worktree | `../OpemDay-audit-opus48` (isolated; main tree's untracked files untouched) |
| Date | 2026-07-16 |
| Host | darwin arm64 (Darwin 25.5.0) |

## Toolchain

Resolved against the repository pins. The ambient shell `node` was **v26.5.0**, which does
**not** match `.node-version`; the pinned interpreter was located at
`~/.nvm/versions/node/v22.16.0/bin` and used for every command below. `pnpm` is not on the
default PATH and was taken from the same pinned Node installation.

| Tool | Version | Pin | Match |
| --- | --- | --- | --- |
| node | v22.16.0 | `.node-version` = 22.16.0 | yes |
| pnpm | 10.33.0 | `packageManager` = pnpm@10.33.0 | yes |
| vite | 8.1.4 | — | — |
| tsc | 6.0.3 | — | — |
| vitest | 4.1.10 | — | — |
| playwright | 1.61.1 | — | — |

`pnpm install --frozen-lockfile` → exit 0.

## Results

| Command | Exit | Duration | Notes |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | ~2s | lockfile honoured, no drift |
| `pnpm format:check` | 0 | 3s | clean |
| `pnpm lint` | 0 | 7s | `--max-warnings 0`, clean |
| `pnpm typecheck` | 0 | 4s | clean |
| `pnpm test` | 0 | 20s | **62 files, 705 tests, 705 passed** |
| `pnpm verify:privacy` | 0 | <5s | no cookies/trackers/analytics/geolocation; storage session/local-pref only |
| `pnpm build:production` (bare) | 1 | <5s | **expected**: requires explicit `DIVAN_PUBLIC_ORIGIN`; not a defect |
| `pnpm verify:dist` (bare) | 1 | <5s | **expected**: consequence of the above; no `dist/` present |
| `bash scripts/check.sh --ci` | **0** | 67s | canonical gate green end-to-end |

### On the two bare-command failures

Neither is a baseline defect. `scripts/build.ts` requires an explicit `DIVAN_PUBLIC_ORIGIN`
by design (fail-closed). The repository supplies its own documented production inputs in
`scripts/check.sh:37-47` — a committed, non-secret public hostname. No `.env` or credential
file was read, opened, or referenced at any point. Run through the canonical gate, the
production build and `verify:dist` pass, which is why `check.sh --ci` exits 0.

## Baseline verdict

**Clean.** Zero pre-existing failures across format, lint, typecheck, the full 705-test
suite, privacy verification, and the canonical CI gate. Every finding this audit reports is
therefore attributable to analysis, not to inherited breakage.

## Honest limitations at baseline

- `pnpm test` excludes Playwright by config; e2e ran inside `check.sh --ci`.
- Docker-dependent ops evidence is skipped by `check.sh` when no daemon is running.
- No physical-device, VoiceOver, TalkBack, or Safari-hardware evidence has been collected.
  Nothing in this document claims otherwise.
