# DIVAN Repository Rules

## Authority

- `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md` is the release-1 design authority.
- The inline user instructions and the nearest active instruction file take precedence over this file.
- Public launch remains blocked until every governance, content-rights, cultural-review, accessibility, security, deployment, rollback, and physical-QR gate has evidence.

## Engineering contract

- Use Vite, React, strict TypeScript, a hand-controlled service worker, and an unprivileged static production image.
- Keep visitor processing local. Do not add a database, public write endpoint, analytics, cookies, identifiers, remote fonts, runtime poetry APIs, autoplay, or raw HTML rendering.
- Keep Hafez and Rumi culturally distinct. Never fabricate poetry, translation, provenance, licences, approvals, reviews, credits, or production configuration.
- Only conspicuous non-production fixtures may exercise local builds. Production compilation must reject fixtures and fail until an approved corpus is present.
- Preserve English-before-Persian order. Persian must remain live text with structural `lang="fa" dir="rtl"` markup and safe bidi isolation.
- Use test-driven development for behavior: observe a meaningful failing test, implement the minimum behavior, then refactor while green.
- Treat accessibility, reduced motion, offline release coherence, privacy, security headers, container isolation, and rollback as release behavior, not documentation-only claims.
- Keep `.env`, permission evidence, tunnel credentials, private authoring records, source maps, and existing EOI/ballot data out of public output and logs.
- Do not change, connect to, or share the existing EOI/ballot code, database, volume, network, route, environment, or credential.
- Use focused commits and run fresh verification before recording completion.

## Change protocol

- Read this file, the design authority, and `CHANGELOG.md` before edits.
- Explain filesystem-changing commands before running them.
- Update this file and `CHANGELOG.md` with a dated `Raouf:` entry after repository changes.
- Record exact commands and honest limitations; unavailable external evidence remains a blocker.

## Raouf change log

### 2026-07-14 (Australia/Sydney) — poetry source ingestion: live run + real-data fixes

**Raouf:**

- **Scope:** Owner authorised the live pipeline ("literature approved; run the full pipeline and ingest all data… keep fixing until correct"). Ran real fetch + extraction against the archival hosts and fixed every defect real data surfaced, in a loop. No poetry, translation, rights approval, or reviewer identity fabricated — ingestion produces private staging + machine candidates only; the public corpus stays empty and `build:production` stays fail-closed. Verse text is git-ignored; only code, hashes, a text-free summary, and docs are committed.
- **Summary:** Fetched all four sources (source-lock.json written). Fixes driven by real data: (1) archival redirects — allowlist switched from exact hosts to registrable-domain **suffix** matching so `*.archive.org` datanodes resolve while look-alikes (`evilarchive.org`) are still rejected; (2) Bell 1897 OCR returned 0 because real poem numbers are bare (`II`, not `II.`) — relaxed the roman-numeral heading, now 33 candidate poems with front matter skipped; (3) the Persian Masnavi EPUB was only a section **index** (titles, no verse) — built `poetry:fetch-masnavi` to pull real couplets from Wikisource ProofreadPage `<span class="beyt">` across ~1001 subpages, ordered by scan page, **resumable** (per-section disk checkpoint + `--assemble-only`), rate-limited with 429 backoff after the first burst tripped Wikimedia's limit; ingested 85+ sections / ~5,000 hemistich lines (continuing toward the full set on resume); (4) candidate matching — token overlap is ~0 across scripts, so replaced it with a curated **transliterated proper-noun / recurring-image** bilingual scorer + colophon/TOC noise filters (246/255 Rumi candidates now carry real signal, e.g. Solomon↔سلیمان). Hafez Divan (589 pages → 1,816 blocks) and Whinfield (6 books → 397 blocks) verified as genuine verse.
- **Files Changed:** `src/lib/content/sourceRegistrySchema.ts` (domain-suffix allowlist), `scripts/poetry/fetch-masnavi-sections.ts` (new), `scripts/poetry/extract-hafez-bell.ts` (bare-numeral headings), `scripts/poetry/extract-sources.ts` (skip index-only Rumi EPUB), `scripts/poetry/build-candidate-index.ts` (bilingual scorer, adapters, anchor, noise filters), `tests/content/masnaviSections.test.ts` (new), `tests/content/bellOcr.test.ts`, `tests/content/sourceLock.test.ts` (subdomain cases), `sources-private/poetry/source-lock.json` + `reports/candidates-summary.json` (committed), `.gitignore` (candidate JSONs), `docs/poetry-source-runbook.md`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2, branch `feat/poetry-source-ingestion`. `pnpm check` green: format/lint/typecheck 0, vitest 536/536 (42 files; +7 Masnavi tests), `verify:dist` (+ leak gate) + `verify:privacy` pass, `audit --prod` clean, `build:production` + `verify:qr` fail-closed. Candidate quality spot-checked; source-lock has 5 verified artefacts.
- **Follow-ups:** `poetry:fetch-masnavi` resumes to complete all ~1001 Masnavi sections (rate-limited). Human pairing/approval of excerpts and every §31.2 launch gate remain outstanding and unfabricated.

### 2026-07-14 (Australia/Sydney) — poetry source ingestion (acquisition + extraction + candidates), adapted

**Raouf:**

