# DIVAN — UX Flow Baseline Audit

**Auditor:** ux-flow-auditor
**Date:** 2026-07-13
**Build under test:** synthetic fixture, served by `vite preview` at `http://127.0.0.1:4173`
**Browser:** Chromium (Playwright 1.61.1), headless
**Method:** Every route and interaction was exercised in a real browser via Playwright
scripts (scratchpad). Console errors, page errors, failed and remote network requests were
captured on every run. Poem text is intentionally ASCII sentinels (`TEST ONLY / NOT POETRY`);
structure and flow were audited, not fixture wording.

**Design authority:** `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md`
(§5 experience architecture, §7 screen specs, §26 failure behaviour, §27 metadata).

---

## Summary of results

| Severity    | Count |
| ----------- | ----- |
| Blocker     | 0     |
| Critical    | 0     |
| High        | 2     |
| Medium      | 2     |
| Low         | 3     |
| Observation | 4     |

**Total: 11 issues.** No blocker or privacy failure was found: zero remote network requests
were observed across the entire audit, launch gates remain closed, and the core flow works on
both poets. The dominant problems are (1) a decorative bar that clips the first character of
text on all phone widths and (2) a wayfinding dead-end on the result screen.

---

## Issues

### UX-01 — Decorative gradient bar clips the first character of every left-aligned text block on phones

- **Severity:** High (borderline Critical — it corrupts legibility of the verse translation and
  reflection, the core deliverable, on 100 % of phone-portrait visitors, which is the primary
  QR-scan device)
- **Confidence:** High
- **Route:** `/` (in-app RESULT stage)
- **State:** result card shown, any poet
- **Viewport:** all widths ≤ ~460 px (reproduced at 320 / 360 / 390 / 414). Clean at ≥ 500 px.
- **Browser:** Chromium
- **Evidence:**
  - Screenshot `docs/audits/divan/screenshots/baseline/ux-clip-w390-result.png` — the reflection
    paragraph loses the first character of **every wrapped line** ("ynthetic", "eutral", "ommentary",
    "epresents", "erson", "he record"); the English verse lines lose the leading "T"/"E"; the "A" of
    "A reflection…" is clipped.
  - Measured geometry (script `clip_offline.mjs`), bar right-edge vs text left-edge, relative to the
    frame border box:

    | width | frame padding-left | bar right edge | text left | overlap          |
    | ----- | ------------------ | -------------- | --------- | ---------------- |
    | 320   | 20px               | 26px           | 21px      | **+5px (clips)** |
    | 390   | 20px               | 26px           | 21px      | **+5px (clips)** |
    | 414   | 21px               | 26px           | 22px      | **+4px (clips)** |
    | 500   | 25px               | 26px           | 26px      | 0px (ok)         |
    | 768   | 38px               | 26px           | 39px      | −13px (ok)       |
    | 1440  | 64px               | 26px           | 65px      | −39px (ok)       |
- **Design requirement:** §7.6 "Use a readable literary serif… Never use decorative script for body
  text"; §6.4 "do not place texture behind long text when it reduces readability"; §7.2/§7.6 imply the
  verse and reflection must be legible on common phone viewports.
- **Root cause:** `src/styles/visual.css:503-508`. `.illuminated-frame::after` is absolutely positioned
  at a **fixed** `inset-inline-start: 1.2rem` with `inline-size: 0.42rem`, so its right edge is fixed at
  ~1.62rem (~26px) regardless of viewport. The frame content padding is
  `padding: clamp(1.25rem, 5vw, 4rem)` (`visual.css:481`); below ~518px the `5vw` term falls under the
  `1.25rem` (20px) floor, so text starts at ~20px — left of the bar's 26px right edge. The pseudo-element
  is a positioned box and paints above the static `<section>` content, so it overruns the first ~5px of
  every glyph that reaches the content-box left edge. `pointer-events:none` means interaction is not
  blocked; the damage is purely visual, but it is on every line of the reflection and every verse line.
- **Proposed fix:** Ensure the bar and the text never share horizontal space. Cleanest options:
  (a) give `.poem-result > .illuminated-frame > section` a `padding-inline-start` that clears the bar
  (≥ ~1.2rem beyond the bar right edge), or (b) raise the frame's minimum `padding-inline` above the
  bar's right edge (e.g. `clamp(2rem, 5vw, 4rem)`), or (c) move the bar into the outer gutter / reduce
  its `inset-inline-start` so `barRight ≤ min padding`. Verify the fix also protects the Persian (RTL)
  block's line ends and the reduced-motion result. Respect `tests/performance/visualBudgets.test.ts`
  (authored CSS ≤ 45 KB; transform/opacity-only animation — this change is static, so it is safe).
