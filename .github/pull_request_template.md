<!-- Keep the DIVAN engineering contract in AGENT.md in mind. -->

## Summary

<!-- What does this change do, and why? -->

## Scope

<!-- Which stage/subsystem: B1 state, B2 visual, B3 content, B4 offline, B5 a11y, B6 ops, share, ops, docs? -->

## Verification

- [ ] `pnpm check` passes locally (`scripts/check.sh`)
- [ ] `pnpm test` and, if UI/e2e affected, `pnpm test:e2e` pass
- [ ] No new runtime dependency, database, analytics, cookie, tracker, remote font/asset, or raw HTML rendering
- [ ] No EOI/ballot code, data, or credentials touched
- [ ] `AGENT.md` and `CHANGELOG.md` updated with a dated `Raouf:` entry

## Launch gates

<!-- Confirm none of these were fabricated: approved corpus/rights, cultural review,
manual assistive-tech evidence, final hostname/short URL, University-mark approval,
live deploy/tunnel/logging, rollback rehearsal, physical QR. Note any that this PR touches. -->

- [ ] This PR does not fabricate content, rights, approvals, or production configuration
