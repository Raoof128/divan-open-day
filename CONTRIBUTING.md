# Contributing to DIVAN

Thank you for helping build the DIVAN Open Day experience. This repository
follows a strict, evidence-driven contract. Please read `AGENT.md` (the
engineering contract) and the design authority
`2026-07-12-divan-open-day-agent-ready-design-v2-audited.md` before making changes.

## Prerequisites

- Node.js (see `.node-version`, currently 22.16.0)
- pnpm (see `packageManager` in `package.json`, currently 10.33.0)

```bash
pnpm install --frozen-lockfile
```

## The quality gate

One command runs the full local verification gauntlet:

```bash
pnpm check           # format, lint, typecheck, tests, build, verify:*, gates
pnpm check --quick   # fast loop: format, lint, typecheck, unit tests
pnpm check --e2e     # also run Playwright end-to-end tests
```

CI runs `scripts/check.sh --ci` (including end-to-end tests) on every pull
request. A green gate is required before merge.

Individual steps:

```bash
pnpm format          # apply Prettier
pnpm lint            # ESLint (zero warnings)
pnpm typecheck       # strict TypeScript
pnpm test            # Vitest (unit, component, a11y, offline, share, perf, security)
pnpm test:e2e        # Playwright (Chromium)
pnpm build:fixture   # non-production fixture build
pnpm verify:dist     # distribution integrity
pnpm verify:privacy  # no cookies/analytics/trackers/geolocation
```

## Non-negotiables

- Test-driven development for behaviour: write a failing test, implement the
  minimum, refactor while green.
- No database, public write endpoint, analytics, cookies, identifiers, remote
  fonts, runtime poetry APIs, autoplay, or raw HTML rendering.
- Never fabricate poetry, translations, provenance, licences, approvals,
  reviews, credits, University branding, or production configuration. Production
  compilation must stay fail-closed until an approved corpus exists.
- Do not touch the existing EOI/ballot code, data, network, or credentials.
- Update `AGENT.md` and `CHANGELOG.md` with a dated `Raouf:` entry after changes.

## Commits and PRs

- Focused commits; no unrelated refactors.
- Open PRs against `main`; fill in the pull request template.
- Public launch remains blocked by the gates listed in the design §31.2 and the
  PR template — do not claim launch readiness.