- **Files likely affected:** `src/styles/visual.css` (`.illuminated-frame`, `.illuminated-frame::after`,
  `.poem-result > .illuminated-frame > section`).
- **Verification method:** re-run `clip_offline.mjs` geometry across 320–1440; overlap must be ≤ 0 at
  every width; visually confirm no first-character clipping in `ux-clip-w320/390-result.png`.

---

### UX-02 — Result screen omits the design-required "Learn about the poet" and "Return to the stall" actions (wayfinding dead-end)

- **Severity:** High
- **Confidence:** High
- **Route:** `/` (RESULT stage)
- **State:** any verse result
- **Viewport:** all
- **Evidence:** The only interactive controls on the result card are
  `["Skip to main content", "Reveal another", "Save this verse", "Download verse card"]`
  (script `walk.mjs`, both poets). There is no link to About/Credits/Privacy/Accessibility and no
  "return to the stall" invitation. From the result, the only way back toward Welcome or any context
  page is the browser Back button (three presses: RESULT→INTENTION→CHOOSE_POET→WELCOME).
- **Design requirement:** §7.6 Actions — Primary "Reveal another"; Secondary "Listen in Persian",
  "Save this verse", **"Learn about the poet"**, **"Return to the stall"**. §7.6 also: "'Return to the
  stall' displays a simple invitation and stall identifier, not device location."
- **Root cause:** `src/components/PoemResult.tsx:152-162` renders only three buttons; "Learn about the
  poet" (link to `/about` or a poet section) and "Return to the stall" (static invitation) are not
  implemented. Note "Download verse card" is an _extra_ action not in the design list.
- **Proposed fix:** Add a "Learn about the poet" link (to `/about`) and a "Return to the stall"
  affordance (static invitation + stall identifier, no geolocation) to the result actions, matching
  §7.6. Keep accessible names stable and route announcements through the shared live region.
- **Files likely affected:** `src/components/PoemResult.tsx`, `src/styles/visual.css` (`.result-actions`),
  and tests targeting result action labels.
- **Verification method:** assert result actions include "Learn about the poet" and "Return to the stall";
  confirm the About link navigates and the stall invitation exposes no location.

---

### UX-03 — No persistent home/wayfinding affordance on any flow screen

- **Severity:** Medium
- **Confidence:** High
- **Route:** `/` (WELCOME, CHOOSE_POET, INTENTION, REVEAL, RESULT)
- **State:** all flow stages
- **Viewport:** all
- **Evidence:** The header wordmark home link (`App.tsx:709-716`) only renders when
  `activeContextRoute !== null` — i.e. only on `/about`, `/credits`, etc. On every flow screen the
  header shows only a spacer + the Motion `<select>`; there is no home, no back, no menu. Secondary
  links (About/Accessibility/Credits) exist **only** on WELCOME (`WelcomeScene.tsx:34-38`). Once a
  visitor presses "Begin", the only route to informational pages is browser Back to Welcome.
- **Design requirement:** §5.3 (coherent history model) and the general wayfinding expectation implied
  by §7; not an explicit clause, but combined with UX-02 it produces a closed loop with no in-page exit.
- **Root cause:** By design the wordmark is context-route-only (`App.tsx:710`). No global nav exists for
  the flow.
- **Proposed fix:** Expose a lightweight persistent affordance on flow screens — e.g. render the DIVAN
  wordmark (linking to Welcome/`/`) on flow stages too, or add a small "About · Accessibility" utility
  link set. Keep it out of the way of the primary action and the 44px target rules.
- **Files likely affected:** `src/app/App.tsx` (header), `src/styles/visual.css`.
- **Verification method:** from RESULT, confirm a single control reaches Welcome and/or a context page
  without using the browser chrome.

---

### UX-04 — Duplicate, conflicting offline pages; the in-app `/offline` route is an unreachable orphan

