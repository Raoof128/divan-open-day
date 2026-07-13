# DIVAN — Accessibility & Bilingual Baseline Audit

Auditor role: accessibility-bilingual-auditor
Date: 2026-07-13
Target: WCAG 2.2 AA + project rules (design §8 typography/bidi, §9.3 reduced motion, §20 accessibility spec)
Build under test: synthetic fixture served by `vite preview` at `http://127.0.0.1:4173`
Tooling: Playwright (Chromium 1.61.1) driving the real DOM + axe-core 4.12.1 (`@axe-core/playwright`), plus manual DOM/keyboard inspection and computed-style contrast measurement.

> **Fixture caveat (applies throughout).** Poem "Persian" lines are ASCII sentinels
> (`TEST ONLY / NOT POETRY / PERSIAN UNIT …`). Persian shaping, joining, half-spaces,
> nastaliq rendering, real line breaks, and real translation text are therefore **not**
> exercised. Conclusions about Persian glyph rendering and wrapping are limited and flagged
> as such. All structural, focus, contrast (of the chrome/English/paper surfaces), motion,
> reflow and target-size findings are valid regardless of corpus.

---

## Summary

Automated axe found a **single serious violation** (About-page related-info links fail
contrast). Manual inspection surfaced two bilingual/visual defects (a decorative bar that
overlaps the first glyphs of result text, and a mirrored parenthesis around the Persian work
name) and one focus-management gap (focus drops to `<body>` during the reveal animation).
The remainder of the flow is in good shape: one polite live region, correct heading order,
one `h1` per scene, programmatic focus to the result heading, 44px targets everywhere, clean
320px/text-spacing/landscape/200%-zoom reflow, working and persisted reduced-motion, and a
focus ring that stays visible on both dark and light surfaces.

### Counts by severity

- **Serious/High:** 1 (A11Y-01)
- **Moderate:** 3 (A11Y-02, A11Y-03, A11Y-04)
- **Low / Informational:** 2 (A11Y-05, A11Y-06)

---

## Issue records

### A11Y-01 — About-page "related information" links fail text contrast

- **Severity:** Serious / High
- **Confidence:** High (axe violation + independent computed-style measurement)
- **Criterion:** WCAG 2.2 **1.4.3 Contrast (Minimum)** — AA; design §20 "measured contrast"
- **Route / State / Viewport:** `/about`, default, all viewports (1440 / 390 / 320)
- **Evidence:**
  - axe: `color-contrast`, impact **serious**, 2 nodes — targets `a[href$="credits"]`, `a[href$="privacy"]`.
  - Measured: foreground `rgb(231,199,119)` (`--gold-light` `#e7c777`) on effective background `rgb(255,249,238)` (`--paper`) = **1.56 : 1** (requires ≥ 4.5 : 1 for 16px/400 text).
  - The same `--gold-light` link colour is fine elsewhere because those links sit on the **dark** night background (welcome nav link 10.76 : 1; `.return-link` 11.5 : 1). The defect is specific to links rendered **inside the light `.context-document` card**.
- **Root cause:** `src/styles/visual.css:304-310` — `.scene nav a, .context-links a, .return-link { color: var(--gold-light); … }`. `.context-links` (used by `src/pages/AboutPage.tsx:50-53`) is a child of the parchment `.context-document`, so gold-on-parchment falls far below 4.5 : 1.
- **Proposed fix:** Give links on the light card a dark, high-contrast colour (e.g. `--deep-red` `#76232f` → ~7 : 1 on paper, or `--lapis`) and keep the underline; scope it with a `.context-document a` rule so the dark-background `.scene nav a` / `.return-link` keep gold. Do not change the gold links that live on the night background.
- **Files likely affected:** `src/styles/visual.css`.
- **Verification:** Re-run axe on `/about` (0 contrast violations) and confirm measured ratio ≥ 4.5 : 1; add the `/about` page to the e2e axe sweep (currently uncovered — see Test coverage).

---

### A11Y-02 — Decorative accent bar overlaps the first characters of result text

