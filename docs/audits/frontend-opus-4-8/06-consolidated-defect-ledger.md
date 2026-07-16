# 06 — Consolidated Defect Ledger

**Status: PARTIAL.** Phase 6 has run for one viewport (390×844) and one flow (Hafez, full-motion,
online). The viewport matrix, WebKit/Firefox engines, Rumi flow, cinematic scrub, offline, and
reduced-motion routes have **not** run. This ledger is not final and carries no verdict.

## Prior-art reconciliation (goal Phase 0)

`docs/audits/divan/09-final-verification-report.md` records a completed UI/UX gauntlet at
`67958c9` (2026-07-14): 22 findings, 4 High, all fixed; axe 0 violations; LCP 1,212 ms; CLS 0.0053.

**That audit ran against the 40-item ASCII fixture.** Its own stated limitation:

> "The fixture's ASCII sentinels mean Persian shaping, wrapping, nastaliq rendering, and true
> verse lengths are unexercised; the spine-bar RTL line-end clearance and the nastaliq swap cost
> must be re-checked with the real corpus."

Two surfaces are therefore genuinely unaudited and are this phase's target:

1. **The real 120-record Persian corpus** (production build, `productionEligible: true`).
2. **The cinematic threshold**, which landed later (PR #4, `ddf590a`).

### Findings NOT re-reported (already rejected with evidence by the prior audit)

Re-reporting these would be noise. Recorded so no later reader mistakes the silence for an
oversight:

| Prior ID | Claim | Prior disposition |
| --- | --- | --- |
| PERF-03 | Code-splitting | Rejected — bundle at half budget; heavy dist-contract coupling |
| PERF-04 | Unused CSS | Rejected — 4.7 KB gzip total |
| RESP-02 | 68ch measure | Rejected — within comfortable range |
| A11Y-06 | `role=status` redundancy | Rejected — accepted robustness pattern |
| FV-03/04/05 | Visual restraint | Rejected — deliberate, within approved art direction |

Goal rule 3 (no redesign by taste) and the precedence rules make these settled.

---

## M-01 — METHODOLOGY: stale service worker invalidated the first measurement

**Not an application defect.** Recorded because it would have corrupted every Phase 6 number and
because any future session using the persistent Chrome profile will hit it.

The first clean-looking load of the production preview rendered the **fail-closed blocking error**
("The experience could not finish loading"), with a console 504 and a JS bundle
(`index-8f20ea3f677de95d.js`) **that does not exist in `dist/`**. `curl` fetched the same corpus
JSON successfully (200, 151,026 bytes).

Cause, proven via `navigator.serviceWorker.getRegistrations()` + `caches.keys()`:

```json
{"staleRegistrations":[{"scope":"http://127.0.0.1:4173/","active":".../service-worker.js"}],
 "staleCacheNames":["divan-release-v2:test-only-fixture-release",
                    "divan-release-pointers-v2",
                    "divan-release-v2:audit-opus48-phase6"]}
```

A **fixture** release (`test-only-fixture-release`) was still cached in the persistent profile from
an earlier session, alongside the new production release. The SW served the stale fixture shell
against the new `release.json`.

**Disposition:** profile pollution. Cleared registrations + caches; all measurements below were
taken after cleanup and after a cache-ignoring reload.

**Worth noting:** this is an accidental, partial observation of the "stale tab after deployment" /
"no mixed release shell/corpus" scenario in goal Phase 4.9. It is **not** evidence of a defect —
the fixture/production mix cannot occur on the public site, which only ever serves production
releases. A deliberate, controlled release-mismatch test is still outstanding.

---

## F-01 — Persian section heading renders in an unbundled system font

| Field | Value |
| --- | --- |
| **Severity** | **Low** |
| **Status** | Open — reported, not repaired (Phase 8 not authorised) |
| **Affected** | Every visitor, every result, both poets. Presentation only. |
| **Surface** | Result scene, `متن فارسی` (`<h2>`) |
| **Discoverable before now?** | **No** — the ASCII fixture had no Persian in headings |

### Evidence

The heading's computed stack is Latin-only with **no Persian fallback**:

```
font-family: "DIVAN Cormorant Garamond", Georgia, serif
```

`DIVAN Cormorant Garamond` declares `unicode-range: U+0-10FFFF` (the entire range), but the file
behind it is `cormorant-garamond-**latin**-500-normal.woff2` and contains no Arabic glyphs. The
browser therefore attempts Cormorant, finds no glyph, and falls through per-glyph to
Georgia → `serif` → an **unspecified system Arabic face**.

Proven by rendering the same string under each candidate family (24.8px):

| Family | Rendered width |
| --- | ---: |
| **Declared stack (actual)** | **93.59px** |
| Cormorant only | 93.59px |
| Georgia only | 93.76px |
| generic `serif` | 93.98px |
| **bundled `DIVAN Vazirmatn`** | **106.69px** |
| **bundled `DIVAN Noto Nastaliq Urdu`** | **85.84px** |

The actual render matches the Latin/system chain and matches **neither** bundled Persian face.
Confirmed visually: `متن فارسی` paints as a bold system naskh, plainly a different type system
from the adjacent Cormorant serif headings ("Your verse", "Source note") in the same card.

Secondary: `line-height: 27.28px` on `font-size: 24.8px` (**1.1×**) is tight for a script with
descenders. Measured ink height **30px inside a 27px box** — 1.5px above, 1.23px below;
`scrollHeight - clientHeight = 2`. For contrast the verse itself uses 52px/20.8px (**2.5×**) and
clips by 0.

### Violated requirement

`divan-brand-art-direction`: *"Use repository-bundled or system fonts only"* — system fonts are
permitted, so this is **not** a hard violation. The defect is **consistency**, not conformance: a
culturally-specific design renders one Persian element in whatever face the OS supplies (Geeza Pro
on iOS, Noto Naskh on Android, another on Windows), diverging from the curated typography
everywhere else on the same card. Ink overflow is a real but sub-pixel-scale artifact.

### Proposed minimal repair (not applied)

Append the bundled Persian face to the heading's stack and relax the line-height for Arabic
script — a CSS-only change in `src/styles/visual.css`, no redesign:

```css
/* heading stack gains a Persian fallback */
font-family: 'DIVAN Cormorant Garamond', Georgia, 'DIVAN Vazirmatn', serif;
```

### Regression-test plan

Extend `tests/performance/visualBudgets.test.ts` (the locked visual system) or add a component
assertion: any element carrying `lang="fa"` must resolve to a font stack containing a bundled
Persian family. This generalises past the single heading and would catch recurrence anywhere.

### Risk

Low. CSS-only, additive to a fallback chain, no token change, no layout system change. Must be
re-measured against the locked visual budgets, which assert authoritative colours/fonts.

**Not yet done:** repair, regression test, before/after capture at the same viewport.

---

## F-02 — Reducer sends unhandled events to `intention`, discarding the poem

| Field | Value |
| --- | --- |
| **Severity** | **Low** (latent; downgraded from an initial High hypothesis) |
| **Status** | Open — reported, not repaired |
| **Surface** | `src/app/state.ts:213-282` |

`appReducer` routes any event its guard rejects to `recoverToNearestSafeState(state)` instead of
returning state unchanged. For a **valid** `result` / `result_action` / `revealing` state that
function returns `stage: 'intention'` with `currentPoemId: null`. Confirmed by direct execution:

```
result + BEGIN                     -> stage=intention | poemId=null
result + REVEAL                    -> stage=intention | poemId=null
result_action + OPEN_RESULT_ACTION -> stage=intention | poemId=null
revealing + REVEAL (dup)           -> stage=intention | poemId=null
-- control --
intention + REVEAL (valid)         -> stage=revealing | poemId=null
result + SET_STATUS (valid)        -> stage=result    | poemId=poem-1
```

### Why this is Low, not High

The initial hypothesis was that a double-tap could silently discard a visitor's verse. **It cannot,
and the disproof is recorded as part of the finding.** Every dispatch site is guarded:
`handleReveal` and `completeReveal` both early-return on `revealActiveRef.current`; `BEGIN` and
`CHOOSE_POET` are reachable only from scenes where they are valid; `SET_STATUS` /
`SET_MOTION_PREFERENCE` are stage-independent. `OPEN_RESULT_ACTION` is dispatched **only in
tests** — never in application code — so `result_action` is unreachable through the reducer at
runtime. `onRevealAnother` bypasses the reducer via `setState`.

This is latent defense-in-depth, not a live user-facing bug. Reporting it as High would have been
false.

### Proposed minimal repair (not applied)

Return `state` unchanged for an unhandled event on an already-valid state; reserve
`recoverToNearestSafeState` for genuinely invalid states. Failing test first, per goal rule 11.

---

## Verified sound — no defect (Phase 6, real corpus)

Recorded so later phases need not re-derive them.

| Check | Evidence | Verdict |
| --- | --- | --- |
| LCP | **815 ms** (390×844, CPU 4×, Fast 3G) vs ≤2500 ms budget; prior fixture audit 1,212 ms | **Pass — improved** |
| CLS | **0.00** vs ≤0.1 budget | **Pass** |
| Nastaliq deferral | Not requested on welcome; loads at reveal only | **Pass** — matches poster-first contract |
| Nastaliq clipping (**prior L-19**) | Verse 20.8px / line-height 52px (2.5×), `scrollHeight - clientHeight = 0` | **Does not reproduce** |
| `font-display` | All six faces `swap` | **Pass** |
| Horizontal overflow @390 | `scrollWidth - clientWidth = 0` | **Pass** |
| Console | **0 messages** on clean load | **Pass** |
| External requests | **0** — every request `127.0.0.1` | **Pass** |
| English-first / Persian-beneath | `h1` "Your verse" → English → `h2 متن فارسی` → Persian | **Pass** |
| Bidi parens | `" ("` / `دیوان حافظ` / `")"` as siblings — parens outside the RTL isolate | **Pass** |
| `lang`/`dir` | 3 `[lang="fa"]` regions, all `dir="rtl"` | **Pass** |
| `letter-spacing` on Persian | `normal` — shaping undistorted | **Pass** |
| Focus on transition | `h1` focused at choose_poet, intention, and result | **Pass** |
| Visible return nav | "← Choose another poet" present at intention and result | **Pass** |
| Skip link | `position: fixed; top: -160px` unfocused → `top: 8px` focused | **Pass** — see note |
| Provenance | Ghazal 94; Qazvini-Ghani (CC BY-SA); Clarke 1891 public-domain | **Pass** |
| Non-predictive disclaimer | Present on intention | **Pass** |

**Skip-link note (goal rule 14).** The full-page screenshot shows "Skip to main content" painted
mid-page over the Source note. It is **not a defect** — a `position: fixed` element renders once at
its viewport offset inside a tall full-page capture. Verified by measurement: off-screen at
`top: -160px` unfocused, `top: 8px` focused. Recorded because the screenshot alone would have
supported a false High finding, which is exactly what rule 14 warns about.

## Honest limitations of this phase

- **One viewport (390×844), one engine (Chromium), one flow (Hafez, full-motion, online).**
- **LCP render delay is 802 ms of the 815 ms** (98%), against the LCP skill's <10% target. TTFB is
  13 ms because this is **localhost** — not a public-network figure. The dominance is architectural
  (client-rendered SPA; the LCP text cannot paint before JS executes) and an SSR migration is
  barred by goal rule 4. Absolute LCP is well inside budget, so per `cloudflare:web-perf`
  ("don't prioritise 0 ms-impact changes") this is **informational, not a defect**.
- Measurements are **throttled-Chromium proxies on a local preview**, not the public site and not
  device-certified. No physical-device, VoiceOver, TalkBack, or Safari-hardware evidence exists.
- **axe has not been run** in this phase.
- Only **1 of 120** records has been rendered. Long-line and typography extremes across the full
  corpus are unexercised.
- Screenshots are local and regenerable, gitignored per the convention already set by
  `docs/audits/divan/screenshots/`. Regenerate: production build → `vite preview --port 4173`.
