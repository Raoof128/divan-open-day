# DIVAN — Final Accessibility Review (post-remediation, adversarial)

**Reviewer role:** final-accessibility-reviewer (fresh adversarial eyes, READ-ONLY)
**Date:** 2026-07-14
**Branch:** `feat/ui-ux-gauntlet-r1` @ `e7e88d1`
**Target:** WCAG 2.2 A/AA + design §8 (bidi), §9.3 (reduced motion), §20 (a11y spec incl. §20.1 SR sequence)
**Build under test:** synthetic fixture served by `vite preview` at `http://127.0.0.1:4173`
**Tooling:** Playwright (Chromium 1.61.1) driving the real DOM + axe-core 4.12.1 (`@axe-core/playwright`), WCAG tag set `wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa` plus a `best-practice` pass on the result screen; gradient-aware and pixel-verified contrast maths; DOM/keyboard/geometry inspection.

> **Fixture caveat (applies throughout).** Poem "Persian" lines are ASCII sentinels
> (`TEST ONLY / NOT POETRY / SYNTHETIC …`). Persian shaping, joining, ZWNJ, nastaliq
> rendering, real line breaks and real translations are **not** exercised. All structural,
> focus, contrast (chrome/English/parchment surfaces), bidi-DOM, geometry, reflow and motion
> findings are valid regardless of corpus; anything needing real Persian glyphs is flagged in
> "Cannot verify".

---

## Verdict

**Unresolved Blocker / Critical / High: 0.**

All four remediated issues (A11Y-01…04) **hold** under adversarial re-test. The five new
surfaces introduced by the fix pass — the "Return to the stall" disclosure button, the hidden
context-note panel, the "Learn about the poet" link/nav, the audio-element removal on failure,
and Escape-to-skip — are all accessible and axe-clean, including with the stall panel **open**.
axe reports **0 violations** on every one of the eleven required states. No regressions found.
Two Low observations (pre-existing, non-blocking) are recorded at the end.

---

## Verification table — prior issues

| ID                 | Issue                                                    | Fix claimed                                                         | Adversarial result | Evidence                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A11Y-01 / L-03** | About/context links fail contrast (1.56:1 gold on paper) | scope link colour to `--deep-red` on light surfaces                 | **HELD**           | `.context-document a` measured **9.77:1** (deep-red `#76232f` on `#fff9ee`); axe 0 on `/about`,`/credits`,`/privacy`,`/accessibility`,`/offline`. Extended to result-card links too.                                                                       |
| **A11Y-02 / L-01** | Spine bar clips first glyph of result lines (≤460px)     | raise `.illuminated-frame` `padding-inline-start` to `max(2rem, …)` | **HELD**           | At 320/360/390/414 both poets: bar end **37.9px**, content start **44px**, text inline-start **45px** → bar clears text by **+7.1px** (overlap **−6.1px**). RTL/line-end side protected by same padding (real-corpus caveat below).                        |
| **A11Y-03 / L-06** | Mirrored parens around Persian work name                 | parens in LTR flow, only `workFa` in `<bdi lang=fa dir=rtl>`        | **HELD**           | DOM: `workEn (…<bdi lang="fa" dir="rtl">workFa</bdi>)`. Work `dd` **not** inside any `[dir=rtl]`; bdi contains no paren; `parenInsideRtl=false`; **bdi count = 3** in provenance.                                                                          |
| **A11Y-04 / L-05** | Focus drops to `<body>` during reveal                    | set `focusRequestRef → scene-heading` on `REVEAL`                   | **HELD**           | Sampled activeElement every ~60ms through the whole `revealing` stage — always the reveal `h1[data-focus-target=scene-heading]`, **never `body`**, in **full and reduced** motion, **both poets**. Completion focuses `#result-heading` in all four cases. |

### New surfaces introduced by the fix pass

| Surface                                                      | Adversarial result | Evidence                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Return to the stall" disclosure                             | **PASS**           | `aria-expanded` `false→true→false`; `aria-controls="stall-invitation"` resolves to the panel; panel carries `hidden` initially, removed when open; accessible name stable ("Return to the stall") across states; Enter **and** Space toggle it. axe 0 with panel **open** (both poets). |
| Hidden context-note panel                                    | **PASS**           | Text = ink-deep on translucent gold (22%) over parchment ≈ **14.2–15.3:1**. No fabricated stall number/location (copy contains no digits).                                                                                                                                              |
| "Learn about the poet" link + `nav[aria-label="Learn more"]` | **PASS**           | Reachable in tab order (position 5, after the four action buttons), `href="/about"`, deep-red underline ~**8.9–9.8:1** on parchment. Only one `nav` on the result screen — no landmark-uniqueness clash; `best-practice` axe = none.                                                    |
| Audio element removed on failure                             | **PASS**           | When `audio_unavailable`, the `<audio>` node is gone (`count=0`), the §26.4 message and the `h2 "Listen in Persian"` remain; failure is announced once via the single polite region (`App.tsx:709`). Attribute contract (controls/preload/no-autoplay) still pinned by jsdom tests.     |
| Escape-to-skip                                               | **PASS**           | Escape mid-reveal (`revealing` confirmed active) → focus lands on `#result-heading "Your verse"`, not lost.                                                                                                                                                                             |

