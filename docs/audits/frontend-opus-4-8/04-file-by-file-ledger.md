# 04 — File-by-File Ledger

**Status: IN PROGRESS — 13 of 127 rows touched (9 resolved, 4 partial). 114 remain `PENDING`.**

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

## `src-sw/integrity.ts` — 87 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Canonical JSON, SHA-256, response reconstruction, fatal-UTF-8 parsing |
| Lenses | T, S, O |
| Tests | **none directly** (exercised transitively via `tests/offline/releaseManager.test.ts`) |
| Verdict | **NO DEFECT** |

**Security.** Strong. `parseJson`/`parseCanonicalJson` use `TextDecoder('utf-8', { fatal: true })`,
so malformed UTF-8 throws rather than silently substituting U+FFFD — which matters directly for
Persian byte integrity. `parseCanonicalJson` re-serialises and compares against the source text, so
a release whose encoding differs from the canonical form is rejected outright rather than accepted
and re-canonicalised. `canonicalStringify` sorts keys, rejects non-finite numbers, and throws on
unsupported types.

`responseFromBytes` deletes hop-by-hop and encoding headers before caching, including
**`set-cookie`/`set-cookie2`** — consistent with the no-cookies invariant — with a comment
explaining the real reason (replaying transfer metadata alongside reconstructed bytes misdescribes
the body and breaks Cache matching). `sha256` copies via `bytes.slice().buffer`, avoiding
offset/SharedArrayBuffer aliasing.

**Considered and dismissed.** `canonicalStringify` would emit `{}` for a `Date` or `RegExp` rather
than throwing, since both are `typeof 'object'` with no own enumerable keys. Unreachable in
practice: every input originates from `JSON.parse`, which never produces them. Not a defect;
recorded so a later reader need not re-derive it.

---

## `src/main.tsx` — 20 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | React root mount |
| Lenses | R |
| Tests | **none** |
| Verdict | **NO DEFECT** |

`StrictMode` is enabled (so the double-invoked-effect safety the goal's 4.1 lens asks about is
actually exercised in development), `ErrorBoundary` wraps `App` *inside* `StrictMode`, and a null
root throws explicitly rather than failing silently. Notably it does **not** register the service
worker — that is `sw-client/register.ts`, called from `App`, keeping the entry free of lifecycle
concerns.

---

## `src-sw/cacheTypes.ts` — 15 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Structural cache/crypto interfaces |
| Lenses | T |
| Tests | via `tests/offline/helpers.ts` |
| Verdict | **NO DEFECT** |

Narrow structural types for injection. `CryptoLike` is `Pick<SubtleCrypto, 'digest'>` — the minimum
surface, so a test double cannot accidentally satisfy more than the code needs.

---

## `src/contracts/app.ts` — 30 lines

| Field | Value |
| --- | --- |
| Full read | **yes** |
| Purpose | Stage/motion unions, history-state shape, storage key registry |
| Lenses | T, S |
| Tests | via `tests/unit/storage.test.ts`, `shuffleBag.test.ts` |
| Verdict | **NO DEFECT** — one **Informational** note (I-01) |

`APP_STAGES` and `MOTION_PREFERENCES` are `as const` and drive their unions, so the reducer's
exhaustive `switch` is compiler-enforced.

### I-01 (Informational) — `SESSION_STORAGE_KEYS` contains a localStorage key

