# 02 — Frontend File Inventory

Generated deterministically from tracked files at `2d1b72ab5681e1be452013d6f2374d4967423bc5` on branch
`audit/opus-4-8-exhaustive-frontend`. Machine-readable twin: `02-frontend-file-inventory.json`.

Mechanical fields (bytes, lines, import edges, test mapping) are **measured**, not hand-typed.
Responsibility and rendered-surface annotations are the auditor's.

## Method

Classification is by **reachability from a real browser entry point**, not by directory name.
Two entry points were traced with `madge`:

| Entry | Modules reachable |
| --- | --- |
| `src/main.tsx` (app) | 56 |
| `src-sw/service-worker.ts` (service worker) | 6 |

`src/contracts/release.ts` is reachable from **both** graphs — the one shared module across the
app/service-worker boundary, and therefore the place where a schema drift would surface as the
"Offline release staging failed" class of bug described in `CLAUDE.md`.

## Counts

| Metric | Count |
| --- | --- |
| Frontend files inventoried | **72** |
| — reachable from app graph | 56 |
| — reachable from SW graph | 6 |
| — not import-reachable (assets, media, entry, config) | 11 |
| Boundary dependencies (build-time, excluded) | 14 |
| Unannotated / unclassified | **0** |
| Audit status `PENDING` | 72 |

Total tracked under `src/`, `src-sw/`, `public/`, `index.html` = 72 + 14 = 86. Nothing is silently unclassified.

## Boundary dependencies — excluded from the frontend audit, listed not omitted

Per goal Phase 2, private poetry machinery is not a frontend file. All 14 files under
`src/lib/content/` are **build-time content, rights, and review machinery**. The import trace
proves the boundary: **none is reachable from either browser entry point**. They define contracts
the frontend consumes (via `src/contracts/`), so they are listed here as boundary dependencies.

| Path | Lines | Reachable from app graph | Tests |
| --- | ---: | --- | --- |
| `src/lib/content/authoringSchema.ts` | 374 | no | 3 |
| `src/lib/content/canonical.ts` | 101 | no | 5 |
| `src/lib/content/canonicalIdentity.ts` | 22 | no | 0 |
| `src/lib/content/compileCorpus.ts` | 510 | no | 5 |
| `src/lib/content/compileItem.ts` | 76 | no | 3 |
| `src/lib/content/productionManifest.ts` | 217 | no | 1 |
| `src/lib/content/productionSelection.ts` | 107 | no | 2 |
| `src/lib/content/publicSchema.ts` | 234 | no | 3 |
| `src/lib/content/registrySchemas.ts` | 607 | no | 5 |
| `src/lib/content/release.ts` | 446 | no | 1 |
| `src/lib/content/remoteResource.ts` | 12 | no | 0 |
| `src/lib/content/reviewAuthority.ts` | 193 | no | 4 |
| `src/lib/content/sourceRegistrySchema.ts` | 200 | no | 2 |
| `src/lib/content/sourceRightsSchema.ts` | 108 | no | 1 |

> `src/lib/content/release.ts` deserves a note: `CLAUDE.md` names it as the home of
> `FIXED_BROWSER_ASSETS`, which must stay in sync with `src-sw/schemas.ts` `FIXED_MIME`. It is
> build-time (not browser-reachable), but it is a **live coupling** to the service worker and is
> therefore in scope for the Phase 5 cross-file audit even though it is out of scope as a file.

## Frontend files

Columns: **App** = reachable from `src/main.tsx`; **SW** = reachable from the service-worker
entry; **Tests** = test files importing this module directly (indirect coverage via `App.tsx`
is not counted here and is assessed per-file in Phase 4).

### entry (2)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `index.html` | 45 | 1,451 |  |  | Document shell, meta, mount point | all | — | PENDING |
| `src/main.tsx` | 21 | 486 | ✓ |  | React root mount and SW registration bootstrap | all | — | PENDING |

