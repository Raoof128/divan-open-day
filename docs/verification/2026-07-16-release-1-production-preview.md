# Release 1 protected production-preview verification

Date: 2026-07-16 (Australia/Sydney)

## Verdict

Release 1 is **PASS for a protected production preview** and **NOT APPROVED for
public launch**. The exact tagged source and immutable image are deployed at
`divan.raoufabedini.dev`, but Cloudflare Access deliberately returns its login
redirect to unauthorised visitors and a final deny-everyone policy remains in
place. No public-launch claim is made while the physical QR, physical-device,
assistive-technology, provider-log/retention, and approved off-device credential
backup gates remain open.

This closeout did not change poetry, corpus selection, source evidence,
translations, release compilation, service-worker behaviour, University
branding, the separate 60-Hafez/60-Rumi work, or any unrelated Droplet service.

## Immutable release identity

| Field                    | Verified value                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Source tag               | annotated `v1.0.3`                                                                                               |
| Tagged/merged source SHA | `fa9d1e226f7d0f9df86d77eb1888fc0ce25b2791`                                                                       |
| Release ID               | `divan-release-1-v1-0-3`                                                                                         |
| Public origin            | `https://divan.raoufabedini.dev`                                                                                 |
| Production content       | exactly 60 Hafez + 60 Rumi = 120                                                                                 |
| Image                    | `ghcr.io/raoof128/divan-open-day:v1.0.3@sha256:9d526a184ca23743298c8ca679f94abef856f0e4667dae503fe2fd1ac69a4513` |
| Image scan               | Docker Scout: 0 Critical / 0 High / 0 Medium / 0 Low                                                             |
| SBOM SHA-256             | `63f64941be34dfe8136aa4be9a7bb4c103e3c99d11cda30a1595a27bd6563ecf`                                               |
| Branding                 | `society_only`; University approval ID empty                                                                     |

The final documentation commit cannot name its own SHA without changing that
SHA. The table therefore records the exact immutable source/deployment SHA; the
evidence commit and final merge SHA are recorded in the evidence PR and release
handoff after those commits exist.

## Source, PR, and image review

- Draft PR #5 was reviewed file-by-file against `main`, repaired only where its
  implementation genuinely failed, passed its required checks, was marked ready,
  and merged normally. Its verified implementation SHA remains
  `a079e722f0d3ecdb643c8204d7c3272e14ad4616`.
- The visible intention/result controls, session clearing, deterministic chooser,
  browser Back/Forward, automatic and manual scroll-scrubbing, terminal-frame
  arrival, Skip control, and every direct fallback route are covered by
  `visible-navigation-and-cinematic-begin.md`.
- PR #8 added release-runtime repairs and the QR generator; PR #9 fixed explicit
  no-store 404 origin responses. Both required Quality gate and OSV checks passed.
- `v1.0.0` was rejected before publication after image scanning. `v1.0.2` was
  rejected before image publication after the missing-path cache-header defect.
  Neither rejected candidate was substituted for `v1.0.3`, and no tag was moved.
- The final `v1.0.3` image was built from a clean `git archive v1.0.3`, scanned,
  pushed by digest, and deployed by digest. Registry credentials were removed
  locally and remotely after use.

## Exact repository commands and results

Node 22.16.0 and pnpm 10.33.0 were used. The final focused command set was:

```bash
export PATH=/Users/raoof.r12/.nvm/versions/node/v22.16.0/bin:$PATH
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:components
pnpm test:a11y
pnpm test:e2e
export DIVAN_PUBLIC_ORIGIN=https://divan.raoufabedini.dev
export DIVAN_RELEASE_ID=divan-release-1-v1-0-3
export DIVAN_MIN_HAFEZ_COUNT=60
export DIVAN_MIN_RUMI_COUNT=60
export DIVAN_BRANDING_MODE=society_only
export DIVAN_UNIVERSITY_APPROVAL_ID=
export SOURCE_DATE_EPOCH=1784198509
pnpm build:production
pnpm verify:dist
pnpm verify:privacy
```

| Command                 | Final result                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ |
| `pnpm format:check`     | PASS; all matched files use Prettier style                                     |
| `pnpm lint`             | PASS; zero warnings/errors                                                     |
| `pnpm typecheck`        | PASS                                                                           |
| `pnpm test:components`  | PASS; 11 files, 80/80 tests                                                    |
| `pnpm test:a11y`        | PASS; 2 files, 24/24 tests                                                     |
| `pnpm test:e2e`         | PASS; 5/5 Chromium tests                                                       |
| `pnpm build:production` | PASS; `divan-release-1-v1-0-3`, exactly 120 items                              |
| `pnpm verify:dist`      | PASS; coherent production release and no archival/private bundle leak          |
| `pnpm verify:privacy`   | PASS; no cookies, tracking, fingerprinting, geolocation, or disallowed storage |

The first documentation-branch invocation stopped at `pnpm format:check` because
this new report needed Prettier. Only this Markdown file was formatted, then the
complete nine-command sequence above was restarted and passed.

The complete `bash scripts/check.sh --ci` gate also passed on the release source:
62 Vitest files / 705 tests, production output of exactly 120 records, Playwright
5/5, source locks 9/9, distribution/private-leak, privacy, audit, and static
operations checks. Its first attempt exposed one non-deterministic Playwright
timeout when automatic completion detached `Skip entrance` during a click; the
isolated rerun passed and a fresh complete gate passed without code or test
changes. No test was weakened or deleted.

