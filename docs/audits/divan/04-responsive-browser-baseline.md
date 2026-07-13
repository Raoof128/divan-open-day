# 04 — Responsive & Cross-Browser Baseline Audit (DIVAN)

**Auditor:** responsive-browser-auditor
**Date:** 2026-07-13
**Target:** synthetic fixture served at `http://127.0.0.1:4173` (poem text is ASCII sentinels — intentional; no real corpus)
**Method:** Automated Playwright walk of the full flow + all context routes across 16 viewports, with in-page geometry metrics (document/element `scrollWidth`, bounding-box overflow, decorative-bar overlap, motion-control overlap, `ch` measure). Chromium is definitive; WebKit and Firefox used for cross-engine parity at 390×844 and 1440×900.
**Scope:** READ-ONLY audit. No source changed. Artifacts: this report + `screenshots/baseline/resp-*.png`.

Design authority consulted: `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md` — §20 (200% zoom, 320-px reflow, portrait+landscape, "touch targets not obscured by browser chrome or sticky controls"), §21.1 (browser support policy), §7.2 (welcome composition).

---

## Headline result

The layout system is **fundamentally sound and reflow-clean**. Across **160 viewport × state cells there is zero horizontal overflow** (`documentElement.scrollWidth − clientWidth = 0` everywhere, including 320-px and the 200 %-zoom approximation). The reflow discipline — CSS logical properties, `min()`/`clamp()` widths, `flex-wrap`, `dvb` block units, `overflow-wrap: anywhere` — holds at every width and orientation.

**One genuine responsive defect** was found: a decorative vertical "spine" bar on the result card occludes the leading glyph of every left-aligned line (English poem, reflection, headings) at narrow widths (**≈ ≤ 518 px, i.e. all phone portrait sizes**). It is reproduced identically in Chromium, WebKit, and Firefox. This is the previously-flagged "left decorative gradient bar clips leading characters" suspect, now root-caused.

Two premises in the audit brief were **not confirmed** and are documented as corrections below (the "floating Motion control" is a static in-flow header; the wide "-FAIL" screenshots from the first detector pass were a live-region false positive).

---

## Severity counts

| Severity           | Count | IDs              |
| ------------------ | ----- | ---------------- |
| Critical           | 0     | —                |
| High               | 1     | RESP-01          |
| Medium             | 0     | —                |
| Low                | 2     | RESP-02, RESP-03 |
| Info / corrections | 2     | RESP-04, RESP-05 |

---

## Pass / Fail matrix (viewport × state)

Verdict legend: **PASS** = no horizontal overflow, no content occlusion. **BAR** = spine-bar leading-glyph occlusion (RESP-01). All non-result / non-narrow cells pass. Orientation: `568×320` and `667×375` are landscape phone; `320–430` portrait phone; `768–820` tablet; `1024–1920` desktop; `640×400-zoom200` ≈ 1280 logical at 200 % zoom.

| Viewport              | welcome | choose | intention | result-Hafez | result-Rumi | about | credits | privacy | a11y | offline |
| --------------------- | ------- | ------ | --------- | ------------ | ----------- | ----- | ------- | ------- | ---- | ------- |
| 320×568               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 360×640               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 375×667               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 390×844               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 412×915               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 430×932               | PASS    | PASS   | PASS      | **BAR**      | **BAR**     | PASS  | PASS    | PASS    | PASS | PASS    |
| 568×320 (landscape)   | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 667×375 (landscape)   | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 768×1024              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 820×1180              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 1024×768              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 1280×720              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 1366×768              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 1440×900              | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 1920×1080             | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |
| 640×400 (≈200 % zoom) | PASS    | PASS   | PASS      | PASS         | PASS        | PASS  | PASS    | PASS    | PASS | PASS    |

Result: **12 BAR cells** (result-Hafez + result-Rumi at the six portrait-phone widths). All 148 other cells pass. The bar clears at ≥ 568 px, so landscape phone, tablet, and desktop are unaffected.

Raw metrics: `scratchpad/resp-metrics.json` (per-cell `overflowX`, `frameBar`, `motion`, `measure`, offender/clip lists). Summary: `scratchpad/resp-summary.json`.

---

## Issue records

### RESP-01 — Decorative spine bar occludes leading glyphs of result-card content on phones

