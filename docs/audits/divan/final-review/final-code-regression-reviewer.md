# Final code regression review — `feat/ui-ux-gauntlet-r1`

Reviewer: final-code-regression-reviewer (adversarial, read-only).
Scope: `git diff main...feat/ui-ux-gauntlet-r1` — 14 src/script files + tests
(`index.html`, `public/offline.html`, `scripts/build.ts`, `src/app/App.tsx`,
`src/app/core.css`, `src/components/PoemResult.tsx`, `src/components/SourceCredit.tsx`,
`src/lib/share/shareCard.ts`, `src/pages/AboutPage.tsx`, `src/pages/OfflinePage.tsx`,
`src/scenes/ChoosePoetScene.tsx`, `src/scenes/RevealScene.tsx`, `src/styles/visual.css`,
plus 9 test files).

## Gate results (run by me)

- `pnpm typecheck` — PASS (exit 0).
- `pnpm lint` (`eslint . --max-warnings 0`) — PASS (exit 0).
- `pnpm test` (full vitest) — PASS: **34 files / 499 tests passed, 0 skipped, 0 todo**.
- e2e (`test:e2e`) not run per instructions; judged by reading the spec diff.

## Headline

No Blocker, Critical, or High findings. The change set is correct, well-tested,
and respects every locked invariant I could exercise (release-integrity dist set,
visual-budget locks, privacy verifiers, focus/live-region contract). Findings below
are three Low observations (one behavioural edge case, one e2e-reliability note, one
maintainability note). None should block the merge.

**Unresolved Blocker/Critical/High: 0.**

---

## Findings

### FC-01 — Escape-to-skip can be triggered from the always-present motion `<select>` during the reveal (Low)

`src/scenes/RevealScene.tsx:33-43` — the Escape handler is bound at `window` level for
the whole `revealing` stage. The `MotionControl` `<select>` lives in `.utility-header`
and is rendered in every stage, including `revealing`. If a user focuses that select
(or opens then dismisses it) during the ~reveal window and presses Escape, the window
listener also runs `onSkip()` (= `completeReveal`), collapsing the animation.

Failure scenario: keyboard user tabs to the motion control mid-reveal and presses
Escape to close the native dropdown → the reveal is skipped as a side effect.

Impact is benign: `completeReveal` is idempotent and guarded
(`App.tsx:525`), and the outcome (jump to the result) is the same action the visible
"Skip animation" button performs. No state corruption, no lost focus. This is a minor
UX surprise in a contrived, short-lived window, not a defect.

Optional hardening: ignore Escape when `event.target` is a form control / inside the
header, e.g. `if (event.key === 'Escape' && !(event.target as HTMLElement)?.closest('.utility-header'))`.
Not required.

### FC-02 — Rewritten e2e audio assertion now depends on the fixture stub failing to load naturally (Low, test-only)

`tests/e2e/accessibility.spec.ts:249-273` — the old block dispatched a synthetic
`error` event on the `<audio>` element and asserted `controls` / `preload` / no-`autoplay`.
The new block instead relies on the fixture's stub audio failing to load in a real
browser, then asserts the element is removed (`toHaveCount(0)`) and the honest message
shows.

- Coverage of the element attributes is **not** lost: `controls`, `preload="metadata"`,
  and no-`autoplay` are pinned in jsdom at `tests/components/failures.test.tsx:129-130`
  and `tests/accessibility/appAccessibility.test.tsx:324-326`. Verified present.
- Residual risk: if the fixture audio ever loads successfully in Chromium,
  `audioUnavailable` stays false, the element is not removed, and `toHaveCount(0)`
  would time out. The assertion is deterministic only while the synthetic stub is
  guaranteed unplayable. This is a reliability note on a test, not a product bug, and
  the new path arguably tests a more realistic failure than the old synthetic dispatch.

### FC-03 — Offline-ready dispatch + message duplicated across two handlers (Low, maintainability)

`src/app/App.tsx:384-385` (`handleOffline`) and `src/app/App.tsx:430-433` (the SW
offline-status handler) both do `dispatch({ type: 'SET_STATUS', statusCode: 'offline_ready' })`
followed by the identical `setLiveMessage('You are offline, but your poetry experience
is ready.')`. Correct in both places and idempotent if both fire, but the literal and
the two-line block are mirrored. A small extracted helper would prevent drift. No
behavioural issue.

---

## Verified clean (actively probed, no defect)

**App state / effects (`App.tsx`)**

- **Offline-status early return (`427-435`)** does not skip bookkeeping: `offlineActiveReleaseIdRef.current`,
  `setOfflineUpdateReleaseId(null)`, and the dedup key (`415`) are all set _before_ the
  `return`; the early return only suppresses the trailing generic `setLiveMessage(detail.message)`,
  which is the intent. New `failures.test.tsx` "reports active while offline" test covers it.
- **Restore matrix (`309-331`)** cannot restore `intention` with a null poet — the whole
  block is gated on `selectedPoet !== null && !== undefined`, so both sub-branches carry a
  valid poet. The new intention branch is a genuine §5.3 improvement over the old code,
  which dropped a validly-chosen poet back to welcome. `lastSelectedPoetRef`/`lastResultPoemIdRef`
  bookkeeping is correct for both branches; the poet shuffle bags are initialised for both
  poets unconditionally (`282-285`), so a later reveal works.