`SESSION_STORAGE_KEYS.motionPreference` is a **misnomer**: the motion preference is a *localStorage*
key. `CLAUDE.md` invariant 4 explicitly permits this ("localStorage only for the motion
preference"), and the write is correct — `App.tsx:85` uses `browserStorage('localStorage')`.

**Verified, not assumed.** Rendered test at 390×844:

| Step | `localStorage` | `sessionStorage['divan.motionPreference']` | select |
| --- | --- | --- | --- |
| fresh | `{}` | `null` | `system` |
| set Reduced | `{divan.motionPreference: 'reduced'}` | **`null`** | `reduced` |
| reload | `{divan.motionPreference: 'reduced'}` | **`null`** | `reduced` |
| new context | `{}` | — | `system` |

The preference is written to localStorage **only**, never sessionStorage, and persists correctly.
The invariant holds.

**The latent smell:** `restoreSessionState(storage, …)` calls `readLocalMotionPreference(storage)`
with the **sessionStorage** adapter (`App.tsx:256`), i.e. it looks up a localStorage key name inside
sessionStorage and can only ever return `null`. Harmless today because `App.tsx:85` reads
localStorage directly and that value wins. It is dead-but-misleading code sitting on a privacy
boundary, and the misnamed constant invites a future author to persist the preference through the
session path. **Not a defect** — no behaviour is wrong — so no change is proposed under goal rule 3.
Recorded so the next reader does not mistake it for a bug, or repeat this investigation.

---

## `src-sw/schemas.ts` — 388 lines

| Field | Value |
| --- | --- |
| Full read | **partial — the asset/MIME contract (lines 267-310); the rest PENDING** |
| Purpose | Independent service-worker-side release validation |
| Lenses | T, S, O |
| Tests | **none directly** |
| Verdict | **NO live defect** — one **Informational** finding (I-02); row stays `PENDING` |

`FIXED_MIME` was compared entry-by-entry against `FIXED_BROWSER_ASSETS` in
`src/lib/content/release.ts`. **They are identical** — 11 paths, same MIME types, same order. The
drift `CLAUDE.md` warns about is **not** present. Verified, not assumed.

`VITE_ASSET_PATTERN` (`/^assets\/…-[a-f0-9]{16}\.(css|js|woff2|avif|png|svg|webp)$/u`) correctly
omits `mp4`: hashed Vite assets are never video, and the two cinematic masters are served from
fixed `public/` paths already covered by `FIXED_MIME`. Not a gap.

### I-02 (Informational) — the fixed asset list exists in four hand-maintained copies with no cross-check

`CLAUDE.md` documents this as a known trap ("**Two asset schemas must stay in sync**… a mismatch
shows up as *Offline release staging failed*"). The audit found the coupling is **wider than two**
and is protected by **nothing but discipline**:

| # | Location | Symbol |
| --- | --- | --- |
| 1 | `src/lib/content/release.ts` | `FIXED_BROWSER_ASSETS` (11 entries) |
| 2 | `src-sw/schemas.ts` | `FIXED_MIME` (11 entries) |
| 3 | `tests/content/release.test.ts` | `fixedBrowserSources()` (11 entries) |
| 4 | `scripts/build.ts` | `public/` allow-list (appears at ~638 and ~671) |

**Both maps are module-private and neither is exported. No test imports either. No test asserts the
copies agree.** Verified by grep: `FIXED_MIME|FIXED_BROWSER_ASSETS` appears nowhere under `tests/`
or `scripts/`.

**Why this is Informational, not a defect.** The copies agree today — measured, not assumed — so
there is no current user-facing fault. Severity must reflect real impact, and the impact is zero
right now.

**Why it is worth recording anyway.** The failure mode is asymmetric: a future author adding an
asset updates three of four copies, every existing test still passes (they build their manifests
from copy 3, which they just updated), and the drift ships. It surfaces to visitors as
"Offline release staging failed" — an offline-breaking error with no compile-time or test-time
signal. This is the same *cross-boundary coupling* shape that produced F-03, which is why it was
audited ahead of path order.

**Proposed repair (test-only, not applied).** Export the two maps and add a test asserting
`FIXED_MIME` and `FIXED_BROWSER_ASSETS` are entry-for-entry equal, and that
`fixedBrowserSources()` covers exactly the same key set. This is additive, changes no runtime
behaviour, and converts a silent runtime failure into a build-time one. It does **not** require the
structural unification a "single source of truth" refactor implies — goal rule 4 bars redesign on
best-practice grounds alone, and a shared module spanning the app/SW boundary would be a real
architectural change deserving its own decision.

**Not applied here** because Phase 8 authorised only F-01, and because adding it belongs with the
maintainer's judgement about the app/SW boundary.

---

## `src-sw/releaseManager.ts` — 871 lines

| Field | Value |
| --- | --- |
| Full read | **partial — exported surface + `#stageCurrentRelease` retention path (222-269); ~800 lines unread** |
| Purpose | Release staging, coherence, retention, cleanup, pointer management |
| Lenses | T, S, O |
| Tests | `tests/offline/releaseManager.test.ts`, `runtimeStrategies.test.ts`, `serviceWorker.test.ts` |
| Verdict | **No defect in what was read.** Row stays **`PENDING`** — the majority is unaudited |

**Cache naming (verified against rendered evidence).** `RELEASE_CACHE_PREFIX = 'divan-release-v2:'`
and `POINTER_CACHE_NAME = 'divan-release-pointers-v2'` match exactly the cache names observed live
during M-01 (`divan-release-v2:test-only-fixture-release`, `divan-release-pointers-v2`,
`divan-release-v2:audit-opus48-phase6`). Code and runtime agree.

**Retention path (222-269) — sound.** This is a direct implementation of the goal's 4.9
requirements, and it is written defensively:

- The release descriptor is parsed through `parseCanonicalJson` **and** a zod schema before use, so
  a malformed or non-canonical `release.json` is rejected at the boundary rather than partially
  applied.
- When the incoming release **is** the active one, it re-verifies coherence (ready record exists,
  candidate complete, hashes match) and throws `'Active release metadata is incoherent.'` rather
  than trusting its own cache.
- `isProtectedRollback` (`pointer?.previousReleaseId === descriptor.releaseId`) exempts a rollback
  target from cache deletion — the "previous-release retention" requirement, implemented rather
  than assumed.
- **Release-ID reuse with different hashes throws** and deletes the offending cache (unless it is
  the protected rollback). This is a genuine integrity control: it makes a mutated release under a
  reused ID a hard failure instead of a silent swap.
- A protected rollback whose metadata is incoherent throws rather than deleting — failing closed on
  the one cache that must survive.

**Explains M-01.** The stale-fixture episode was **correct** service-worker behaviour, not a bug:
the SW keeps serving the active release until a new one is *completely* staged. The 504 came from
the server no longer hosting the old fixture's content file, not from the SW misbehaving. This
strengthens the M-01 disposition — profile pollution, not a defect.

**Unaudited (~800 lines):** fetch strategies, pending/ready lifecycle, cleanup of superseded
caches, quota/Cache-API failure handling, and the `TimeoutAdapter` seam. Row remains `PENDING`; the
"no defect" above covers **only** the lines read.

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
| Rows resolved (full read + verdict) | **9** |
| Rows partially read, still `PENDING` | 4 |
| Rows untouched `PENDING` | **114** |
| Total | 127 |
| Defects found in resolved rows | 2 (F-02, F-03) |
| Informational notes | 2 (I-01, I-02) |
| `NO DEFECT` verdicts | 7 |

**The audit cannot pass in this state.** 114 rows have not been opened. Any later reader must treat
the absence of a finding for those files as **unaudited**, not as evidence of soundness.

### Signal from the ordering

Prioritising the inventory's "no direct test" files produced F-03 in the third file audited, from a
module backing a navigation control that shipped as a dedicated fix (PR #5) and still has no test
importing it.

The rest of that untested set has now been audited and came back clean: `integrity.ts` is the
strongest code read so far (fatal UTF-8 decoding, canonical-form re-verification, `set-cookie`
stripping before cache), `main.tsx` and `cacheTypes.ts` are correct, and `contracts/app.ts` yielded
only I-01. **Absence of tests did not predict defects here** — the honest read is that the untested
files are mostly small and defensive, and F-03 came from the one with real cross-store behaviour.

Two hypotheses were raised and **disproved by measurement** rather than filed: the motion
preference write/read mismatch (I-01 — verified written to localStorage only, persisting correctly)
and the reducer double-tap (F-02 — every dispatch site guarded). Recording the disproofs matters as
much as the findings.

**The cross-boundary-coupling hypothesis held.** Auditing `src-sw/schemas.ts` ahead of path order
— chosen because it is the far side of a coupling, not because it lacked tests — produced I-02 on
the first read. Coupling, not missing coverage, is the better predictor in this codebase. Both
findings so far (F-03, I-02) sit on a boundary where two owners must agree with no mechanism
forcing it.

**Next, on the same reasoning:** `App.tsx` (795L), where the focus, history, and release-replacement
races concentrate and where F-03's counterpart writer lives; then the remaining ~800 lines of
`releaseManager.ts`; then the ~1000 unaudited lines of `visual.css`.

### A note on the two largest files

`releaseManager.ts` (871L) and `App.tsx` (795L) together are ~13% of the frontend line count and
carry most of the state, race, and lifecycle risk. Neither can be honestly cleared by a partial
read. They should be the first work of the next session, before any further breadth.
