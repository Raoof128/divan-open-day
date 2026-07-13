# DIVAN — Consolidated Issue Ledger

**Date:** 2026-07-13 · **Lead:** principal design-engineer session
**Inputs:** 01-visual-research.md, 02-ux-flow-baseline.md, 03-accessibility-bilingual-baseline.md, 04-responsive-browser-baseline.md, 05-frontend-performance-baseline.md, plus the lead's independent code pass.
**Build under audit:** `main` @ `6a102f5`, fixture release `test-only-fixture-release` (40 items), preview at 127.0.0.1:4173.

Severity: **Blocker** (prevents use/launch/privacy) · **Critical** (severe a11y/security/cultural/flow failure) · **High** (obvious professional-quality failure) · **Medium** (visible inconsistency/friction) · **Low** (polish) · **Observation** (verified note, no change).

Cross-auditor duplicates are merged; source IDs retained. Every entry was reproduced or code-verified by the lead before acceptance.

---

## Fix-now defects

### L-01 — Illuminated-frame spine bar clips the first glyph of every text line on phones

- **Sources:** UX-01 + A11Y-02 + lead code pass (three independent confirmations)
- **Severity:** High (borderline Critical — corrupts the core deliverable on all phone-portrait widths)
- **Confidence:** Confirmed (measured geometry table at 320/390/414/500/768/1440)
- **Route/State/Viewport:** RESULT (both poets), widths ≤ ~460px; persists at 200% zoom
- **Evidence:** `screenshots/baseline/ux-clip-w390-result.png`, `a11y-result-decorbar-320.png`; overlap +5px at 320/390, +4px at 414, clean ≥500
- **Design req:** §6.4 (texture must not reduce readability), §7.6 (readable serif body)
- **Root cause:** `src/styles/visual.css:503-508` — `.illuminated-frame::after` fixed at `inset-inline-start: 1.2rem`, `inline-size: 0.42rem` (right edge ~26px) vs frame `padding: clamp(1.25rem, 5vw, 4rem)` (`:481`) flooring at 20px below ~518px. Positioned pseudo paints above static text.
- **Fix:** keep the ornament but guarantee `bar_end ≤ content_start` at every width — raise the frame's padding floor (e.g. `clamp(2.25rem, 5vw, 4rem)` inline) or move the bar into the 0.55rem inner-border gutter; protect the RTL (line-end) side for real Persian too.
- **Files:** `src/styles/visual.css`
- **Owner:** design-system-engineer
- **Verification:** geometry script overlap ≤ 0 at 320–1440; visual diff; new style test asserting the relationship

### L-02 — Result screen omits §7.6-required "Learn about the poet" and "Return to the stall" actions (dead end)

- **Sources:** UX-02 + lead + visual-research R10
- **Severity:** High · **Confidence:** Confirmed
- **Evidence:** result controls are only Skip-link/Reveal another/Save/Download (walk.mjs, both poets)
- **Design req:** §7.6 Actions (secondary list), §7.6 "Return to the stall displays a simple invitation and stall identifier, not device location"
- **Root cause:** `src/components/PoemResult.tsx:152-162` renders three buttons only
- **Fix:** add "Learn about the poet" (link to `/about`) and "Return to the stall" (static invitation panel — generic Society-stall wording, NO fabricated stall number, no location APIs). Keep existing accessible names stable; announce nothing new through extra live regions.
- **Files:** `src/components/PoemResult.tsx`, `src/styles/visual.css` (.result-actions), tests targeting result actions
- **Owner:** experience-ui-engineer
- **Verification:** component test asserting the new actions; e2e walk

### L-03 — About-page related-links fail contrast 1.56:1 on paper (axe serious)

- **Sources:** A11Y-01
- **Severity:** High (WCAG 1.4.3 failure) · **Confidence:** Confirmed (axe + measured)
- **Evidence:** `--gold-light` #e7c777 on `--paper` #fff9ee = 1.56:1 (needs 4.5:1); same tokens pass on night (10.76:1)
- **Root cause:** `src/styles/visual.css:304-310` shares one gold link colour across dark and light surfaces; `.context-links` sits on the parchment `.context-document`
- **Fix:** scope link colour on light surfaces (e.g. `.context-document a { color: var(--deep-red) }`, keep underline); leave night-surface links gold
- **Files:** `src/styles/visual.css`
- **Owner:** design-system-engineer
- **Verification:** axe on all five context pages = 0 violations; measured ratio ≥ 4.5:1; extend e2e axe sweep to context pages

### L-04 — Hafez and Rumi result cards are visually identical (breaks "culturally distinct modes")

