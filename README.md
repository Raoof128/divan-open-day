# DIVAN — Open Day

[![Live demo](https://img.shields.io/badge/live%20demo-divan.raoufabedini.dev-6d28d9)](https://divan.raoufabedini.dev/)
[![CI](https://github.com/Raoof128/divan-open-day/actions/workflows/ci.yml/badge.svg)](https://github.com/Raoof128/divan-open-day/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-22.16.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-10.33.0-orange)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License](https://img.shields.io/badge/code-MIT-blue)

> **DIVAN** is a bilingual (English + Persian) Persian-poetry experience built for a
> Persian Society Open Day stall. A visitor chooses a poet — **Hafez** or **Rumi** —
> holds a thought, and reveals one reviewed verse with its translation, source and
> rights credits, and optional recitation.

**🔗 Live demo: <https://divan.raoufabedini.dev/>** · **Release:** `divan-release-1-v1-0-7` (tag `v1.0.7`)

It is a **static, offline-first, privacy-preserving** single-page app. There is no
backend, no database, no analytics, no cookies, no visitor input, and no remote
fonts or APIs. Everything runs on the visitor's device.

---

## Highlights

- **Reviewed bilingual corpus** — exactly **60 Hafez + 60 Rumi = 120** source-bound
  records, each with an English translation and provenance bound to an immutable
  edition, span, and mapping.
- **Privacy by construction** — no cookies, identifiers, trackers, or visitor input;
  nothing is transmitted. `sessionStorage` holds only public release/poem IDs;
  `localStorage` holds only the motion preference.
- **Offline-first** — a hand-written service worker serves a content-addressed,
  integrity-checked release so a visit survives a flaky stall network.
- **Fair, unbiased selection** — a Web Crypto shuffle bag draws the verse locally;
  there is no server round-trip.
- **Accessibility as behaviour** — bilingual `lang`/`dir` markup with bidi isolation,
  a single shared live region, visible focus, 44 px targets, reduced-motion support,
  and forced-colors handling — all enforced by tests.
- **Culturally distinct art direction** — Hafez and Rumi keep separate illuminated
  Persian-miniature identities; Persian is always live Nastaliq text, never an image.

---

## Tech stack

| Area       | Choice                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Build & UI | Vite · React 19 · strict TypeScript                                                                     |
| Offline    | Hand-written service worker (`src-sw/`) with its own integrity schemas                                  |
| Toolchain  | pnpm `10.33.0` · Node `22.16.0` (pinned in `.node-version` + `packageManager`)                          |
| Tests      | Vitest (unit / component / a11y / offline / share / performance / security) + Playwright (Chromium e2e) |
| Delivery   | Unprivileged static container behind an outbound tunnel                                                 |

---

## Quick start

Node and pnpm are pinned. Enable the exact versions, then install from the lockfile:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install --frozen-lockfile
```

### See the app locally

`pnpm dev` intentionally shows the fail-closed _"collection is being prepared"_
screen — it does not serve a compiled release, and that is correct behaviour, not a
bug. To preview a runnable build, use the fixture release:

```bash
pnpm build:fixture
pnpm exec vite preview --host 127.0.0.1 --port 4173   # → http://127.0.0.1:4173
```

> The **fixture** is a synthetic release (`productionEligible: false`) whose Persian
> lines are conspicuous ASCII placeholders (`TEST ONLY / NOT POETRY …`). It exists to
> exercise the build and must never be deployed. The production compiler rejects those
> markers. Nastaliq shaping and real translations appear only in a production build.

---

## Quality gate

One command runs the whole gate; CI runs the same script on every push to `main` and
every pull request.

```bash
pnpm check           # format, lint, typecheck, tests, build, verify:*, launch-gate status
pnpm check --quick   # fast loop: format, lint, typecheck, unit tests
pnpm check --e2e     # also run Playwright end-to-end tests
```

Focused scripts:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint . --max-warnings 0
pnpm test             # vitest run (all non-e2e suites)
pnpm test:e2e         # playwright (spawns its own server on :4173)
pnpm verify:dist      # distribution integrity + leak scan
pnpm verify:privacy   # no cookies / trackers / analytics / geolocation in src or dist
```

`verify:privacy` and `verify:dist` fail closed: the privacy scan rejects any tracker,
cookie, or analytics code in `src` **or** `dist`, and the distribution check rejects any
non-local resource anywhere in the browser bundle. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full developer workflow.

---

## Architecture

A strict build-time compiler converts reviewed **private authoring records** into a
**content-addressed public corpus**. In the browser, code verifies the release
descriptor and corpus integrity before the local draw becomes available; Web Crypto
supplies the random selection, and session storage holds only the small public state
needed to resume a visit.

By design there is **no** visitor database, public write API, runtime poetry API,
analytics, advertising, social login, autoplay, raw-HTML rendering, or remote font
dependency. The audited
[release design](2026-07-12-divan-open-day-agent-ready-design-v2-audited.md) and the
[implementation plan](docs/implementation-plan.md) record the full security and
release boundaries; the [deployment runbook](docs/deployment-runbook.md) records the
release procedure.

```
src/
  app/         reducer + history + offline + focus orchestration
  scenes/      Boot · Welcome · ChoosePoet · Intention · Reveal · BlockingError
  components/  the illuminated entrance, book stage, poem result, and atmosphere
  pages/       About · Privacy · Accessibility · Credits · Offline
  lib/         content compiler + schemas · secure shuffle bag · share card · storage
  contracts/   typed app / content / release boundaries
src-sw/        the hand-written service worker + its own integrity schemas
scripts/       build + verifiers + ops helpers
ops/           Dockerfile · compose · Caddyfile · deploy / verify / rollback
content-private/  the 120 reviewed authoring records (tracked, source-bound)
docs/          runbooks, per-release verification evidence, audits
tests/         mirrors src/ ; e2e/ is Playwright
```

---

## Privacy

DIVAN never asks a visitor to submit an intention, name, email, or student ID. It sets
no tracking cookies and sends no poem choice to any application database. A hosting
provider and network edge may process limited connection data (such as an IP address)
to deliver and protect the site; provider logging, access, and retention are governed
separately. The app carries an in-app Privacy note, and the
[security policy](SECURITY.md) records how to report concerns.

---

## Content and rights

Production poetry is bound to machine-alignment authority over immutable edition, span,
mapping, and canonical-identity evidence — attribution and source-bound permissions
fail closed if that evidence is missing. Fixtures are marked with repeated `TEST ONLY`,
`SYNTHETIC`, `NOT POETRY`, and `NOT TRANSLATION` sentinels, which the production
compiler rejects. See the [content style guide](docs/content-style-guide.md) and the
[public rights register](docs/rights-register-public.md).

---

## Scope and status

The corpus, rights, hostname, tunnel, live deploy, and rollback gates are **open** —
that is why the site is live and serving the reviewed 120-record corpus.

Repository tests and local browser checks are **engineering** evidence. They do **not**
establish, and this project does **not** claim:

- cultural-review sign-off;
- manual assistive-technology evidence on real devices (VoiceOver / TalkBack /
  branded Safari — Playwright WebKit is not Safari);
- a University mark or endorsement (branding stays **society only**);
- a provider logging / retention review; or
- a physical QR deliverable (`verify:qr` stays fail-closed by design).

---

## Security

Report security issues through the [security policy](SECURITY.md). Do not add machine
discovery, credentials, private evidence, production content, or generated tunnel
configuration to Git. Dependency and font acknowledgements appear in the
[third-party notices](THIRD_PARTY_NOTICES.md).

---

## Licence

Repository-authored **source code** is released under the MIT Licence — see
[`LICENSE`](LICENSE). That grant covers this repository's own code only. It does **not**
extend to, and no licence is granted for:

- **Persian poetry, translations, and reflections.** The source-bound corpus and its
  registered source editions are third-party works under their own terms (for example,
  Persian Wikisource transcriptions are CC BY-SA and require attribution). Reuse is a
  matter between you and those rights holders.
- **Persian Society names and marks**, and any University mark. These are not licensed
  for reuse.

Third-party components remain under their own licences.

---

<p align="center">
  Made by the <strong>Macquarie Persian Society</strong> — with love, for everyone. 🌹
</p>
```
