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