- **Severity:** Medium
- **Confidence:** High
- **Route:** `/offline`
- **State:** direct entry
- **Viewport:** all
- **Evidence:**
  - `curl http://127.0.0.1:4173/offline` returns the **static** `dist/offline.html`
    (title "DIVAN — Offline recovery", `<h1>DIVAN is not ready offline yet</h1>`). The server resolves
    the extensionless `/offline` to `offline.html`.
  - The in-app React page for the same route, `src/pages/OfflinePage.tsx`, renders a **different**
    document — `<ContextLayout title="When you are offline">` — and is never displayed for `/offline`
    because the static file shadows it (confirmed: `nav2.mjs` direct `/offline` shows h1 "DIVAN is not
    ready offline yet", `returnLink: 0`, whereas every other context route shows its ContextLayout
    return-link).
  - Nothing in `src/` links to `/offline` (grep: only `routes.ts:6` and the `index.tsx` switch case).
    So the React `OfflinePage` is both unlinked and unreachable — dead from the user's perspective — and
    the two offline surfaces carry conflicting titles and copy.
  - `offline.html` links to `/`, `/about`, `/privacy`, `/accessibility` but not `/credits`.
- **Design requirement:** §17.1 (public files/routes), §26.2 (offline copy), §27 (coherent IA). Having a
  registered context route that can never render, with copy that contradicts the static fallback, is an
  IA defect.
- **Root cause:** `/offline` is registered in `CONTEXT_ROUTES` (`src/pages/routes.ts:6`) and handled in
  `src/pages/index.tsx:24-25`, but a static `offline.html` occupies the same URL path and is served by
  the host (and cached by the SW as the offline fallback document).
- **Proposed fix:** Decide on one offline surface. Either (a) remove `/offline` from `CONTEXT_ROUTES` and
  delete `OfflinePage.tsx` (let `offline.html` be the sole offline document), or (b) give the SW fallback
  a distinct path (e.g. `offline.html` served only on failed navigations) and route in-app `/offline`
  to the React page. Reconcile the titles/copy either way, and add `/credits` to the offline.html nav.
- **Files likely affected:** `src/pages/routes.ts`, `src/pages/index.tsx`, `src/pages/OfflinePage.tsx`,
  `public/offline.html`, `src-sw/` fallback logic, and the dist manifest/tests if a file is removed.
- **Verification method:** confirm `/offline` renders exactly one intended document and that any in-app
  link to it resolves consistently.

---

### UX-05 — Returning-visitor / kiosk restore lands on the previous visitor's verse

- **Severity:** Low
- **Confidence:** High
- **Route:** `/`
- **State:** a result was previously revealed in the same tab
- **Viewport:** all
- **Evidence:** After revealing a verse, re-navigating to `BASE` in the same tab restores directly to
  the RESULT stage with the same poem (`nav2.mjs`: "re-goto BASE with persisted result (same tab) → result").
  Reload at RESULT restores the identical poem for both poets (`test-only-rumi-05` → `test-only-rumi-05`).
- **Design requirement:** §5.3 "refresh **may** restore the selected poet and current public poem ID"
  — the restore itself is compliant and intended. The UX concern is the stall context: on a shared
  kiosk tablet where the tab stays open, the next visitor sees the prior visitor's result and must press
  "Reveal another" or Back to start fresh.
- **Root cause:** `App.tsx:282-313` restores `stage:'result'` from `sessionStorage` on load when a
  matching poem exists. `sessionStorage` is per-tab, so this only bites a persistently-open kiosk tab.
- **Proposed fix (optional / launch decision):** for kiosk deployment, consider a "start over" reset or
  a short idle-timeout that returns to Welcome. Not a code bug; a deployment/UX decision to record.
- **Files likely affected:** `src/app/App.tsx` (restore logic) if a reset is desired.
- **Verification method:** confirm intended kiosk behaviour with stakeholders; if a reset is added,
  verify a fresh visit begins at Welcome.

---

### UX-06 — Refresh at INTENTION or CHOOSE_POET drops back to WELCOME, discarding the poet selection

- **Severity:** Low
- **Confidence:** High
- **Route:** `/`
- **State:** INTENTION or CHOOSE_POET
- **Viewport:** all
- **Evidence:** `nav2.mjs`: refresh at INTENTION → welcome; refresh at CHOOSE_POET → welcome. The
  selected poet **is** persisted (`persistSelectedPoet` on choose), but the restore path only rehydrates
  when a matching `currentPoemId` exists (`App.tsx:297-310`), which is null before a reveal, so it falls
  back to Welcome.
- **Design requirement:** §5.3 "refresh **may** restore the selected poet…" — optional, so this is
  compliant. It is avoidable friction rather than a contract violation.
- **Root cause:** restore requires `restoredItem?.poet === restored.selectedPoet`; with no poem drawn yet
  the branch is skipped (`App.tsx:297-310`).
- **Proposed fix (optional):** when a `selectedPoet` is persisted but no poem is drawn, restore to
  INTENTION for that poet instead of Welcome.
