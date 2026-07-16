# 04 — File-by-File Ledger

**Status: IN PROGRESS — 7 of 127 rows resolved. 120 remain `PENDING`.**

This ledger is the goal's primary artefact and is far from complete. Every row below was **read in
full** by the primary agent, not sampled and not delegated. A `NO DEFECT` verdict is recorded only
where the file was read completely *and* its rendered consequence was checked where one exists.

Rows are worked in the inventory's deterministic path order, but priority was given first to files
the Phase 2 inventory flagged as having **no direct test importing them** — the highest risk of an
unaudited defect. That ordering immediately paid: `flowNavigation.ts`, one of the untested files,
yielded F-03.

## Legend

Lenses per goal Phase 4: **R** React/state · **T** TypeScript/contract · **C** CSS/layout ·
**A** accessibility · **M** animation/media · **I** i18n/Persian · **P** performance ·
**S** privacy/security · **O** offline/PWA.

---

## `src/app/state.ts` — 282 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Pure reducer; state validity; recovery to nearest safe state |
| Lenses | R, T |
| Tests | `tests/unit/state.test.ts`, `tests/unit/history.test.ts` |
| Verdict | **F-02 (Low)** |

**Correctness.** `appReducer` routes any event its guard rejects to `recoverToNearestSafeState`
rather than returning state unchanged; for a valid `result`/`result_action`/`revealing` state that
returns `stage: 'intention'` with `currentPoemId: null`. Proven by direct execution. **Latent** —
every dispatch site is guarded and `OPEN_RESULT_ACTION` is dispatched only in tests. See F-02.

**TypeScript.** Exemplary. `as const satisfies readonly AppStatusCode[]` pins the code lists to the
union; `isValidState`'s `switch` is exhaustive over `AppStage` with no `default`, so adding a stage
becomes a compile error. Narrowing is done with real predicates, not assertions. No `any`.

**Maintainability.** `copyState` hand-expands every field rather than spreading, which is verbose
but makes `Partial<AppState>` overrides explicit and `readonly`-safe. Deliberate, not accidental.

---

## `src/app/history.ts` — 132 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | History-state serialisation, validation, and restore resolution |
| Lenses | R, T, S |
| Tests | `tests/unit/history.test.ts` |
| Verdict | **NO DEFECT** |

**Security/correctness.** `parseHistoryState` is genuinely defensive against a hostile
`history.state`: it rejects arrays, requires an **exact** key set (length *and* per-key match
against a sorted list — so extra keys are rejected, not ignored), pins `releaseId` to the expected
release, validates every field with a predicate, and enforces stage/poet coherence. This is the
right posture for a value an attacker can set via `pushState`.

**Contract note (informative, not a defect).** `DivanHistoryState` deliberately carries **no
`currentPoemId`** — only `{stage, selectedPoet, releaseId}`. The poem lives in `sessionStorage`.
This split is the structural precondition for F-03; it is a sound privacy choice (no poem ID in
history or URL, per the privacy lens) and the defect belongs to the writer, not this file.

**Dead-ish code.** `resolveDirectHistoryState` ignores its `_value` parameter and always returns
`welcomeState`. Underscore-prefixed and intentional (a direct/deep hit always lands on welcome,
matching prior finding L-12). Not a defect.

---

## `src/lib/accessibility/focus.ts` — 32 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Focus target constants; main-region and scene-target focus |
| Lenses | R, A, T |
| Tests | **none directly** (exercised via `App.tsx` in `tests/accessibility/appAccessibility.test.tsx`) |
| Verdict | **NO DEFECT** |

Both helpers **verify** the focus landed (`document.activeElement === element`) and return a
boolean rather than assuming success — the correct pattern, since `.focus()` silently no-ops on a
non-focusable or hidden element. Guards `instanceof HTMLElement` and null. No listeners, so no leak
surface. Rendered evidence confirms focus reaches the `h1` at every transition (Phase 6).

**Nit, not a defect.** `element === undefined || element === null` — `querySelector` returns
`T | null` and never `undefined`, so the first branch is unreachable. Harmless under
`strictNullChecks`; not worth a change (goal rule 3: no cosmetic churn).

---

