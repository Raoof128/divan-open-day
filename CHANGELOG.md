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