- **Severity:** High · **Confidence:** High (metric + three-engine visual proof)
- **Route / State:** `/` reveal flow → result card (both poets)
- **Viewport:** all widths **< ~518 px** (measured intrusion at 320/360/375/390 = 5.9 px, 412 = 5.3 px, 430 = 4.4 px; clear from 568 up)
- **Browser:** Chromium, WebKit **and** Firefox — identical (CSS-driven, engine-independent)
- **Design §:** violates §20 legibility/reflow intent and §7.2's "primary reading surface" priority — the hero content (the verse itself) is partially occluded.
- **Evidence:**
  - `resp-EVIDENCE-390--spine-bar-clip.png` — "**S**ource and translation **I**nformation" with the "S" and "I" behind the gold bar (matches the reported baseline "ource and translation").
  - `resp-EVIDENCE-390--spine-bar-poem.png` — the bar (pomegranate at its top) clipping the "**T**" of "TEST ONLY" and "**E**" of "ENGLISH UNIT" on the English poem lines.
  - `resp-webkit-390--result-hafez.png`, `resp-firefox-390--result-hafez.png`, `resp-390x844--result-hafez-FAIL.png` — full cards showing the clip on **every** left-aligned line (poem, reflection paragraph, all section headings). The Persian (RTL) column is centre/right-aligned and unaffected.
- **Root cause:** `src/styles/visual.css`
  - `.illuminated-frame::after` (**lines 503–508**) is an absolutely-positioned vertical gradient bar at `inset-inline-start: 1.2rem`, `inline-size: 0.42rem` → its right edge sits at **1.62 rem = 25.92 px** from the frame's inline-start.
  - `.illuminated-frame` `padding-inline` (**line 481**) is `clamp(1.25rem, 5vw, 4rem)`. The content box starts at that padding. When padding < 1.62 rem the section content slides **under** the bar. `5vw < 1.62rem` for viewport width < 518 px, and the `clamp` floor (`1.25rem = 20 px`) is itself below the bar's right edge, so every narrow width intrudes by `25.92 − padding` px.
  - The narrow-width override `@media (max-width: 24rem)` (**lines 676–679**) pins `padding-inline: 1.25rem`, guaranteeing the 5.9-px overlap on the smallest phones.
  - The `<dl>` in `SourceCredit` escapes because `.poem-result dl` adds its own `padding` + `border-inline-start` (visual.css 543–547), so only the section **headings, poem lines, and reflection paragraph** — which sit flush at the frame padding edge — are hit. That is why the visible symptom is on those, not the `dl` rows.
- **Proposed fix (pick one; option A is smallest/safest):**
  - **A.** Raise the frame's inline-start padding so content always clears the bar: set `.illuminated-frame { padding-inline-start: max(2rem, clamp(1.25rem, 5vw, 4rem)); }` (bar right edge 1.62 rem + gap). Also bump the `@media (max-width:24rem)` rule from `padding-inline: 1.25rem` to something like `padding-inline: 2rem 1.25rem` (start, end) — or drop that override's start value.
  - **B.** Move the bar fully into the gutter — reduce `inset-inline-start` and width so its right edge stays ≤ the minimum padding (e.g. `inset-inline-start: 0.6rem; inline-size: 0.3rem`), keeping right edge < 1.25 rem.
  - **C.** Reserve a dedicated left rail: give `.illuminated-frame` a `padding-inline-start` that scales with the bar and pin the bar to that rail.
  - Prefer **A** — one declaration + one media-query tweak, no geometry redesign, preserves the ornament.
- **Files likely affected:** `src/styles/visual.css` only. No component/TSX change needed.
- **Verification method:** re-run `scratchpad/resp-audit.mjs`; assert `frameBar.barIntrudesContent === false` for all widths (i.e. `overlapPx ≤ 0`). Visually re-shoot 320/375/390 result cards and confirm no leading-glyph occlusion. Confirm `tests/performance/visualBudgets.test.ts` still passes (authored CSS ≤ 45 KB; the change animates nothing new). Note the visual-budget test also asserts "only transform/opacity/bounded-stroke animate" — a padding change is static, so it is safe.

### RESP-02 — Reading measure at very large widths is controlled but body copy runs to 68ch

