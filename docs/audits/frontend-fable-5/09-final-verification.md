# Fable 5 frontend audit — Phase 10 final verification gauntlet

Date: 2026-07-17 (Australia/Sydney). Branch `audit/fable-5-exhaustive-frontend` @ `dff4075` (5 commits over `e348048`). Node v22.16.0, pnpm 10.33.0, Vite 8.1.4, TS 6.0.3, Vitest 4.1.10, Playwright 1.61.1.

## Repository gauntlet (fresh, post-repair)

| Command | Exit | Result |
| --- | --- | --- |
| `bash scripts/check.sh --ci` (12:07–12:10 AEST) | **0** | Whole gate green: source locks 9/9 · format:check · lint 0 warnings · typecheck · **test 713/713 (62 files)** · build:fixture (40 items) · verify:dist + public-bundle leak · verify:privacy · OSV audit (429 packages, no issues) · **build:production 120 items** (`ci-production-verification`) · **Playwright e2e 5/5** · `verify:qr` fail-closed as intended · Docker evidence skipped (no daemon; out of scope) |
| Focused suites (individually, during repairs) | 0 | offline 56/56 · accessibility 25/25 · performance 6/6 · components+unit 140/140 · share 27/27 |

Test delta vs baseline: 705 → **713** (+8 net-new regression tests; none deleted; one assertion adjusted to a strictly stronger form — see 08).

## Rendered re-verification (repaired production build `fable5-rendered-audit`, 120 items, served on 127.0.0.1:4173)

Multi-engine matrix (Playwright Chromium/WebKit/Firefox, 2026-07-17T02:10Z run; emulated engines — WebKit ≠ branded Safari):

| Check | Chromium | WebKit | Firefox |
| --- | --- | --- | --- |
| 10-viewport overflow matrix (320→1440, worst-case record) | PASS | PASS | PASS |
| `#persian-heading` font stack (D-2) | **Nastaliq stack** | **Nastaliq stack** | **Nastaliq stack** |
| Verse-card download event (D-6) | PASS | PASS | PASS |
| Cinematic settled state (no user gesture) | playing | poster (cold-start flake → designed fallback; gesture prime not exercised without a click) | playing |
| Console errors | 0 | 1 (known spurious font-preload warning, O-3) | 0 |

Targeted post-repair probes:

- **D-1:** Chromium — delete release cache (pointer intact) → online reload → **app fully recovers** (welcome renders, 0 failed requests, SW still controlling). Pre-repair this was a permanent 504-broken page.
- **D-4:** WebKit — Begin pressed at poster state → entered chooser in **205 ms** (pre-repair worst case ~4s gate wait); component test pins the muted gesture prime + pause-on-presented; residual: cinematic availability on real Safari/iOS remains unverifiable in this environment.
- **D-2:** WebKit full-page capture — متن فارسی renders in Nastaliq, colour keying intact, no clipping (line box 2×).
- **D-3:** Chromium aria snapshot — `button "Begin"` (decorative ✦ no longer in the accessible name).
- Reduced-motion, Save-Data, video-error, offline-cache flows, Back/Forward focus restoration, refresh restore, context pages, share fallbacks: re-exercised during Phase 6/8 on this branch (06-rendered-state-matrix.md) and covered by the green e2e suite (keyboard+axe both poets @320px, motion precedence + audio failure, offline lifecycle incl. update failure + rollback, locked visual matrix ×5 viewports with zero remote requests, reveal choreography introspection).
- Performance: lab CLS 0.00 (trace, 390×844, 4× CPU, Fast 4G); LCP on loopback ~100ms (not a field claim); INP structurally unmeasurable without field data — interaction handlers audited instead. Bundle: authored CSS 36.7KB/45KB lock; compressed budgets enforced by the passing visualBudgets suite; production dist verified exact-file-set with zero remote references and no source maps.

## Honest evidence boundary

Emulated/automated only: Chromium (CDP+Playwright), Playwright WebKit/Firefox builds. **No** physical-device, branded-Safari, iOS/Android hardware, VoiceOver/TalkBack, print, or field measurements are claimed — those remain §31.2 launch-gate items. The live site `divan.raoufabedini.dev` was not touched, deployed to, or mutated; all verification is local.

## Verdict input

Zero unresolved Blocker/Critical/High findings. All six repaired defects verified at test and rendered levels. Launch gates remain fail-closed (`verify:qr` verified; `build:production` is a required passing gate per repo policy, not a launch approval).
