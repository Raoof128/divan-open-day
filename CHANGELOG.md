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

## 2026-07-13 — Static assembly review fixes

**Raouf:**

- **Scope:** Environment isolation, embedded remote-resource coverage, and activation-status correctness.
- **Summary:** Replaced Vite's default environment prefix with an explicit public-only namespace, rejected additional remote HTML embeds/SVG resources/JavaScript network forms after coherent rehashing, tested previous-dist restoration on activation failure, and kept verified activation successful when only obsolete-backup cleanup needs manual maintenance.
- **Files Changed:** `vite.config.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; adversarial environment/iframe/SVG RED reproduced all three gaps; focused fixes 5/5, full content 232/232, typecheck/lint and real fixture build/dist verification passed.
- **Follow-ups:** Obtain independent re-review before integration and retain the production/offline/external launch gates.

## 2026-07-13 — Browser URL-bearing resource closure

**Raouf:**

- **Scope:** Final narrow static-distribution remote-resource correction.
- **Summary:** Validated URL-bearing attributes generically in emitted HTML, including inline SVG, and blocked literal remote DOM resource assignment through compiled JavaScript `setAttribute` calls.
- **Files Changed:** `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; two adversarial RED cases became GREEN 2/2; content 234/234, typecheck/lint, fixture build, and dist verification passed.
- **Follow-ups:** Integrate only after final independent approval; retain every separate release and launch gate.
## 2026-07-13 — Isolated production delivery controls

**Raouf:**

- **Scope:** B6 immutable container, static delivery headers, tunnel isolation, digest-only deployment/rollback, and operator documentation.
- **Summary:** Added a digest-pinned BuildKit frontend and multi-stage image whose default production build fails closed, an unprivileged Caddy runtime with its unnecessary low-port file capability removed, exact security/cache behavior with disabled access logs, content-aware internal health, two explicitly named Compose networks with no host ports, a fixed-order tunnel template and validated renderer, and strict scripts that preserve verified image state and restore failed candidate or rollback attempts without server-side builds. Documented only the approved sanitized host snapshot, both multi-platform and x86_64 image digests, recovery boundaries, and unresolved launch gates.
- **Files Changed:** `ops/Dockerfile`, `ops/Caddyfile`, `ops/compose.yml`, `ops/cloudflared/config.yml.example`, `ops/scripts/*.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/*`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; security TDD RED 16 initial failures plus focused capability/cache/input/state failures; GREEN 22/22 security tests; unchanged 222/222 content tests; typecheck and lint passed; Compose config and cloudflared ingress validated; explicit fixture image build and hardened container smoke passed with exact CSP/cache/health behavior; default production image build failed at the expected absent-approved-corpus gate.
- **Follow-ups:** Production/public launch remains blocked until a genuine approved image and corpus, dedicated domain/tunnel, provider-log/firewall/host decisions, SBOM and scan evidence, unchanged-neighbour proof, live deployment and rollback rehearsal, and every independent governance, accessibility, cultural, rights, security, and physical-QR gate has evidence. No live system was contacted or changed.

## 2026-07-13 — Delivery-control review hardening

**Raouf:**

