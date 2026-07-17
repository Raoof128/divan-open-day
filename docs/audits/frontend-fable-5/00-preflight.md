# Fable 5 exhaustive frontend audit — Phase 0 preflight

Date: 2026-07-17 (Australia/Sydney)
Lead: Claude Fable 5 (model ID `claude-fable-5`)

## Repository identity and state

| Item | Value |
| --- | --- |
| Working directory | `/Users/raoof.r12/Desktop/Raouf/OpemDay` |
| Git toplevel | `/Users/raoof.r12/Desktop/Raouf/OpemDay` |
| Remote | `origin https://github.com/Raoof128/divan-open-day.git` (fetch+push) |
| Source `main` SHA | `e3480481d09474849449cb504c9c2424e49e4fd3` (local `main` == `origin/main`) |
| Audit branch | `audit/fable-5-exhaustive-frontend` created from `origin/main` @ `e348048` |
| Fetch | `git fetch --all --prune` run; only new remote ref was `origin/docs/fable-5-frontend-file-audit-goal` (documentation branch carrying this goal — NOT used as the working base) |

### Untracked files present before the audit (preserved, never touched)

```
New_Frontend/                                                    (protected local input, lint-ignored)
docs/audits/frontend-opus-4-8/00-goal.md                         (superseded Opus 4.8 goal text)
scripts/poetry/build-hafez-align-tasks.ts                        (protected local alignment input)
sources-private/poetry/reports/hafez-align-tasks.json            (private poetry evidence)
sources-private/poetry/reports/hafez-clarke-align-proposals-UNVERIFIED.json (private poetry evidence)
sources-private/poetry/reports/hafez-ghazal-matlas.json          (private poetry evidence)
```

None of these are frontend files; none will be modified, committed, or deleted.

## Instruction files read completely before any change

1. `AGENT.md` (781 lines — repository rules, engineering contract, change protocol, full Raouf change log). Key binding rules: never fabricate content/rights/approvals; no analytics/cookies/remote resources/raw HTML; English-before-Persian with live `lang="fa" dir="rtl"` text; TDD for behaviour; dated `Raouf:` entries in `AGENT.md` + `CHANGELOG.md` after changes; `.env`/private records stay out of output.
2. `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md` (2,926 lines — Release 1 design authority; §5 state machine/history/storage contract, §6–9 visual/typography/motion, §12 schemas, §14 draw, §15 share, §16 offline, §20 accessibility, §21 budgets, §22 CSP/headers, §29 tests, §30 evidence, §31 gates).
3. `CLAUDE.md` (project-local, git-ignored) and `~/.claude/CLAUDE.md` (user-global).
4. `README.md`, `CHANGELOG.md` (head; body mirrors AGENT.md change log), `package.json`, `vite.config.ts`, `playwright.config.ts` (re-exports `tests/e2e/accessibility.playwright.config`), `tsconfig.json`, `eslint.config.js`.
5. `docs/verification/visible-navigation-and-cinematic-begin.md`, `docs/verification/divan-cinematic-enhancement-report.md` (cinematic + navigation behaviour and evidence); remaining verification/audit documents are read during Phases 3–5 as file-by-file inputs.

Precedence applied throughout (per goal §1.3): current user goal → repository instruction files (`AGENT.md` + design authority) → Release 1 design authority → nearest applicable skill contract → general guidance.

## Baseline facts the audit takes as fixed (not reopened)

- Production corpus: exactly 60 Hafez + 60 Rumi = 120 records (`v1.0.3`, release `divan-release-1-v1-0-3`).
- Cinematic scroll-scrub entrance with poster-first fallbacks; visible "Choose another poet" navigation; layered book opening; candle/butterfly/mote atmosphere.
- Live public site `https://divan.raoufabedini.dev` (owner-authorised public-access override, 2026-07-16). The audit never deploys, merges, tags, or mutates the live site.
- Deployment/DNS/tunnel/Docker/firewall configuration is out of scope.
- Poetry text, translations, provenance, rights, and corpus selection are content authority and are not edited; their **frontend presentation** is in scope (§5.10 of the goal).

## Toolchain (from pinned manifests; exact runtime versions recorded in Phase 4)

Node 22.16.0 (`.node-version`), pnpm 10.33.0 (`packageManager`), Vite 8.1.4, React 19.2.7, TypeScript 6.0.3, Vitest 4.1.10, Playwright 1.61.1, ESLint 10.7.0, Prettier 3.9.5, zod 4.4.3, `@axe-core/playwright` 4.12.1.

## Initial blockers / environmental notes

- `pnpm audit --prod` is known-failing environment-wide: npm retired the configured audit endpoints (HTTP 410). Pre-existing; recorded, not hidden.
- `pnpm lint` at repo root previously failed on untracked `New_Frontend/**`; `eslint.config.js` now ignores it — verified in Phase 4.
- Docker daemon evidence (`ops/scripts/verify.sh`) is skipped by `check.sh` when no daemon runs; ops is out of audit scope anyway.
- Physical-device, VoiceOver/TalkBack, Safari-hardware, Android-hardware, print, and field evidence are NOT available in this environment and will never be claimed. Browser evidence is emulated/automated (Chromium via CDP/Playwright; WebKit/Firefox via Playwright if installable) and will be labelled as such.

## Working rules for this audit

- Isolated branch `audit/fable-5-exhaustive-frontend`; no work on `main` or the docs goal branch.
- No `git add -A`, force-push, reset, clean, or history rewriting; focused commits only.
- No dependency upgrades unless a verified defect cannot otherwise be repaired safely.
- No reading of `.env` or any credential file.
- Test-driven repair for all behavioural changes; no weakening of tests, gates, privacy, or fail-closed behaviour.
