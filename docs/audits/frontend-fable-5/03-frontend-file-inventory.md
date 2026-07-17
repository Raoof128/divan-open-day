# Fable 5 frontend audit — Phase 3 frontend file inventory

Generated deterministically from `git ls-files` at `e348048` (audit branch base). Frontend files: **131**. Boundary dependencies (build-time content pipeline consumed by the frontend contract): **14** — recorded separately per the goal; not part of the file-by-file frontend read requirement but their contracts are checked at the boundary.

Status values: all rows READ/AUDITED (text) or INSPECTED (binary) as of Phase 5 completion (see 05-file-by-file-ledger.md for per-file findings).

## Frontend files

| Path | Category | Type | Bytes | Lines | Status |
| --- | --- | --- | --- | --- | --- |
| docs/verification/divan-cinematic-assets.json | doc-frontend-verification | json | 1529 | 49 | READ/AUDITED |
| docs/verification/divan-cinematic-enhancement-report.md | doc-frontend-verification | md | 9748 | 149 | READ/AUDITED |
| docs/verification/divan-cinematic-provenance.md | doc-frontend-verification | md | 9276 | 133 | READ/AUDITED |
| docs/verification/visible-navigation-and-cinematic-begin.md | doc-frontend-verification | md | 6674 | 122 | READ/AUDITED |
| eslint.config.js | config | js | 1780 | 67 | READ/AUDITED |
| index.html | entry-html | html | 1451 | 45 | READ/AUDITED |
| playwright.config.ts | config | ts | 71 | 2 | READ/AUDITED |
| public/icon.svg | public-asset | svg | 685 | 12 | READ/AUDITED |
| public/images/divan-alcove-desktop.webp | media-image | binary | 64474 | — | INSPECTED (binary) |
| public/images/divan-alcove-mobile.webp | media-image | binary | 66134 | — | INSPECTED (binary) |
| public/images/divan-poster-desktop.webp | media-image | binary | 199096 | — | INSPECTED (binary) |
| public/images/divan-poster-mobile.webp | media-image | binary | 202136 | — | INSPECTED (binary) |
| public/manifest.webmanifest | public-asset | webmanifest | 479 | 22 | READ/AUDITED |
| public/offline.html | public-asset | html | 1293 | 36 | READ/AUDITED |
| public/video/divan-cinematic-desktop.mp4 | media-video | binary | 2700797 | — | INSPECTED (binary) |
| public/video/divan-cinematic-mobile.mp4 | media-video | binary | 2624919 | — | INSPECTED (binary) |
| scripts/build.ts | build-script | ts | 35811 | 1177 | READ/AUDITED |
| scripts/check.sh | quality-gate | sh | 3972 | 127 | READ/AUDITED |
| scripts/verify-dist.ts | build-script | ts | 21646 | 728 | READ/AUDITED |
| scripts/verify-privacy.ts | build-script | ts | 4360 | 150 | READ/AUDITED |
| src-sw/cacheTypes.ts | service-worker | ts | 469 | 16 | READ/AUDITED |
| src-sw/integrity.ts | service-worker | ts | 2512 | 88 | READ/AUDITED |
| src-sw/releaseManager.ts | service-worker | ts | 28287 | 872 | READ/AUDITED |
| src-sw/schemas.ts | service-worker | ts | 11929 | 389 | READ/AUDITED |
| src-sw/service-worker.ts | service-worker | ts | 5681 | 196 | READ/AUDITED |
| src/app/App.tsx | app-core | tsx | 25940 | 796 | READ/AUDITED |
| src/app/core.css | app-core | css | 3185 | 186 | READ/AUDITED |
| src/app/ErrorBoundary.tsx | app-core | tsx | 1020 | 41 | READ/AUDITED |
| src/app/history.ts | app-core | ts | 3514 | 133 | READ/AUDITED |
| src/app/runtime.ts | app-core | ts | 12995 | 441 | READ/AUDITED |
| src/app/state.ts | app-core | ts | 7956 | 283 | READ/AUDITED |
| src/components/BookStage.tsx | component | tsx | 1038 | 40 | READ/AUDITED |
| src/components/ButterflyField.tsx | component | tsx | 1429 | 43 | READ/AUDITED |
| src/components/CandleScene.tsx | component | tsx | 546 | 14 | READ/AUDITED |
| src/components/CinematicThreshold.tsx | component | tsx | 10068 | 345 | READ/AUDITED |
| src/components/DecorativeGeometry.tsx | component | tsx | 3262 | 96 | READ/AUDITED |
| src/components/FlowBackButton.tsx | component | tsx | 289 | 11 | READ/AUDITED |
| src/components/IlluminatedFrame.tsx | component | tsx | 394 | 20 | READ/AUDITED |
| src/components/LiveRegion.tsx | component | tsx | 285 | 17 | READ/AUDITED |
| src/components/ManuscriptPortal.tsx | component | tsx | 443 | 20 | READ/AUDITED |
| src/components/MotionControl.tsx | component | tsx | 733 | 26 | READ/AUDITED |
| src/components/OfflineBadge.tsx | component | tsx | 98 | 4 | READ/AUDITED |
| src/components/PoemResult.tsx | component | tsx | 6311 | 207 | READ/AUDITED |
| src/components/PoetryMotes.tsx | component | tsx | 538 | 18 | READ/AUDITED |
| src/components/SkipLink.tsx | component | tsx | 398 | 17 | READ/AUDITED |
| src/components/SourceCredit.tsx | component | tsx | 1495 | 51 | READ/AUDITED |
| src/contracts/app.ts | contract | ts | 795 | 31 | READ/AUDITED |
| src/contracts/content.ts | contract | ts | 1876 | 64 | READ/AUDITED |
| src/contracts/release.ts | contract | ts | 1074 | 44 | READ/AUDITED |
| src/lib/accessibility/focus.ts | lib-a11y | ts | 796 | 33 | READ/AUDITED |
| src/lib/accessibility/motion.ts | lib-a11y | ts | 1497 | 54 | READ/AUDITED |
| src/lib/cinematic/capability.ts | lib-cinematic | ts | 1820 | 65 | READ/AUDITED |
| src/lib/cinematic/scrollScrub.ts | lib-cinematic | ts | 2221 | 91 | READ/AUDITED |
| src/lib/content/publicSchema.ts | release-contract | ts | 6895 | 234 | READ/AUDITED |
| src/lib/content/release.ts | release-contract | ts | 13979 | 446 | READ/AUDITED |
| src/lib/draw/secureRandom.ts | lib-draw | ts | 1749 | 68 | READ/AUDITED |
| src/lib/draw/shuffleBag.ts | lib-draw | ts | 3287 | 125 | READ/AUDITED |
| src/lib/navigation/flowNavigation.ts | lib-navigation | ts | 1339 | 55 | READ/AUDITED |
| src/lib/share/shareCard.ts | lib-share | ts | 5367 | 120 | READ/AUDITED |
| src/lib/share/shareService.ts | lib-share | ts | 3590 | 126 | READ/AUDITED |
| src/lib/storage/session.ts | lib-storage | ts | 8046 | 309 | READ/AUDITED |
| src/main.tsx | entry-js | tsx | 486 | 21 | READ/AUDITED |
| src/pages/AboutPage.tsx | page | tsx | 2354 | 58 | READ/AUDITED |
| src/pages/AccessibilityPage.tsx | page | tsx | 2059 | 50 | READ/AUDITED |
| src/pages/ContextLayout.tsx | page | tsx | 624 | 28 | READ/AUDITED |
| src/pages/CreditsPage.tsx | page | tsx | 4009 | 123 | READ/AUDITED |
| src/pages/index.tsx | page | tsx | 777 | 29 | READ/AUDITED |
| src/pages/OfflinePage.tsx | page | tsx | 1741 | 45 | READ/AUDITED |
| src/pages/PrivacyPage.tsx | page | tsx | 2635 | 66 | READ/AUDITED |
| src/pages/routes.ts | page | ts | 321 | 14 | READ/AUDITED |
| src/scenes/BlockingErrorScene.tsx | scene | tsx | 717 | 23 | READ/AUDITED |
| src/scenes/BootScene.tsx | scene | tsx | 624 | 24 | READ/AUDITED |
| src/scenes/ChoosePoetScene.tsx | scene | tsx | 1615 | 48 | READ/AUDITED |
| src/scenes/IntentionScene.tsx | scene | tsx | 1406 | 40 | READ/AUDITED |
| src/scenes/RevealScene.tsx | scene | tsx | 2815 | 89 | READ/AUDITED |
| src/scenes/WelcomeScene.tsx | scene | tsx | 1493 | 50 | READ/AUDITED |
| src/styles/flow-navigation.css | style | css | 807 | 36 | READ/AUDITED |
| src/styles/fonts.css | style | css | 1318 | 54 | READ/AUDITED |
| src/styles/index.css | style | css | 95 | 5 | READ/AUDITED |
| src/styles/motion.css | style | css | 7248 | 352 | READ/AUDITED |
| src/styles/tokens.css | style | css | 1451 | 53 | READ/AUDITED |
| src/styles/visual.css | style | css | 22643 | 1049 | READ/AUDITED |
| src/sw-client/register.ts | sw-client | ts | 7585 | 264 | READ/AUDITED |
| src/vite-env.d.ts | config-types | ts | 38 | 2 | READ/AUDITED |
| tests/accessibility/appAccessibility.test.tsx | test-a11y | tsx | 13624 | 415 | READ/AUDITED |
| tests/accessibility/styles.test.ts | test-a11y | ts | 6182 | 154 | READ/AUDITED |
| tests/components/appFlow.test.tsx | test-component | tsx | 13052 | 409 | READ/AUDITED |
| tests/components/cinematicBegin.test.tsx | test-component | tsx | 2787 | 88 | READ/AUDITED |
| tests/components/cinematicThreshold.test.tsx | test-component | tsx | 5703 | 179 | READ/AUDITED |
| tests/components/contextRoutes.test.tsx | test-component | tsx | 3544 | 97 | READ/AUDITED |
| tests/components/document.test.ts | test-component | ts | 1291 | 30 | READ/AUDITED |
| tests/components/failures.test.tsx | test-component | tsx | 7414 | 253 | READ/AUDITED |
| tests/components/fixtures.ts | test-component | ts | 3331 | 96 | READ/AUDITED |
| tests/components/offlineIntegration.test.tsx | test-component | tsx | 4198 | 150 | READ/AUDITED |
| tests/components/poetSelectionNavigation.test.tsx | test-component | tsx | 4192 | 147 | READ/AUDITED |
| tests/components/runtime.test.ts | test-component | ts | 11334 | 389 | READ/AUDITED |
| tests/components/shareAction.test.tsx | test-component | tsx | 5949 | 188 | READ/AUDITED |
| tests/components/visualLanguage.test.tsx | test-component | tsx | 2318 | 69 | READ/AUDITED |
| tests/content/buildRelease.test.ts | test-release-contract | ts | 46977 | 1369 | READ/AUDITED |
| tests/content/canonical.test.ts | test-release-contract | ts | 1399 | 49 | READ/AUDITED |
| tests/content/contentLoader.test.ts | test-release-contract | ts | 7101 | 244 | READ/AUDITED |
| tests/content/productionManifest.test.ts | test-release-contract | ts | 1749 | 62 | READ/AUDITED |
| tests/content/publicSchema.test.ts | test-release-contract | ts | 6723 | 221 | READ/AUDITED |
| tests/content/release.test.ts | test-release-contract | ts | 9905 | 310 | READ/AUDITED |
| tests/e2e/accessibility.playwright.config.ts | test-e2e | ts | 688 | 25 | READ/AUDITED |
| tests/e2e/accessibility.spec.ts | test-e2e | ts | 9594 | 281 | READ/AUDITED |
| tests/e2e/offline-server.ts | test-e2e | ts | 9017 | 305 | READ/AUDITED |
| tests/e2e/offline.spec.ts | test-e2e | ts | 5913 | 163 | READ/AUDITED |
| tests/e2e/visual.spec.ts | test-e2e | ts | 10673 | 347 | READ/AUDITED |
| tests/fixtures/content/corpus.ts | test-fixture | ts | 10193 | 294 | READ/AUDITED |
| tests/offline/artifacts.test.ts | test-offline | ts | 2142 | 62 | READ/AUDITED |
| tests/offline/client.test.ts | test-offline | ts | 7477 | 238 | READ/AUDITED |
| tests/offline/helpers.ts | test-offline | ts | 10841 | 319 | READ/AUDITED |
| tests/offline/releaseManager.test.ts | test-offline | ts | 20142 | 571 | READ/AUDITED |
| tests/offline/runtimeStrategies.test.ts | test-offline | ts | 12675 | 377 | READ/AUDITED |
| tests/offline/serviceWorker.test.ts | test-offline | ts | 7306 | 251 | READ/AUDITED |
| tests/performance/visualBudgets.test.ts | test-performance | ts | 5080 | 142 | READ/AUDITED |
| tests/security/publicReadiness.test.ts | test-security-frontend | ts | 9493 | 239 | READ/AUDITED |
| tests/setup/vitest.ts | test-setup | ts | 43 | 2 | READ/AUDITED |
| tests/share/shareCard.test.ts | test-share | ts | 6916 | 183 | READ/AUDITED |
| tests/share/shareService.test.ts | test-share | ts | 3822 | 113 | READ/AUDITED |
| tests/unit/cinematicCapability.test.ts | test-unit | ts | 2252 | 70 | READ/AUDITED |
| tests/unit/history.test.ts | test-unit | ts | 3009 | 123 | READ/AUDITED |
| tests/unit/scrollScrub.test.ts | test-unit | ts | 3246 | 113 | READ/AUDITED |
| tests/unit/secureRandom.test.ts | test-unit | ts | 2434 | 84 | READ/AUDITED |
| tests/unit/shuffleBag.test.ts | test-unit | ts | 4328 | 147 | READ/AUDITED |
| tests/unit/state.test.ts | test-unit | ts | 4145 | 151 | READ/AUDITED |
| tests/unit/storage.test.ts | test-unit | ts | 7328 | 225 | READ/AUDITED |
| tsconfig.json | config | json | 888 | 35 | READ/AUDITED |
| vite.config.ts | config | ts | 1028 | 31 | READ/AUDITED |
| vitest.config.ts | config | ts | 1062 | 37 | READ/AUDITED |