## Deployment and rollback evidence

The operator used the repository's key-only, dedicated `eoiadmin` route and
passwordless `sudo`; root/password SSH was not used. The deployment ran from
`/opt/divan-open-day` with owner-only state, UID/GID 65532 mode-0400 tunnel
configuration/credentials, two isolated DIVAN networks, a read-only unprivileged
web runtime, and no published host port.

The following repository procedures were run using the immutable image and
non-secret environment variables above; tunnel identity and credential paths are
intentionally omitted from public evidence:

```bash
ops/scripts/preflight.sh --image "$DIVAN_IMAGE" --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
ops/scripts/deploy.sh --image "$DIVAN_IMAGE" --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
ops/scripts/verify.sh --image "$DIVAN_IMAGE" --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
ops/scripts/rollback.sh --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
```

- Preflight, deployment verification, and the independent post-deployment
  verifier passed.
- Five unrelated containers were running before and after deployment; all five
  remained running and healthy. DIVAN published zero port 8080 and shared no
  existing volume, credential, route, or Docker network.
- The Cloudflare tunnel and DNS route are locally managed with the audited
  credential file. A separate remote-managed dashboard tunnel created during
  setup remains unused and was not connected to production.
- The hostname-scoped Cache Rule respects/bypasses on the origin's cache headers,
  preventing a broad service-worker edge TTL. Existing hashed assets remain
  immutable; documents, release pointers, service worker, and 404s retain their
  reviewed cache contracts.
- Exactly one explicit `Deny all until launch gates close` Access policy remains,
  with no bypass policy. Local and independent remote probes returned HTTP 302 to
  Access after the policy was restored.
- Rollback rehearsal passed, restored the tagged `v1.0.3` reference, and preserved
  the same approved digest. Because this is the first verified production image,
  the rehearsal exercised state/reference restoration with the same bytes rather
  than switching to an older approved build.
- Final host baseline: five unrelated services running, zero unhealthy, zero
  DIVAN host-published ports, and zero retained registry authentication entries.

## Vulnerability, provenance, and privacy evidence

- Docker Scout found 0 Critical / 0 High / 0 Medium / 0 Low findings in the final
  31 MB image.
- OSV reported only unscored/no-fix `GO-2026-5932`. Dependency-graph inspection
  proved the affected `golang.org/x/crypto/openpgp` packages are absent from the
  compiled Caddy command; the informational advisory is accepted with that exact
  limitation.
- The SPDX SBOM and OSV JSON are release assets. Both are evidence files, not
  runtime inputs.
- Public verification found the exact security/cache headers, coherent
  `release.json`, no cookies, analytics, visitor identifiers, third-party runtime
  requests, public health endpoint, source maps, private authoring data, `.env`,
  or credentials.

## QR print pack

The release QR encodes only `https://divan.raoufabedini.dev`, uses error
correction M, a four-module quiet zone, vector modules, and no logo. Digital
generation, exact manifest/checksum verification, and visual inspection passed
for:

- A3 hero poster with a 180 mm QR;
- A5 table stand with a 70 mm QR;
- 85 x 55 mm take-home card with a 35 mm QR;
- A5 staff troubleshooting card with a 70 mm QR.

The four PDFs are also combined into a mixed-page-size print-ready PDF and a ZIP
containing the individual PDFs, SVGs, and manifest. The combined PDF SHA-256 is
`3a73fda67453a6085015795bd0e49dfe056f76f05d2a977bf4fbb73a6430291c`.

The digital QR pack is **PASS**. The physical scan matrix remains **BLOCKED**
until printed samples are tested on iOS and Android at the documented distances
and lighting levels. While Access deny-all remains active, scans correctly reach
the protected Access boundary rather than a public visitor experience.

## Manual experience evidence

The PR #5 walk used Chromium at 390 x 844 CSS pixels:

- Welcome -> Begin automatically traversed the cinematic and scrubbed the real
  video from 0 to 7.95 seconds before showing the poet cards;
- manual scrolling and `Skip entrance` remained usable;
- Rumi -> `Choose another poet` returned both cards;
- Hafez -> reveal -> result `Choose another poet` returned both cards;
- browser Back restored the Hafez result and Forward restored the chooser;
- reduced motion, Save-Data, offline, video error, first-frame timeout,
  non-scrollable, and rejected-scroll routes entered directly without trapping.

The final image contains the same reviewed frontend bytes; later release commits
changed runtime packaging, QR output, and explicit missing-file handling only.

## Open gates and honest limitations

- Public launch remains closed by the Access deny-all policy.
- Printed iOS/Android QR distance/lighting evidence is not yet available.
- The manual phone walk is Chromium emulation on macOS, not physical iOS/Android,
  Safari/Firefox, screen-reader, switch-control, or voice-control evidence.
- Cloudflare and DigitalOcean provider logging/access/retention still require an
  approved owner decision.
- The SSH key and secret directory have an owner-only same-device encrypted
  backup, but the approved off-device password-manager/encrypted-backup gate is
  still open.
- The unused remote-managed tunnel should be reviewed and removed after operators
  confirm it is not required; it is not routed to the live service.
- `shellcheck` was unavailable locally (`command not found`); repository shell
  contract tests and the live procedures passed.
- This repository has no `docs/open-day-checklist.md`; the design authority,
  deployment/rollback runbooks, and this report are the evidence sources.
