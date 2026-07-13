# DIVAN — Final Browser Performance Review (post-remediation)

Re-verification of the fixture `dist/` after the UI/UX remediation pass, measured against the
Audit-05 baseline (`docs/audits/divan/05-frontend-performance-baseline.md`).

- **Branch:** `feat/ui-ux-gauntlet-r1` · **Artifact:** live fixture at `http://127.0.0.1:4173/`
  (`buildProfile: fixture`, `productionEligible: false`) — server not restarted, `dist/` not rebuilt.
- **Date:** 2026-07-14
- **Method:** read-only. `gzip -9` byte measurement of `dist/`; `pnpm verify:dist` + `pnpm verify:privacy`;
  source/diff inspection; Node-Playwright (Chromium 1.61.1) with CPU 4× throttle + CDP net emulation
  (~1.6 Mbps down / 150 ms RTT), viewport 390×844, 3-run median, same scripts the baseline used.
- **Changes under review:** 3 local font preloads injected into `index.html`; `viewport-fit=cover`;
  ~70 lines new CSS; new result-card DOM (disclosure + source link); share-card SVG rework; App/scene wiring.
- **Headline:** **No Blocker / Critical / High.** LCP and CLS both improved; the release-integrity chain,
  privacy, and dist membership are intact; `src-sw/` untouched. One notable regression: **FCP is ~45%
  slower on the throttled profile (940 → 1364 ms)** because the three high-priority font preloads now
  contend with the render-critical JS in this client-rendered SPA. It is a deliberate trade (it eliminates
  the welcome-font FOUT and improves LCP/CLS), is not a §21.2-budgeted metric, and does not block launch —
  but it is a real >10% regression and is recorded as FP-01 (Medium).

---

## Metric comparison — baseline vs final

Runtime = median of 3 cold runs, CPU 4× + net ~1.6 Mbps / 150 ms, 390×844.

| Metric                                     | §21 limit          | Baseline |         Final |     Δ | Verdict                     |
| ------------------------------------------ | ------------------ | -------: | ------------: | ----: | --------------------------- |
| **LCP**                                    | ≤2.0 s / 2.5 s max | 1,464 ms |  **1,352 ms** |   −8% | PASS · improved             |
| **CLS**                                    | ≤0.05 / 0.1 max    |   0.0064 |    **0.0053** |  −17% | PASS · improved             |
| **FCP** (first _contentful_ paint)         | — (unbudgeted)     |   940 ms |  **1,364 ms** |  +45% | see FP-01                   |
| first-paint (background)                   | —                  |        — |        580 ms |     — | non-contentful (theme bg)   |
| Press-to-feedback ("Press to reveal")      | ≤100 ms            |   3.3 ms | **4.5–10 ms** |    +↑ | PASS (huge margin) · FP-03  |
| Longest task during reveal                 | none >200 ms       |     0 ms |  **66–73 ms** |    +↑ | PASS (under 200 ms) · FP-02 |
| Reveal render completed                    | —                  | 1/1 runs |      1/1 runs |     = | PASS                        |
| Cold-load transfer (full flow)             | ≤1.2 MB            |  ~194 KB |       ~195 KB | +1 KB | PASS                        |
| Console / page errors (full flow ×2 poets) | 0                  |        0 |         **0** |     = | PASS                        |
| Failed requests (full flow + 5 routes)     | 0                  |        0 |         **0** |     = | PASS                        |
| External requests                          | 0                  |        0 |         **0** |     = | PASS                        |

### Transfer / bundle budgets (§21.3), gzip −9