- **Sources:** visual-research R2 + lead
- **Severity:** High (design §6.2 / acceptance §31.1-3 conformance) · **Confidence:** Confirmed (desktop-1440 result screenshots differ only in the word Hafez/Rumi)
- **Fix:** key the result card to `data-visual-language` (already emitted by `PoemResult.tsx:94-96`, currently unused by CSS): corner ornament motif per poet (motifs already exist in `DecorativeGeometry`), spine-gradient hues (pomegranate/cypress for Hafez; lapis/turquoise for Rumi), one accent tone. Subtle accent, not a reskin; parchment reading surface and measured contrast untouched.
- **Files:** `src/styles/visual.css`, `src/components/IlluminatedFrame.tsx` (+ optionally `PoemResult.tsx` to pass motif), style tests
- **Owner:** motion-visual-engineer
- **Verification:** screenshot diff Hafez vs Rumi result; contrast table re-measured; visualBudgets test still green

### L-05 — Focus drops to `<body>` during the reveal animation

- **Sources:** A11Y-04 + lead hypothesis (confirmed by measurement)
- **Severity:** Medium (WCAG 2.4.3; transient and self-recovering) · **Confidence:** Confirmed
- **Root cause:** no focus target set for the `revealing` stage (`src/app/App.tsx:525-556` dispatches REVEAL without `focusRequestRef`; effect at `:220-229` only honours requests)
- **Fix:** set `focusRequestRef` to the reveal scene heading on REVEAL (heading already has `tabIndex=-1` + `data-focus-target="scene-heading"`); do not steal focus once the user tabs to Skip
- **Files:** `src/app/App.tsx`
- **Owner:** accessibility-responsive-engineer
- **Verification:** unit test: activeElement ≠ body throughout revealing; e2e assertion added

### L-06 — Mirrored parentheses around the Persian work name in provenance (real-corpus bidi defect)

- **Sources:** A11Y-03 + visual-research R1
- **Severity:** Medium (WCAG 1.3.2 / §8.3) · **Confidence:** Confirmed in DOM
- **Root cause:** `src/components/SourceCredit.tsx:20-26` — literal `(` `)` inside the `dir="rtl"` span but outside the `<bdi>`
- **Fix:** keep parentheses in LTR document flow: `{workEn} (<bdi lang="fa" dir="rtl">{workFa}</bdi>)`; strengthen the bdi test to assert paren placement
- **Files:** `src/components/SourceCredit.tsx`, `tests/accessibility/appAccessibility.test.tsx`
- **Owner:** accessibility-responsive-engineer
- **Verification:** DOM assertion; manual check with real Persian across engines noted as launch-gated

### L-07 — `/offline` duplication: static offline.html shadows an unreachable React OfflinePage with conflicting copy

- **Sources:** UX-04 + A11Y-05
- **Severity:** Medium (IA defect / orphan route) · **Confidence:** Confirmed
- **Fix decision (lead):** keep `public/offline.html` as the SW recovery artefact it already is, and keep the in-app `/offline` React route as the linked, richer page. Resolution must NOT change the service-worker contract lightly — the SPA serves `/offline` via navigation fallback in production Caddy (`try_files`), while the preview server resolves the static file first. Minimal safe fix: reconcile the two documents' copy/titles so they no longer conflict, link the React page from the Accessibility/About pages where offline behaviour is described, and add `/credits` to offline.html's nav. Any deeper unification is out of scope (SW + dist-lock coupling).
- **Files:** `public/offline.html`, `src/pages/OfflinePage.tsx`, context-page links
- **Owner:** pwa-share-audio-engineer
- **Verification:** copy consistency check; `/offline` renders one intended document per environment; dist tests green

### L-08 — Welcome star ornament crosses the headline letterforms on desktop

- **Sources:** visual-research R6
- **Severity:** Medium (display legibility) · **Confidence:** Confirmed (desktop-1440--welcome.png)
- **Fix:** adjust `DecorativeGeometry` field placement/scale or reduce opacity behind the heading so no vertex crosses a glyph stem; keep the motif
- **Files:** `src/styles/visual.css` (.geometric-field/.manuscript-portal), possibly `src/components/DecorativeGeometry.tsx`
- **Owner:** motion-visual-engineer
- **Verification:** screenshot diff at 1440/1920

### L-09 — Dead `<audio>` control persists after audio failure

- **Sources:** UX-07
- **Severity:** Low · **Confidence:** Confirmed (fixture poem test-only-hafez-01)
- **Fix:** when `audioUnavailable`, hide the `<audio>` element and keep the §26.4 message
- **Files:** `src/components/PoemResult.tsx`
- **Owner:** pwa-share-audio-engineer
- **Verification:** existing audio-failure tests extended to assert control removal