- **Severity:** Moderate
- **Confidence:** High (measured geometry at two viewports + screenshots)
- **Criterion:** Legibility / text not obscured by decoration; borders on WCAG 1.4.8 (AAA, aspirational) and the design's "decorative art must not impede content." Not a clean single-SC AA failure, but a real readability defect.
- **Route / State / Viewport:** result (both poets), 320px and 390px (persists at 200% zoom).
- **Evidence:** `.illuminated-frame::after` is a vertical pomegranate→gold→cypress bar at `inset-inline-start: 1.2rem` (19.2px), width 6.7px. At 320px and 390px the frame's content padding is 20px, so the English `h1` and poem lines start at x≈33px while the bar spans x≈31.2–37.9px — the bar paints **over the first ~5px** of the leading glyph of the heading and every English line. Pseudo-elements render above the element's own text, so the sliver is covered, not merely adjacent. See `screenshots/baseline/a11y-result-decorbar-320.png`, `…-390.png` (and the originally-noted `baseline/mobile-390--result-hafez.png`).
  - For the RTL Persian block the bar sits at the **line-end** side; short ASCII fixture lines do not reach it, but long real Persian lines could have their trailing glyphs overlapped — **cannot fully verify without real corpus.**
- **Impact scope:** Purely visual — the bar is a CSS pseudo-element, absent from the accessibility tree, so screen-reader text is intact. Affects sighted and low-vision users, and does not clear at zoom.
- **Root cause:** `src/styles/visual.css:503-508` (`.illuminated-frame::after`) inset is smaller than the `.illuminated-frame` `padding-inline-start` floor (`clamp(1.25rem,5vw,4rem)` → 20px at small widths) at `src/styles/visual.css:481`.
- **Proposed fix:** Move the bar fully into the gutter (e.g. align it with the `::before` inset of `0.55rem`, or set `inset-inline-start` so `bar_end ≤ padding_start`), and/or raise the content stacking context above the bar. Preserve the ornament, just stop it from crossing the text edge.
- **Files likely affected:** `src/styles/visual.css`.
- **Verification:** Re-measure that every text element's inline-start edge is ≥ the bar's inline-end edge at 320/390/200%; visual diff of result screenshots.

---

### A11Y-03 — Mirrored parenthesis around the Persian work name in the provenance block

- **Severity:** Moderate
- **Confidence:** Medium-High (DOM confirmed; visual severity with real Persian unverified)
- **Criterion:** WCAG 2.2 **1.3.2 Meaningful Sequence** / bidi correctness; design §8.3 ("Test mixed Persian/Latin source references with `<bdi>`").
- **Route / State / Viewport:** result, provenance "Work" row, all viewports.
- **Evidence:** `src/components/SourceCredit.tsx:20-26` renders
  `{workEn} <span lang="fa" dir="rtl">(<bdi>{workFa}</bdi>)</span>`.
  Captured DOM of the node: `<span lang="fa" dir="rtl">(<bdi>…</bdi>)</span>`. The literal
  `(` and `)` are **inside** the RTL span but **outside** the `<bdi>`, so they are reordered/
  mirrored by the RTL context and no longer bracket the English→Persian transition cleanly
  (the "flipped parenthesis" seen in `baseline/mobile-390--result-hafez.png`). This affects
  the **real corpus** too, because `workFa` is genuine Persian.
- **Root cause:** Parentheses placed in an RTL isolate rather than in the surrounding LTR document flow.
- **Proposed fix:** Keep the parentheses in the document (LTR) flow and isolate only the Persian, e.g.
  `{workEn} (<bdi lang="fa" dir="rtl">{workFa}</bdi>)`, or wrap the entire parenthetical span in a single `<bdi>`. The existing test only counts `<bdi>` elements (`tests/accessibility/appAccessibility.test.tsx:138`) and does **not** catch paren placement.
- **Files likely affected:** `src/components/SourceCredit.tsx`; strengthen `tests/accessibility/appAccessibility.test.tsx`.
- **Verification:** Assert the parentheses are siblings of the RTL isolate (not inside it); manual visual check with a real Persian work title in Safari/Chrome/Firefox (design §8.3).

---

### A11Y-04 — Focus drops to `<body>` during the reveal animation

