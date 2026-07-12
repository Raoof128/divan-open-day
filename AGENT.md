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
