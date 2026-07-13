# DIVAN Release 1 Implementation Plan

Date: 12 July 2026

Authority: `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md`

Design SHA-256: `badf98316813a58c84a35420c75b231eddd459f479d490319301fac12a6ecd75`

## Global constraints

1. The public application is static and offline-capable. It has no runtime server, database, public write API, visitor identity, analytics, cookie, tracking request, remote asset dependency, or runtime poetry API.
2. Production content compilation fails unless the approved minimum corpus, edition provenance, rights, permissions, reviews, approvals, assets, and checksums are complete.
3. Test fixtures are synthetic, conspicuously non-production, non-poetic, and excluded from production corpus discovery and counts.
4. English precedes Persian in the DOM and visual order. Persian uses live text, semantic language/direction attributes, logical CSS, and bidi isolation.
5. The draw uses Web Crypto rejection sampling and a per-poet session shuffle bag. `Math.random()` is forbidden in production draw code.
6. Reduced motion is a complete experience. It disables rotation, parallax, path drawing, particles, continuous movement, and nonessential View Transitions.
7. A service-worker update becomes active only after the complete release, corpus, asset manifest, item counts, and SHA-256 values verify. A failed stage leaves the active release untouched.
8. DIVAN shares no code, database, volume, network, route, environment, or credential with EOI/ballot services. The web container has no egress network or host-published port.
9. No production deployment, DNS change, tunnel mutation, firewall change, credential rotation, or public launch occurs in this implementation run.

## Task 0 — Protected repository and shared contracts

Owner: root coordinator

Files: root package/tooling configuration, `src/contracts/**`, test setup, instruction and changelog files.

Actions:

1. Initialize `main`, commit the authority document and protected baseline, and create `feat/divan-open-day-r1`.
2. Pin compatible current versions of React, Vite, TypeScript, Vitest, Playwright, Zod, axe-core, content tooling, and self-hosted font packages.
3. Configure strict TypeScript, linting, unit/component/browser tests, deterministic build values, and fixture-versus-production profiles.
4. Publish shared public-item, release, asset-manifest, application-event, and motion contracts before writer branches diverge.

Validation:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

Rollback point: baseline commit on `main`; the feature branch can be removed without touching the user-provided design or `.env`.

## Task 1 — B3 Content Pipeline Agent

Worktree branch: `agent/b3-content-pipeline`

Files: `src/lib/content/**`, `scripts/content/**`, `content-private/**`, `tests/content/**`, `tests/fixtures/content/**`, `docs/content-style-guide.md`, `docs/asset-register.md`, `docs/rights-register-public.md`.

Test-first behaviors:

- strict YAML and registry parsing with unknown-key rejection;
- allowlisted poet/mode, status, edition, alignment, rights, approval, reviewer, asset, and audio values;
- path, symlink, remote-URL, raw-markup, bidi-control, size, duplicate-ID, and fixture-leak rejection;
- explicit private-to-public construction with zero private fields;
- digest-bound review records, canonical item hashes, sorted corpus hash, asset-manifest hash, and release metadata;
- 24 Hafez/16 Rumi/40 total production minimums;
- safe test-only fixture build and expected production-gate failure when no approved corpus exists.

Validation:

```text
pnpm test:content
pnpm build:fixture
pnpm build:production
pnpm verify:dist
```

Expected production result while corpus evidence is absent: `build:production` exits non-zero with a recorded launch blocker.

Rollback point: cherry-pick boundary for the B3 commit.

## Task 2 — B1 Application Shell and State Agent

Worktree branch: `agent/b1-shell-state`

Files: `src/main.tsx`, `src/app/**`, `src/scenes/**`, `src/lib/draw/**`, `src/lib/storage/**`, error boundaries, shared semantic result components, and matching unit/component tests.

Test-first behaviors:

- only valid state transitions and nearest-safe recovery;
- browser Back/Forward/refresh contract without poem IDs in URLs;
- public-ID-only session storage and local-only motion preference;
- unbiased secure integer boundaries and no-repeat Fisher-Yates bags;
- unsupported-browser fallback without `Math.random()`;
- one active scene and `h1`, English-first result order, Persian semantics, result focus, preserved poem on action failure;
- double-activation prevention and deterministic reveal completion/skip behavior.

Validation:

```text
pnpm test:unit
pnpm test:components
pnpm typecheck
pnpm lint
```

Rollback point: cherry-pick boundary for the B1 commit.

## Task 3 — B5 Accessibility Implementation Agent

Worktree branch: `agent/b5-accessibility`

Files: accessibility primitives/tests and reviewed corrections across UI-owned files.

Test-first behaviors:

