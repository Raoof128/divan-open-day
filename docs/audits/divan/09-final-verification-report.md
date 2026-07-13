# DIVAN — Final Verification Report (UI/UX Gauntlet, Release 1 fixture)

## Executive result

- **Outcome:** **PASS WITH LAUNCH GATES**
- **Branch:** `feat/ui-ux-gauntlet-r1` · **Final commit:** `67958c9239f88f35bc5f51b7139279230a4e2e88` (2026-07-14, off `main` @ `6a102f5`)
- **Environment:** macOS (Darwin 25.5.0), Node 22.16.0, pnpm 10.33.0, Chromium via Playwright 1.61.1 (WebKit 26.5 / Firefox 151 for parity spot-checks)
- **Release under test:** synthetic fixture `test-only-fixture-release` (40 items, `productionEligible: false`)
- **Real blockers:** none for implementation quality. Public launch remains blocked by the intentional §31.2 gates (approved corpus + rights, cultural review, manual assistive-technology evidence, final hostname/short URL, University-mark approval, live deploy/tunnel/logging decision, rollback rehearsal, physical QR). None of these were fabricated or weakened; `build:production` and `verify:qr` still exit 1 by design.

## Audit summary

- **Process:** 5 independent read-only auditors (Cohort A) → lead-verified consolidated ledger (22 merged findings + rejections) → remediation plan with one-owner-per-file allowlists → 3 worktree-isolated writers (Cohort B) → lead integration + cross-writer fix → full gauntlet → 5 fresh adversarial reviewers (Cohort C) → repair loop → re-verification.
- **Cohort A raw findings:** 36 (UX 11, accessibility 6, responsive 5, performance 4, visual research 10 recommendations), deduplicated to ledger entries L-01…L-22.
- **By severity (consolidated):** Blocker 0 · Critical 0 · High 4 (L-01 spine-bar glyph clipping, L-02 missing §7.6 result actions, L-03 link contrast 1.56:1, L-04 identical poet result cards) · Medium 6 · Low 9 · Observations/production-track 3.
- **Fixed:** all 4 High, all fix-now Medium/Low (L-01…L-18, L-22), plus all 5 actionable Cohort C findings (FP-01 FCP regression, FV-01 action-zone composition, FC-01 Escape scope, FC-03 duplication, FA-01 group role).
- **Rejected with recorded evidence:** PERF-03 code-splitting (bundle at half budget; heavy dist-contract coupling), PERF-04 unused CSS (4.7 KB gzip total), RESP-02 68ch measure (within comfortable range), A11Y-06 role=status redundancy (accepted robustness pattern), FV-03/04/05 (deliberate restraint within the approved art direction, recorded in the visual-director report).
- **Deferred to launch gates (not fabricated):** L-19 nastaliq subsetting + reveal re-measure (runbook note added), L-20 kiosk idle-reset (deployment decision), L-21 canonical/OG/robots (need final hostname + rights-cleared image).
- **Unresolved Blocker/Critical/High after the repair loop: 0** — attested independently by all five Cohort C reviewers (`docs/audits/divan/final-review/*.md`) and re-verified after repairs.

## Visual evidence

- Baseline: `docs/audits/divan/screenshots/baseline/` · Final: `docs/audits/divan/screenshots/final/` (matching names/viewports/fixtures; 29 MB of local, regenerable evidence — excluded from git; regenerate with the session capture scripts against `pnpm build:fixture` + `vite preview`).
- Matrix: 320/390/667-landscape/768/1440 for the full flow; mobile+desktop for all five context pages; Rumi + Hafez results; reduced-motion result; offline.html.
- Before/after highlights: spine bar no longer paints over glyphs at any width (was +5.9 px intrusion at 320–390); Hafez (pomegranate/gold/cypress) vs Rumi (lapis/turquoise/gold) result cards now visibly distinct with unchanged parchment/text contrast; welcome star quieted behind the headline; About links dark red on paper; result action zone composed (4 pills + centred learn-more link + stall disclosure).
- Responsive: 160 viewport×state cells, zero horizontal overflow (Cohort A matrix, re-held after changes via the locked e2e visual matrix).

## UX evidence

- Complete flow both poets: 3 taps QR-to-verse, ~2.8 s. English → Persian → reflection → provenance order verified (§7.6).
- Back contract (§5.3) RESULT→INTENTION→CHOOSE_POET→WELCOME verified; refresh restores the result poem; refresh mid-flow now restores the chosen poet's intention (L-10); unknown deep paths land on Welcome with a clean `/` URL (L-12).
- Interruption: skip within 300 ms, Escape mirrors skip (scene-scoped), double-activation guarded, back-mid-reveal clean — zero page errors in every case.
- Repeat: full 24-draw Hafez no-repeat cycle verified with the cycle-reset announcement.
- Offline: after first load, SW-cached reload + new draws verified; §26.2 reassurance copy now announced on offline reload (L-11); offline surfaces reconciled (L-07).
- Audio failure (§26.4): poem retained, honest message, dead control removed (L-09).