### app (5)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/app/App.tsx` | 796 | 25,940 | ✓ |  | Reducer host, history, offline, focus orchestration, scene routing | all | `accessibility/appAccessibility.test.tsx`<br>`components/appFlow.test.tsx`<br>`components/contextRoutes.test.tsx`<br>`components/failures.test.tsx`<br>`components/offlineIntegration.test.tsx`<br>`components/poetSelectionNavigation.test.tsx`<br>`components/visualLanguage.test.tsx` | PENDING |
| `src/app/ErrorBoundary.tsx` | 41 | 1,020 | ✓ |  | Top-level error containment | all | `accessibility/appAccessibility.test.tsx`<br>`components/failures.test.tsx` | PENDING |
| `src/app/history.ts` | 133 | 3,514 | ✓ |  | History serialisation and restore | all | `unit/history.test.ts` | PENDING |
| `src/app/runtime.ts` | 441 | 12,995 | ✓ |  | Release fetch, verification, runtime assembly | boot | `components/fixtures.ts`<br>`components/runtime.test.ts` | PENDING |
| `src/app/state.ts` | 283 | 7,956 | ✓ |  | Pure reducer, state validity, recovery | all | `unit/history.test.ts`<br>`unit/state.test.ts` | PENDING |

### scene (6)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/scenes/BlockingErrorScene.tsx` | 23 | 717 | ✓ |  | Fail-closed error surface | error | — | PENDING |
| `src/scenes/BootScene.tsx` | 24 | 624 | ✓ |  | Boot/loading | boot | — | PENDING |
| `src/scenes/ChoosePoetScene.tsx` | 48 | 1,615 | ✓ |  | Hafez/Rumi selection | choose_poet | — | PENDING |
| `src/scenes/IntentionScene.tsx` | 40 | 1,406 | ✓ |  | Hold a thought + Reveal | intention | `components/poetSelectionNavigation.test.tsx` | PENDING |
| `src/scenes/RevealScene.tsx` | 89 | 2,815 | ✓ |  | Reveal transition + Skip | revealing | — | PENDING |
| `src/scenes/WelcomeScene.tsx` | 50 | 1,493 | ✓ |  | Welcome + Begin | welcome | — | PENDING |

### component (15)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/components/BookStage.tsx` | 40 | 1,038 | ✓ |  | Live book scene receiving cinematic handoff | reveal/result | — | PENDING |
| `src/components/ButterflyField.tsx` | 43 | 1,429 | ✓ |  | Decorative butterflies (skill cap: max 2) | reveal/result | — | PENDING |
| `src/components/CandleScene.tsx` | 14 | 546 | ✓ |  | Candle body and glow | reveal/result | — | PENDING |
| `src/components/CinematicThreshold.tsx` | 345 | 10,068 | ✓ |  | Two-scene entrance, poster-first, scroll-scrub, Skip, handoff | welcome/cinematic | `components/cinematicBegin.test.tsx`<br>`components/cinematicThreshold.test.tsx` | PENDING |
| `src/components/DecorativeGeometry.tsx` | 96 | 3,262 | ✓ |  | Original SVG geometric motifs | multiple | — | PENDING |
| `src/components/FlowBackButton.tsx` | 11 | 289 | ✓ |  | Visible return-to-poet navigation | intention/result | — | PENDING |
| `src/components/IlluminatedFrame.tsx` | 20 | 394 | ✓ |  | Manuscript border framing | result | — | PENDING |
| `src/components/LiveRegion.tsx` | 17 | 285 | ✓ |  | Single shared polite live region | all | — | PENDING |
| `src/components/ManuscriptPortal.tsx` | 20 | 443 | ✓ |  | Portal motif | welcome | — | PENDING |
| `src/components/MotionControl.tsx` | 26 | 733 | ✓ |  | Motion preference control | all | — | PENDING |
| `src/components/OfflineBadge.tsx` | 4 | 98 | ✓ |  | Offline status indicator | all | — | PENDING |
| `src/components/PoemResult.tsx` | 207 | 6,311 | ✓ |  | Verse, translation, credits, share/save actions | result | `components/poetSelectionNavigation.test.tsx`<br>`components/shareAction.test.tsx` | PENDING |
| `src/components/PoetryMotes.tsx` | 18 | 538 | ✓ |  | Ambient motes | reveal/result | — | PENDING |
| `src/components/SkipLink.tsx` | 17 | 398 | ✓ |  | Skip-to-content link | all | — | PENDING |
| `src/components/SourceCredit.tsx` | 51 | 1,495 | ✓ |  | Source/rights attribution | result | — | PENDING |