- **Files likely affected:** `src/app/App.tsx` restore logic.
- **Verification method:** refresh at INTENTION restores INTENTION for the chosen poet.

---

### UX-08 — Invalid deep route renders Welcome but leaves the bogus URL in the address bar

- **Severity:** Low
- **Confidence:** High
- **Route:** `/xyzzy-nope` (any unknown path)
- **State:** direct entry
- **Evidence:** `nav2.mjs`: `/xyzzy-nope` → HTTP 200 (SPA fallback) and renders Welcome (correct per
  §5.3 "direct entry to an invalid stage returns to WELCOME"), but `location.pathname` stays
  `/xyzzy-nope` — it is not rewritten to `/`.
- **Design requirement:** §5.3 (invalid entry → Welcome). Behaviour is compliant; the stale URL is
  cosmetic.
- **Root cause:** the app renders Welcome from state but does not `replaceState` the URL to `/` for
  unknown paths.
- **Proposed fix (optional):** on unknown path, `history.replaceState` to `/` so the address bar matches
  the shown stage.
- **Files likely affected:** `src/app/App.tsx` (initial route resolution).
- **Verification method:** direct entry to an unknown path shows Welcome with `/` in the URL.

---

### UX-07 — The one audio-bearing fixture poem leaves a dead `<audio>` control and emits a console error

- **Severity:** Observation (Low)
- **Confidence:** High
- **Route:** `/` (RESULT stage, poem `test-only-hafez-01` only)
- **Evidence:** `shuffle_audio.mjs`: when `test-only-hafez-01` renders, an `<audio controls>` element
  is present (`audioCount:1`, `#audio-heading` present), the source
  `/audio/test-only-hafez-01-ea5a2658.mp3` fails (`net::ERR_FAILED`, one console error), the `onError`
  handler fires, and "Persian audio is unavailable right now." is shown **and** announced. The failure
  handling is correct per §26.4 (poem retained, message shown), but the non-functional native audio
  control remains in the DOM beside the "unavailable" message.
- **Design requirement:** §26.4 "Keep the poem visible" + audio-unavailable copy — satisfied. The task's
  concern ("honestly omit/disable rather than show a dead control") is only partly met: the message is
  honest, but the dead control persists.
- **Root cause:** `PoemResult.tsx:131-150` renders the `<audio>` element whenever `item.audio !== null`
  and does not hide/replace it when `onError` sets `audioUnavailable`. The fixture ships a 21-byte stub
  `dist/audio/test-only-hafez-01-ea5a2658.mp3` which the service worker rejects (hence `ERR_FAILED`).
- **Proposed fix (optional):** when `audioUnavailable` is true, hide the `<audio>` element and keep only
  the message, so no dead control is shown. (Prod behaviour would be the same for any 404/invalid audio.)
- **Files likely affected:** `src/components/PoemResult.tsx`.
- **Verification method:** force the audio-error path; assert the `<audio>` element is removed/hidden and
  only the unavailable message remains, poem intact.

---

### UX-09 — Metadata gaps vs §27 (canonical, Open Graph, robots) and a description mismatch