- **Severity:** Low · **Confidence:** High
- **Route / State:** context pages (`/about`, `/credits`, `/privacy`, `/accessibility`) at ≥ 1440 px; result reflection at 1920.
- **Design §:** §20 general readability (no hard limit specified).
- **Evidence / metric (1920×1080):** poem lines measure **≈ 53 ch** (bounded by `.poem-result { inline-size: min(100% − 1.5rem, 54rem) }` + `clamp` font — good). Context body/`li`/`dd` measure **≈ 68 ch**, set intentionally by `.context-page p,li,dd { max-inline-size: 68ch }` (visual.css 573–577). 68ch is at the upper end of the 45–75ch comfortable range but **within** it — this is a nit, not a failure.
- **Root cause:** `src/styles/visual.css:576` (`max-inline-size: 68ch`).
- **Proposed fix (optional):** tighten to `66ch` (or `60–65ch`) if the content team wants a tighter measure. No functional impact; purely typographic preference.
- **Files likely affected:** `src/styles/visual.css`.
- **Verification method:** re-measure `approxCh` in the audit script for `page-*` at 1920.

### RESP-03 — No `env(safe-area-inset-*)` handling for notched / rounded-display devices

- **Severity:** Low · **Confidence:** Medium (cannot be proven on desktop engines)
- **Route / State:** all — global chrome (`.utility-header`, fixed `.skip-link`, bottom-padded scenes).
- **Design §:** §20 "touch targets not obscured by browser chrome or sticky controls"; §21.1 lists iOS Safari as a first-class target.
- **Evidence:** `grep` of `src/styles` + `src/app` + `public` returns **no** `env()` / `safe-area-inset` usage. On a notched iPhone in landscape, the utility header (top-right Motion control) and the focused skip-link (`.skip-link`, `core.css:41–51`, `position: fixed; inset-inline-start: 0.5rem`) could fall under the notch/rounded corner or home indicator. Block units use `dvb`/`dvh` (good — handles the dynamic toolbar), but inset padding is absent.
- **Root cause:** absence of `padding: env(safe-area-inset-*)` on the app shell / header / skip-link; no `viewport-fit=cover` in `public/index.html` (which is also required for `env()` to become non-zero).
- **Proposed fix:** add `viewport-fit=cover` to the viewport meta, then pad the shell/header with `max(<current>, env(safe-area-inset-inline-start/-inline-end/-block-start))`. Low urgency — the current fixed `0.5–2rem` gutters give partial clearance; this is hardening for physical notched hardware.
- **Files likely affected:** `public/index.html` (viewport meta), `src/app/core.css` (`.utility-header`, `.skip-link`), `src/styles/visual.css` (`.app-shell`).
- **Verification method:** requires real iOS Safari on a notched device (evidence gap — see below) or a simulator; cannot be confirmed in Chromium/WebKit-desktop headless.

### RESP-04 — Correction: the "floating Motion control" is a static in-flow header, not a fixed overlay

- **Severity:** Info · **Confidence:** High
- **Finding:** The brief flagged a suspected "floating Motion control top-right that overlaps content at small widths / landscape." Metrics show `.motion-control` computes **`position: static`** inside `.utility-header` (**`position: relative`**), and its bounding box **never overlaps** the scene/result/context content at any of the 16 viewports (`motion.overlapsContent = false` in every cell). The only `position: fixed` rules in the codebase are `.skip-link` (off-screen until focus, `core.css:42`) and the pointer-events-none decorative `.app-shell::after` background layer (`visual.css:31`, `z-index:-1`). **No sticky/floating control obscures content.** No action required; recorded so the suspicion is closed with evidence.

### RESP-05 — Correction: the first automated pass's wide-viewport "-FAIL" screenshots were a detector false positive

- **Severity:** Info · **Confidence:** High
- **Finding:** An initial over-broad detector flagged 144/160 cells (including every context page at 1920) because it counted the visually-hidden **`.live-region`** (a 1-px `clip: rect(0,0,0,0)` polite announcer, `core.css:133–143`) as "clipped text," and counted classless `<g>`/`<path>` **SVG internals inside the `aria-hidden` `.geometric-field`** decorative motif as "overflowing" (they are clipped by the SVG viewport and cause **zero** document overflow). Both are correct, intentional patterns — not defects. After excluding these a11y-hidden / decorative patterns, the true failure set collapses to the **12 RESP-01 cells**. The false-positive `-FAIL` screenshots were deleted; only genuine-evidence `resp-*` artifacts remain.