- **Scope:** Build the net-new source-provenance layer of the poetry ingestion plan (its Tasks 2–6, 8, 12), wired to feed the **existing** authoring/registry/compiler/UI pipeline. Executed test-first per the plan-review reconciliation in `docs/decisions/poetry-source-integration-baseline.md`: the plan's content/mapping/compiler/UI tasks (7, 10, 11, 13, most of 4) already exist in-repo and more strictly, so rebuilding them was rejected as a hard-invariant violation. No live downloads (owner-gated); acquisition/extraction TDD'd against fixtures and mocked hosts. No poetry, translation, provenance, rights approval, review, or production config fabricated; the public corpus stays empty and `build:production` stays fail-closed.
- **Summary:** Added an immutable source registry (`sourceRegistrySchema.ts` + `sources-private/poetry/registry.yaml`) for the four editions (Hafez Qazvini–Ghani FA / Bell 1897 EN _selection_ / Rumi Nicholson FA / Whinfield _abridged_ EN), strict HTTPS + host-allowlist only. Added a host-allowlisted streaming downloader with redirect revalidation, size caps, SHA-256 source-lock, HTML-for-EPUB rejection, atomic writes and lock reconciliation (`fetch-sources.ts` / `verify-source-lock.ts`), all unit-tested without network. Added honest source rights **evidence** (`sourceRightsSchema.ts` + `rights-evidence.yaml` + `reports/source-rights-report.md`): every record `pending`, and `approved` is structurally impossible without a named human reviewer and an acquired hash ("ai" rejected); extended `docs/rights-register-public.md` with a pending-evidence pointer (no approval claims). Added deterministic stdlib EPUB extraction (`extract-epub.py`, raw vs. search text separated, ZWNJ preserved, XXE/entity guard) with an orchestrator, and conservative Bell OCR candidate parsing (`extract-hafez-bell.ts`, raw kept, corrections empty, visual-verification flagged). Added a non-publishable machine candidate index (`build-candidate-index.ts`, `publishable:false`, refused by the production compiler) and an archival-leak bundle gate (`inspect-public-bundle.ts`) chained into `verify:dist`. New commands: `poetry:fetch`, `poetry:verify-sources`, `poetry:extract`, `poetry:extract-bell`, `poetry:build-candidates`. Runbook at `docs/poetry-source-runbook.md`.
- **Files Changed:** `src/lib/content/sourceRegistrySchema.ts`, `src/lib/content/sourceRightsSchema.ts`, `scripts/poetry/{fetch-sources,verify-source-lock,extract-sources,extract-hafez-bell,build-candidate-index,inspect-public-bundle}.ts`, `scripts/poetry/extract-epub.py`, `sources-private/poetry/{registry.yaml,rights-evidence.yaml,reports/source-rights-report.md,raw/.gitkeep,extracted/.gitkeep}`, `tests/content/{sourceRegistry,sourceLock,poetryRights,extraction,bellOcr,candidateIndex,publicBundleLeak}.test.ts`, `tests/fixtures/poetry/build-fixture-epub.py`, `package.json`, `.gitignore`, `.prettierignore`, `docs/{poetry-source-runbook.md,rights-register-public.md,decisions/poetry-source-integration-baseline.md}`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2, branch `feat/poetry-source-ingestion` off `main` @ `6a102f5`. `pnpm check` green: format/lint/typecheck 0, vitest 529/529 (41 files; +57 net-new poetry tests, none weakened), `build:fixture` + `verify:dist` (incl. the new leak gate) + `verify:privacy` pass, `audit --prod` clean, `build:production` and `verify:qr` fail-closed as intended. Docker evidence skipped (no daemon). No live network fetch performed; all acquisition/extraction tests are hermetic.
- **Follow-ups:** Owner runs `pnpm poetry:fetch` (network) when ready; then extract + build candidates and hand to the Society's reviewers. Public launch still requires approved corpus + rights (incl. CC BY-SA attribution for the two Persian Wikisource transcriptions), cultural review, Bell OCR-vs-scan verification, and every existing §31.2 gate — none fabricated here.

### 2026-07-13 (Australia/Sydney) — frontend design audit fixes (PWA metadata, verse hierarchy, CSS cleanup)

**Raouf:**

