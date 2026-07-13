# Changelog

## 2026-07-12 — Repository baseline

**Raouf:**

- **Scope:** DIVAN release-1 implementation bootstrap.
- **Summary:** Created the protected greenfield repository baseline, recorded active engineering rules, excluded credentials and generated output, and documented the evidence-driven implementation sequence.
- **Files Changed:** `.gitignore`, `.dockerignore`, `AGENT.md`, `CHANGELOG.md`, `docs/implementation-plan.md`.
- **Verification:** The initial commit is created on `main` with `.env` excluded; feature work proceeds on `feat/divan-open-day-r1` and isolated writer branches.
- **Follow-ups:** Build and independently verify every local acceptance criterion while keeping unavailable production, rights, human-review, and physical-event gates closed.

## 2026-07-13 — Permission effective-date enforcement

**Raouf:**

- **Scope:** Shared permission registry contract and corpus compiler evidence timing.
- **Summary:** Required real ISO permission effective dates, rejected incoherent effective/expiry intervals, and rejected permissions that are not yet effective on the injected corpus build date without merging that rule into final-approval timing. Updated only conspicuous synthetic fixtures; no production rights or approval evidence was added.
- **Files Changed:** `src/lib/content/registrySchemas.ts`, `src/lib/content/compileCorpus.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/fixtures/content/corpus.ts`, `content-private/README.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused registry/compiler tests 58/58; full content tests 141/141; strict TypeScript typecheck passed; ESLint passed with zero warnings or errors.
- **Follow-ups:** Production compilation and public launch remain blocked until authentic human permission records and every independent release gate are verified.

## 2026-07-13 — Deterministic content release build

**Raouf:**

- **Scope:** B3 private content loader, release compiler, fixture build, and distribution verification.
- **Summary:** Added strict YAML and filesystem boundaries, canonical content-addressed corpus and asset-manifest generation, exact non-production fixture output, secure production configuration parsing, the expected missing-corpus stop gate, and public-dist tamper/private-leak verification. Added editor, asset, and public-rights guidance that explicitly records the absence of approved production records.
- **Files Changed:** `scripts/content/loadContent.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `docs/content-style-guide.md`, `docs/asset-register.md`, `docs/rights-register-public.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful module-absence RED followed by embedded-URL and non-UTC timestamp RED; focused release-layer tests 25/25; full content suite 166/166; typecheck, lint, fixture build, and dist verification passed. `build:production` exited 1 with `Production build blocked: no approved production corpus exists in content-private.`
- **Follow-ups:** Keep production compilation and public launch closed until authentic content, asset, permission, approval, cultural-review, accessibility, security, deployment, rollback, and physical-QR evidence exists and passes every independent gate.

## 2026-07-13 — Release build security review fixes

**Raouf:**

- **Scope:** B3 asset completeness, filesystem replacement safety, private-source leakage, remote resources, and distribution verification.
- **Summary:** Made compiled audio, the asset manifest, and emitted bytes an exact verified join; limited production asset loading to canonical non-symlink `public-static/`; added only an explicit fixture `TEST ONLY - NOT AUDIO` payload; constrained destructive replacement to `<explicit projectRoot>/dist`; rejected all URI schemes using `://` and protocol-relative values; loaded exact private-only values from the matching fixture or production source records while preserving intended public credits and paths; and rejected symlinked dist roots before `realpath`.
- **Files Changed:** `scripts/build.ts`, `scripts/content/loadContent.ts`, `scripts/verify-dist.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `tests/content/buildRelease.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/fixtures/content/corpus.ts`, `docs/asset-register.md`, `docs/content-style-guide.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED captured 10 original reviewer gaps plus six production asset-loading gaps; focused tests 46/46; full content tests 187/187; fixture build and dist verification passed; typecheck and lint passed; production build retained the exact required exit-1 missing-corpus message.
- **Follow-ups:** No production content or asset has been created or approved; keep all production and public-launch gates closed pending authentic human evidence and complete independent verification.

## 2026-07-13 — Bounded asset reads and resource-scheme rejection

**Raouf:**

- **Scope:** Final B3 release-size, file-read, and resource-value controls.
- **Summary:** Reused one 100,000,000-byte maximum across private registry and public asset-manifest schemas, rejected invalid filesystem size/type/symlink metadata before content reads, hashed asset files in bounded chunks, capped production content collection, and blocked `data:`, `blob:`, `mailto:`, `file:`, `tel:`, `ws:`, `wss:`, `ssh:`, and `sftp:` alongside existing remote forms while allowing ordinary prose such as `Note: this is text`.
- **Files Changed:** `src/contracts/release.ts`, `src/lib/content/registrySchemas.ts`, `src/lib/content/release.ts`, `src/lib/content/remoteResource.ts`, `scripts/content/readAssetFile.ts`, `scripts/content/loadContent.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/release.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED captured 19 schema/resource failures and two pre-read `EACCES` failures; GREEN focused tests 106/106 and full content tests 212/212; fixture build, dist verification, typecheck, and lint passed; production build preserved the exact expected exit-1 blocker.
- **Follow-ups:** The production corpus and production assets remain absent by design; public launch stays blocked pending genuine evidence and every separate launch gate.

## 2026-07-13 — Bare-colon URL resource rejection

**Raouf:**

- **Scope:** Final narrow B3 URL predicate fix.
- **Summary:** Extended the existing explicit dangerous-scheme list to reject bare-colon `https:`, `http:`, `ftp:`, `ftps:`, and `javascript:` values in both source loading and public-dist verification without adopting an overbroad arbitrary `word:` rule.
- **Files Changed:** `src/lib/content/remoteResource.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced 10 loader/verifier acceptances; GREEN direct tests 74/74 and full content tests 222/222; fixture build, dist verification, typecheck, and lint passed; production build preserved the exact required exit-1 blocker.
- **Follow-ups:** No production content or approval was added; all production and public-launch gates remain closed.