### page (8)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/pages/AboutPage.tsx` | 58 | 2,354 | ✓ |  | About | about | — | PENDING |
| `src/pages/AccessibilityPage.tsx` | 50 | 2,059 | ✓ |  | Accessibility statement | accessibility | — | PENDING |
| `src/pages/ContextLayout.tsx` | 28 | 624 | ✓ |  | Shared context page chrome | context pages | — | PENDING |
| `src/pages/CreditsPage.tsx` | 123 | 4,009 | ✓ |  | Credits and rights | credits | — | PENDING |
| `src/pages/index.tsx` | 29 | 777 | ✓ |  | Context page registry | context pages | — | PENDING |
| `src/pages/OfflinePage.tsx` | 45 | 1,741 | ✓ |  | Offline context page | offline | — | PENDING |
| `src/pages/PrivacyPage.tsx` | 66 | 2,635 | ✓ |  | Privacy statement | privacy | — | PENDING |
| `src/pages/routes.ts` | 14 | 321 | ✓ |  | Context route table | context pages | — | PENDING |

### contract (3)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/contracts/app.ts` | 31 | 795 | ✓ |  | App stage and motion preference types | all | `components/appFlow.test.tsx`<br>`components/poetSelectionNavigation.test.tsx`<br>`unit/shuffleBag.test.ts`<br>`unit/storage.test.ts` | PENDING |
| `src/contracts/content.ts` | 64 | 1,876 | ✓ |  | Poet and poem item types | all | `accessibility/appAccessibility.test.tsx`<br>`components/appFlow.test.tsx`<br>`components/fixtures.ts`<br>`components/runtime.test.ts`<br>`components/shareAction.test.tsx`<br>`content/compileItem.test.ts`<br>`share/shareCard.test.ts`<br>`share/shareService.test.ts` | PENDING |
| `src/contracts/release.ts` | 44 | 1,074 | ✓ | ✓ | Release shape — SHARED by app and service worker | all | `components/runtime.test.ts` | PENDING |

### lib (10)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/lib/accessibility/focus.ts` | 33 | 796 | ✓ |  | Focus target resolution | all | — | PENDING |
| `src/lib/accessibility/motion.ts` | 54 | 1,497 | ✓ |  | Reduced-motion resolution and persistence | all | — | PENDING |
| `src/lib/cinematic/capability.ts` | 65 | 1,820 | ✓ |  | Media/Save-Data/reduced-motion capability routing | cinematic | `unit/cinematicCapability.test.ts` | PENDING |
| `src/lib/cinematic/scrollScrub.ts` | 91 | 2,221 | ✓ |  | Scroll-to-currentTime scrub, seek coalescing | cinematic | `unit/scrollScrub.test.ts` | PENDING |
| `src/lib/draw/secureRandom.ts` | 68 | 1,749 | ✓ |  | CSPRNG wrapper | reveal | `unit/secureRandom.test.ts`<br>`unit/shuffleBag.test.ts` | PENDING |
| `src/lib/draw/shuffleBag.ts` | 125 | 3,287 | ✓ |  | No-repeat draw bag | reveal | `unit/shuffleBag.test.ts` | PENDING |
| `src/lib/navigation/flowNavigation.ts` | 55 | 1,339 | ✓ |  | Flow navigation targets | intention/result | — | PENDING |
| `src/lib/share/shareCard.ts` | 120 | 5,367 | ✓ |  | Share card composition | result | `share/shareCard.test.ts` | PENDING |
| `src/lib/share/shareService.ts` | 126 | 3,590 | ✓ |  | Web Share / download / clipboard fallbacks | result | `share/shareService.test.ts` | PENDING |
| `src/lib/storage/session.ts` | 309 | 8,046 | ✓ |  | sessionStorage public IDs; localStorage motion pref only | all | `unit/shuffleBag.test.ts`<br>`unit/storage.test.ts` | PENDING |

