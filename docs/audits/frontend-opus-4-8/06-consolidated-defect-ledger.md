# 06 — Consolidated Defect Ledger

**Status: PARTIAL.** Phase 6 has now run: the full 10-viewport matrix, three engines
(Chromium/WebKit/Firefox), axe across four scenes, and the reduced-motion, offline, and cinematic
routes — all against the **real 120-record production corpus**. Still outstanding: Phase 4's
file-by-file ledger (126 of 127 rows `PENDING`), Phase 5 cross-file audit, share/save/download
fallbacks, history back/forward, deliberate release-mismatch testing, and 200% zoom. **No verdict
is claimed.**

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
| **Status** | **FIXED** — test-first, verified rendered, `check.sh --ci` exit 0 |
| **Affected** | Every visitor, every result, both poets. Presentation only. |
| **Surface** | Result scene, `متن فارسی` (`<h2>`) |
| **Discoverable before now?** | **Yes — correction.** `متن فارسی` is a hardcoded literal in `PoemResult.tsx:120`, not corpus data, so it rendered under the ASCII fixture too. An earlier draft of this entry claimed the fixture could not have surfaced it; that was wrong and is corrected here. The prior audit simply was not examining heading font fallback. |

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

### Repair applied

`.poem-result [lang='fa'] h2 { font-family: var(--font-persian); line-height: 1.5; }`

Regression test written first and **observed failing** at `visualBudgets.test.ts:103` before
the CSS change, per AGENT.md line 16.

| Measure (390×844, real corpus) | Before | After |
| --- | --- | --- |
| computed family | system fallback | **`"DIVAN Vazirmatn"`** |
| rendered width | 93.59px (= Cormorant/serif) | **106.69px (= bundled Vazirmatn exactly)** |
| line-height | 1.1× | **1.5×** |
| `scrollHeight - clientHeight` | 2 | **0** |
| Persian verse (regression check) | Nastaliq, lh 52px, clip 0 | **unchanged** |
| English headings (regression check) | Cormorant | **unchanged** |
| horizontal overflow | 0 | **0** |

`bash scripts/check.sh --ci` exit 0 (60s), 706 tests (705 → 706, none weakened).

**Honest limit of the regression test:** it reads CSS as **text** and therefore cannot observe
inheritance — which is precisely how this bug arose. It catches a Persian-scoped selector set to a
Latin family, and pins this heading rule, but would **not** catch a future Persian element silently
inheriting a Latin stack from an unscoped rule. An earlier draft of this ledger claimed the test
"generalises past the single heading"; that overstated it and is corrected here.

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

## O-01 — RESOLVED: cinematic Begin traversal is correct (was a headless artifact)

**Resolved. Not a defect.** Re-run in a **headed** browser (Chrome for Testing 149.0.7827.55,
installed for this purpose) confirms the traversal is real and the headless observation was an
environment artifact, as hypothesised:

| t | scrollY | `document.scrollHeight` | video | `h1` |
| ---: | ---: | ---: | --- | --- |
| 0 | 0 | 2274 | `rs:4, t:0` | "A verse is waiting for you." |
| 339 ms | **542** | 2274 | `rs:1, **t:2.533**` | "A verse is waiting for you." |
| 542 ms | **649** | 2274 | `rs:1, t:2.533` | "A verse is waiting for you." |
| **947 ms** | 5 | **1139** | `null` | **"Whose words will you open?"** |

Begin animates the scroll corridor (`scrollY` 0 → 542 → 649) and **scrubs the video**
(`currentTime` 0 → 2.533) before handing off to the chooser at ~950 ms. `readyState` dropping 4 → 1
is the in-progress seek, expected while scrubbing. The corridor then collapses 2274 → 1139 px.

This satisfies the `divan-cinematic-threshold` contract: a ~1 s threshold, "short enough to feel
like a threshold, not a trailer", with Skip available from the first frame.