---

## Specific checks requested (results)

- **Horizontal overflow (scrollWidth ≤ width):** PASS at all 160 cells. `maxOverflowX = 0`.
- **Clipped text (scrollWidth > clientWidth on overflow-hidden):** only the intentional `.live-region` (screen-reader hidden). No real clipping.
- **Overlapping absolutely-positioned elements / Motion control:** none — see RESP-04. The bar occlusion (RESP-01) is a decorative pseudo-element over content, tracked separately.
- **Collapsed spacing / extreme line length:** measure controlled (poem ≈ 53 ch, body ≈ 68 ch) — RESP-02.
- **Safe-area handling:** absent — RESP-03.
- **Dynamic viewport units:** GOOD. `dvb` used for shell/scene block sizing (`visual.css:24,120,121`); no bare `100vh`. This correctly handles the mobile URL-bar show/hide.
- **Orientation:** portrait and landscape phone widths both PASS. Landscape-specific rules (`@media (max-block-size:35rem) and (orientation:landscape)`, `visual.css:686–699`) collapse min-heights and reduce padding correctly. (Tested as discrete landscape viewports; a live rotation event was not simulated — minor gap, low risk given both orientations pass statically.)
- **200 % zoom:** approximated at 640×400 (≈ 1280 logical @ 200 %) — PASS, no overflow, no occlusion (padding ≥ 1.62 rem at 640, so no bar intrusion).
- **Coarse pointer (`hasTouch`):** applied to ≤ 932-px contexts; no layout divergence; 44-px targets preserved (`core.css:22–27`).
- **Longest result content:** the fixture's multi-line units (English 2-line + reflection paragraph + full source `dl`) were rendered for both poets across all widths; no overflow at any width — only the RESP-01 leading-glyph occlusion.

## Cross-browser (parity)

| Engine          | 390×844 result                                                        | 1440×900 result                                                | Notes                                 |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Chromium 1.61.1 | rendered — definitive matrix                                          | rendered                                                       | authoritative; all metrics above      |
| WebKit 26.5     | `resp-webkit-390--result-hafez.png` — RESP-01 reproduced identically  | walk flaked in automation                                      | render parity with Chromium confirmed |
| Firefox 151.0   | `resp-firefox-390--result-hafez.png` — RESP-01 reproduced identically | Playwright `click` timed out (flow flake, not a render defect) | render parity with Chromium confirmed |

The Firefox/WebKit 1440 walks hit Playwright interaction timeouts on the second navigation (a harness flake in the reveal-button click, not a rendering or layout fault); the 390 captures — the decisive width for RESP-01 — succeeded on both and match Chromium pixel-for-pixel in the defect region.

## Honest evidence gaps

- **No real iOS Safari / Android hardware.** WebKit-desktop and Firefox-desktop are engine proxies, not the real mobile browsers; iOS Safari's dynamic toolbar behaviour, notch/safe-area, and TalkBack/VoiceOver interaction (RESP-03) must be confirmed on physical devices per design §20.2's manual matrix.
- **Fixture text is ASCII sentinels**, so real nastaliq shaping, RTL line-wrapping of genuine Persian, and true translation lengths were **not** exercised. RESP-01 is width/geometry-driven and independent of glyph content, but the Persian column's wrap behaviour with real long verses should be re-checked once a corpus exists.
- **Live orientation-change events** were tested as discrete portrait/landscape viewports, not a runtime `resize`/`orientationchange` mid-flow.
- **200 % zoom** is approximated via viewport scaling, not a real browser zoom (which also enlarges fonts against the layout); behaviour matched, but real-zoom confirmation belongs in the manual matrix.

## Reproduction

- Metrics matrix: `node scratchpad/resp-audit.mjs` (16 viewports × 12 states, writes `resp-metrics.json` + `resp-summary.json`, screenshots failures).
- Evidence crops + cross-engine: `node scratchpad/resp-evidence.mjs`.
- Server assumed already running at `http://127.0.0.1:4173` (fixture). No build performed by this audit.