### style (7)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/app/core.css` | 186 | 3,185 | ✓ |  | Base layout and reset-adjacent rules | all | — | PENDING |
| `src/styles/flow-navigation.css` | 36 | 807 | ✓ |  | Flow navigation styling | intention/result | — | PENDING |
| `src/styles/fonts.css` | 54 | 1,318 | ✓ |  | Self-hosted font faces, swap, no remote URL | all | — | PENDING |
| `src/styles/index.css` | 5 | 95 | ✓ |  | Style entry aggregator | all | — | PENDING |
| `src/styles/motion.css` | 352 | 7,248 | ✓ |  | Motion and reduced-motion rules | all | — | PENDING |
| `src/styles/tokens.css` | 53 | 1,451 | ✓ |  | Authoritative colour/spacing tokens (locked: defined once) | all | — | PENDING |
| `src/styles/visual.css` | 1049 | 22,643 | ✓ |  | Main visual system | all | — | PENDING |

### sw-client (1)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/sw-client/register.ts` | 264 | 7,585 | ✓ |  | SW registration bridge, update messaging | all | `accessibility/appAccessibility.test.tsx`<br>`components/failures.test.tsx`<br>`components/offlineIntegration.test.tsx`<br>`offline/client.test.ts` | PENDING |

### sw (5)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src-sw/cacheTypes.ts` | 16 | 469 |  | ✓ | Cache naming/type contract | all (offline) | `offline/helpers.ts` | PENDING |
| `src-sw/integrity.ts` | 88 | 2,512 |  | ✓ | Digest/integrity checks | all (offline) | — | PENDING |
| `src-sw/releaseManager.ts` | 872 | 28,287 |  | ✓ | Release staging, coherence, retention, cleanup | all (offline) | `offline/releaseManager.test.ts`<br>`offline/runtimeStrategies.test.ts`<br>`offline/serviceWorker.test.ts` | PENDING |
| `src-sw/schemas.ts` | 389 | 11,929 |  | ✓ | Independent SW-side validation (FIXED_MIME) | all (offline) | — | PENDING |
| `src-sw/service-worker.ts` | 196 | 5,681 |  | ✓ | SW entry, fetch/install/activate | all (offline) | `offline/artifacts.test.ts`<br>`offline/serviceWorker.test.ts` | PENDING |

### asset (3)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `public/icon.svg` | 12 | 685 |  |  | App icon (SVG — raster budget is 0 bytes) | install | — | PENDING |
| `public/manifest.webmanifest` | 22 | 479 |  |  | PWA manifest | install | — | PENDING |
| `public/offline.html` | 36 | 1,293 |  |  | Offline fallback document | offline | — | PENDING |

### media (6)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `public/images/divan-alcove-desktop.webp` | bin | 64,474 |  |  | Alcove backdrop 16:9 | reveal/result | — | PENDING |
| `public/images/divan-alcove-mobile.webp` | bin | 66,134 |  |  | Alcove backdrop 9:16 | reveal/result | — | PENDING |
| `public/images/divan-poster-desktop.webp` | bin | 199,096 |  |  | Cinematic poster 16:9 | cinematic | — | PENDING |
| `public/images/divan-poster-mobile.webp` | bin | 202,136 |  |  | Cinematic poster 9:16 | cinematic | — | PENDING |
| `public/video/divan-cinematic-desktop.mp4` | bin | 2,700,797 |  |  | Cinematic master 16:9 | cinematic | — | PENDING |
| `public/video/divan-cinematic-mobile.mp4` | bin | 2,624,919 |  |  | Cinematic master 9:16 | cinematic | — | PENDING |