| Asset                | Budget | Baseline gz |     Final gz | Verdict                                   |
| -------------------- | -----: | ----------: | -----------: | ----------------------------------------- |
| `index.html`         |  40 KB |       736 B |    **878 B** | PASS (+142 B: 3 preloads + viewport meta) |
| `assets/index-*.js`  | 200 KB |    93,628 B | **94,153 B** | PASS (+525 B)                             |
| `assets/index-*.css` |  45 KB |     4,840 B |  **5,007 B** | PASS (+167 B; authored 24.5 KB < 45 KB)   |
| `service-worker.js`  |      — |    23,981 B | **23,981 B** | unchanged (`src-sw/` untouched)           |
| `offline.html`       |      — |       515 B |    **629 B** | PASS (offline copy reconciliation)        |
| welcome fonts        | 180 KB |     91.5 KB |  **91.5 KB** | PASS (font bytes/hashes unchanged)        |
| Nastaliq (deferred)  |      — |    159.4 KB | **159.4 KB** | unchanged; still lazy (0 B in fixture)    |
| Initial images       | 500 KB |           0 |        **0** | PASS (SVG icon only)                      |
| Initial audio        |      0 |           0 |        **0** | PASS (`preload="metadata"`, 1/40 items)   |

**Membership: unchanged.** `dist/` contains the exact same file set as the baseline — no new files added
(verified by `find`). `index.html` now carries **exactly 3** local font preloads + `viewport-fit=cover`
(verified). `pnpm verify:dist` → "Verified fixture release (40 items)"; `pnpm verify:privacy` → passed.
The injected `index.html` sha256 is present in the asset manifest → the digest/release-integrity chain
captured the injection correctly.

---

## Verification detail

**1. Font-phase timing (the point of the change).** Preloaded faces now start at ~188 ms — the same
moment as the document/CSS/JS requests (186–188 ms), i.e. **at TTFB, before CSS is parsed** — whereas the
non-preloaded `inter-700` starts at 1281 ms. The three critical faces finish at ~800–822 ms, **before**
contentful paint at 1364 ms, so welcome text paints directly in the correct fonts (**FOUT eliminated**;
consistent with the CLS improvement). PERF-01 from the baseline is genuinely remediated. ✅

**2. Reveal animation.** Still composited — no new `transition`/`@keyframes`/layout-animated properties in
the CSS diff (only `line-height`, a media query, a static `opacity`). Warm reveal cycles produced 0 long
tasks. The ~70 ms task (FP-02) is a one-time render/commit of the richer result card on the first reveal,
not per-frame animation jank. ✅

**3. Integrity — full flow, both poets, all context pages.** Hafez + Rumi driven end-to-end (up to 8
reveals each) plus `/about /privacy /accessibility /credits /offline` (all HTTP 200): **0 console errors,
0 page errors, 0 failed requests, 0 external requests.** ✅

**4. Audio.** Only `test-only-hafez-01` (1 of 40 items) carries audio; the `<audio>` uses
`preload="metadata"` with no autoplay, so nothing loads in the passive flow and it is never in the initial
payload. It remains the single audio-bearing item; its stub is a decode/metadata concern on that one poem,
not a network failure, and is out of scope for performance. ✅

**5. `scripts/build.ts` determinism & integrity.** `injectFontPreloadLinks` iterates a fixed
`PRELOADED_FONT_FILE_STEMS` array (stable order, **not** `readdir` order), matches each stem against a
regex constrained to `assets/<stem>-<16 hex>.woff2`, throws on >1 match, and emits **root-relative local**
`href="/assets/…"` only. It reads the **emitted** hashed names from the staged build and runs **before**
the manifest/digest step, so hashes flow through correctly (confirmed: dist `index.html` digest ∈ manifest;
`verify:dist` passes). No path traversal, no remote-href risk, no fabricated assets (absent faces are
skipped). Deterministic across rebuilds. ✅

**6. Service worker.** `git diff main...feat/ui-ux-gauntlet-r1 -- src-sw/` is **empty** — no SW-contract
change. ✅

---

## Issue records

### FP-01 — FCP regressed ~45% on the throttled profile (font preloads contend with render-critical JS)