- **`replaceState(null,'','/')` URL cleanup (`238-249`)** is coherent with the history
  contract: the guard skips `/` and every real context route (`routes.ts` exact-match), so
  only unknown deep paths normalise to `/`. `writeHistory` (`100-113`) calls
  `replace/pushState(historyState, '')` with **no URL argument**, so it preserves the `/`
  the cleanup set — no conflict with popstate resolution or replace-on-init. A restored
  `result` stage after reload at an unknown path renders correctly at `/`.
- **Reveal focus request (`578-580`)** lands on the reveal-scene `<h1 data-focus-target="scene-heading">`
  (`RevealScene.tsx:64`); the focus effect (`220-229`) fires on the `revealing` stage change.
  e2e asserts `[data-scene="revealing"] h1` is focused, then the result heading. No focus-to-`<body>`.
- **Escape cleanup / `onSkip` identity**: listener removed with the same handler ref;
  `onSkip` = `completeReveal`, a `useCallback` with stable deps (`524-553`) — re-subscription is
  harmless. `completeReveal` guard prevents double-run.
- **`dispatch` added to the offline-status effect deps (`453`)** is the stable `useReducer`
  dispatch — no re-subscription churn.

**PoemResult (`PoemResult.tsx`)**

- Stall panel `useState` resets between poems: "Reveal another" routes through
  `intention` → `revealing`, unmounting/remounting `PoemResult`, so `stallInvitationOpen`
  starts `false` each time. Only one result is mounted at once, so the fixed
  `id="stall-invitation"` / `aria-controls` pairing is unique. New axe check exercises the
  expanded panel (`appAccessibility.test.tsx:409`).
- Audio element removal on failure: `audioUnavailable` swaps the `<audio>`+credit for the
  message; asserted in jsdom (`failures.test.tsx:139-142`) and e2e (`toHaveCount(0)`). No
  re-error loop.

**SourceCredit (`SourceCredit.tsx`)** — bidi rework keeps the parentheses in the LTR `dd`
flow and isolates only the Persian title in a `bdi[lang=fa][dir=rtl]`; the closing paren
can no longer mirror. New assertion at `appAccessibility.test.tsx:139-158` checks exactly
this (parens outside any `dir=rtl`, bdi text free of `()`), and the `bdi` count assertion
still passes — no test still asserts the old `span` structure.

**build.ts font preloads** — injection (`632`) runs after the Vite build but _before_
`collectBrowserAssets` (`649`) computes digests, so the modified `index.html` hashes
coherently (the "byte-identical dist set" test at `buildRelease.test.ts:314-382` proves it).
Ambiguous match throws (fail-closed), missing face is skipped (documented, perf-only),
headless doc throws. Regex `^assets/<stem>-[a-f0-9]{16}\.woff2$` cannot false-match
`inter-latin-700-normal` or `-italic`/`noto-nastaliq` variants (unit test confirms).
`crossorigin` is correct/required even for same-origin font preloads; hrefs are
root-relative local paths (verify-dist safe). The three hardcoded stems match the real
`@fontsource` filenames in `src/styles/fonts.css` exactly and the project's 16-char hash
length, so preloads inject in the real fixture build — not a silent no-op.

**CSS (`visual.css`, `core.css`)**

- `.illuminated-frame` padding split into logical longhands with
  `padding-inline-start: max(2rem, clamp(...))` keeps the 1.62rem spine bar clear at every
  width; the narrow override correctly sits in `@media (max-width: 24rem)` (`visual.css:703-729`),
  matching the guard test. `.context-document` no longer shares the frame's start padding.
  RTL geometry holds: all inner content (incl. the `dir=rtl` Persian section) is inset ≥2rem
  from the frame's inline-start edge; no rule reduces the Persian section's inline padding.
- Light-surface link colour (`--deep-red`) applied to both `.context-document a` and
  `.poem-result a`; poet-keyed lamp-constellation accents target real
  `::before`/`::after`/`__ornament` selectors that exist in the base rules; `data-visual-language`
  values match the component (`hafez`→`garden-night`, else `lamp-constellation`).
- `[lang='fa'] { letter-spacing: 0 }` guards connected script; safe-area `env()` uses shipped
  physical names. The visual-budget lock test (`tests/performance/visualBudgets.test.ts`) was
  **not** modified and still passes with the new CSS — no weakened budget/color-uniqueness assertion.

**shareCard.ts** — 1200×630 rework: single bold frame (stroke-width 12 ≥ 8 floor), English
before Persian, both excerpts ≥48px, all text ≥600 weight / ≥24px, URL line omitted when
`siteUrl` is empty (no empty `<text>` element). XML escaping preserved. Exported
`SHARE_CARD_WIDTH/HEIGHT` are consumed by the new tests. Runtime-only, no dist impact.

**Tests** — no assertion in the diff was weakened or deleted; every new test asserts
behaviour (focus targets, aria state, bidi structure, dist-set invariance, fail-closed
throws) rather than implementation trivia. Audio attribute coverage that the e2e dropped
is preserved in jsdom (see FC-02).

## Altitude / architecture

Only FC-03's small duplication is worth noting. No dead code, no unused exports
(`SHARE_CARD_WIDTH/HEIGHT`, `injectFontPreloadLinks` are all consumed by tests/build),
naming is consistent with the surrounding code.