### config (1)

| Path | Lines | Bytes | App | SW | Responsibility | Surface | Direct tests | Status |
| --- | ---: | ---: | :-: | :-: | --- | --- | --- | --- |
| `src/vite-env.d.ts` | 2 | 38 |  |  | Vite ambient type reference | none | — | PENDING |

## Test-coverage observations (to be proven in Phase 4, not asserted here)

50 of 72 frontend files have **no test importing them directly**. That is not the
same as untested — most components are exercised through `tests/components/appFlow.test.tsx` and
`tests/accessibility/appAccessibility.test.tsx` via `App.tsx`, and the CSS is governed by
`tests/performance/visualBudgets.test.ts`. Files where the absence is worth a closer look in
Phase 4:

- `src/lib/accessibility/focus.ts` and `motion.ts` — no direct unit test, yet they drive focus
  and the reduced-motion route, both of which are hard accessibility requirements.
- `src/lib/navigation/flowNavigation.ts` — no direct unit test; backs the visible
  return-to-poet-selection navigation that PR #5 shipped specifically to fix.
- `src-sw/integrity.ts` and `src-sw/schemas.ts` — no direct test import; exercised only
  transitively through `releaseManager` tests.
- `src/main.tsx` — no test; the mount and SW-registration bootstrap.

## Frontend configuration (7)

| Path | Lines | Responsibility | Status |
| --- | ---: | --- | --- |
| `vite.config.ts` | 31 | Build config; publicDir:false, asset allow-listing interacts with dist integrity | PENDING |
| `vitest.config.ts` | 37 | Unit/component runner; excludes e2e | PENDING |
| `playwright.config.ts` | 2 | E2E runner; port 4173 | PENDING |
| `tsconfig.json` | 35 | Strict TS incl. noUncheckedIndexedAccess | PENDING |
| `eslint.config.js` | 67 | Lint, --max-warnings 0 | PENDING |
| `.prettierrc.json` | 9 | Format: single quotes, semi, trailing comma, width 80 | PENDING |
| `.prettierignore` | 29 | Excludes AGENT.md/CHANGELOG.md/design doc from format churn | PENDING |

## Frontend tests (39)

Suites that exercise the browser surface. `tests/content/` is **excluded** — its 32 files
test the build-time boundary machinery, not the frontend, and are listed separately below.

### tests/accessibility (2)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/accessibility/appAccessibility.test.tsx` | 415 | PENDING |
| `tests/accessibility/styles.test.ts` | 154 | PENDING |

### tests/components (12)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/components/appFlow.test.tsx` | 409 | PENDING |
| `tests/components/cinematicBegin.test.tsx` | 88 | PENDING |
| `tests/components/cinematicThreshold.test.tsx` | 179 | PENDING |
| `tests/components/contextRoutes.test.tsx` | 97 | PENDING |
| `tests/components/document.test.ts` | 30 | PENDING |
| `tests/components/failures.test.tsx` | 253 | PENDING |
| `tests/components/fixtures.ts` | 96 | PENDING |
| `tests/components/offlineIntegration.test.tsx` | 150 | PENDING |
| `tests/components/poetSelectionNavigation.test.tsx` | 147 | PENDING |
| `tests/components/runtime.test.ts` | 389 | PENDING |
| `tests/components/shareAction.test.tsx` | 188 | PENDING |
| `tests/components/visualLanguage.test.tsx` | 69 | PENDING |

### tests/e2e (5)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/e2e/accessibility.playwright.config.ts` | 25 | PENDING |
| `tests/e2e/accessibility.spec.ts` | 281 | PENDING |
| `tests/e2e/offline-server.ts` | 305 | PENDING |
| `tests/e2e/offline.spec.ts` | 163 | PENDING |
| `tests/e2e/visual.spec.ts` | 347 | PENDING |