## Accessibility evidence

- axe (WCAG 2.0/2.1/2.2 A+AA tags): **0 violations** on all flow scenes and all five context pages, including the result with the stall panel open (re-run after repairs).
- Measured contrast: all changed elements ≥ thresholds (context/result links 9.77:1; Rumi lapis h2 8.65:1 on parchment; full table in audit 03 and the final a11y review).
- Keyboard: full flow completable; focus never on `<body>` through the reveal (full and reduced motion, both poets); result heading focused on completion; skip link, disclosure semantics (aria-expanded/controls), and tab order verified.
- Bidi: parens outside the RTL isolate, `<bdi>` on mixed identifiers, `lang="fa" dir="rtl"` on every Persian region, structural `letter-spacing: 0` for Persian.
- Reflow: 320 px, text-spacing override, ~200% zoom, landscape — no loss/overflow. Reduced motion complete and persistent; Motion select honours system/reduced/full precedence.
- **Honest limits:** ASCII fixture cannot exercise Persian shaping/wrapping/nastaliq; automated axe ≠ WCAG conformance; VoiceOver/TalkBack, real-device zoom/orientation, and Persian pronunciation remain §20.2 manual launch gates.

## Performance evidence

(390×844, CPU 4×, ~1.6 Mbps/150 ms RTT, median of 3)

| Metric              | Target (§21.2) | Baseline | Final                                                                 |
| ------------------- | -------------- | -------- | --------------------------------------------------------------------- |
| LCP                 | ≤ 2.0 s        | 1,464 ms | **~1,212 ms**                                                         |
| CLS                 | ≤ 0.05         | 0.0064   | **0.0053**                                                            |
| FCP                 | (unbudgeted)   | 940 ms   | ~1,212 ms (regression contained from 1,364 ms by single-face preload) |
| Press-to-feedback   | ≤ 100 ms       | 3.3 ms   | ≤ 10 ms                                                               |
| Long task in reveal | ≤ 200 ms       | 0        | ~70 ms worst                                                          |

Budgets (§21.3, gzip): HTML 0.7 KB/40 · CSS 4.9 KB/45 · JS 93.6 KB/200 · welcome fonts (now 1 preloaded + swap) ≤ 91.5 KB/180 · images 0/500 · total ~194 KB/1,200 · offline set 0.66 MB/8 MB. All pass. dist membership unchanged; index.html carries exactly one local font preload + `viewport-fit=cover`; SW (`src-sw/`) untouched. Production-corpus risk (159 KB nastaliq at reveal) recorded in `docs/deployment-runbook.md`.

## Security & privacy evidence

- Runtime (full flow both poets + all pages + share/download): **0 external requests, 0 cookies, 0 fingerprinting calls**; sessionStorage limited to `divan.releaseId/selectedPoet/shuffle.*/currentPoemId`; localStorage only the motion preference.
- `pnpm verify:privacy` PASS · `pnpm verify:dist` PASS · `pnpm audit --prod` clean.
- Diff review: preload injection allow-listed + hash-anchored (no injection vector); share-card SVG escapes all dynamic values (holds for future Persian corpus); no inline script/style, no eval; no new storage keys; no EOI/ballot references; no secrets.
- Launch gates fail-closed: `build:production` exit 1 (no approved corpus), `verify:qr` exit 1.

## Test evidence

All on Node v22.16.0 / pnpm 10.33.0, final commit `67958c9`, 2026-07-14 (AEST):

