# DIVAN Open Day

[![CI](https://github.com/Raoof128/divan-open-day/actions/workflows/ci.yml/badge.svg)](https://github.com/Raoof128/divan-open-day/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-22.16-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-10.33-orange)

DIVAN is a bilingual Persian poetry experience for a Persian Society Open Day
stall. This repository is a **Work in progress**. It contains a source-bound
local production corpus, but the application is not deployed and no public
launch, University branding, live infrastructure, physical QR, or event approval
is claimed.

## Release status

`pnpm build` and `pnpm build:fixture` produce a synthetic release marked
`productionEligible: false`; do not publish it. With explicit non-secret release
configuration, `pnpm build:production` validates the deterministic manifest of
exactly 60 Hafez and 60 Rumi source-bound records. Public launch remains a
separate gated operation.

Repository tests and local browser checks provide engineering evidence. They
do not establish cultural approval, rights clearance, accessibility
conformance, infrastructure readiness, or permission to launch.

## Local setup

Use Node.js 22.16.0 and pnpm 10.33.0. The repository pins both versions in
`.node-version`, `package.json`, and the package manager declaration.

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install --frozen-lockfile
```

Build and serve the runnable fixture from `dist`:

```bash
pnpm build:fixture
pnpm exec vite preview --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`. The source development server from `pnpm dev`
does not serve `dist/release.json`; without an explicit local fixture adapter it
shows the intended fail-closed release error instead of loading test content.

Run the full local quality gate with a single command:

```bash
pnpm check           # format, lint, typecheck, tests, build, verify:*, gates
pnpm check --quick   # fast loop: format, lint, typecheck, unit tests
pnpm check --e2e     # also run Playwright end-to-end tests
```

CI runs the same gate (`scripts/check.sh --ci`, including end-to-end tests) on
every push to `main` and every pull request. See `CONTRIBUTING.md` for the full
developer workflow. `build:production` and `verify:qr` are intentionally
fail-closed until an approved corpus and the physical QR deliverable exist;
Docker-host evidence (`ops/scripts/verify.sh`, image build, SBOM scan) is run
separately on a host with a running Docker daemon.

## Architecture

Release 1 uses a static Vite and React application. A strict build-time
compiler converts reviewed private authoring records into a content-addressed
public corpus. Browser code verifies the release descriptor and corpus before
the local draw becomes available. Web Crypto supplies random selection, while
session storage holds only the small public state needed to resume a visit.

The design has no visitor database, public write API, runtime poetry API,
analytics, advertising, social login, or remote font dependency. Deployment
uses an unprivileged static container behind an outbound tunnel. The
[audited release design](2026-07-12-divan-open-day-agent-ready-design-v2-audited.md)
and [implementation plan](docs/implementation-plan.md) record the full
security and release boundaries.

## Privacy

DIVAN does not ask visitors to submit a private intention, name, email address,
or student identifier. The application does not set tracking cookies or send
poem choices to an application database. A hosting provider and network edge
may process limited connection data such as an IP address to deliver and
protect the site. Provider logging, access, and retention require a recorded
decision before launch.

## Content and rights

Test records use repeated `TEST ONLY`, `SYNTHETIC`, `NOT POETRY`, and
`NOT TRANSLATION` markers. The production compiler rejects those markers.
Production poetry uses fresh machine-alignment authority bound to immutable
edition, span, mapping, and canonical-identity evidence; it does not require a
fabricated human identity. Attribution and source-bound permissions still fail
closed. See the [content workflow](docs/content-style-guide.md) and
[public rights register](docs/rights-register-public.md).

## Operations and security

The deployment and rollback documents describe procedures. Operators must
collect separate evidence before they approve a host or public route. Do not
add machine discovery, credentials, private evidence, production content, or
generated tunnel configuration to Git.

Report security issues through the [Security policy](SECURITY.md). Dependency
and font acknowledgements appear in the
[Third-party notices](THIRD_PARTY_NOTICES.md).

## Source availability and licence

Repository-authored source code is released under the MIT Licence — see
[LICENSE](LICENSE). That grant covers this repository's own code only.

It does not extend to, and no licence is granted for:

- **Persian poetry, translations, and reflections.** The source-bound production
  corpus and its five registered source editions are third-party works that keep
  their own terms (for example, the Persian Wikisource transcriptions are CC
  BY-SA and require attribution). Reusing them is a matter between you and those
  rights holders.
- **Persian Society names and marks**, and any University mark. These are not
  licensed for reuse.

Third-party components remain under their own licences; publication of this
repository does not change those terms.