**Root cause of the false alarm:** headless Chromium does not animate
`scrollIntoView({ behavior: 'smooth' })` — it jumps, driving the scrub straight to its terminal
frame and firing arrival within 300 ms. The code was correct throughout. Recorded because a less
careful pass would have filed this as a High ("Begin bypasses the cinematic") against working code.

**Still unverified at this sampling resolution (200 ms):** whether the *exact terminal frame*
paints before handoff. Arrival was observed while `scrollY` was 649 of a possible ~1430; the smooth
scroll may have completed between samples. The handoff-continuity requirement therefore remains
**unproven, not disproven** — it needs frame-accurate sampling or a `requestAnimationFrame` probe.

### Superseded original entry

**Not filed as a defect. Evidence is insufficient and the likely cause is the test environment.**

`tests/components/cinematicBegin.test.tsx` states the contract explicitly:

> `it('smoothly traverses the scroll corridor instead of arriving immediately')`
> — asserts `scrollIntoView({ behavior: 'smooth', block: 'end' })`, announces "Entering the
> reading alcove.", and `expect(onArrive).not.toHaveBeenCalled()`.

Observed in **headless** Chromium at 390×844, sampling the DOM after clicking Begin:

| t | `h1` | video | `document.scrollHeight` |
| --- | --- | --- | ---: |
| 0 (welcome) | "A verse is waiting for you." | `readyState:4, paused` | 2274 |
| **300 ms** | **"Whose words will you open?"** | `null` | 1107 |

Begin reaches the poet chooser within 300 ms; the 2274px scroll corridor collapses to 1107px and
the video element is gone — indistinguishable from Skip.

**Why this is not reported as a defect:** headless Chromium does not animate
`scrollIntoView({ behavior: 'smooth' })` — it jumps. A jump drives the scroll-scrub straight to its
terminal frame, which legitimately fires arrival. The observation is therefore consistent with
**correct** code in an environment that cannot render the traversal. Filing it would repeat exactly
the error rule 14 warns about, in reverse: treating a rendering artifact as a defect.

**To resolve:** re-run Begin in a **headed** browser and confirm the corridor is visibly traversed
and the terminal frame paints before handoff. Until then this is an open question, not a finding.

---

## F-03 — "Choose another poet" then browser Back leaves view and storage disagreeing

| Field | Value |
| --- | --- |
| **Severity** | **Low** |
| **Status** | Open — reported, not repaired |
| **Surface** | `src/lib/navigation/flowNavigation.ts:29-54` (writer); `src/app/history.ts` (contract) |
| **Affected** | A visitor who presses "← Choose another poet" from a result, then browser Back |
| **Test coverage** | `flowNavigation.ts` has **no test importing it**, despite backing the control PR #5 shipped specifically to add |

### Reproduction (rendered, Chromium 390×844)

| Step | `h1` | storage `selectedPoet` | storage `currentPoemId` | `history.state` |
| --- | --- | --- | --- | --- |
| 1. at result | Your verse | `hafez` | `test-only-hafez-19` | `{stage:'result', selectedPoet:'hafez'}` |
| 2. Choose another poet | Whose words will you open? | `null` | `null` | `{stage:'choose_poet', selectedPoet:null}` |
| 3. **browser Back** | **Your verse** | **`null`** | **`null`** | `{stage:'result', selectedPoet:'hafez'}` |
| 4. Forward | Whose words will you open? | `null` | `null` | `{stage:'choose_poet'}` |
| 5. Reload | **A verse is waiting for you.** | `null` | `null` | `{stage:'welcome'}` |

At step 3 the **same verse is re-rendered** (`SAME VERSE RE-SHOWN? true`) from React memory
(`lastResultPoemIdRef`), with the full result control set, while storage holds nothing. Pressing
"Reveal another" from there lands on intention with `selectedPoet: null` still in storage.
Zero page errors throughout.

### Root cause