- **Severity:** Moderate
- **Confidence:** High (measured active element mid-transition)
- **Criterion:** WCAG 2.2 **2.4.3 Focus Order**; design §20 "programmatic result focus without focus theft during animation."
- **Route / State / Viewport:** `revealing` stage (after activating "Press to reveal"), all viewports; most impactful in full-motion (up to 1600ms window).
- **Evidence:** Immediately after activating "Press to reveal" the active element is `<body>` while `data-scene="revealing"` (measured). The `RevealScene` `h1` carries `data-focus-target="scene-heading"` but nothing focuses it: `App.tsx` dispatches `REVEAL` without setting `focusRequestRef` (`src/app/App.tsx:525-556`), and the reveal-stage focus effect only runs for requested targets (`src/app/App.tsx:220-229`). One `Tab` reaches "Skip animation", and at completion focus is correctly moved to `#result-heading` — so the loss is **transient and self-recovering**, and the live region announces "Revealing your verse." Still, keyboard/SR users lose their place for the animation window and the Skip control is not focused.
- **Root cause:** No focus target set for the `revealing` stage.
- **Proposed fix:** On `REVEAL`, set `focusRequestRef` to the reveal `h1` (`scene-heading`), or move focus to the Skip control when it appears; keep focus off `<body>` throughout the stage. Avoid stealing focus back once the user has tabbed.
- **Files likely affected:** `src/app/App.tsx`, `src/scenes/RevealScene.tsx`.
- **Verification:** Assert `document.activeElement` is a scene element (not `body`) for the whole `revealing` stage; extend `tests/e2e/accessibility.spec.ts`.

---

### A11Y-05 — `/offline` serves the static fallback, not the React `OfflinePage`

- **Severity:** Low / Informational (routing; a11y of served page is acceptable)
- **Confidence:** High
- **Criterion:** Informational — parity/routing; no AA failure in the served document.
- **Route / State / Viewport:** `/offline` and `/offline.html`.
- **Evidence:** Both URLs serve `public/offline.html` (title "DIVAN — Offline recovery", `h1` "DIVAN is not ready offline yet"), **not** `src/pages/OfflinePage.tsx` ("When you are offline"). The served static page is structurally sound: `lang="en" dir="ltr"`, `<main>` + `<nav>` landmarks, one `h1`, no Persian nodes. It lacks a skip link and the richer recovery steps of the SPA `OfflinePage`. The SPA `OfflinePage` is effectively unreachable by direct navigation in this preview, so its accessibility is exercised only via in-app context routing (not audited live here).
- **Root cause:** Server/service-worker resolves `/offline` to the static file before SPA fallback.
- **Proposed fix (defer to ux-flow/routing owner):** Decide which document `/offline` should serve and make it deliberate; if the static file is canonical, consider adding a skip link / return link for parity. No urgent a11y action.
- **Files likely affected:** routing/SW config, `public/offline.html`, `src/pages/OfflinePage.tsx`.
- **Verification:** Confirm intended `/offline` behaviour with the ux-flow auditor.

---

### A11Y-06 — Redundant `role="status"` alongside `aria-live="polite"` (no action needed)

- **Severity:** Low / Informational
- **Confidence:** High
- **Criterion:** Belt-and-suspenders pattern; not a defect.
- **Evidence:** `src/components/LiveRegion.tsx` sets both `role="status"` and `aria-live="polite"` (`role="status"` already implies polite). There is exactly **one** such region (verified: single node with `role=status aria-live=polite aria-atomic=true`), which is the desired single-live-region design. The redundancy is a widely accepted robustness pattern; a small number of SR/browser combinations could double-announce.
- **Recommendation:** Leave as-is, or drop `aria-live` if double-announcement is observed in manual AT testing. Listed only for completeness.

---

## Measured contrast table

Method: computed `color` vs the effective background (walking ancestors and resolving
`background-color` **and** gradient stops with alpha compositing). AA thresholds: 4.5 : 1
normal text, 3 : 1 large text (≥ 24px or ≥ 18.66px bold).