- **Scope:** Independent review fixes for immutable production activation, cloudflared file ownership, bounded restoration, exact runtime isolation, public release/header/cache verification, and health/state safety.
- **Summary:** Required production labels plus production-eligible release bytes, fixed the tunnel-file ownership contract so mode-`0400` UID/GID `65532:65532` files do not require operator read permission, verified exact image IDs/repository digests and complete runtime hardening for both containers, and made failed deploy/rollback restoration stop the DIVAN stack. Public verification now uses HTTPS-only bounded requests, reconciles release/content/manifest identity and hashes, checks exact browser headers and cache policies, and proves both hashed and unhashed missing paths stay no-store 404s. Caddy grants immutable caching only when a matching content-addressed file exists.
- **Files Changed:** `ops/Caddyfile`, `ops/compose.yml`, `ops/scripts/container-health.sh`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/render-tunnel-config.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; two meaningful RED rounds failed 3/32 tests each; final operations tests passed 32/32 and content tests 222/222; typecheck, lint, fixture build/dist verification, Bash/POSIX syntax, diff hygiene, Compose config, and Caddy validation passed. The fixture image was rebuilt and rejected by production health with exit 1. Both package and Docker default production builds failed with the exact missing-approved-corpus blocker. Full healthy-image runtime smoke is deferred only until these ops changes are integrated with the already completed application build that supplies `index.html`.
- **Follow-ups:** Run the definitive local hardened-container/header smoke after integration. Production and public launch remain blocked by authentic corpus/rights/reviews, domain/tunnel/provider-log decisions, host/firewall and unchanged-neighbour evidence, SBOM/scans, live rollback rehearsal, accessibility/device/governance approval, and physical-QR testing.

## 2026-07-13 — Fail-closed activation and runtime release binding

**Raouf:**

