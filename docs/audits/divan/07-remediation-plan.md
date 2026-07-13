# DIVAN — Remediation Plan

**Date:** 2026-07-13 · **Input:** 06-consolidated-issue-ledger.md
**Baseline:** `main` @ `6a102f5`, all suites green (472 vitest, 5 e2e), fixture 40 items.

## Writer consolidation decision

The audit produced a modest, heavily CSS-centred fix set. Five writers would force multiple owners onto `src/styles/visual.css` and `src/app/App.tsx` — a direct conflict with the one-owner-per-file rule. Cohort B is therefore **three worktree-isolated writers** whose scopes preserve the five role boundaries (design-system + motion-visual merged: both own only CSS; experience-ui + accessibility-responsive merged: both own only app/component TSX + their tests; pwa-share-audio standalone: build/pages/share/manifest).

Cross-cutting invariants for every writer:

- TDD: meaningful failing test first where automatable; never weaken existing assertions or delete tests.
- Locked visual system (`tests/performance/visualBudgets.test.ts`): colors defined once in tokens.css; transform/opacity/bounded-stroke animation only; authored CSS ≤ 45 KB.
- Keep accessible names stable ("Begin", "Press to reveal", "Reveal another", "Save this verse", "Download verse card").
- One polite live region; no new `role="status"`.
- Never fabricate content/rights/stall identifiers; "Return to the stall" is a generic Society invitation.
- Prettier (single quotes, 80 cols); strict TS (`noUncheckedIndexedAccess`).
- Do NOT run `pnpm test:e2e` (port 4173 is held by the lead's preview server); do NOT touch AGENT.md/CHANGELOG.md (lead logs once at integration).
- No new dependencies. No remote resources. No new dist files (except deliberate index.html byte changes by Writer C).

---

## Task W-A — design-system-engineer (CSS only)

**Owns (allowlist):** `src/styles/tokens.css`, `src/styles/visual.css`, `src/styles/fonts.css`, `src/app/core.css`, `tests/accessibility/styles.test.ts`, `tests/performance/visualBudgets.test.ts` (only if a budget/lock assertion must learn a new token — never loosened).
**Forbidden:** all TSX, scripts/, public/, index.html, src-sw/.

| Ledger          | Objective                                                                                                                                                                                                                                                                                         | Acceptance                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| L-01            | Frame padding clears the spine bar at every width (option A: `padding-inline-start: max(2rem, clamp(1.25rem, 5vw, 4rem))` + fix the ≤24rem override)                                                                                                                                              | geometry check overlap ≤ 0 at 320–1440; style test pins the relationship            |
| L-03            | Links on light surfaces get ≥4.5:1 (scope `.context-document a` to `--deep-red` or `--lapis`, keep underline; night links stay gold)                                                                                                                                                              | measured ratio ≥ 4.5:1; style test                                                  |
| L-04            | Poet-keyed result card via existing `.poem-result[data-visual-language]`: spine-bar gradient hues + `h2`/accent tone per poet (garden-night: pomegranate/cypress/warm gold; lamp-constellation: lapis/turquoise). CSS only; parchment surface and text colors keep measured contrast ≥ thresholds | Hafez vs Rumi result screenshots visibly distinct; contrast unchanged for body text |
| L-08            | Welcome star no longer crosses headline glyphs (opacity/position/scale of `.manuscript-portal__corners` / field behind heading)                                                                                                                                                                   | visual check 1440/1920                                                              |
| L-15            | `.welcome-persian` modest parity lift (size/rhythm), English H1 still leads                                                                                                                                                                                                                       | visual check                                                                        |
| L-16            | `[lang='fa']` gets structural `letter-spacing: 0`; style test asserts it                                                                                                                                                                                                                          | test                                                                                |
| L-22 (CSS half) | `env(safe-area-inset-*)` max() padding on `.utility-header`, `.skip-link`, scene gutters                                                                                                                                                                                                          | static CSS assertion in style test                                                  |

## Task W-B — experience-a11y-engineer (app/components TSX + their tests)

**Owns:** `src/app/App.tsx`, `src/components/PoemResult.tsx`, `src/components/SourceCredit.tsx`, `src/scenes/ChoosePoetScene.tsx`, `src/scenes/RevealScene.tsx`, `tests/components/**`, `tests/accessibility/appAccessibility.test.tsx`, `tests/e2e/accessibility.spec.ts`.
**Forbidden:** all CSS files (request selectors from existing classes only; if a genuinely new class is needed, use existing utility classes or inline the minimal semantic hook via data-attribute and tell the lead), scripts/, public/, src/lib/share/ internals, src-sw/.

| Ledger | Objective                                                                                                                                                                             | Acceptance                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| L-02   | Add "Learn about the poet" (anchor to `/about`) + "Return to the stall" (disclosure/panel with generic Society invitation, no location, no fabricated stall number) to result actions | component test asserts actions; a11y roles correct |
| L-05   | Focus never drops to `<body>` during revealing (set focus request to scene heading on REVEAL; don't steal from Skip)                                                                  | unit + e2e assertion                               |
| L-06   | Parentheses moved to LTR flow around `<bdi lang="fa" dir="rtl">{workFa}</bdi>`; test asserts placement                                                                                | DOM test                                           |
| L-09   | Hide `<audio>` when `audioUnavailable`; keep §26.4 message                                                                                                                            | extend audio-failure test                          |
| L-10   | Refresh with persisted poet but no poem restores INTENTION for that poet                                                                                                              | restore-matrix unit test                           |
| L-11   | Offline reload announces §26.2 copy + offline badge when SW-active release serves offline                                                                                             | component test with mocked offline status          |
| L-12   | Unknown path → `history.replaceState('/')` on boot                                                                                                                                    | unit test                                          |
| L-14   | Hafez card copy de-duplicated ("A tradition-inspired reading.") — accessible name "Open the Divan" unchanged                                                                          | test string update                                 |
| UX-10  | Escape during reveal triggers the Skip handler                                                                                                                                        | component test                                     |

## Task W-C — pwa-share-build-engineer (build, pages, share, manifest)

**Owns:** `scripts/build.ts`, `index.html`, `public/manifest.webmanifest`, `public/offline.html`, `src/pages/**`, `src/lib/share/**`, `tests/share/**`, `tests/content/buildRelease.test.ts`, `tests/content/release.test.ts`, `tests/offline/**` (only where dist-lock assertions must learn new index.html bytes).
**Forbidden:** src/app, src/components, src/scenes, src/styles, src-sw/ (release/MIME schemas unchanged — no new dist files allowed in this pass).

| Ledger           | Objective                                                                                                                                                                                                                       | Acceptance                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| L-07             | Reconcile offline copy: `public/offline.html` (SW recovery artefact) and `src/pages/OfflinePage.tsx` no longer conflict; add `/credits` to offline.html nav; link the offline explanation from the Accessibility page if absent | copy-consistency test/check; verify:dist green |
| L-13             | Align index.html + manifest descriptions                                                                                                                                                                                        | string equality                                |
| L-17             | Build-generated font preloads (inter-400, cormorant-500, vazirmatn-400) injected into emitted index.html by `scripts/build.ts` from real hashed names; local hrefs only                                                         | verify:dist green; font requests start ≈TTFB   |
| L-18             | Share-card compression review: bold high-contrast type, ≥1200×630, no hairlines, credit legible; keep fully local                                                                                                               | share tests assert dimensions/weights          |
| L-22 (meta half) | `viewport-fit=cover` added to viewport meta                                                                                                                                                                                     | dist test                                      |
| L-19 (doc half)  | Add the nastaliq-subsetting + reveal re-measure note to `docs/deployment-runbook.md` launch checks — factual, no fabricated evidence                                                                                            | doc review                                     |

**Warning for W-C:** `dist/` is an exact-set contract. index.html byte changes are fine (hash recomputed); NEW files are not permitted. If a fixed asset would be needed, stop and report instead.

---

## Dependencies & integration order

W-A, W-B, W-C are file-disjoint and run in parallel. Integration order: **W-A (design system) → W-B (experience/a11y) → W-C (build/pages/share)**, focused tests after each, then full `scripts/check.sh --e2e`, final screenshot capture, Cohort C.

## Explicitly deferred (no writer)

L-19 subsetting itself, L-20 kiosk reset, L-21 canonical/OG/robots — launch-gated; recorded in ledger and runbook only.