| Route / element                          | Foreground    | Effective background | Ratio    | Threshold | Result             |
| ---------------------------------------- | ------------- | -------------------- | -------- | --------- | ------------------ |
| Welcome `h1`                             | `#fff9ee`     | `#11182d`            | 16.8     | 3 (large) | Pass               |
| Welcome Persian line (82% α paper)       | `#fff9ee`@.82 | `#11182d`            | 16.8     | 4.5       | Pass               |
| Begin button label                       | `#fff9ee`     | night gradient       | 16.8     | 4.5       | Pass               |
| Welcome nav link (on night)              | `#e7c777`     | `#11182d`            | 10.76    | 4.5       | Pass               |
| Motion `<label>`                         | `#f2e6cf`     | `#11182d`            | 14.25    | 4.5       | Pass               |
| Poet-card title / description            | `#fff9ee`     | night                | 16.8     | 3 / 4.5   | Pass               |
| Poet-card Persian label                  | `#e7c777`     | `#11182d`            | 10.76    | 3 (large) | Pass               |
| Result `h1` "Your verse"                 | `--ink-deep`  | parchment gradient   | ≥ 12     | 3 (large) | Pass               |
| Result English poem line                 | `#2e302e`     | `rgb(254,247,236)`   | 12.53    | 3 (large) | Pass               |
| Result Persian poem line                 | `#2e302e`     | `rgb(254,247,236)`   | 12.53    | 3 (large) | Pass               |
| Result Persian `h2` `متن فارسی`          | `#76232f`     | `rgb(254,247,236)`   | 9.64     | 3 (large) | Pass               |
| Reflection body                          | `#2e302e`     | parchment            | 12.53    | 4.5       | Pass               |
| Provenance `dt`/`dd`                     | `#2e302e`     | `#fff9ee`            | 12.69    | 4.5       | Pass               |
| Result action buttons                    | `#fff9ee`     | `--action` gradient  | 17.95    | 4.5       | Pass               |
| Context page `h1` (about/privacy/…)      | `--ink-deep`  | `#fff9ee`            | 16.8     | 3 (large) | Pass               |
| Context page body                        | `#2e302e`     | `#fff9ee`            | 12.69    | 4.5       | Pass               |
| `.return-link` (on night)                | `#e7c777`     | `#0b1026`            | 11.5     | 4.5       | Pass               |
| Credits `.context-note`                  | `--ink-deep`  | `#e7c777`-ish        | 10.76    | 4.5       | Pass               |
| **`.context-links a` (About, on paper)** | **`#e7c777`** | **`#fff9ee`**        | **1.56** | **4.5**   | **FAIL → A11Y-01** |

> Note on method: a first pass that read only `background-color` reported the parchment poem
> card text as low-contrast; that was a **measurement artifact** because the card background is
> a `linear-gradient`. The gradient-aware re-measurement above (and axe reporting **no**
> contrast violation on the result route) confirm the result-card text passes comfortably.

---

## Target-size table (project min 44×44 primary; WCAG 2.5.8 min 24×24)

Measured bounding boxes across the full flow at 320px and 390px.

| Control                                                | 320px                    | 390px   | Result          |
| ------------------------------------------------------ | ------------------------ | ------- | --------------- |
| Motion `<select>`                                      | 162×44                   | 162×44  | Pass            |
| Begin button                                           | 160×46                   | 160×46  | Pass            |
| Welcome nav links (About / Accessibility / Credits)    | 165×44 / 184×44 / 54×44  | same    | Pass (≥44 tall) |
| Poet cards (Hafez / Rumi)                              | 288×391 / 288×423        | 358×391 | Pass            |
| Press to reveal                                        | 160×46                   | 160×46  | Pass            |
| Reveal another / Save this verse / Download verse card | 172×46 / 160×46 / 206×46 | same    | Pass            |
| Skip animation (button, `tabindex 0`)                  | ≥44                      | ≥44     | Pass            |
| Skip-to-main link (focused)                            | ≥44                      | ≥44     | Pass            |

All interactive controls meet the 44×44 project floor. (Non-interactive `h1` elements measure
40px tall at some widths — they are programmatic focus targets, not pointer targets, so 2.5.8
does not apply.)

---

## What passes (verified live)

- **Landmarks / headings:** `<header>` (banner) + `<main id="main-content" tabindex="-1">`; exactly one `h1` per scene; result heading order matches design §20.1 (`h1` "Your verse" → `h2` متن فارسی → `h2` "A reflection, not a prediction" → `h2` "Source and translation information").
- **Live region:** exactly one `role="status" aria-live="polite" aria-atomic="true"` region; announcements fire for revealing, result-ready (incl. the no-repeat cycle-reset message), offline, and share outcomes; no competing regions.
- **Focus to result:** on reveal completion `document.activeElement` is `#result-heading` (`tabIndex=-1`) for both poets — no focus theft during animation, focus lands after mount.
- **Skip link:** first focusable element; moves focus to `<main>` without changing history/hash.
- **Skip-animation control:** appears ~178ms after reveal (< 300ms), is a real keyboard-focusable `<button>`.
- **lang/dir:** document `lang="en" dir="ltr"`; every Persian region carries `lang="fa" dir="rtl"` (welcome line, both poet-card labels, result Persian section, provenance work/reference/opening-hemistich). `<bdi>` present on the reference and opening-hemistich identifiers (≥3 bdi in provenance).
- **Focus visibility:** two-tone ring (`outline: 3px var(--ink-night)` + `box-shadow: 0 0 0 6px #78d6ff`) stays visible on **dark** surfaces (blue glow) and **light** surfaces (dark outline). Screenshots: `a11y-focus-begin-dark`, `-poetcard`, `-resultbutton`, `-contextlink-light`, `-motionselect`.
- **Reflow:** no horizontal overflow at 320px, 390px, 640×512 (≈200% zoom), landscape 667×375, or with the text-spacing override (line-height 1.5, letter 0.12em, word 0.16em, para 2em). Screenshots: `a11y-textspacing-640`.
- **Reduced motion:** system `prefers-reduced-motion: reduce` → `data-motion="reduced"`; explicit **Full** overrides system; preference stored in `localStorage["divan.motionPreference"]` only (permitted) and **persists across reload**. Reduced result screenshot: `a11y-result-reduced-390`.
- **axe (WCAG 2a/2aa/21a/21aa/22aa):** **0 violations** on welcome, choose-poet, intention, result (Hafez), and the credits / privacy / accessibility / offline pages. Only `/about` violated (A11Y-01).
- **Audio (code review only — fixture has no audio):** `src/components/PoemResult.tsx:131-150` uses native `<audio controls>` with `aria-label`, `preload="metadata"`, no autoplay; the visible Persian poem is the transcript; on `onError` the poem and actions remain (covered by `tests/accessibility/appAccessibility.test.tsx:294`). No phantom audio UI when `item.audio === null`.