### L-10 — Refresh at INTENTION/CHOOSE_POET discards the chosen poet (falls to Welcome)

- **Sources:** UX-06
- **Severity:** Low (design §5.3 "may restore" — friction, not violation) · **Confidence:** Confirmed
- **Fix:** when `selectedPoet` is persisted but no poem drawn, restore to INTENTION for that poet
- **Files:** `src/app/App.tsx` (restore branch ~:282-313)
- **Owner:** experience-ui-engineer
- **Verification:** unit test for the restore matrix

### L-11 — Offline reload does not surface the §26.2 reassurance copy

- **Sources:** UX-11
- **Severity:** Low · **Confidence:** Confirmed
- **Fix:** on load, when the SW reports the active release serving and `navigator.onLine === false`, announce/set the §26.2 message and offline badge
- **Files:** `src/app/App.tsx` (offline status handling)
- **Owner:** pwa-share-audio-engineer
- **Verification:** e2e offline reload asserts the copy

### L-12 — Invalid deep route leaves the bogus URL in the address bar

- **Sources:** UX-08
- **Severity:** Low (behaviour compliant; URL cosmetic) · **Confidence:** Confirmed
- **Fix:** `history.replaceState` to `/` for unknown paths on boot
- **Files:** `src/app/App.tsx`
- **Owner:** experience-ui-engineer
- **Verification:** direct entry test asserts pathname `/`

### L-13 — index.html vs manifest description mismatch

- **Sources:** UX-09 (non-gated part)
- **Severity:** Low · **Confidence:** Confirmed
- **Fix:** align wording ("private, bilingual Persian poetry experience…"); canonical/OG/robots stay launch-gated (see Deferred)
- **Files:** `index.html`, `public/manifest.webmanifest` (+ dist-lock tests re-hash)
- **Owner:** design-system-engineer
- **Verification:** string equality check; verify:dist green

### L-14 — Redundant copy on the Hafez poet card

- **Sources:** visual-research R8
- **Severity:** Low · **Confidence:** Confirmed ("Hafez — A tradition-inspired reading from Hafez.")
- **Fix:** tighten to "Hafez — a tradition-inspired reading." (per §7.3 copy); keep accessible name "Open the Divan" stable
- **Files:** `src/scenes/ChoosePoetScene.tsx`, any test matching the string
- **Owner:** experience-ui-engineer

### L-15 — Persian welcome line reads as a subordinate caption

- **Sources:** visual-research R7
- **Severity:** Low (subjective, within-brief) · **Confidence:** Agreed by lead
- **Fix:** modest size/rhythm lift for `بیتی در انتظار توست` toward bilingual parity; keep hierarchy (English H1 leads)
- **Files:** `src/styles/visual.css` (.welcome-persian)
- **Owner:** design-system-engineer

### L-16 — Persian typography metrics: guard rails missing

- **Sources:** visual-research R3 (verified by lead against CSS)
- **Severity:** Low (current values pass: body line-height 2.5 verse / 1.5 UI; no letter-spacing applied to fa) · **Confidence:** Confirmed
- **Fix:** add explicit `letter-spacing: 0` under `[lang='fa']` (letter-spacing on the shell is 0.04em on some chrome; make the guarantee structural) and a style test pinning Persian line-height ≥ 1.7 for body-size Persian text
- **Files:** `src/app/core.css` or `src/styles/visual.css`, `tests/performance/visualBudgets.test.ts` or a11y styles test
- **Owner:** design-system-engineer

### L-17 — Font preloads absent for welcome-critical faces

- **Sources:** PERF-01
- **Severity:** Low · **Confidence:** Confirmed (measured: fonts start post-CSS)
- **Fix:** build-generated `<link rel="preload" as="font" crossorigin>` for inter-400, cormorant-500, vazirmatn-400 (content-hashed names emitted by `scripts/build.ts`)
- **Files:** `index.html` template handling in `scripts/build.ts`, dist-lock tests
- **Owner:** pwa-share-audio-engineer (owns build/dist coupling)
- **Verification:** font requests start ≈TTFB; LCP not regressed; verify:dist green
- **Note:** touching build output = update `FIXED_BROWSER_ASSETS`? (no new files — only index.html bytes change; hashes recomputed automatically)

### L-18 — Share card must survive messaging-app compression (design-forward)

- **Sources:** visual-research R5
- **Severity:** Medium (quality of the most-travelled artifact) · **Confidence:** High
- **Fix:** review `src/lib/share/shareCard.ts` card layout: ≥1200×630 logical, one focal point, bold high-contrast type both scripts, credit line legible, no gold hairlines; PNG output already local
- **Files:** `src/lib/share/*`, `tests/share/*`
- **Owner:** pwa-share-audio-engineer
- **Verification:** render card in test, assert dimensions/contrast tokens; manual visual check