- **Severity:** Observation (launch-gated)
- **Confidence:** High
- **Route:** `/` (document head)
- **Evidence:** `dist/index.html` head contains `theme-color #0B1026`, `<title>DIVAN — Persian Poetry
Experience</title>`, description, `icon.svg`, `apple-touch-icon`, manifest — but **no** canonical URL,
  **no** Open Graph image/tags, and **no** robots/`X-Robots-Tag` directive. Manifest is well-formed
  (name/short_name/maskable icon). The meta description ("A private, local Persian poetry experience from
  the Persian Society.") differs from the manifest description ("A private, bilingual Persian poetry
  experience from the Persian Society.").
- **Design requirement:** §27 lists canonical URL, rights-cleared OG image, and `X-Robots-Tag: noindex`
  for technical resources as required. These depend on the final hostname and a rights-cleared image,
  both launch gates, so their absence is acceptable pre-launch but must be closed before launch.
- **Root cause:** launch-gated metadata not yet populated; two descriptions authored independently.
- **Proposed fix:** at launch, add canonical + OG image + robots directives; align the index.html and
  manifest descriptions now (cheap, non-gated).
- **Files likely affected:** `public/index.html`, `public/manifest.webmanifest`, host/SW headers.
- **Verification method:** head contains canonical + OG + robots at launch; descriptions match.

---

### UX-10 — Escape during the reveal animation is a no-op

- **Severity:** Observation
- **Confidence:** High
- **Evidence:** `reveal.mjs`: pressing Escape ~120ms into the reveal does nothing special; the reveal
  completes normally to RESULT. The Skip control (keyboard-reachable) is the intended interruption and
  works.
- **Design requirement:** §7.5 requires a keyboard-reachable Skip control (present and working). Escape
  cancellation is not required; noting for completeness.
- **Proposed fix:** none required. Optionally map Escape to the same handler as Skip for discoverability.
- **Verification method:** n/a.

---

### UX-11 — §26.2 offline-reassurance copy is not surfaced on an offline reload

- **Severity:** Observation
- **Confidence:** Medium
- **Evidence:** `clip_offline.mjs`: after first load the SW is active/controlling; setting the context
  offline and reloading returns HTTP 200 from cache, restores the RESULT stage, and lets the visitor draw
  another verse offline — all working. But the live region reads "Your verse is ready.", not the §26.2
  copy "You are offline, but your poetry experience is ready." That copy is only emitted by the live
  `offline` event handler (`App.tsx:349-368`) when `offlineActiveReleaseId` matches, which is reset on a
  fresh page load.
- **Design requirement:** §26.2 offline copy — the _capability_ is satisfied; the reassuring message is
  simply not shown on the reload path.
- **Proposed fix (optional):** on load, if the SW reports the active cached release is serving and the
  browser is offline, surface the §26.2 message.
- **Files likely affected:** `src/app/App.tsx` offline status handling.
- **Verification method:** reload while offline; confirm the §26.2 message appears.

---

## Verified working (with evidence)

- **Shortest QR-to-result path:** 3 taps (Begin → poet → Press to reveal), ~2.8–2.9 s to the verse
  heading, for **both** poets (`walk.mjs` hafez=2941ms, rumi=2794ms).
- **Full flow, both poets:** Welcome → Choose Poet → Intention → Reveal → Result completes cleanly with
  no page errors.
- **Result block order matches §7.6 exactly:** English ("Your verse") → Persian ("متن فارسی") →
  Reflection ("A reflection, not a prediction") → Source credit → Actions (`walk.mjs`, both poets).
- **Shuffle-bag no-repeat + cycle reset:** the first 24 Hafez draws are all 24 unique poems with no
  repeat; at draw 24 the live region announces "Your verse is ready. A new no-repeat cycle has begun."
  (`shuffle_audio.mjs`). Satisfies §7.6 "do not repeat within the current poet's shuffle bag until
  exhaustion" without promising global uniqueness.
- **Browser Back contract (§5.3):** RESULT → INTENTION → CHOOSE_POET → WELCOME, each verified with the
  correct heading (`nav.mjs`).
- **Refresh restores the current poem at RESULT** for both poets (`nav2.mjs`; rumi-05 restored identically).
- **Direct entry to an invalid route returns to WELCOME** (`nav2.mjs`, `/xyzzy-nope` → Welcome).
- **Context pages (`/about`, `/credits`, `/privacy`, `/accessibility`)** all return HTTP 200, render the
  correct heading, and provide a "Return to the poetry experience" link plus a home link (`nav2.mjs`).
- **Offline after first load (§26.2):** SW active and controlling; reload while offline returns cached
  content (HTTP 200), restores RESULT, and a new verse can be drawn offline (`clip_offline.mjs`).
- **Reveal interruption is safe:** Skip appears and jumps straight to the result; double-click "Press to
  reveal" produces exactly one result (guarded, §7.4 "one activation only"); Back mid-reveal lands cleanly
  on Choose Poet with reveal timers cleared; rapid repeated "Reveal another" stays stable — **zero page
  errors** in every case (`reveal.mjs`).
- **Choose Poet matches §7.3:** real `<button type="button">` elements, English + Persian sub-labels
  ("فال حافظ", "لحظه‌ای با مولانا"), focus targets (`ChoosePoetScene.tsx`).
- **Audio failure path (§26.4):** message shown and poem retained (see UX-07 for the residual dead control).
- **Privacy at runtime:** **zero** remote network requests across all scripts (`REMOTE requests: []`
  everywhere). The only failed request is the local audio stub (UX-07). No cookies/trackers observed.

---

## Notes on scope

Poem wording, calligraphic shaping, and translation quality were **not** assessed — the fixture ships
ASCII sentinels by design, and real nastaliq/translation only appear with a compiled corpus. Visual
polish (colour, type scale, spacing) is the visual-research auditor's remit; this report covers flow,
navigation, information architecture, state/history, failure recovery, and the one structural layout
defect (UX-01) that corrupts content legibility.
