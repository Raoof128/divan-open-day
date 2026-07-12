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