- **Scope:** Critical activation/restoration error handling and exact mount, network, tmpfs, and public-release runtime verification.
- **Summary:** Moved restore-image pull/label/digest validation ahead of activation and replaced scattered post-failure stops with an armed exit/signal handler that remains active until a candidate or restoration is fully verified. Exact runtime checks now reject swapped tunnel source files, any web bind/volume, tmpfs drift, wrong network driver/internal/role/ownership state, and unrelated network members. Public verification compares fetched `release.json` with the exact running container's `/srv/release.json` identity and SHA byte for byte.
- **Files Changed:** `ops/compose.yml`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/mock-bin/docker`, `tests/fixtures/ops/mock-bin/stat`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED 8/43; GREEN security 43/43 with mocked deploy/rollback prerequisite and verification failures plus isolation/release mismatch negatives; content 222/222; typecheck, lint, fixture build/dist verification, Bash/POSIX syntax, diff check, Compose rendering, Caddy validation, and the expected production-package blocker passed.
- **Follow-ups:** Re-run the healthy hardened-container and public delivery smoke on the integrated application branch. All authentic content, governance, accessibility, live infrastructure, provider logging, host isolation, security scanning, rollback rehearsal, and physical-QR gates remain closed.
## 2026-07-13 — Accessibility hardening and browser evidence

**Raouf:**

- **Scope:** B5 semantic flow, focus management, reduced-motion precedence, reflow, live status, audio resilience, and accessibility automation.
- **Summary:** Added narrow accessibility focus/motion helpers and focused shell corrections for predictable scene and Back focus, a useful skip link, one active landmark/heading flow, stored-versus-system motion behavior, two-tone focus, 44-by-44 targets, and unconstrained 320-pixel/text-spacing reflow. Added jsdom axe coverage for every core and blocking-error scene plus deterministic Chromium keyboard, browser-history, reflow, motion, skip, audio-failure, and browser-axe checks using only the conspicuous non-production fixture release.
- **Files Changed:** `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/SkipLink.tsx`, `src/scenes/*.tsx`, `src/lib/accessibility/*.ts`, `tests/accessibility/*.ts*`, `tests/e2e/accessibility*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; resumed TDD GREEN accessibility tests 16/16, component tests 39/39, unit tests 38/38, TypeScript and ESLint passed; real Chromium Playwright checks passed 2/2. Automated results are bounded evidence and are not a WCAG-conformance claim.
- **Follow-ups:** Manual VoiceOver/TalkBack, Persian-pronunciation, actual-device/browser, 200-percent zoom, contrast, focus-order, and unfinished context-navigation evidence remain launch blockers alongside every non-accessibility public-launch gate.

## 2026-07-13 — Accessibility review fixes

**Raouf:**

- **Scope:** Reduced-motion rendering, blocking-error focus, and deterministic default E2E setup.
- **Summary:** Made reduced reveal motion visibly interpolate opacity from zero to one over 120 ms before result mounting, without changing the full-motion path; moved focus to the mounted error heading when an invalid draw or random-provider exception blocks the experience; and made the default Playwright command build fixture release data before running only the accessibility spec from a clean checkout.
- **Files Changed:** `src/app/App.tsx`, `src/app/core.css`, `src/scenes/RevealScene.tsx`, `tests/accessibility/appAccessibility.test.tsx`, `tests/accessibility/styles.test.ts`, `tests/components/failures.test.tsx`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/accessibility.spec.ts`, `playwright.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced the non-rendering transition and both body-focus failures; GREEN focused tests 25/25, accessibility 18/18, components 41/41, unit 38/38, TypeScript and ESLint passed. The default E2E command listed exactly two tests in one file, Chromium passed 2/2, and a clean-dist rerun rebuilt fixture release output before passing 2/2 again.
- **Follow-ups:** Automated checks remain bounded evidence, not WCAG conformance; all manual accessibility and independent public-launch gates remain blocked pending reviewed evidence.

## 2026-07-13 — Stabilize skip availability timing

**Raouf:**

- **Scope:** B5 skip-control timing margin and browser measurement.
- **Summary:** Reduced skip-control availability from 250 ms to 200 ms, preserving the design's within-300-ms requirement while adding scheduling margin. Updated deterministic tests to enforce the 199/200 ms boundary and Chromium coverage to measure elapsed time from the actual DOM activation event instead of relying on a timeout equal to the requirement.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `tests/e2e/accessibility.spec.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced absence at 200 ms under the old delay; GREEN component tests 41/41 twice, accessibility tests 18/18 twice, and corrected Chromium tests 2/2 twice with measured skip availability at most 300 ms. Strict TypeScript and ESLint passed.
- **Follow-ups:** This change supplies automated timing evidence only; manual accessibility and every independent public-launch gate remain unchanged and blocked.

## 2026-07-13 — Increase skip timing margin under load

**Raouf:**

- **Scope:** Final B5 concurrent-load skip timing correction.
- **Summary:** Reduced skip availability from 200 ms to 100 ms after concurrent execution reproduced a browser-visible result beyond 300 ms. Updated the deterministic boundary to 99/100 ms and retained the unchanged actual-DOM elapsed assertion of at most 300 ms.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED failed at the 100 ms boundary under the prior setting; GREEN focused behavior passed, five consecutive Chromium runs passed 2/2 under concurrent load, components passed 41/41, accessibility passed 18/18, and TypeScript plus ESLint passed.
- **Follow-ups:** Manual accessibility evidence and all independent production/public-launch gates remain unchanged and blocked.

## 2026-07-13 — Align offline and production delivery contracts

**Raouf:**

- **Scope:** Exact offline recovery delivery, production Docker compiler inputs, and schema-parity immutable caching.
- **Summary:** Served `/offline.html` as its own verified static file with no-cache and noindex headers instead of rewriting it to `index.html`; retained `/offline` as the SPA route; aligned Caddy's existing-file immutable matcher with all build-valid content-addressed manifests, Vite assets, and nested audio/font/image/icon paths; and exposed only the public production compiler inputs as explicit Docker arguments. The deployment runbook now provides the complete approved production command and labels every value as public provenance while preserving the expected no-argument fail-closed build.
- **Files Changed:** `ops/Caddyfile`, `ops/Dockerfile`, `docs/deployment-runbook.md`, `tests/security/opsConfig.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** TDD RED 3/46 became GREEN 46/46; content 234/234, TypeScript, ESLint, shell syntax, diff hygiene, pinned-Caddy validation, and Compose rendering passed. The fixture image built and ran locally with no network or host port, retained its fixture label/flags, and was rejected by production health; the default Docker production build retained the exact missing-approved-corpus failure.
- **Follow-ups:** Perform the final recovery-file byte/header smoke after B4 integration. Production and public launch remain blocked by authentic content and reviews, explicit approved build values, immutable registry evidence, external governance/accessibility/security gates, live isolated deployment and rollback proof, and physical Open Day testing.
