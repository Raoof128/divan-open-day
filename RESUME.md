# RESUME — DIVAN Open Day (pick up here)

> Handoff note for the next session (Claude Code or Codex). Read this first, then
> `AGENT.md`, `docs/implementation-plan.md`, and `CHANGELOG.md`.
> Last updated: 2026-07-13 (Australia/Sydney).

## Where we are

- **Integration branch:** `feat/divan-open-day-r1` (base `main`). Working tree clean.
- **Build stages B1–B6 are all landed** on the integration branch (cherry-picked
  from the `agent/*` worktree branches). The code build is essentially complete.
- Baseline verified green on this machine (Node 22.16.0) — see "Green baseline" below.
- The 14 `agent/*` branches under `.worktrees/` are the per-stage source branches;
  their work is already reflected in `feat/divan-open-day-r1`.

### Stage status

| Stage | Scope | Status |
|-------|-------|--------|
| B1 | App state, secure draw, history, React shell | done + review-closed |
| B2 | Visual system / illuminated DIVAN experience | done |
| B2C | Locked two-stage Vite build + dist verifier | done + review-closed |
| B3 | Content pipeline, corpus compiler, release gate | done + review-closed |
| B4 | Offline core, service worker, random draw | done |
| B5 | Accessibility, motion, skip-timing | done + review-closed |
| B6 | Ops: Docker/Caddy/tunnel, deploy/rollback | done (last worked on) |

## Green baseline (verified 2026-07-13, commit `3971390`)

| Check | Result |
|-------|--------|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | 377/377 passed (21 files) |
| `pnpm test:content` | 234/234 |
| `pnpm build:fixture` | built fixture release (40 items) |
| `pnpm verify:dist` | verified |
| `pnpm build:production` | exit 1 — **intended** fail-closed: "no approved production corpus exists in content-private" |

## What changed in this tidy-up pass (2026-07-13)

Small robustness/hygiene fixes so `pnpm test` and `pnpm lint` are reliably green
on a clean checkout (they previously broke on a full monolithic run). No product
behavior was changed.

1. `vitest.config.ts` — exclude `tests/e2e/**` (Playwright specs must run via
   `pnpm test:e2e`, not vitest, which was collecting `accessibility.spec.ts` and
   failing on `test.beforeEach`).
2. `vitest.config.ts` — `testTimeout`/`hookTimeout` raised to 30 s. The ops and
   release tests spawn real builds and shell scripts via `execFileSync`; the
   default 5 s ceiling flaked under concurrent CPU load ("Test timed out in 5000ms").
   Fast tests are unaffected.
3. `eslint.config.js` + `.gitignore` — ignore `.tmp-tests/` (leftover fixture build
   output from the determinism test was breaking `pnpm lint`).

## Next task — resume at Task 7

Per `docs/implementation-plan.md`:

- **Task 7 — Wave C independent verification.** Six read-only reviewers audit
  functional behavior, accessibility, security, performance, visual/cultural
  fidelity, and release/documentation reproducibility. For each valid finding:
  failing regression test → smallest fix → focused verification → reviewer re-check.
- **Task 8 — Final local gauntlet + acceptance evidence.** Run the full command
  list in the plan from a clean checkout and write `docs/verification-report.md`
  (command, tool version, Sydney timestamp, commit, exit code, artifact hash,
  acceptance-criterion mapping, and every unrun/manual/external gate).

## Launch gates still blocked (cannot be closed by an agent)

Public launch stays blocked until these human/external items have real evidence:

- Genuine **approved poetry corpus** + rights/permission/licence records in
  `content-private/` (production build is *designed* to fail without it).
- Cultural review (Hafez/Rumi distinct, Persian pronunciation).
- Manual accessibility evidence: VoiceOver iOS/macOS, TalkBack Android, real-device
  portrait/landscape, 200% zoom, measured contrast, manual focus order.
- Real deployment: final hostname, Cloudflare tunnel/domain, provider logging,
  host/firewall, rollback rehearsal, SBOM/scan.
- Physical: printed QR test, campus Wi-Fi.

## Handy commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test
pnpm test:content && pnpm test:a11y && pnpm test:security   # scoped suites
pnpm build:fixture && pnpm verify:dist
pnpm test:e2e            # Playwright (Chromium) — separate from vitest
```