`returnToPoetSelection` clears `selectedPoet` and `currentPoemId` from `sessionStorage` and then
`pushState`s a **new** `choose_poet` entry. The previous entry is untouched and still says
`{stage:'result', selectedPoet:'hafez'}`. Browser Back restores that entry faithfully — correct
history semantics — but the storage it depends on was already emptied. `DivanHistoryState`
deliberately carries no `currentPoemId` (a sound privacy choice: no poem ID in history or URL), so
history alone cannot re-establish the poem. The two stores are written by different owners at
different times with no reconciliation.

### Why Low, not Medium

No page error, no crash, no data loss the visitor notices in the moment — Back arguably *should*
return them to the verse they were reading. The concrete harm is narrow: at step 3 the app promises
a restorable result but a refresh silently drops them at **welcome** (step 5), contradicting the
restore contract the prior audit verified as L-10 ("refresh restores the result poem"). Severity
reflects real user impact, not tidiness.

### Proposed minimal repair (not applied)

Prefer `history.replaceState` over `pushState` in `returnToPoetSelection`, so leaving the poet does
not leave a resurrectable result entry behind the visitor. This matches the intent — the poem was
deliberately discarded — and keeps the §5.3 back contract
(RESULT→INTENTION→CHOOSE_POET→WELCOME) intact rather than inserting a forward/back pair that
re-enters a cleared state. Requires checking against `tests/components/poetSelectionNavigation.test.tsx`.

### Regression-test plan

`flowNavigation.ts` currently has no direct test. Add one asserting that after
`returnToPoetSelection`, no reachable history entry resolves to a `result` stage whose
`currentPoemId` is absent from storage. This closes the coverage gap the Phase 2 inventory flagged.

### Risk of repair

**Medium — higher than the defect.** `replaceState` changes the history stack shape and could
affect the verified §5.3 back contract and the restore matrix (prior L-10). Must not be applied
without re-running `tests/components/poetSelectionNavigation.test.tsx`, the offline lifecycle e2e,
and the rendered back/forward walk. Given severity Low and repair risk Medium, **deferring is
defensible**; the decision belongs to the maintainer, not this audit.

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

### Accessibility — axe across three engines (real corpus)