---

## Measured-contrast table — changed / new elements

Method: WCAG relative luminance. Result-card values are computed against the **real parchment**
(`--paper #fff9ee` top → ~`#f7eedc` bottom of the `.illuminated-frame` gradient) and cross-checked
by reading computed colors from rendered pixels — automated ancestor-walk numbers on the card are
a known artifact (the parchment is a `linear-gradient`, so a naive walker composites through to the
night `body`). axe's own gradient-aware contrast check reported **0** contrast violations on every
state, corroborating the table.

| Element (changed)                           | Foreground           | Effective background                 | Ratio                     | Threshold  | Result              |
| ------------------------------------------- | -------------------- | ------------------------------------ | ------------------------- | ---------- | ------------------- |
| Rumi lapis `h2` (all Rumi-card headings)    | `#174a7e`            | parchment                            | **8.65** (7.86 worst-row) | 3 (large)  | **Pass**            |
| Hafez section `h2` (deep-red, unchanged)    | `#76232f`            | parchment                            | ~9.6                      | 3 (large)  | Pass                |
| `.context-document a` (About related links) | `#76232f`            | `#fff9ee`                            | **9.77**                  | 4.5        | **Pass**            |
| `.poem-result a` ("Learn about the poet")   | `#76232f`            | parchment                            | **8.88–9.77**             | 4.5        | **Pass**            |
| Stall disclosure + secondary action buttons | `#76232f`            | parchment                            | **8.88–9.77**             | 4.5        | **Pass**            |
| Stall `.context-note` panel text            | `#11182d`            | 22% gold over parchment (~`#faf0d4`) | **14.2–15.3**             | 4.5        | **Pass**            |
| Primary "Reveal another" button             | `#fff9ee`            | gradient `#a6192e→#76232f`           | **7.16** (worst)          | 4.5        | Pass                |
| Rumi spine bar / corner ornament            | lapis→turquoise→gold | —                                    | n/a                       | decorative | Note only — no text |

## Geometry table — spine bar vs text (result card, both poets)

| Viewport              | `padding-inline-start` | Bar inline-end | Content start | Text inline-start | Bar→content        | Bar→text clearance |
| --------------------- | ---------------------- | -------------- | ------------- | ----------------- | ------------------ | ------------------ |
| 320 / 360 / 390 / 414 | 32px (2rem)            | 37.9px         | 44px          | 45px              | **−6.1px** (clear) | **+7.1px** (clear) |

Identical at every width and for both Hafez and Rumi. The bar sits only on the inline-start
(left) edge; the 2rem start padding floors content past it, so neither the English lines nor the
RTL Persian block (whose line-end is the same left edge) can be overlapped.

## Reflow

| Case                                                                        | Horizontal overflow              |
| --------------------------------------------------------------------------- | -------------------------------- |
| 320px full flow to result                                                   | **0**                            |
| 320px result actions (4 buttons)                                            | stack to 4 rows, **no overflow** |
| 320px + text-spacing override (lh 1.5 / ls .12em / ws .16em / p-margin 2em) | **0**                            |
| 640×400 (≈200% zoom)                                                        | **0**                            |
| 667×375 landscape                                                           | **0**                            |

The result has **five interactive controls** (four `.result-actions` buttons + the separate
"Learn about the poet" link). At 320px the four buttons wrap to one-per-row cleanly; the link sits
in its own nav below. No clipping, no horizontal scroll.

## Live region & motion

- **Exactly one** `role=status aria-live=polite` region on the result screen. Opening **and**
  closing the stall panel leaves its text unchanged ("Your verse is ready.") — **no spurious
  announcement**. Audio-failure still announces once through this same region.
- System `prefers-reduced-motion: reduce` → `data-motion="reduced"`; the Motion `<select>` is
  present, and choosing **Full** writes `localStorage["divan.motionPreference"]="full"` which
  **persists across reload**. Reduced-motion reveal keeps focus managed identically to full.