## `src/lib/accessibility/motion.ts` — 53 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Reduced-motion resolution, system query, subscription; reveal durations |
| Lenses | R, M, A, T |
| Tests | **none directly** |
| Verdict | **NO DEFECT** |

**Correctness.** Precedence is explicit and right: explicit `reduced` → explicit `full` → system.
`readSystemReducedMotion` and `subscribeToSystemReducedMotion` both accept `matchMedia | undefined`
and wrap in `try/catch`, so a missing or throwing `matchMedia` degrades to "not reduced" instead of
crashing the app — correct fail-safe direction for a decorative concern.

**Leaks.** `subscribeToSystemReducedMotion` pairs `addEventListener`/`removeEventListener` on the
same query object and returns a no-op cleanup on the failure path, so the caller can always call
the returned function unconditionally. No leak.

**Rendered corroboration.** Phase 6 confirms the reduced-motion route end-to-end: video never
requested, zero `<video>` elements created, complete path to the verse.

---

## `src/lib/navigation/flowNavigation.ts` — 54 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | "← Choose another poet" — clears poet/poem, pushes a `choose_poet` entry |
| Lenses | R, T, S |
| Tests | **none directly** — backs the navigation PR #5 shipped specifically to add |
| Verdict | **F-03 (Low)** |

**Security.** `currentReleaseId` narrows `unknown` carefully and re-validates against
`PUBLIC_ID_PATTERN` before trusting `history.state`. `browserSessionStorage` wraps access in
`try/catch` for private-browsing/quota failures. Both correct.

**Correctness — F-03.** The function clears `selectedPoet` and `currentPoemId` from storage, then
`pushState`s a **new** entry. The prior entry still says `{stage:'result', selectedPoet:'hafez'}`,
so history and storage now disagree. See F-03.

**Fallback.** Wrapping `pushState` + synthetic `PopStateEvent` in `try/catch` with
`history.back()` as fallback is sound. Dispatching a synthetic `popstate` (browsers do not fire one
for `pushState`) is a legitimate way to reuse the single popstate handler as one state owner —
consistent with `divan-book-motion-system`'s "use a single state owner".

---

## `src/components/PoemResult.tsx` — 206 lines

| Field | Value |
| --- | --- |
| Full read | **partial — lines 100-135 only** |
| Purpose | Verse, translation, credits, share/save actions |
| Lenses | I, A, C |
| Tests | `tests/components/shareAction.test.tsx`, `poetSelectionNavigation.test.tsx` |
| Verdict | **PENDING — must not be read as cleared** |

Only the English/Persian sections were read, in service of F-01. Structure verified there:
`<section lang="fa" dir="rtl" aria-labelledby>` wrapping `<h2 id="persian-heading">متن فارسی</h2>`
and `.poem-lines`, with English preceding Persian per AGENT.md line 15. The share, save, download,
and audio surfaces are **unaudited**. Row stays `PENDING`.

---

## `src/styles/visual.css` — 1048 → 1056 lines

| Field | Value |
| --- | --- |
| Full read | **partial** |
| Purpose | Main visual system |
| Lenses | C, I |
| Tests | `tests/performance/visualBudgets.test.ts` (locked visual system) |
| Verdict | **F-01 (Low) — FIXED**; row otherwise **PENDING** |

Font/heading rules audited and repaired (F-01). The remaining ~1000 lines — stacking contexts,
z-index, safe-area, scroll locking, forced-colours, hover/active/disabled states — are
**unaudited**. Row stays `PENDING`.

---

## Progress

| Metric | Count |
| --- | ---: |
| Rows resolved (full read + verdict) | **5** |
| Rows partially read, still `PENDING` | 2 |
| Rows untouched `PENDING` | **120** |
| Total | 127 |
| Defects found in resolved rows | 2 (F-02, F-03) |
| `NO DEFECT` verdicts | 3 |

**The audit cannot pass in this state.** 120 rows have not been opened. Any later reader must treat
the absence of a finding for those files as **unaudited**, not as evidence of soundness.

### Signal from the ordering

Prioritising the inventory's "no direct test" files produced a defect (F-03) in the first three
files audited, from a module backing a navigation control that shipped as a dedicated fix (PR #5)
and still has no test importing it. The remaining untested files —
`src-sw/integrity.ts`, `src-sw/schemas.ts`, and `src/main.tsx` — should be audited next on the same
reasoning.