- **Severity:** Medium · **Confidence:** High · **Not a blocker, not a budget breach.**
- **Evidence:** FCP median 940 ms (baseline) → 1,364 ms (final), same script/methodology. Resource
  finish-times explain it: on the 1.6 Mbps pipe the three preloaded faces (~68 KB, High priority) finish at
  ~800–822 ms, delaying the render-critical JS chunk to 1,159 ms; React then paints first content at
  1,364 ms. Because `#root` is empty (client-rendered SPA), contentful paint is gated on that JS. Baseline
  discovered fonts late (post-CSS), so the JS had the pipe to itself and painted content sooner — but in
  fallback fonts, then swapped (the FOUT this change removes).
- **Design §:** 21.2 (LCP/CLS are the budgeted targets — both improved; FCP is unbudgeted).
- **Root cause:** `scripts/build.ts` `injectStagedFontPreloads` promotes 3 fonts to High-priority preloads
  that share the constrained downlink with the entry JS.
- **Trade-off (honest):** the change **improves LCP (−8%) and CLS (−17%) and eliminates welcome FOUT** —
  defensible for a typography-forward experience. The cost is ~420 ms later first content on a pessimistic
  4×-CPU / 1.6 Mbps proxy; on real device/network the gap is proportionally smaller.
- **Options (if FCP is prioritised):** (a) preload only the single most-visible welcome face
  (Cormorant-500) rather than all three, restoring most JS bandwidth; (b) keep all three but accept the
  trade; (c) longer-term, drop `crossorigin`-competing fonts to `rel=preload` with lower fetch priority, or
  reduce entry-JS weight (PERF-03 code-split) so JS is not the FCP bottleneck. Recommend (a) — measure FCP
  with a single preload and keep it only if FCP recovers toward ~940 ms without reintroducing FOUT.
- **Verification:** re-run `timing.mjs`; assert FCP recovers and LCP/CLS stay improved.

### FP-02 — Reveal introduces a reproducible ~70 ms long task (baseline 0)

- **Severity:** Low · **Confidence:** High
- **Evidence:** all 3 cold runs showed one 66–73 ms `longtask` during the first reveal (baseline: 0 across
  all runs). Warm subsequent reveals: 0. Attributable to the richer result-card DOM (disclosure + source
  link) committing on first reveal.
- **Design §:** 21.2 (limit: no task >200 ms). **PASS** — 70 ms is well under budget; ~17 ms on unthrottled
  hardware. No fix required; recorded so the delta from baseline is not mistaken for a defect later.

### FP-03 — Press-to-feedback rose from 3.3 ms to ~4.5–10 ms

- **Severity:** Info · **Confidence:** High
- **Evidence:** median press latency 4.5–10 ms across runs vs 3.3 ms baseline — the heavier reveal render
  is dispatched on press. Limit is 100 ms; margin is ~10×. No action.

### FP-04 — Injected preload lines have cosmetic indentation drift

- **Severity:** Info · **Confidence:** High
- **Evidence:** the first injected `<link rel="preload">` sits at a different indent than the following two
  in `dist/index.html`. Zero functional/parse/perf/CSP impact; output is deterministic. Cosmetic only.

---

## Unresolved severity count

| Severity |                             Count |
| -------- | --------------------------------: |
| Blocker  |                             **0** |
| Critical |                             **0** |
| High     |                             **0** |
| Medium   | 1 (FP-01, non-blocking trade-off) |
| Low      |                         1 (FP-02) |
| Info     |                  2 (FP-03, FP-04) |

## Limitations

- Fixture, not production corpus: the 159 KB Nastaliq download and its Reveal-screen swap (baseline PERF-02)
  are still unexercised by the ASCII fixture and remain the largest unmeasured pre-launch risk.
- CPU 4× / 1.6 Mbps is a pessimistic mid-mobile proxy; absolute FCP/LCP scale down on real hardware. The
  FP-01 delta is directional. Lighthouse not run (not installed; no packages added).
- TTFB is localhost-flattered (~21 ms); the production tunnel adds real latency not modelled here.
- Read-only: no `dist/`, source, or server changes were made.
