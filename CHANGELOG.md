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