## 2026-07-13 — Application domain and secure local draw

**Raouf:**

- **Scope:** B1 state machine, browser-history records, storage boundaries, secure integer selection, and per-poet shuffle bags.
- **Summary:** Implemented the locked application-stage reducer with stale-data recovery, exact three-field history state, release-matched session restoration using only the six approved keys, local motion preference persistence, Web Crypto rejection sampling across the full 1 through 2^32 contract, and Fisher-Yates bags restricted to approved active IDs. Bags return each eligible ID once per cycle, expose reset metadata, fail closed when empty, and persist only public remaining IDs while the release still matches.
- **Files Changed:** `src/app/state.ts`, `src/app/history.ts`, `src/lib/draw/secureRandom.ts`, `src/lib/draw/shuffleBag.ts`, `src/lib/storage/session.ts`, `tests/unit/state.test.ts`, `tests/unit/history.test.ts`, `tests/unit/secureRandom.test.ts`, `tests/unit/shuffleBag.test.ts`, `tests/unit/storage.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED produced 12 reducer/random assertion failures, 11 history/storage/shuffle assertion failures, and three security-review regression failures; final unit suite passed 38/38, content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Wire the domain layer into the separately owned React/browser shell with injected native storage and crypto adapters; production and public launch remain independently blocked pending genuine content, rights, human review, accessibility, security, deployment, rollback, isolation, and QR evidence.

## 2026-07-13 — Accessible React core flow

**Raouf:**

- **Scope:** B1 browser release runtime and semantic React core experience.
- **Summary:** Added a strict no-store, no-redirect release/corpus loader with Web Crypto verification and privacy-safe blocking recovery; composed the reviewed reducer, history, storage, and shuffle domains into the locked Hafez/Rumi flow; preserved one active scene and `h1`, English-before-Persian live RTL content, bidi-safe provenance, one persistent polite live region, bounded full/reduced reveal timing, keyboard skip, result focus, native optional audio, and safe Back/retry behavior; and added only minimal responsive accessibility CSS pending B2 visual ownership.
- **Files Changed:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/runtime.ts`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/*.tsx`, `src/scenes/*.tsx`, `tests/components/*.ts`, `tests/components/*.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful missing-module/document RED plus six runtime/audio hardening RED failures; GREEN component/runtime/document tests 25/25; inherited unit tests 38/38; inherited content tests 222/222; strict TypeScript and ESLint passed.
- **Follow-ups:** Keep B2 visual polish, context/share/offline/deployment slices, production corpus and rights evidence, manual accessibility proof, and all independent public-launch gates closed until their owners complete and verify them.

## 2026-07-13 — React core independent-review fixes

**Raouf:**

- **Scope:** Task 2B runtime parity, durable browser history, required disclaimer, focus stability, and verified-offline readiness.
- **Summary:** Mirrored the full build Markdown/audio-path rejection boundary in browser-safe code and tested both parsers against one digest-valid parity table; replaced current-state Back inference with exact validated pop-state traversal; excluded `revealing`, used replace-only initial/hydrated history, and restored approved results across real Back/Forward without putting poem IDs in history or URLs; installed the required verbatim disclaimer immediately after the reveal control; kept skip tabbable without focus theft; and suppressed offline-ready during pending or rejected verification.
- **Files Changed:** `src/app/App.tsx`, `src/app/history.ts`, `src/app/runtime.ts`, `src/scenes/IntentionScene.tsx`, `src/scenes/RevealScene.tsx`, `tests/components/appFlow.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/runtime.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused RED failures 6 schema parity, 3 history, 2 disclaimer, 1 focus, and 2 offline gating; GREEN component tests 39/39, unit tests 38/38, content tests 222/222, strict TypeScript and ESLint passed.
- **Follow-ups:** Final visual design, context/share/offline-cache/deployment work, approved production content, external reviews/evidence, and all public-launch gates remain outside this focused correction and blocked.

## 2026-07-13 — Atomic Vite and content distribution assembly

**Raouf:**

- **Scope:** Complete static browser/content build integration and non-destructive activation.
- **Summary:** Added deterministic local-only Vite output with no source maps or environment loading; allowlisted fixed and content-hashed browser assets with exact MIME, byte and SHA-256 records; expanded distribution verification to semantic HTML, UTF-8, local runtime resources, media signatures and private-source leak checks; and changed activation to verify a private staged tree before identity-checked rename/restore handling. No service-worker placeholder or production content was created.
- **Files Changed:** `.gitignore`, `vite.config.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused browser-shell, inline-script, private-leak, remote-runtime and previous-dist preservation RED/GREEN tests; full content suite 227/227; components 25/25; unit 38/38; typecheck and lint passed; repeated fixture tree hashes matched; fixture build/dist verification passed; production build retained the exact expected exit-1 approved-content blocker without replacing the good dist.
- **Follow-ups:** Add and independently verify the real B4 offline release before requiring its worker/manifest/offline files, and keep every production/public launch gate closed until external evidence is complete.