---

## Production-track / risk register (fix or document; not fixture-actionable)

### L-19 — Nastaliq 159 KB unsubset; swap reflow will hit the reveal with a real corpus

- **Sources:** PERF-02 · **Severity:** Medium (deferred-risk)
- **Action now:** document in the launch runbook as a §21.2 re-measure gate; add fallback `size-adjust`/metric overrides for the nastaliq face so the eventual swap doesn't shift layout; subsetting itself requires the approved corpus (launch-gated).
- **Owner:** design-system-engineer (fallback metrics) + docs

### L-20 — Kiosk tab restores the previous visitor's verse

- **Sources:** UX-05 · **Severity:** Observation (deployment decision)
- **Action:** record in launch runbook (staff guidance: reload/new tab between visitors, or a future idle-reset). No code change in this pass.

### L-21 — Canonical URL / OG image / robots directives absent

- **Sources:** UX-09 · **Severity:** Observation (launch-gated — final hostname + rights-cleared OG image do not exist)
- **Action:** keep gated; do not fabricate. Tracked in §31.2 launch gates.

---

## Rejected / no-action (with evidence)

- **PERF-03 code-splitting:** rejected — bundle at 93.6 KB gzip is under half budget; splitting adds heavy release-integrity coupling (FIXED_BROWSER_ASSETS/FIXED_MIME/tests) for no user-visible gain.
- **PERF-04 unused CSS (31% on happy path):** rejected — 4.7 KB gzip total; documented so future reviewers don't re-flag.
- **A11Y-06 role=status + aria-live redundancy:** keep as-is — accepted robustness pattern, single region verified.
- **UX-10 Escape-to-skip:** optional nicety; Skip control already satisfies §7.5. Will implement only if trivially safe in the experience pass. (Decision: implement — one keydown handler, improves keyboard UX.)
- **Full-flow LCP/CLS/press-latency/budgets:** all PASS with wide margins (see 05 report tables) — no perf remediation required this pass.

---

## Verified-working highlights (evidence in source reports)

Zero remote requests and zero console errors across every audit run (privacy §14.3/§23 hold). Shuffle-bag no-repeat verified across a full 24-draw Hafez cycle with reset announcement. §5.3 back/refresh contract verified. Offline redraw after first load verified. §7.6 content order (English → Persian → reflection → provenance) verified both poets. axe = 0 violations on all flow scenes and 4 of 5 context pages. All §21 budgets pass with wide margin (LCP 1.46s, CLS 0.006, JS 93.6 KB gzip). SW update algorithm conforms to §16.3. CSP-compatible build (no inline script/style, no eval). Focus ring two-tone verified on dark and light. Target sizes ≥44px everywhere.

---

## Responsive matrix findings (from 04 — merged)

**Headline:** zero horizontal overflow across all 160 viewport×state cells (16 viewports × 10 states), including 320px and the 200%-zoom approximation. `dvb` units used correctly (no bare `100vh`). Landscape rules verified. Cross-engine: RESP-01 reproduced identically in Chromium, WebKit 26.5, Firefox 151.

- **RESP-01** = merged into **L-01** (adds the definitive fix: option A — `padding-inline-start: max(2rem, clamp(1.25rem, 5vw, 4rem))` on `.illuminated-frame` plus bumping the `@media (max-width:24rem)` start padding; measured intrusion 5.9px at 320–390, clears ≥518px).
- **RESP-02** (68ch context measure): **rejected** — within the 45–75ch comfortable range; recorded as typographic preference only.
- **RESP-04 / RESP-05** (corrections): Motion control is static in-flow and never overlaps content at any viewport; the early wide-viewport "FAIL" captures were detector false positives (visually-hidden live region + aria-hidden SVG internals). Suspicions closed with evidence.

### L-22 — No safe-area-inset handling for notched devices

- **Sources:** RESP-03
- **Severity:** Low · **Confidence:** Medium (not provable on desktop engines; iOS Safari is a §21.1 first-class target)
- **Evidence:** no `env(safe-area-inset-*)` anywhere in src/styles, src/app, or index.html; no `viewport-fit=cover` in the viewport meta
- **Fix:** add `viewport-fit=cover` to the viewport meta (owner: pwa-share-audio via index.html) and `max(<current>, env(safe-area-inset-…))` padding on `.utility-header`/`.skip-link`/`.app-shell` (owner: design-system via CSS) — split across the two file owners
- **Verification:** static CSS assertions; physical-device confirmation stays in the §20.2 manual matrix (launch-gated)