## Boundary dependencies (not frontend files; contract-checked only)

| Path | Category | Bytes | Lines |
| --- | --- | --- | --- |
| scripts/content/loadContent.ts | boundary-content-pipeline | 15693 | 532 |
| scripts/content/readAssetFile.ts | boundary-content-pipeline | 3563 | 115 |
| src/lib/content/authoringSchema.ts | boundary-content-pipeline | 11356 | 374 |
| src/lib/content/canonical.ts | boundary-content-pipeline | 2561 | 101 |
| src/lib/content/canonicalIdentity.ts | boundary-content-pipeline | 742 | 22 |
| src/lib/content/compileCorpus.ts | boundary-content-pipeline | 14941 | 510 |
| src/lib/content/compileItem.ts | boundary-content-pipeline | 2827 | 76 |
| src/lib/content/productionManifest.ts | boundary-content-pipeline | 7284 | 217 |
| src/lib/content/productionSelection.ts | boundary-content-pipeline | 3689 | 107 |
| src/lib/content/registrySchemas.ts | boundary-content-pipeline | 11879 | 607 |
| src/lib/content/remoteResource.ts | boundary-content-pipeline | 420 | 12 |
| src/lib/content/reviewAuthority.ts | boundary-content-pipeline | 5981 | 193 |
| src/lib/content/sourceRegistrySchema.ts | boundary-content-pipeline | 6389 | 200 |
| src/lib/content/sourceRightsSchema.ts | boundary-content-pipeline | 3502 | 108 |