---

## New issues

**None at Blocker/Critical/High/Medium.** Two Low observations, both **pre-existing** (not
introduced by this remediation pass) and non-blocking:

### FA-01 (Low, observation) — `.result-actions` uses `aria-label` on a role-less `<div>`

- **WCAG ref:** 4.1.2 (name/role/value) — advisory, not a failure here.
- **Evidence:** `PoemResult.tsx:156` `<div className="result-actions" aria-label="Verse actions">`.
  `aria-label` on a generic container with no `role` is not reliably exposed by assistive tech, so
  the group label "Verse actions" may be dropped by some AT. Each button has its own clear name, so
  no information is lost. axe (incl. best-practice) does not flag it.
- **Fix (optional):** add `role="group"` to the div, or drop the label. Not a regression — the
  container predates this pass; only a button was added inside it.

### FA-02 (Low, observation) — secondary-button underline colour is partly transparent

- **WCAG ref:** none (link/button text itself is 8.9–9.8:1). Cosmetic.
- **Evidence:** `visual.css` `text-decoration-color: rgb(118 35 47 / 45%)` on `.poem-result a` /
  `.context-document a`. The underline is fainter than the glyphs; the text meets AA comfortably
  and the underline is still visible. Note only.

---

## Test-change review (`git diff main…HEAD -- tests/`)

No weakened assertions found; coverage was **added**, not removed.

- **appAccessibility.test.tsx** — adds paren-placement assertions (work `dd` not in `[dir=rtl]`,
  bdi has no paren, text-node parens outside any RTL isolate) for A11Y-03; asserts the `<audio>`
  node is removed while the `h2` stays for §26.4; re-runs axe with the **stall panel open**. All
  strengthen coverage.
- **failures.test.tsx** — adds "audio node removed on failure" and an offline-reload-readiness
  test. Additive.
- **e2e/accessibility.spec.ts** — the audio block was **intentionally rewritten**: it no longer
  manually dispatches a synthetic `error` on the `<audio>` and checks its attributes; instead it
  follows the fixture stub's **natural** load failure and asserts the element is removed
  (`toHaveCount(0)`) with the honest message shown. **Judgement: no net coverage loss** — the
  attribute contract it dropped (`controls`, `preload="metadata"`, no `autoplay`) is still pinned
  in jsdom at `failures.test.tsx:129-130` and `appAccessibility.test.tsx:324-326`. The e2e change
  makes the test exercise the real §26.4 removal path rather than a simulated event, which is
  strictly more faithful. It also **adds** e2e assertions for reveal-heading focus, Escape→result
  focus, the disclosure semantics, and the digit-free stall copy.

---

## Cannot verify (honest limits)

- **Persian shaping / joining / ZWNJ / nastaliq / approved line breaks / real translations** —
  ASCII fixture only (design §8.1/§8.3).
- **RTL line-end overlap with _long_ real Persian** at 320px — fixture lines are short; the spine
  bar is geometrically cleared on the bar (left) side at all tested widths, but real wrapping is
  not exercised.
- **Screen-reader reading order, `lang="fa"` voice switching, and the §20.1 announced sequence** on
  VoiceOver / TalkBack / NVDA / JAWS — DOM order and single-live-region behaviour are correct, but
  actual AT output (design §20.2/§20.4) is not established by DOM/axe. Note §20.3: zero axe
  violations is **not** WCAG conformance; the manual matrix remains launch-gated.
- **Real `<audio>` keyboard/seek/state** — fixture ships no playable audio; the failure path is
  verified, the success path is not.
- **Windows High-Contrast / forced-colors**, real-device 200% zoom, and physical portrait/landscape
  on supported iOS/Android hardware (design §20.2 manual matrix).
- **Console/network cleanliness** this run was not separately re-captured here; privacy/remote-leak
  guarantees remain covered by the baseline sweep and `verify:privacy`.

---

## Bottom line

The remediation is sound. **0 unresolved Blocker/Critical/High** issues; A11Y-01 through A11Y-04
all verified fixed with measured evidence (link contrast 9.77:1, spine-bar +7.1px clearance,
parens correctly outside the RTL isolate with 3 bdi, focus never on `<body>` through reveal in
full or reduced motion for both poets). The new disclosure, panel, link, audio-removal and
Escape-to-skip behaviours are all accessible and axe-clean including with the stall panel open,
and the Rumi lapis accent measures 8.65:1 (well past the large-text 3:1 floor). Only two
pre-existing Low observations (FA-01 role-less group label, FA-02 faint underline) remain, neither
blocking. Test changes add coverage without weakening any assertion.