| Command                                | Result                                                                  | Exit |
| -------------------------------------- | ----------------------------------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile`       | up to date                                                              | 0    |
| `pnpm format:check`                    | clean                                                                   | 0    |
| `pnpm lint` (eslint, --max-warnings 0) | clean                                                                   | 0    |
| `pnpm typecheck` (tsc strict)          | clean                                                                   | 0    |
| `pnpm test` (vitest)                   | **34 files, 499/499**                                                   | 0    |
| `pnpm test:e2e` (Playwright Chromium)  | **5/5** (a11y×2, offline lifecycle, visual matrix, reveal choreography) | 0    |
| `pnpm build:fixture` → `verify:dist`   | fixture 40 items verified                                               | 0    |
| `pnpm verify:privacy`                  | pass                                                                    | 0    |
| `pnpm audit --prod`                    | no known vulnerabilities                                                | 0    |
| `bash scripts/check.sh --e2e`          | quality gate passed                                                     | 0    |
| `pnpm build:production`                | fail-closed (intended)                                                  | 1    |
| `pnpm verify:qr`                       | fail-closed (intended)                                                  | 1    |
| Docker ops evidence                    | skipped — no daemon on this host (unchanged blocker)                    | —    |

Vitest grew 472 → 499 (27 new behavioural tests; none deleted or weakened — one e2e audio block rewritten to follow the natural stub-failure path with attribute coverage retained in jsdom, reviewed by the code-regression reviewer).

## Acceptance matrix (§31.1)

| #     | Criterion                                                  | Status                                 | Evidence                                                                          |
| ----- | ---------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| 1     | Approved URL opens DIVAN                                   | **Gated**                              | no approved hostname exists (§31.2)                                               |
| 2     | Mobile+desktop visual systems complete                     | **Pass (fixture)**                     | screenshot matrix, 0-overflow grid                                                |
| 3     | Hafez/Rumi culturally distinct                             | **Pass**                               | distinct scenes + now-distinct result cards (L-04)                                |
| 4     | English precedes Persian                                   | **Pass**                               | §7.6 order verified both poets, e2e                                               |
| 5     | Persian live RTL text + markup                             | **Pass (structure)**                   | lang/dir/bdi verified; shaping needs real corpus                                  |
| 6     | Edition provenance/rights/reviews per item                 | **Gated**                              | fixture sentinels only; compiler enforces fail-closed                             |
| 7     | Reflection labelled non-predictive                         | **Pass**                               | heading + disclaimer verified                                                     |
| 8     | Keyboard + screen-reader completion                        | **Pass (automated)** / manual AT gated | keyboard e2e, axe 0; §20.2 matrix outstanding                                     |
| 9     | Reduced motion preserves experience                        | **Pass**                               | e2e + reviewer verification                                                       |
| 10    | No personal info requested/stored                          | **Pass**                               | storage inventory                                                                 |
| 11    | No analytics/tracking/social SDK                           | **Pass**                               | 0 external requests; verify:privacy                                               |
| 12    | Secure shuffle bag, no session repeats                     | **Pass**                               | 24-draw cycle verified                                                            |
| 13    | Works offline after first load                             | **Pass**                               | e2e offline lifecycle + manual walk                                               |
| 14    | Failed update retains previous release                     | **Pass**                               | e2e offline spec                                                                  |
| 15    | Audio optional + rights-cleared                            | **Pass (fixture)**                     | no autoplay; honest failure; rights gated with corpus                             |
| 16    | Share content generated locally                            | **Pass**                               | 0 network calls during share/download                                             |
| 17    | Performance budgets pass                                   | **Pass**                               | tables above                                                                      |
| 18–20 | Tunnel-only path, no public ports, no egress web container | **Gated (ops)**                        | ops configs reviewed & tested; live deploy evidence needs a Docker host + droplet |
| 21    | Rollback tested                                            | **Gated**                              | scripts tested via mocks; live rehearsal outstanding                              |
| 22    | EOI/ballot unchanged                                       | **Pass**                               | untouched; verified in diff review                                                |
| 23    | QR physical matrix                                         | **Gated**                              | verify:qr fail-closed                                                             |
| 24    | Verification evidence complete                             | **Pass (this report)**                 | docs/audits/divan/*                                                               |

## Changed-file summary (24 files, +881/−68, excluding audit docs)

- **Design system (CSS):** `src/styles/visual.css`, `src/app/core.css` — spine-bar clearance, light-surface link colour, poet-keyed result accents, welcome polish, fa tracking guard, safe-area padding, composed learn-more zone.
- **Experience/a11y (TSX):** `src/app/App.tsx`, `src/components/PoemResult.tsx`, `src/components/SourceCredit.tsx`, `src/scenes/ChoosePoetScene.tsx`, `src/scenes/RevealScene.tsx` — §7.6 actions, reveal focus, bidi parens, audio-failure honesty, restore matrix, offline-reload announcement (extracted), URL hygiene, scoped Escape-to-skip, group role.
- **Build/pages/share:** `scripts/build.ts` (single display-face preload injection), `index.html` (+viewport-fit, description), `public/offline.html`, `src/pages/AboutPage.tsx`, `src/pages/OfflinePage.tsx`, `src/lib/share/shareCard.ts` (1200×630 compression-surviving card).
- **Tests:** 8 files, 27 net-new behavioural tests (styles guardrails, action/disclosure semantics, focus-through-reveal, restore matrix, offline announcement, preload injection incl. fail-closed ambiguity, share-card contract, e2e focus/audio assertions).
- **Docs:** `docs/deployment-runbook.md` (nastaliq/launch note), `docs/audits/divan/*` (9 reports + 5 final reviews), `.gitignore` (local-only files + screenshot evidence).

## Honest limitations

- The fixture's ASCII sentinels mean Persian shaping, wrapping, nastaliq rendering, and true verse lengths are unexercised; the spine-bar RTL line-end clearance and the nastaliq swap cost must be re-checked with the real corpus (runbook note added).
- Runtime metrics are throttled-Chromium proxies, not device-certified; Lighthouse was unavailable without new installs.
- WebKit/Firefox coverage is desktop-engine parity, not real iOS Safari/Android Chrome; safe-area behaviour needs physical notched hardware.
- Automated axe results support but do not establish WCAG conformance (§20.3); the §20.2 manual matrix (VoiceOver, TalkBack, Persian pronunciation, real zoom) remains a launch gate.
- Docker/ops runtime evidence remains environment-blocked on this host (no daemon), unchanged from the prior baseline.
