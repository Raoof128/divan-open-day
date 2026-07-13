# RESUME — DIVAN Open Day (pick up here)

> Handoff note for the next session. Read this first, then `AGENT.md`,
> `docs/verification-report.md`, `docs/implementation-plan.md`, and `CHANGELOG.md`.
> Last updated: 2026-07-13 (Australia/Sydney), commit `c552189`.

## Where we are

- **Integration branch:** `feat/divan-open-day-r1` (base `main`). Working tree clean.
- **All build stages B1–B6 are now integrated** on this branch. An earlier
  partial integration had merged B1/B2C/B3/B5/B6 but **not** B2 (visual) or B4
  (offline/service-worker); those, plus `public-readiness`, have now been merged
  and reconciled, and the previously-missing share card (criterion 16) and the
  `verify:*` scripts have been implemented.
- The 14 `agent/*` branches under `.worktrees/` are the per-stage source branches,
  preserved for reference/subagent use.

### What was completed in this pass (2026-07-13)

1. Merged `agent/b2-visual` (colour tokens, self-hosted fonts, original geometry,
   Hafez/Rumi distinct portals, About/Credits/Privacy/Accessibility/Offline pages,
   `tests/performance`, `tests/e2e/visual.spec.ts`).
2. Merged `agent/b4-integration` (service worker `src-sw/*`, `src/sw-client`,
   `public/offline.html`, `manifest.webmanifest`, `tests/offline/*`).
3. Merged `agent/public-readiness` (README, SECURITY, THIRD_PARTY_NOTICES, metadata).
4. Implemented the **share card** (§15 / criterion 16): `src/lib/share/*`, wired
   into `PoemResult` via the app's single live region.
5. Implemented the dangling `verify:*` scripts: `scripts/verify-privacy.ts`,
   `scripts/ops/verify-*` (docker-free static checks), fail-closed `scripts/qr/verify-qr.ts`.
6. Fixed two B2↔B4 e2e integration bugs (service worker vs. visual capture; `/offline`
   SPA routing in the e2e server) and the `compose.yaml`→`compose.yml` doc typo.

## Verified green baseline (2026-07-13, commit `c552189`, Node 22.16.0)

| Check                                                     | Result                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm typecheck`                                          | exit 0                                                             |
| `pnpm lint`                                               | exit 0                                                             |
| `pnpm test` (vitest)                                      | **472 passed (34 files)**                                          |
| `pnpm test:e2e` (Playwright, Chromium)                    | **5 passed**                                                       |
| `pnpm build:fixture` + `verify:dist`                      | pass (40-item fixture release)                                     |
| `pnpm verify:privacy`                                     | pass                                                               |
| `pnpm verify:container/headers/origin-isolation/rollback` | pass (docker-free static groups)                                   |
| `pnpm audit --prod`                                       | no known vulnerabilities                                           |
| `pnpm build:production`                                   | exit 1 — **intended** fail-closed (no approved corpus)             |
| `pnpm verify:qr`                                          | exit 1 — **intended** fail-closed (Phase-7 gate)                   |
| Bundle budgets (§21.3)                                    | JS 118 KB gz / CSS 4.8 KB / HTML 657 B / total 752 KB — all within |

Full evidence and the §31.1 acceptance-criteria matrix: **`docs/verification-report.md`**.

## What remains

- **Environment-blocked (Docker daemon down in this session):** `docker buildx build`,
  container scan (`syft`), live `docker compose config`, and `ops/scripts/verify.sh`
  runtime evidence. The config is statically verified by `tests/security` (52 tests).
  Re-run these on a host with Docker.
- **§31.2 public-launch gates (cannot be closed by an agent):** approved production
  corpus + rights/permissions (production build is designed to fail without it),
  cultural review, manual assistive-tech evidence (VoiceOver/TalkBack/devices, 200%
  zoom, measured contrast), final hostname/short URL + University-mark approval,
  live deployment/tunnel/provider-logging, rollback rehearsal, physical QR/print.

## Handy commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
pnpm build:fixture && pnpm verify:dist && pnpm verify:privacy
pnpm build:production   # expect exit 1 fail-closed until an approved corpus exists
```