- **Scope:** Apply a file-by-file frontend design audit. UI polish and PWA wiring only; no content, rights, approvals, or production configuration fabricated; no new runtime dependency, network call, or storage.
- **Summary:** Wired the PWA identity that was built but unlinked: added an original `icon.svg` (an eight-point *khatam* star in the night/gold palette, `any maskable`), linked the manifest + `theme-color` + icon from `index.html`, and set the manifest `background_color` to the night surface `#0B1026` so the install splash no longer flashes light. `icon.svg` is now a required fixed browser asset in both the release contract (`src/lib/content/release.ts`) and the service-worker schema (`src-sw/schemas.ts`), copied by the build and precached offline. Design: promoted the Persian verse to nastaliq (`--font-persian-display`) with generous leading; gave the result actions a hierarchy (primary "Reveal another" vs. quiet gold-outline "Save"/"Download"). Cleanup: removed the near-invisible fourth background layer (`body::before`, 1.4% hatch), fixed the undefined `--radius-control` on the skip link, scoped the deep-red `h2` rule to light surfaces only (latent invisible-heading trap on dark scenes), set `color-scheme: dark`, and adopted `--action`/`--ornament-bright` plus new `--turquoise-light`/`--ember` tokens in place of hardcoded literals.
- **Files Changed:** `index.html`, `public/icon.svg` (new), `public/manifest.webmanifest`, `src/lib/content/release.ts`, `src-sw/schemas.ts`, `scripts/build.ts`, `src/styles/tokens.css`, `src/styles/visual.css`, `src/app/core.css`, `tests/offline/artifacts.test.ts`, `tests/offline/helpers.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. `bash scripts/check.sh --e2e` green: `format:check` clean, `lint` 0, `typecheck` 0, `test` 472/472 (34 files), `build:fixture` + `verify:dist` pass with `icon.svg` accepted through the full contract, `verify:privacy` pass, `audit --prod` clean, Playwright e2e 5/5 (incl. locked visual matrix and axe). `build:production` and `verify:qr` remain fail-closed; Docker evidence skipped (no daemon). Result screen visually confirmed. Nastaliq applies to real Persian glyphs; the ASCII fixture cannot display it.
- **Follow-ups:** iOS home-screen uses an SVG `apple-touch-icon`, so it falls back to a screenshot until a PNG touch icon exists; §31.2 launch gates unchanged and remain closed.

### 2026-07-13 (Australia/Sydney) — Prettier, quality-gate script, and CI

**Raouf:**

- **Scope:** Repository professionalisation — formatting, a single quality-gate command, continuous integration, and contributor scaffolding. No product behaviour changed.
- **Summary:** Added Prettier (`prettier`, `eslint-config-prettier`) with `.prettierrc.json`/`.prettierignore`, wired `eslint-config-prettier` last in the flat ESLint config so the two do not conflict, and applied formatting repo-wide (append-only logs and the design authority are ignored to avoid prose churn). Added `format`, `format:check`, and `check` scripts. Added `scripts/check.sh`, one command that runs the design §30.1 gauntlet (format, lint, typecheck, tests, fixture build, dist/privacy verification, prod audit) and reports the fail-closed launch gates (`build:production`, `verify:qr`) and the Docker-host evidence it skips; supports `--quick`, `--e2e`, and `--ci`. Added `.github/workflows/ci.yml` running `check.sh --ci` (including Playwright) on pushes to `main` and all pull requests, plus `.editorconfig`, a pull-request template, `CONTRIBUTING.md`, and CI/Node/pnpm badges in `README.md`.
- **Files Changed:** `package.json`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `scripts/check.sh`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, `README.md`, repo-wide Prettier formatting, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. After formatting: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 472/472 (34 files), `pnpm format:check` clean. `bash scripts/check.sh` passes all hard gates with `build:production` and `verify:qr` correctly fail-closed and Docker evidence skipped (no daemon). The CI workflow uses only static commands — no untrusted `github.event.*` input reaches any `run` step.
- **Follow-ups:** Docker-host and §31.2 launch gates are unchanged and remain closed. Consider adding branch protection requiring the `Quality gate` check before merge to `main`.

### 2026-07-13 (Australia/Sydney) — full integration, Wave C review, share card, and verification evidence

**Raouf:**

- **Scope:** Complete the interrupted integration, run independent Wave C verification, fix confirmed defects, and record Task 8 evidence. No design decision was reopened; no production content, rights, or approvals were fabricated.
- **Summary:** Diagnosed that `feat/divan-open-day-r1` had integrated B1/B2C/B3/B5/B6 but **not** B2 (visual) or B4 (offline/service-worker), leaving the branch internally inconsistent (ops referenced an absent service worker and `offline.html`). Ran a six-dimension read-only review swarm with adversarial verification (functional, accessibility, security, performance, visual/cultural, release-docs); it confirmed 11 real defects and correctly separated intended fail-closed launch gates. Merged `agent/b2-visual`, `agent/b4-integration`, and `agent/public-readiness`, resolving doc/config conflicts. Implemented the previously-absent local share card (§15 / criterion 16) with Web Share, clipboard fallback, and SVG card download announced through the app's single live region. Implemented the dangling `verify:*` scripts (`verify-privacy` docker-free denylist; `scripts/ops/verify-*` running their docker-free `opsConfig` groups; fail-closed `verify-qr`). Fixed two B2↔B4 e2e interaction bugs (service worker vs. Playwright route interception in the visual matrix; `/offline` SPA routing in the e2e server) and the `compose.yaml`→`compose.yml` doc typo. Corrected the previously-overstated `RESUME.md` and added `docs/verification-report.md` with the §31.1 acceptance matrix.
- **Files Changed:** merges of `agent/b2-visual`, `agent/b4-integration`, `agent/public-readiness`; `src/lib/share/*`, `src/components/PoemResult.tsx`, `src/app/App.tsx`, `tests/share/*`, `tests/components/shareAction.test.tsx`; `scripts/verify-privacy.ts`, `scripts/ops/*`, `scripts/qr/verify-qr.ts`; `tests/e2e/visual.spec.ts`, `tests/e2e/offline-server.ts`; `vitest.config.ts`, `eslint.config.js`, `.gitignore`; `docs/implementation-plan.md`, `docs/verification-report.md`, `RESUME.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, commit `c552189`. `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 472/472 (34 files), `pnpm test:e2e` 5/5 (Chromium), `test:content` 236, `test:a11y` 18, `test:offline` 53, `test:share` 13, `test:performance` 5, `test:security` 52. `build:fixture`, `verify:dist`, `verify:privacy`, and the four `verify:*` ops groups pass; `pnpm audit --prod` clean; budgets within §21.3 (JS 118 KB gz / CSS 4.8 KB / HTML 657 B / total 752 KB). `build:production` and `verify:qr` retain their exact fail-closed exits.
- **Follow-ups:** Docker-host evidence (image build, `syft` scan, live `compose` and `ops/scripts/verify.sh`) is environment-blocked here — run on a Docker host. All §31.2 launch gates remain closed: approved corpus/rights, cultural review, manual assistive-tech, final hostname/short URL + University-mark approval, live deploy/tunnel/provider logging, rollback rehearsal, and physical QR.

### 2026-07-13 (Australia/Sydney) — visual system and context documents

**Raouf:**

- **Scope:** B2 visual language, responsive scene composition, contextual document routes, bounded reveal choreography, local font use, and controlled visual/performance evidence.
- **Summary:** Applied the locked illuminated-manuscript/night-garden direction with the exact semantic colour tokens, self-hosted pinned fonts, original script-free inline geometry, manuscript portals, distinct Hafez garden and Rumi reed/constellation treatments, illuminated results, a truthful offline-readiness badge, and full/reduced/coarse-pointer motion mappings. Added accessible `/about`, `/credits`, `/accessibility`, `/privacy`, and `/offline` views whose release data, storage boundary, cache wording, cultural distinctions, and remaining review gates stay source-backed and fail closed. No package, lock, private content, compiler/schema, share, service-worker, operations, University mark, or remote asset change was made.
- **Files Changed:** `src/styles/**`, scoped visual components and core scenes under `src/components/**` and `src/scenes/**`, `src/pages/**`, the smallest shell/style imports in `src/app/App.tsx`, `src/app/core.css`, and `src/main.tsx`, visual/context/performance tests, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful initial RED was 11 failures and 1 pass for absent routes, motifs, tokens, fonts, motion, and budgets. Final required gates passed: component tests 51/51, accessibility tests 18/18, performance tests 5/5, visual Playwright tests 2/2, fixture build and distribution verification, strict TypeScript, and ESLint. Playwright captured 70 core/context images across 320x568, 390x844, 844x390, 768x1024, and 1440x900 with no horizontal overflow or remote request. Built gzip evidence was HTML 644 B, CSS 4,847 B, JavaScript 91,135 B, and critical fonts 115,816 B, with zero raster-image bytes.
- **Follow-ups:** Chromium automation and inspected screenshots are bounded evidence, not cross-browser or WCAG-conformance claims. Manual Safari/Firefox Persian shaping, Safari/Chrome/Firefox/Edge coverage, VoiceOver/TalkBack, measured contrast, 200-percent zoom, focus order, physical devices/orientation, reveal tracing, genuine approved content/rights/cultural review, integrated offline behavior, and every separate deployment/governance/QR launch gate remain blocked pending real evidence.

### 2026-07-12 (Australia/Sydney)

**Raouf:**

- **Scope:** Repository bootstrap and instruction chain.
- **Summary:** Established project-local rules for implementing the locked DIVAN release-1 design without weakening privacy, rights, accessibility, security, or EOI-isolation controls.
- **Files Changed:** `AGENT.md`, `.gitignore`, `.dockerignore`, `CHANGELOG.md`, and `docs/implementation-plan.md`.
- **Verification:** Project ignore rules are checked before the first commit; the implementation branch and writer worktrees are created only after the protected baseline exists.
- **Follow-ups:** Execute the approved implementation plan and append the final verification record.

### 2026-07-13 (Australia/Sydney)

**Raouf:**

- **Scope:** Permission effective-date contract and corpus build-date enforcement.
- **Summary:** Added required real ISO `effective_on` permission evidence, rejected permission intervals whose expiry precedes effectiveness, and prevented corpus compilation before permission effectiveness while preserving the independent future-final-approval gate. Only conspicuous synthetic dates were added; no production evidence was created.
- **Files Changed:** `src/lib/content/registrySchemas.ts`, `src/lib/content/compileCorpus.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/fixtures/content/corpus.ts`, `content-private/README.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused registry/compiler tests passed 58/58, the full content suite passed 141/141, strict TypeScript typecheck passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Keep the public-launch gate closed until genuine permission evidence and all separate governance, cultural, rights, accessibility, security, deployment, rollback, and physical-QR evidence are supplied and verified.

### 2026-07-13 (Australia/Sydney) — release compiler and dist gate

**Raouf:**

- **Scope:** B3 build-time content loader, release compiler, fixture builder, and public-distribution verifier.
- **Summary:** Added strict single-document YAML and fixed-layout private content loading, deterministic canonical release artefacts, an isolated 24 Hafez/16 Rumi fixture build, explicit production configuration validation, and fail-closed dist verification for hashes, counts, paths, private data, fixture leakage, remote resources, source maps, and unexpected files. Recorded the editor, asset, and rights workflows without creating production claims.
- **Files Changed:** `scripts/content/loadContent.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `docs/content-style-guide.md`, `docs/asset-register.md`, `docs/rights-register-public.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; test-first RED captured missing loader/release/build modules, then embedded-URL and non-UTC timestamp gaps; focused tests passed 25/25; full content tests passed 166/166; strict TypeScript, ESLint, fixture build, and dist verification passed. Production build exited 1 with the precise missing-approved-corpus blocker.
- **Follow-ups:** Supply and independently review genuine production content, registries, asset bytes, rights evidence, and approvals before production compilation; all separate governance, accessibility, security, deployment, rollback, and physical-QR launch gates remain closed.

### 2026-07-13 (Australia/Sydney) — release-layer review hardening

**Raouf:**

- **Scope:** B3 release asset completeness, destructive-output safety, URI/private-data rejection, and dist-root verification.
- **Summary:** Bound every compiled audio reference to one MIME/size/SHA-verified manifest file, restricted production reads to canonical non-symlink `public-static/`, added a conspicuous fixture-only `TEST ONLY - NOT AUDIO` byte payload, required output replacement to target exactly the explicit project root's `dist`, rejected all `://` schemes and protocol-relative resources, replaced heuristic private-value detection with exact source-derived private-only values, and rejected a symlinked dist root before resolution.
- **Files Changed:** `scripts/build.ts`, `scripts/content/loadContent.ts`, `scripts/verify-dist.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `tests/content/buildRelease.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/fixtures/content/corpus.ts`, `docs/asset-register.md`, `docs/content-style-guide.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused release-layer tests passed 46/46, the full content suite passed 187/187, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build exited 1 with the unchanged missing-approved-corpus blocker.
- **Follow-ups:** Production compilation and public launch remain closed until genuine approved corpus, audio bytes, source records, rights evidence, human reviews, and every independent launch gate exist and pass verification.

### 2026-07-13 (Australia/Sydney) — bounded release assets and URI schemes

**Raouf:**

- **Scope:** Final narrow B3 asset-size and remote-resource hardening.
- **Summary:** Defined one shared 100,000,000-byte ceiling for private registry and public manifest asset schemas; added pre-read `lstat` validation for symlink, file type, positive size, ceiling, and declared-size equality; replaced whole-file verification hashing with bounded chunked SHA-256 reads; and rejected common non-hierarchical resource schemes without rejecting ordinary colon prose.
- **Files Changed:** `src/contracts/release.ts`, `src/lib/content/registrySchemas.ts`, `src/lib/content/release.ts`, `src/lib/content/remoteResource.ts`, `scripts/content/readAssetFile.ts`, `scripts/content/loadContent.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/release.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused release tests passed 106/106, the full content suite passed 212/212, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build retained the exact required missing-approved-corpus exit-1 blocker.
- **Follow-ups:** Keep production and public launch closed until authentic approved content, assets, evidence, reviews, and all independent launch gates are complete.

### 2026-07-13 (Australia/Sydney) — bare-colon URL predicate closure

**Raouf:**

- **Scope:** Final minimal B3 remote-resource predicate correction.
- **Summary:** Added only the named bare-colon `https:`, `http:`, `ftp:`, `ftps:`, and `javascript:` forms to the existing dangerous-resource scheme blocklist while retaining ordinary prose such as `Note: this is text`.
- **Files Changed:** `src/lib/content/remoteResource.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, direct loader/verifier tests passed 74/74, the full content suite passed 222/222, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build retained the exact expected missing-approved-corpus exit-1 blocker.
- **Follow-ups:** Production and public launch remain blocked pending authentic approved content, assets, evidence, reviews, and all independent launch gates.

### 2026-07-13 (Australia/Sydney) — application domain and secure draw

**Raouf:**

- **Scope:** B1 non-React state, history, storage, secure randomness, and per-poet shuffle bags.
- **Summary:** Added a fail-safe typed reducer for the locked stage sequence, exact release-scoped history recovery, six-key session restoration with motion-only local persistence, unbiased Web Crypto rejection sampling without a fallback PRNG, and deterministic approved-active shuffle bags with no-repeat cycles, reset announcements, and optional remaining-ID persistence. No visitor intention, visitor identifier, private content, React/UI, compiler, build, service-worker, deployment, or EOI/ballot behavior was added or changed.
- **Files Changed:** `src/app/state.ts`, `src/app/history.ts`, `src/lib/draw/secureRandom.ts`, `src/lib/draw/shuffleBag.ts`, `src/lib/storage/session.ts`, `tests/unit/state.test.ts`, `tests/unit/history.test.ts`, `tests/unit/secureRandom.test.ts`, `tests/unit/shuffleBag.test.ts`, `tests/unit/storage.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful behavioral RED captured 12 reducer/random failures, 11 history/storage/shuffle failures, and three release-boundary hardening failures; GREEN unit tests passed 38/38, the unchanged content suite passed 222/222, strict TypeScript typecheck passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Integrate these injected domain APIs into the separately owned UI/browser shell, retain verified release IDs when constructing history and storage adapters, and keep every production/public-launch gate closed until authentic content and independent governance, accessibility, security, deployment, rollback, isolation, and physical-QR evidence pass.

### 2026-07-13 (Australia/Sydney) — accessible React core flow

**Raouf:**

- **Scope:** B1 browser runtime, accessible React application shell, semantic core scenes, bounded reveal behavior, native audio, and minimal core CSS.
- **Summary:** Added a fail-closed no-store browser release loader with redirect rejection, strict descriptor/corpus parsing, Web Crypto SHA-256 and secure-random availability checks, exact release/count/ID/item-hash validation, and privacy-safe recovery. Wired the reviewed reducer, three-field history, allowlisted storage, and per-poet shuffle bags into one-active-scene React flows for Hafez and Rumi with English-before-Persian live RTL text, bidi-safe provenance, single live-region announcements, one-shot reveal activation, 250 ms skip availability, 150 ms reduced motion, 1.6 second full motion, post-mount result focus, optional native audio, and privacy-safe error containment. Styling remains intentionally structural for the later B2 visual pass.
- **Files Changed:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/runtime.ts`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/*.tsx`, `src/scenes/*.tsx`, `tests/components/*.ts`, `tests/components/*.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED captured the absent runtime/App/ErrorBoundary/document shell and six focused runtime/audio hardening gaps; GREEN component/runtime/document tests passed 25/25, inherited unit tests passed 38/38, inherited content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** B2 retains final visual-system ownership; context pages, local sharing, service-worker/offline caching, deployment, genuine production content, rights/reviews, manual accessibility evidence, and every independent public-launch gate remain separate and blocked until completed and verified.

### 2026-07-13 (Australia/Sydney) — React core independent-review closure

**Raouf:**

- **Scope:** Focused Task 2B runtime-schema, browser-history, disclaimer, reveal-focus, and offline-announcement corrections from independent review.
- **Summary:** Exactly mirrored every build-time Markdown predicate and safe audio-path segment rule in the browser-only runtime without importing Node code; added a build/runtime parity table with digest-valid invalid items; restricted browser history to coherent durable stages, replaced initial/hydrated state, consumed exact validated `PopStateEvent.state`, omitted `revealing`, and restored Forward results only from an approved in-memory or release-matched session poem ID; installed the required verbatim cultural/non-advice disclaimer immediately after the reveal control; removed skip auto-focus while retaining its 250 ms tabbable appearance; and prevented offline-ready announcements until a release is verified.
- **Files Changed:** `src/app/App.tsx`, `src/app/history.ts`, `src/app/runtime.ts`, `src/scenes/IntentionScene.tsx`, `src/scenes/RevealScene.tsx`, `tests/components/appFlow.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/runtime.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful focused RED reproduced six schema-parity gaps, three history failures, two disclaimer failures, one focus theft, and two false offline-ready announcements; focused GREEN passed, the full component suite passed 39/39, inherited unit tests passed 38/38, inherited content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Keep B2 visual work, context/share/offline-cache/deployment slices, production content and rights evidence, manual accessibility proof, and every independent public-launch gate closed until separately completed and verified.

### 2026-07-13 (Australia/Sydney) — atomic browser release assembly

**Raouf:**

- **Scope:** Root-coordinator integration of the Vite browser shell with the verified content release and distribution gate.
- **Summary:** Replaced the JSON-only/delete-first build with a locked, private two-stage Vite and release assembly. Every emitted browser file is allowlisted by fixed or 16-hex Vite path, MIME-coupled, SHA-256 recorded, required for offline staging, scanned for executable inline markup, remote runtime dependencies, source-derived private values, invalid encoding and media signatures, then verified before a guarded same-parent distribution swap. The previous complete `dist` survives every pre-activation failure; service-worker, manifest and offline files are supported but deliberately not fabricated before B4.
- **Files Changed:** `.gitignore`, `vite.config.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, RED proved the old build omitted the browser shell and accepted coherently rehashed inline script/private-browser leaks; GREEN content tests passed 227/227, component tests 25/25, unit tests 38/38, strict TypeScript and ESLint passed, two complete fixture builds had identical seven-file SHA-256 trees, `verify:dist` passed, and production build exited 1 with the unchanged missing-approved-corpus blocker while retaining the verified fixture distribution.
- **Follow-ups:** B4 must add the complete hand-controlled service worker, manifest and offline document before those fixed files become mandatory; production and public launch remain blocked by genuine content/rights/reviews, manual accessibility, domain/tunnel/logging, rollback and physical-event evidence.

### 2026-07-13 (Australia/Sydney) — browser assembly review hardening

**Raouf:**

- **Scope:** Focused correction of independent Task 2C review findings.
- **Summary:** Prevented default `VITE_*` process variables from entering browser bundles by switching to an explicitly public-only prefix; expanded coherently rehashed HTML, JavaScript and SVG checks across embedded-resource elements and common network APIs; added second-rename restoration evidence; and made post-activation old-backup cleanup a warning-only maintenance condition so a successfully activated verified release is never falsely reported as a failed build.
- **Files Changed:** `vite.config.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; three adversarial RED tests proved VITE-prefixed process-value leakage plus remote iframe and SVG-image acceptance before the fixes; focused activation/env/remote tests passed 5/5, full content tests passed 232/232, strict TypeScript and ESLint passed, and the real fixture build/dist verifier remained green.
- **Follow-ups:** Re-run independent Task 2C review; the B4 worker/manifest/offline slice and every external production/public-launch gate remain closed.

### 2026-07-13 (Australia/Sydney) — URL-bearing resource predicate closure

**Raouf:**

- **Scope:** Final Task 2C remote-resource verifier correction.
- **Summary:** Generalised HTML URL-attribute validation across all elements, including inline SVG resource nodes, and rejected hard-coded remote DOM resource assignment through `setAttribute` in compiled JavaScript.
- **Files Changed:** `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** RED reproduced a coherently rehashed inline SVG image and JavaScript `setAttribute("src", ...)` bypass; GREEN focused tests passed 2/2, full content tests passed 234/234, typecheck/lint passed, and the real fixture build plus `verify:dist` passed.
- **Follow-ups:** Obtain final independent Task 2C approval before integration; all offline, production and external launch gates remain closed.
### 2026-07-13 (Australia/Sydney) — isolated production delivery controls

**Raouf:**

- **Scope:** B6 repository-owned static image, Caddy delivery, dual-network Compose, tunnel rendering, immutable deployment/rollback controls, security tests, and operator runbooks.
- **Summary:** Added digest-pinned BuildKit frontend, Node, Caddy, and cloudflared images; a production-default fail-closed multi-stage build; unprivileged port-8080 Caddy delivery with exact CSP/security/cache rules and no access log; content-aware internal health; origin-only web networking with tunnel-only egress; strict non-secret tunnel rendering; and dry-run-capable deploy, verify, and rollback scripts that reject mutable image references and never rebuild on the server. Runtime smoke testing found and fixed Caddy's unnecessary low-port file capability under `cap_drop: ALL`, and header smoke testing changed the conservative cache header to a set-if-absent default so immutable and health routes retain their locked policies.
- **Files Changed:** `ops/Dockerfile`, `ops/Caddyfile`, `ops/compose.yml`, `ops/cloudflared/config.yml.example`, `ops/scripts/*.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/*`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED produced 16 missing-control failures followed by focused Caddy capability, cache-routing, DNS, state-order, and rollback-safety failures; GREEN security tests passed 22/22, strict TypeScript and ESLint passed, the 222-test content suite remained green, Compose rendered without host ports, the explicit fixture image built, Caddy/cloudflared configurations validated, and a hardened local container passed release integrity, non-root/read-only/cap-drop, file-exclusion, CSP, cache, and health checks. The default Docker build exited 1 at the exact missing-approved-production-corpus gate.
- **Follow-ups:** Do not deploy until an approved production corpus/image, dedicated domain/tunnel, provider-log decision, firewall/host hardening evidence, registry/SBOM/vulnerability evidence, neighbouring-service baseline, rehearsed live rollback, accessibility/governance approvals, and physical-QR gates all pass. No live host, Cloudflare, DNS, firewall, registry, GitHub, or existing service was changed by this slice.

### 2026-07-13 (Australia/Sydney) — delivery-control review closure

**Raouf:**

- **Scope:** B6 production-image rejection, tunnel-file ownership, deployment restoration, runtime inspection, release integrity, public headers/cache behavior, and state/health hardening.
- **Summary:** Closed all six independent operations-review findings. Deployment now rejects fixture-labelled images before activation and fixture release metadata in container health, validates root-provisioned mode-`0400` tunnel files by canonical metadata without incorrectly requiring the deployment identity to read them, verifies exact running image bytes/containers/networks/ports/mounts/resources, binds release paths and corpus/asset-manifest identities to their declared hashes, performs only bounded HTTPS public checks across every cache class, grants immutable caching only to existing content-addressed files, and stops an unverified DIVAN stack when no verified restoration is available. State paths/ownership/modes and health timeouts are fail closed.
- **Files Changed:** `ops/Caddyfile`, `ops/compose.yml`, `ops/scripts/container-health.sh`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/render-tunnel-config.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, two focused RED rounds produced three failures each; GREEN operations security tests passed 32/32, content tests passed 222/222, strict TypeScript and ESLint passed, fixture build/dist verification passed, shell syntax/diff checks passed, Compose and Caddy configurations validated, and the default production package and Docker builds both failed at the exact absent-approved-corpus gate. A rebuilt fixture image carried the `fixture` label and its production health command exited 1. A definitive healthy container smoke remains an integration check because this isolated branch intentionally predates the React build that emits `index.html`; health was not weakened and application code was not imported.
- **Follow-ups:** Rebuild and smoke the image after integration with the complete static application, then retain all live domain/tunnel/provider-log, host/firewall, neighbouring-service, SBOM/scan, rollback-rehearsal, accessibility/governance, and physical-QR launch gates. No live system, registry, DNS, firewall, or credential was contacted or changed.

### 2026-07-13 (Australia/Sydney) — fail-closed activation and runtime binding

**Raouf:**

- **Scope:** Second B6 review closure for activation failure handling, exact runtime isolation, and running-to-public release coherence.
- **Summary:** Prevalidated every saved restore image before the first activation and armed one exit/signal fail-closed handler across candidate/rollback activation and restoration, so missing images, fixture labels, repository-digest mismatch, command failure, or failed verification cannot bypass the DIVAN stack stop after activation begins. Runtime verification now requires canonical tunnel bind sources, zero web mounts, exact tmpfs, dedicated bridge network labels/settings/member sets, and rejects foreign members. It extracts `/srv/release.json` from the exact running container and requires the public pointer to match its release identity and SHA byte for byte.
- **Files Changed:** `ops/compose.yml`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/mock-bin/docker`, `tests/fixtures/ops/mock-bin/stat`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED produced eight failures across restore prevalidation, runtime-contract helpers, and release-pointer binding; GREEN operations security tests passed 43/43, including mocked absent/fixture/digest/verification failures for deploy and rollback plus swapped-source, extra-mount, foreign-member, and coherent-other-release negatives. Content tests passed 222/222; typecheck, lint, fixture build/dist, shell syntax, diff hygiene, Compose config, Caddy validation, and the exact production package fail-closed gate passed.
- **Follow-ups:** Run the definitive integrated healthy-container and public-header smoke after cherry-pick onto the complete application branch. Live deployment, tunnel/domain/provider-log decisions, host/firewall and unchanged-neighbour evidence, SBOM/scans, rollback rehearsal, accessibility/governance approvals, and physical-QR tests remain launch blockers. No live system or secret was accessed.
### 2026-07-13 (Australia/Sydney) — accessibility hardening

**Raouf:**

- **Scope:** B5 focus restoration, motion precedence, semantic/reflow guardrails, automated accessibility coverage, and privacy-safe failure behavior.
- **Summary:** Added closed-union focus helpers and system/stored motion resolution; restored focus across scene and real Back traversal; made the skip link focus the active main region without URL mutation; retained one scene and `h1`, English-before-Persian live RTL text, bidi isolation, one polite atomic live region, native non-autoplay audio, and plain errors; and added 44-by-44 control, two-tone focus, 320-pixel reflow, text-spacing, reduced-motion, keyboard, axe, and real-Chromium checks. No content, package, offline, sharing, visual-asset, deployment, EOI, or ballot behavior changed.
- **Files Changed:** `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/SkipLink.tsx`, focused scene components, `src/lib/accessibility/*.ts`, `tests/accessibility/*.ts*`, `tests/e2e/accessibility*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, the resumed TDD cycle reached GREEN with accessibility tests 16/16, component tests 39/39, unit tests 38/38, strict TypeScript, and zero-warning ESLint; Chromium Playwright checks passed 2/2 across both poets with browser axe, keyboard, history focus, 320-pixel/text-spacing reflow, motion precedence, skip timing, and audio-failure preservation. Automated axe support does not establish WCAG conformance.
- **Follow-ups:** Keep public launch blocked pending recorded VoiceOver iOS and macOS, TalkBack Android, Persian pronunciation, Safari/Firefox/Edge, actual-device portrait/landscape/browser-chrome, 200-percent zoom capture, measured contrast, manual focus-order, and context-page navigation evidence, plus all separate governance, content, rights, security, deployment, rollback, isolation, performance, and physical-QR gates.

### 2026-07-13 (Australia/Sydney) — accessibility review closure

**Raouf:**

- **Scope:** B5 reduced-motion rendering, blocking-error focus, and clean-checkout Playwright execution.
- **Summary:** Replaced the inert reduced-motion transition declaration with an actual painted opacity change from zero to one over 120 ms before the 150 ms result mount, while leaving the full-motion path unchanged; focused the mounted blocking-error heading after invalid draws and secure-random exceptions; and added a default root Playwright configuration whose server builds the fixture corpus before selecting the one bounded accessibility spec. No content, packages, lockfile, offline, sharing, deployment, EOI, or ballot behavior changed.
- **Files Changed:** `src/app/App.tsx`, `src/app/core.css`, `src/scenes/RevealScene.tsx`, `tests/accessibility/appAccessibility.test.tsx`, `tests/accessibility/styles.test.ts`, `tests/components/failures.test.tsx`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/accessibility.spec.ts`, `playwright.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced one inert opacity path and two body-focused blocking errors; focused GREEN passed 25/25, accessibility passed 18/18, components passed 41/41, and unit tests passed 38/38. `pnpm test:e2e --list` selected exactly two tests in one spec; Chromium passed 2/2 and exposed a rendered `CSSTransition` from opacity 0 to 1 over 120 ms. A second 2/2 Chromium run rebuilt fixture output after the prior ignored `dist` was moved away. Strict TypeScript and zero-warning ESLint passed.
- **Follow-ups:** Automated evidence is not a WCAG-conformance claim; keep the same manual assistive-technology, Persian-pronunciation, device/browser, 200-percent zoom, measured-contrast, focus-order, context-navigation, and all independent public-launch gates blocked until genuine evidence is reviewed.

### 2026-07-13 (Australia/Sydney) — skip-timing flake closure

**Raouf:**

- **Scope:** Final B5 keyboard skip timing and real-browser elapsed-time evidence.
- **Summary:** Moved the reveal skip control from 250 ms to 200 ms so browser timer, render, and observation scheduling retain a 100 ms margin inside the locked 300 ms maximum. Replaced the exact-300-ms Playwright wait dependency with an in-browser activation timestamp and an independent measured assertion that visible skip availability is at most 300 ms; focus remains on the visitor's existing control until they choose Skip.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `tests/e2e/accessibility.spec.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, test-first RED showed the skip still absent at 200 ms with the prior product delay, then focused GREEN passed at the 199/200 ms boundary. Full component tests passed 41/41 twice, accessibility tests passed 18/18 twice, and two consecutive corrected Chromium runs passed 2/2 with the unchanged measured `<= 300 ms` requirement. Strict TypeScript and zero-warning ESLint passed.
- **Follow-ups:** The timing buffer closes this automated flake only; all previously recorded manual accessibility, genuine content, governance, security, deployment, rollback, isolation, and physical-QR launch gates remain blocked.

### 2026-07-13 (Australia/Sydney) — concurrent-load skip timing

**Raouf:**

- **Scope:** Final B5 skip-control margin under concurrent browser load.
- **Summary:** Moved keyboard-reachable Skip availability from 200 ms to 100 ms after the 200 ms setting exceeded the locked 300 ms browser-visible maximum under concurrent load. The deterministic test now enforces hidden at 99 ms and visible at 100 ms, while the existing Chromium test continues to measure from the actual DOM activation event and independently requires visible availability within 300 ms; no timeout or acceptance threshold was inflated.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced absence at the new 100 ms boundary with the prior product setting; focused GREEN passed at 99/100 ms. Five consecutive measured Chromium runs passed 2/2 under the active concurrent workload, followed by full component tests 41/41, accessibility tests 18/18, strict TypeScript, and zero-warning ESLint.
- **Follow-ups:** This closes the automated skip-timing flake only; all manual accessibility and every independent production/public-launch gate remain unchanged and blocked pending reviewed evidence.

### 2026-07-13 (Australia/Sydney) — offline delivery integration fixes

**Raouf:**

- **Scope:** B6 static recovery routing, production image build inputs, and immutable asset-cache parity with the release schema.
- **Summary:** Stopped Caddy from rewriting the integrity-checked `/offline.html` recovery artefact to the SPA, assigned the exact file no-cache and noindex handling while retaining `/offline` as an application route, and expanded immutable matching to the complete verified release-path contract including nested audio/font/image/icon paths and underscore or embedded digest prefixes. Added only the seven non-secret production compiler inputs as Docker build arguments and documented the exact explicit approved-image command without weakening the no-argument production gate or fixture isolation.
- **Files Changed:** `ops/Caddyfile`, `ops/Dockerfile`, `docs/deployment-runbook.md`, `tests/security/opsConfig.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED failed exactly 3/46 ops tests for the three integration defects, focused GREEN passed 46/46, content passed 234/234, strict TypeScript and zero-warning ESLint passed, Bash/POSIX syntax and diff hygiene passed, pinned Caddy accepted the configuration, Compose rendered without mutation, the explicit fixture image built and passed an isolated no-egress/no-host-port smoke while production health rejected it, and the default Docker production build failed at the exact absent-approved-corpus gate.
- **Follow-ups:** Re-run the `/offline.html` byte/header smoke after the reviewed B4 artefact is integrated; no production content, image, hostname, tunnel, provider-log decision, live deployment, rollback rehearsal, external approval, or physical-event evidence was created, so every corresponding launch gate remains blocked.

### 2026-07-13 (Australia/Sydney) — test-harness hygiene and resume handoff

**Raouf:**

- **Scope:** Reliable green baseline for the full local suite and a session-handoff note. No product behavior changed.
- **Summary:** Excluded Playwright end-to-end specs (`tests/e2e/**`) from vitest so `pnpm test` no longer collects `accessibility.spec.ts` and fails on `test.beforeEach`; raised vitest `testTimeout`/`hookTimeout` to 30 s so the ops and release tests that spawn real builds and shell scripts via `execFileSync` stop flaking with "Test timed out in 5000ms" under concurrent CPU load while fast tests remain unaffected; ignored the determinism test's leftover `.tmp-tests/` fixture build output in ESLint and git so `pnpm lint` stops erroring on nested `dist` JavaScript. Added `RESUME.md` capturing stage status, the verified green baseline, and the next task.
- **Files Changed:** `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `RESUME.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; before the change `pnpm test` failed on the wrongly-collected Playwright spec, and once excluded the ops/release subprocess tests flaked non-deterministically with 5000 ms timeouts (3, then 1, then 2 failures) while `pnpm test:content` stayed 234/234. After the change `pnpm typecheck` and `pnpm lint` exited 0, `pnpm test` passed 377/377 across 21 files, `pnpm build:fixture` and `pnpm verify:dist` passed, and `pnpm build:production` retained the exact exit-1 `no approved production corpus exists in content-private` gate.
- **Follow-ups:** Resume at Task 7 (Wave C independent verification) then Task 8 (final gauntlet + `docs/verification-report.md`). All content, rights, cultural, manual-accessibility, deployment, rollback, and physical-QR launch gates remain blocked pending genuine reviewed evidence.
### 2026-07-13 (Australia/Sydney) — atomic offline release core

**Raouf:**

- **Scope:** B4 browser-safe offline release schemas, bounded integrity checks, candidate staging, deferred atomic activation, active-only routing, nonblocking client registration, install manifest, and offline recovery document.
- **Summary:** Added a hand-controlled service-worker source with strict canonical release/corpus/asset validation, canonical item-hash verification, exact audio joins, an 8 MB non-audio ceiling enforced with bounded stream reads, release-ID reuse rejection, candidate-only failure cleanup, single-record active/previous switching, one-generation retention, and no audio precache. Runtime routing never searches pending or previous releases, keeps health and worker requests network-only/no-store, verifies network navigation HTML against the active manifest, caches declared audio only after a browser audio request, and reports only typed privacy-safe client statuses. The local manifest and script-free recovery page use Persian Society wording without an unapproved University claim or remote resource.
- **Files Changed:** `src-sw/cacheTypes.ts`, `src-sw/integrity.ts`, `src-sw/schemas.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `public/manifest.webmanifest`, `public/offline.html`, `tests/offline/*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; initial RED was three missing-module offline suites; GREEN offline tests passed 34/34, inherited content tests passed 234/234, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Root integration must bundle `src-sw/service-worker.ts` as the fixed classic-IIFE `service-worker.js`, register the reviewed client seam, rebuild and verify the complete release, and run real HTTPS Playwright plus supported Safari/Chrome/Edge/Firefox, iOS, Android, install, storage, warm-offline, failed-update, audio, refresh, and rollback checks. These manual/browser gates, authentic production content and rights, governance approvals, deployment, and physical-QR evidence remain blocked and were not claimed here.

### 2026-07-13 (Australia/Sydney) — offline-core review closure

**Raouf:**

- **Scope:** B4 target-aware activation and rollback, protected cache reuse, compressed-response reconstruction, status-contract closure, and direct service-worker lifecycle coverage.
- **Summary:** Bound explicit activation to one validated release ID carried from typed worker status through the client request, enabled exact previous-release rollback, emitted `activating` before pointer mutation and `active` only after the requested target is confirmed plus `skipWaiting` succeeds, and reported failed targets without false-active status. Protected both active and previous caches from reused/incoherent metadata deletion. Treated compressed `Content-Length` as wire metadata while retaining bounded decoded reads and exact decoded byte/SHA checks, then stripped stale transfer, encoding, range, cookie, and variation headers from reconstructed cached responses while retaining security/content headers. Added a direct install/message/fetch worker harness.
- **Files Changed:** `src-sw/integrity.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `tests/offline/client.test.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/serviceWorker.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced seven findings across targetless status/rollback, previous-cache deletion, compressed length/header reconstruction, missing `activating` delivery, and absent direct worker dispatch. GREEN offline tests passed 40/40, inherited content tests passed 234/234, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Root integration must still bundle and register this reviewed worker, then prove real HTTPS worker install/update/activate/controller transitions, warm offline, failed update, rollback, storage pressure, browser/device coverage, and the unchanged external production/public-launch gates.

### 2026-07-13 (Australia/Sydney) — complete offline integration and lifecycle evidence

**Raouf:**

- **Scope:** B4 fixed-worker build integration, exact pending-release activation, secure client registration, accessible update control, coherent first install/update/rollback behavior, and real-browser outage evidence.
- **Summary:** The release builder now emits one fixed classic-IIFE `service-worker.js` plus the reviewed manifest and script-free recovery page, requires all four fixed browser assets in the signed manifest, and stages only exact HTTP 200 decoded bodies. A ready release persists one exact pending target; only a real `mode=navigate` request or explicit matching waiting-worker action can activate it, while scripted HTML-accepting fetches, stale later-built caches, partial responses, failed pointer writes, and failed installs cannot replace the active release. First install bootstraps the exact verified candidate, later activation retains one rollback release, typed release-matched statuses register only after browser release verification, and URL replacement is bound to the exact waiting worker reaching `activated` with retry/redundancy/timeout cleanup. Offline-ready copy is announced only for the exact active verified release.
- **Files Changed:** `scripts/build.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/app/App.tsx`, `src/lib/content/release.ts`, `src/sw-client/register.ts`, `tests/accessibility/appAccessibility.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/offlineIntegration.test.tsx`, `tests/content/buildRelease.test.ts`, `tests/content/release.test.ts`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/offline-server.ts`, `tests/e2e/offline.spec.ts`, `tests/offline/*.ts`, `vitest.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED covered missing fixed outputs, pre-verification registration, insecure registration, implicit/stale activation, scripted-fetch misclassification, HTTP 206 reaching CacheStorage, first-install pointer absence, activation-listener accumulation, and Playwright specs leaking into Vitest. GREEN passed all 426 Vitest tests across 27 files, including 49 offline and 235 content tests; strict TypeScript and zero-warning ESLint passed; fixture build and `verify:dist` passed. Chromium Playwright passed all 3 tests, with the offline test proving install/control, compressed-body staging, no audio precache, warm-offline reload, network-only `/healthz`, exact clean-navigation update, failed-update retention, explicit waiting-worker activation, controller-driven navigation, and rollback.
- **Follow-ups:** `pnpm verify:privacy` remains an inherited external blocker because the referenced B6B `scripts/verify-privacy.ts` is absent; it was not fabricated in B4. Keep Safari, Firefox, Edge, iOS, Android, storage-pressure/eviction, actual HTTPS/domain, production corpus/rights, governance, deployment, rollback rehearsal, accessibility/device, and physical-QR gates blocked until genuine evidence exists. No live system, secret, DNS, firewall, registry, or production content was changed by this slice.

### 2026-07-13 (Australia/Sydney) — committed activation maintenance closure

**Raouf:**

- **Scope:** B4 committed-release cleanup semantics and exact navigation response acceptance.
- **Summary:** Made the atomic active-pointer write the final activation commit boundary. Pending-marker and stale-cache cleanup now run as non-fatal, idempotent maintenance; a failed marker deletion leaves the candidate intact and an explicit same-target retry clears it before stale caches are considered. Navigation accepts only an exact HTTP 200 response for the verified running release, so matching partial-content responses fall back to the active cached shell.
- **Files Changed:** `src-sw/releaseManager.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/runtimeStrategies.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced an activation reported as failed after its pointer had committed and an HTTP 206 navigation returned as live content. GREEN focused release/runtime tests passed 38/38, offline tests passed 52/52, and the full Vitest suite passed 429/429 across 27 files, including stale-cache deletion failure and pending-marker deletion retry coverage. Strict TypeScript, zero-warning ESLint, fixture build/dist verification, three Chromium Playwright flows, diff hygiene, and the staged gitleaks scan passed.
- **Follow-ups:** Retain the existing real-browser, device, storage-pressure, production-content, rights, governance, deployment, accessibility, and physical-QR launch blockers until genuine evidence exists.

### 2026-07-13 (Australia/Sydney) — release-versioned worker closure

**Raouf:**

- **Scope:** Critical B4 service-worker update identity, genuine multi-release browser evidence, and concurrent component-test stability.
- **Summary:** Versioned every compiled worker by both the exact public release ID and canonical public-corpus SHA-256, and made install fail closed when fetched release identity differs from the worker build. This guarantees corpus-only changes produce different worker bytes even if an operator incorrectly reuses a release ID. Replaced the E2E server's hand-appended comment with genuine Vite worker builds for each served release and required the checked distribution worker to byte-match a clean rebuild. Stabilised the post-verification registration assertion with an awaited effect boundary.
- **Files Changed:** `scripts/build.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `tests/components/offlineIntegration.test.tsx`, `tests/content/buildRelease.test.ts`, `tests/e2e/offline-server.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/serviceWorker.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Meaningful RED proved genuine worker output lacked release versioning. Under Node 22.16.0, focused content/offline tests passed 85/85, strict TypeScript and zero-warning ESLint passed, the fixture build and distribution verifier passed, emitted worker bytes contained the exact release and content identities, and the real Chromium offline lifecycle passed 1/1 using only genuine versioned worker outputs.
- **Follow-ups:** Rerun the full combined suite and independent B4 review after integration with B2/public-readiness; retain manual cross-browser, device, storage-pressure, approved-content, deployment, accessibility, governance, and physical-QR gates.
### 2026-07-13 (Australia/Sydney) — public source governance

**Raouf:**

- **Scope:** Public repository orientation, source-rights boundary, security reporting, third-party font notices, and removal of deployment-host detail from public documentation.
- **Summary:** Added an honest work-in-progress README, GitHub private vulnerability reporting policy, exact installed OFL 1.1 font notices, a Node runtime pin, repository metadata, and repository-wide ownership. Kept the repository all rights reserved with no open-source licence grant, replaced host discovery with private evidence gates, and renamed the synthetic operations sentinel so it cannot be mistaken for a credential.
- **Files Changed:** `README.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`, `.node-version`, `.github/CODEOWNERS`, `package.json`, `docs/phase-0-environment-decisions.md`, `tests/fixtures/ops/*`, `tests/security/opsConfig.test.ts`, `tests/security/publicReadiness.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0 and pnpm 10.33.0, TDD RED first produced six missing-public-readiness failures and a separate preview-command failure; GREEN passed the focused suite 6/6, security tests 49/49, content tests 234/234, strict TypeScript, zero-warning ESLint, and diff/prose hygiene. The frozen lockfile installed from the offline pnpm store without changing dependency versions. Gitleaks found no leaks in the exact staged snapshot or the 59-commit all-history scan.
- **Follow-ups:** Before any public push, rewrite non-public author and committer email metadata in repository history and rescan the rewritten history; keep GitHub private vulnerability reporting disabled until the owner deliberately enables it. Production content, rights, reviews, live infrastructure, accessibility evidence, and every other launch gate remain blocked.