- skip link, landmarks, heading hierarchy, focus placement/restoration, live-region announcements, keyboard flow, and visible focus;
- structural language/direction and mixed-reference bidi isolation;
- 44-by-44 primary targets, 320 CSS-pixel reflow, landscape, text-spacing overrides, and 200 percent zoom readiness;
- System/Reduced/Full preference precedence and a complete reduced-motion mapping;
- native audio accessibility and nonblocking offline/share/audio errors.

Validation:

```text
pnpm test:a11y
pnpm test:components
pnpm test:e2e --grep accessibility
```

Rollback point: cherry-pick boundary for the B5 commit.

## Task 4 — B2 Visual System and Motion Agent

Worktree branch: `agent/b2-visual-motion`

Files: `src/styles/**`, visual components, original sanitised SVG geometry, registered self-hosted fonts/assets, and visual-regression tests.

Behaviors and evidence:

- locked palette, manuscript/night-garden composition, culturally distinct Hafez/Rumi motifs, and non-generic editorial hierarchy;
- responsive 320-by-568, 390-by-844, 844-by-390, 768-by-1024, and 1440-by-900 states;
- reveal skip by 300 ms, 1.6-second target, 2.4-second hard stop, transform/opacity-only choreography, and 120–180 ms reduced reveal;
- two-tone focus treatment that passes on paper and dark scenes;
- explicit dimensions, no layout shift, no remote assets, and performance-budget assertions.

Validation:

```text
pnpm test:visual
pnpm test:a11y
pnpm test:performance
pnpm build:fixture
```

Rollback point: cherry-pick boundary for the B2 commit.

## Task 5 — B4 Offline, Random Draw, and Share Agent

Worktree branch: `agent/b4-offline-share`

Files: `src-sw/**`, `src/sw-client/**`, `src/lib/share/**`, share components, offline fixtures/tests.

Test-first behaviors:

- staged release cache verifies response status, item counts, corpus SHA-256, asset-manifest SHA-256, and every required asset;
- failed staging deletes only the candidate cache; activation retains the prior complete release and never mixes versions;
- navigation, hashed-asset, content, release-pointer, worker, audio, and health strategies match the design;
- share card is generated locally, includes no private intention, makes no network request, revokes Blob URLs, and falls back to text copy/screenshot guidance when sharing or shaping fails.

Validation:

```text
pnpm test:offline
pnpm test:share
pnpm test:e2e --grep offline
pnpm test:e2e --grep share
```

Rollback point: cherry-pick boundary for the B4 commit.

## Task 6 — B6 Infrastructure and Deployment Agent

Worktree branch: `agent/b6-infrastructure`

Files: `ops/**`, `.github/workflows/**`, `scripts/ops/**`, `scripts/qr/**`, `tests/security/**`, `tests/performance/**`, deployment/rollback/Open Day documentation.

Behaviors and evidence:

- multi-stage static image with no private input in the final layer, non-root UID, read-only root, dropped capabilities, no-new-privileges, resource bounds, and disabled access logs;
- exact CSP, security, privacy, cache, technical-resource indexing, document fallback, and internal health behavior;
- dual-network Compose with no `ports:`, no Docker socket, no EOI/ballot network/volume/secret, and a tunnel catch-all/public-health 404;
- immutable image inputs, SBOM, secret scan, dependency/image scan lane, health/readiness checks, deployment and no-rebuild rollback scripts;
- QR SVG/PDF generator requiring an explicit approved URL and recording quiet zone/error correction/checksums.

Validation:

```text
docker compose -f ops/compose.yml config --quiet
pnpm test:security
pnpm test:performance
pnpm verify:container
pnpm verify:headers
pnpm verify:qr
```

Rollback point: cherry-pick boundary for the B6 commit; no live host state is changed.

## Task 7 — Wave C independent verification

Six read-only reviewers independently audit functional behavior, accessibility, security, performance, visual/cultural fidelity, and release/documentation reproducibility. Valid findings receive a failing regression test where practical, the smallest fix, focused verification, and reviewer re-check.

## Task 8 — Final local gauntlet and acceptance evidence

Run from a clean checkout:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:content
pnpm test:a11y
pnpm test:offline
pnpm test:e2e
pnpm test:security
pnpm test:performance
pnpm build:fixture
pnpm verify:dist
pnpm audit --prod
docker buildx build --load --build-arg DIVAN_BUILD_PROFILE=fixture -f ops/Dockerfile -t divan:verify .
syft divan:verify -o cyclonedx-json
docker compose -f ops/compose.yml config --quiet
```

Create `docs/verification-report.md` with command, tool version, Australia/Sydney timestamp, commit, exit code, artifact hash, acceptance-criterion mapping, and every unrun/manual/external gate. The final result cannot be labelled public-launch-ready while production content, human approvals, final hostname, firewall/provider logging, manual assistive-technology, physical QR, campus Wi-Fi, or production rollback evidence is absent.