### tests/offline (6)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/offline/artifacts.test.ts` | 62 | PENDING |
| `tests/offline/client.test.ts` | 238 | PENDING |
| `tests/offline/helpers.ts` | 319 | PENDING |
| `tests/offline/releaseManager.test.ts` | 571 | PENDING |
| `tests/offline/runtimeStrategies.test.ts` | 377 | PENDING |
| `tests/offline/serviceWorker.test.ts` | 251 | PENDING |

### tests/performance (1)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/performance/visualBudgets.test.ts` | 142 | PENDING |

### tests/security (3)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/security/opsConfig.test.ts` | 1038 | PENDING |
| `tests/security/publicReadiness.test.ts` | 239 | PENDING |
| `tests/security/qrGenerator.test.ts` | 89 | PENDING |

### tests/share (2)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/share/shareCard.test.ts` | 183 | PENDING |
| `tests/share/shareService.test.ts` | 113 | PENDING |

### tests/unit (7)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/unit/cinematicCapability.test.ts` | 70 | PENDING |
| `tests/unit/history.test.ts` | 123 | PENDING |
| `tests/unit/scrollScrub.test.ts` | 113 | PENDING |
| `tests/unit/secureRandom.test.ts` | 84 | PENDING |
| `tests/unit/shuffleBag.test.ts` | 147 | PENDING |
| `tests/unit/state.test.ts` | 151 | PENDING |
| `tests/unit/storage.test.ts` | 225 | PENDING |

### tests/setup (1)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/setup/vitest.ts` | 2 | PENDING |

### Test fixtures (9)

| Path | Lines | Status |
| --- | ---: | --- |
| `tests/fixtures/content/corpus.ts` | 294 | PENDING |
| `tests/fixtures/ops/README.md` | 12 | PENDING |
| `tests/fixtures/ops/immutable-image.txt` | 2 | PENDING |
| `tests/fixtures/ops/mock-bin/docker` | 55 | PENDING |
| `tests/fixtures/ops/mock-bin/stat` | 36 | PENDING |
| `tests/fixtures/ops/rendered-config.yml` | 10 | PENDING |
| `tests/fixtures/ops/synthetic-not-a-credential.json` | 2 | PENDING |
| `tests/fixtures/poetry/build-fixture-epub.py` | 86 | PENDING |
| `tests/fixtures/poetry/build-ghazal-fixture-epub.py` | 157 | PENDING |

### Boundary tests — excluded (32)

All under `tests/content/`; they test `src/lib/content/*` build-time machinery.
Listed for completeness, not audited as frontend.


## Tracked visual baselines

**None.** No tracked screenshot or visual-snapshot baselines exist in the repository
(`git ls-files` returns no `.png`/snapshot artefacts). Phase 6 rendered evidence therefore has
**no committed baseline to diff against** — comparisons must be made against the live public site
and the locked design authority, and any "before/after" evidence this audit produces is new, not
a regression against a stored baseline. Recorded so no later reader assumes baselines existed.

## Prior audit evidence not yet read

Goal Phase 0 requires reading prior UI/UX audit evidence under `docs/audits/divan/`. Four
baselines exist and are **not yet read** at the time this inventory was frozen:

- `docs/audits/divan/02-ux-flow-baseline.md`
- `docs/audits/divan/03-accessibility-bilingual-baseline.md`
- `docs/audits/divan/04-responsive-browser-baseline.md`
- `docs/audits/divan/05-frontend-performance-baseline.md`

These must be read before Phase 4 conclusions are trusted: they may already record findings this
audit would otherwise re-report as new, and `04`/`05` bear directly on the Phase 6 browser matrix
and Phase 4.7 performance lens. Recorded as an open gap rather than silently skipped.

## Revised totals

| Metric | Count |
| --- | ---: |
| Frontend source/asset files | 72 |
| Frontend configuration files | 7 |
| Frontend test files | 39 |
| Test fixtures | 9 |
| **Total rows requiring audit** | **127** |
| Boundary dependencies (excluded, listed) | 14 |
| Boundary tests (excluded, listed) | 32 |
| Tracked visual baselines | 0 |
| Rows currently `PENDING` | **127** |