---

## Existing test coverage vs gaps

**Covered** (`tests/accessibility/appAccessibility.test.tsx`, `styles.test.ts`, `tests/e2e/accessibility.spec.ts`): English-before-Persian order + `lang/dir`; ≥3 `<bdi>` in provenance; skip link is first focusable and focuses main without history change; focus restoration to poet/reveal controls on history traversal; distinct reduced-motion opacity phases; single deduplicated polite/atomic live region; motion precedence (stored reduced/full over system); audio-failure resilience; blocking-error plain language; axe on boot/blocking-error and "core usable scenes"; CSS 44px floor, two-tone focus treatment, skip-link visibility, 320px/text-spacing reflow, scoped reduced-motion override, bounded 120–180ms reveal transition.

**Gaps** (recommend adding):

1. **No contrast/axe coverage of the context pages** — the About-page link failure (A11Y-01) slips through because the e2e axe sweep covers flow scenes, not `/about`, `/credits`, `/privacy`, `/accessibility`, `/offline`.
2. **Provenance parenthesis placement (A11Y-03)** — the bdi-count assertion does not detect parentheses trapped inside the RTL isolate.
3. **Focus during `revealing` (A11Y-04)** — no test asserts focus stays off `<body>` for the animation window.
4. **Decorative-bar / text-edge overlap (A11Y-02)** — no geometric assertion that ornament pseudo-elements clear the text inline-start edge.

---

## Cannot verify without real Persian corpus or real assistive technology

- **Persian shaping/joining, half-spaces (ZWNJ), nastaliq rendering, approved line breaks, and punctuation fidelity** — fixture lines are ASCII sentinels (design §8.1/§8.3).
- **Real Persian line wrapping and RTL punctuation at 320px** — ASCII wraps differently from real Persian; the decorative-bar overlap on the Persian (line-end) side (A11Y-02) can only be judged with real text.
- **Visual severity of the mirrored parenthesis (A11Y-03) with real Persian glyphs** in Safari / Chrome / Firefox (design §8.3 explicitly requires this cross-browser check).
- **Screen-reader reading order and Persian pronunciation switching** vs the design §20.1 expected sequence — DOM order matches, but actual VoiceOver (iOS/macOS), TalkBack, and NVDA/JAWS announcements, and `lang="fa"` voice switching (design §20.2/§20.4), are **not** established by DOM/axe.
- **Real `<audio>` element behaviour** — keyboard operation, seeking, timing, and SR state of the native control (fixture ships no audio; verified in code only).
- **Windows High Contrast / forced-colors rendering**, real-device 200% zoom, and physical portrait/landscape orientation on supported iOS/Android hardware (design §20.2 manual matrix).
- Per design §20.3: **zero axe violations does not establish WCAG conformance** — the manual matrix remains required before launch.

---

## Screenshots (this audit)

Under `docs/audits/divan/screenshots/baseline/` (prefix `a11y-`):
`a11y-desktop-1440--result-hafez.png`, `a11y-desktop-1440--result-rumi.png`,
`a11y-result-decorbar-320.png`, `a11y-result-decorbar-390.png`, `a11y-result-reduced-390.png`,
`a11y-textspacing-640.png`, `a11y-focus-begin-dark.png`, `a11y-focus-poetcard.png`,
`a11y-focus-resultbutton.png`, `a11y-focus-contextlink-light.png`, `a11y-focus-motionselect.png`.