axe-core **4.12.1**, injected from local `node_modules` (no CDN — privacy and CSP intact), tags
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`, at 390×844:

| Engine | welcome | choose_poet | intention | result |
| --- | :-: | :-: | :-: | :-: |
| Chromium | 0 | 0 | 0 | 0 |
| WebKit | 0 | 0 | 0 | 0 |
| Firefox | 0 | 0 | 0 | 0 |

**0 violations, 12/12 scene-engine cells.** This extends the prior audit's fixture-only axe result
to the real Persian corpus. Per `divan-accessibility-qa` and goal rule 14, axe success is
**necessary but not sufficient** and does not establish WCAG conformance.

### Responsive — full 10-viewport matrix (real corpus, Chromium)

Every viewport walked welcome → Skip → Hafez → intention → reveal → result:

| Viewport | Horizontal overflow | Persian line clipping |
| --- | :-: | :-: |
| 320×568 · 360×640 · 360×800 · 375×667 · 390×844 | **0** | **0** |
| 412×915 · 768×1024 · 1024×768 · 1280×800 · 1440×900 | **0** | **0** |

**Zero horizontal overflow and zero Persian line clipping at all 10 viewports**, including 320px —
the narrowest, and the case the prior audit could not test without real Persian. At 320px the only
element extending past the viewport is `candle-scene__glow` (57.6px overhang), a decorative radial
bleed that produces **no** document scroll; permitted by `divan-atmosphere-effects`.

### Route coverage (real corpus)

| Route | Result |
| --- | --- |
| **Reduced motion**, full flow | **Pass** — reached the verse, Persian rendered, focus `H1:"Your verse"`, **video never requested once**, 0 page errors |
| **Reduced-motion welcome** | **Pass** — only `Begin` offered (nothing to skip), **0 `<video>` elements created**, poster shown. Matches "do not load scrubbed video automatically" exactly |
| **Full-motion welcome** | **Pass** — `Begin` + `Skip entrance` present from the first frame; video element created but **no media downloaded at load** (deferred to intent); poster immediate |
| **Cinematic media deferral** | **Pass** — `divan-cinematic-mobile.mp4` requested only after Begin, never at load |
| **Offline after first load** | **Pass** — SW activated; welcome renders offline; full flow reaches a **real Persian verse offline** (`دست در حلقهٔ آن زلف دوتا نتوان کرد`); 0 page errors |
| **Offline control set** | **Pass** — only `Begin` offered offline (no video ⇒ no Skip), degrading exactly as the media-failure contract requires: no error wall |
| **Cinematic Begin traversal** | **Pass (headed)** — corridor animated `scrollY` 0→649, video scrubbed `t` 0→2.533, handoff at ~950 ms. See O-01 |

**Skip-link note (goal rule 14).** The full-page screenshot shows "Skip to main content" painted
mid-page over the Source note. It is **not a defect** — a `position: fixed` element renders once at
its viewport offset inside a tall full-page capture. Verified by measurement: off-screen at
`top: -160px` unfocused, `top: 8px` focused. Recorded because the screenshot alone would have
supported a false High finding, which is exactly what rule 14 warns about.

## Findings summary

| ID | Severity | Status |
| --- | --- | --- |
| F-01 Persian heading uses unbundled system font | **Low** | **FIXED** — test-first, verified |
| F-02 Reducer discards poem on unhandled event | **Low** (was High hypothesis; disproved) | Open, repair proposed, not applied |
| F-03 Choose-another-poet + Back desyncs view from storage | **Low** | Open — repair risk (Medium) exceeds the defect; deferral defensible |
| O-01 Cinematic Begin traversal | **Resolved — not a defect** | Headed browser confirms correct traversal |
| M-01 Stale fixture SW | Methodology, **not a defect** | Resolved (profile cleared) |

**Blocker 0 · Critical 0 · High 0 · Medium 0 · Low 3** (1 fixed, 2 open).

Two candidate findings were **investigated and withdrawn** rather than banked: the reducer
double-tap (disproved — every dispatch site guarded) and the skip-link overlay (disproved —
`position: fixed` capture artifact). A third (O-01) was held open rather than filed on
environment-contaminated evidence, then **resolved as correct** by re-running headed.

## Honest limitations of this phase

- **Phase 4 is 1 of 127 rows.** This ledger is not a substitute for the file-by-file audit.
- **Not yet exercised:** share / save / download fallbacks, history back/forward, refresh-restore,
  200% zoom, forced-colours, Save-Data, deliberate release-mismatch and failed-update retention,
  landscape, memory across repeated draws, and the Rumi flow end-to-end (Rumi verses rendered
  incidentally, but the flow was not walked deliberately).
- **LCP render delay is 802 ms of the 815 ms** (98%), against the LCP skill's <10% target. TTFB is
  13 ms because this is **localhost** — not a public-network figure. The dominance is architectural
  (client-rendered SPA; the LCP text cannot paint before JS executes) and an SSR migration is
  barred by goal rule 4. Absolute LCP is well inside budget, so per `cloudflare:web-perf`
  ("don't prioritise 0 ms-impact changes") this is **informational, not a defect**.
- Measurements are **throttled-Chromium proxies on a local preview**, not the public site and not
  device-certified. No physical-device, VoiceOver, TalkBack, or Safari-hardware evidence exists.
- axe HAS now run (3 engines x 4 scenes, 0 violations) but remains necessary-not-sufficient.
- Only **1 of 120** records has been rendered. Long-line and typography extremes across the full
  corpus are unexercised.
- Screenshots are local and regenerable, gitignored per the convention already set by
  `docs/audits/divan/screenshots/`. Regenerate: production build → `vite preview --port 4173`.
