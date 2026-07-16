# DIVAN Codex GPT-5.6 Sol Final Production Deployment and Launch Goal

This file supersedes every earlier deployment, Droplet, Cloudflare, preview, launch-readiness, and QR prompt for DIVAN Release 1.

The bilingual content target is already complete:

```text
Hafez: 60
Rumi: 60
Total: 120
```

This task is the final engineering, infrastructure, verification, deployment, and launch-evidence stage. It must not expand or rewrite the poetry corpus.

## Run

Open `Raoof128/divan-open-day` with GPT-5.6 Sol selected in Codex. Run `/status`, then `/goal`, and paste everything from `BEGIN CODEX GOAL` to `END CODEX GOAL`.

# BEGIN CODEX GOAL

You are the sole release engineer and deployment operator for DIVAN Release 1. Work through the complete remaining path from the current repository state to an evidence-backed production deployment through Cloudflare Tunnel on the authorised DigitalOcean Droplet.

Do not stop after writing a plan, audit, checklist, dry run, or partial deployment. Inspect, repair, test, build, scan, deploy, verify, rehearse rollback, document, commit, push, and return the verified URL when the evidence allows it.

Do not spawn parallel writers or allow multiple agents to mutate the same repository or infrastructure. Preserve unrelated services and files.

## Final outcome

The preferred successful outcome is all of the following:

1. Current `main` contains the final 60 Hafez / 60 Rumi corpus and the final visible-navigation/cinematic-Begin repair.
2. The entire repository passes a fresh release audit.
3. One tagged, reproducible production source commit is frozen.
4. A production-only container image is built from that source, scanned, pushed to an approved registry, and referenced only by immutable digest.
5. DIVAN is deployed in its own directory, Compose project, credentials, volumes, and Docker networks on the authorised Droplet.
6. The static web container has no public host port and no egress-capable network.
7. A dedicated Cloudflare Tunnel is the only public application path.
8. The configured HTTPS hostname serves the exact 120-record production release.
9. Security headers, cache semantics, privacy, offline behaviour, service-worker coherence, accessibility, performance, origin isolation, and neighbouring-service isolation are verified.
10. Rollback is actually rehearsed and the final candidate is restored and reverified afterwards.
11. The QR/short-URL digital pack is generated and verified.
12. Sanitised public evidence is committed; secrets and sensitive infrastructure evidence remain outside Git.
13. The final report contains the public or protected preview URL, release ID, source tag, source SHA, image digest, and an honest launch verdict.

A public URL alone is not success. A deployment that bypasses the design authority, leaks credentials, exposes the Droplet, weakens tests, or invents missing evidence is failure.

## Truth boundary and launch interlock

There is no honest “100% safe” guarantee. Replace that phrase with evidence-backed production readiness.

Never fabricate or silently assume:

- event approval;
- Society executive approval;
- University name or logo approval;
- rights, cultural, or source approval not already evidenced;
- a manual VoiceOver, TalkBack, device, print, glare, or physical QR test that did not occur;
- provider logging configuration you did not inspect;
- a backup, firewall, tunnel, DNS, monitoring, scan, rollback, or deployment result you did not observe;
- a public hostname or short URL outside an account the owner controls.

Use `society_only` branding unless a genuine approval identifier is already supplied and validated. Do not enable University branding merely because the event is associated with Macquarie University.

Public launch is allowed only when every applicable repository gate and external gate has evidence. If one or more non-technical or physical gates cannot be completed with available authorised access, still complete the full technical deployment but protect it with Cloudflare Access or an equivalent restricted preview policy. Return the protected preview URL and the exact blockers. Do not expose an ungated public launch and do not report `PASS` for missing human evidence.

If `.env` contains an explicit boolean launch authorisation such as `DIVAN_PUBLIC_LAUNCH_APPROVED=true`, treat it only as owner authorisation to execute the launch. It does not replace independent evidence required by the v2 design authority.

## Authorities to read before action

Read completely, in this order:

1. every applicable `AGENTS.md`, `AGENTS.override.md`, and root repository instruction file;
2. `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md`;
3. `docs/phase-0-environment-decisions.md`;
4. `docs/deployment-runbook.md`;
5. `docs/rollback-runbook.md`;
6. `docs/open-day-checklist.md`;
7. `docs/verification-report.md`;
8. `docs/verification/2026-07-16-final-120-corpus-report.md` and its machine-readable companion;
9. the current `README.md`, `CHANGELOG.md`, package scripts, Dockerfiles, Compose files, Cloudflare renderer, preflight/deploy/verify/rollback scripts, QR scripts, and security tests;
10. PR #5 and any newer PR or commit that affects visible back navigation or cinematic Begin behaviour.

The design authority requires a static, offline-capable React application delivered through:

```text
Cloudflare edge
  -> dedicated Cloudflare Tunnel
  -> cloudflared container
  -> private divan_origin network
  -> unprivileged static divan-web container on port 8080
```

No application port may be published on the host.

## Secret handling: `.env` is usable, never publishable

The repository owner has placed the credentials and deployment values needed for this task in a local `.env` file.

Treat `.env` as a secret input, not documentation.

Before using it:

1. Confirm `.env` and `.env.*` are ignored, except an optional safe `.env.example`.
2. Run history and index checks proving `.env` is not tracked and was not previously committed.
3. Inspect only the variable names first. Do not print values.
4. Validate that the file contains only ordinary environment assignments before sourcing it. Never execute arbitrary shell embedded in `.env`.
5. Disable shell tracing. Never use `set -x` around secrets.
6. Never `cat`, echo, log, screenshot, paste, commit, upload, or place secret values in command arguments visible to process listings when a safer stdin/file/environment mechanism exists.
7. Redact tokens, account IDs, tunnel IDs, host addresses, usernames, private key material, credential paths, and registry credentials from public reports.
8. Use temporary credential files with mode `0600` or stricter where required and securely remove temporary copies after use.
9. Never use password SSH, `sshpass`, or root password login. Use the supplied SSH key or authorised agent.
10. If a credential has ever entered Git history, logs, a PR, terminal transcript, or public output, stop use of that credential, rotate it through the provider, update `.env`, and record only that rotation occurred.

Allowed public output about `.env` is limited to a list of required variable names and whether each was present and structurally valid.

Expected categories include, but are not limited to:

- SSH destination and key reference;
- DigitalOcean API access where available;
- Cloudflare API access, account, zone, and tunnel inputs;
- registry/GHCR authentication;
- public hostname and optional stable short URL;
- branding and approval references;
- production release values;
- deployment root and operator identity.

Adapt to the actual safe variable names found. Do not rename secrets merely to fit this prompt.

## Repository preflight and final-code reconciliation

From the Git root, first record:

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git remote -v
git log --oneline -30
git tag --sort=-creatordate | head -30
find .. \( -name AGENTS.md -o -name AGENTS.override.md \) -print 2>/dev/null | sort
```

Then:

1. Fetch normally. Never force-push, reset destructively, clean the tree, rewrite history, or use `git add -A`.
2. Preserve unrelated untracked and protected local files.
3. Work on a dedicated branch or isolated worktree based on the latest `origin/main`.
4. Inspect PR #5. If it is not merged, update its changes onto current `main`, resolve conflicts without losing the final 120-record corpus, run the full verification specified below, and integrate it through a reviewable PR.
5. Confirm the final app visibly supports returning from both intention and result screens to the Hafez/Rumi selection cards.
6. Confirm Begin automatically traverses the scroll-scrub cinematic on the normal full-motion route instead of dispatching directly past it.
7. Confirm reduced motion, Save-Data, offline, decode failure, timeout, manual scrolling, and Skip entrance remain non-blocking.
8. Derive the production corpus from repository evidence and prove exactly 60 unique Hafez plus 60 unique, non-overlapping Rumi records.
9. Locate all operational references to the historical `24`, `16`, and `40` targets. Classify every hit. Update only stale release/deployment minimums and examples to `60`, `60`, and `120`; retain historical audit statements where they are explicitly historical.
10. Confirm no deployment work modifies poetry text, translations, canonical identities, mappings, source hashes, permissions, or authority evidence unless a real defect is discovered and independently proven.

Do not deploy a branch-only or dirty worktree state. Deployment must come from the final reviewed and tagged `main` commit.

## Full release audit before infrastructure mutation

Discover the actual package manager and available scripts. Use repository scripts rather than inventing replacements.

At minimum, run fresh equivalents of:

```bash
pnpm install --frozen-lockfile
pnpm poetry:verify-sources
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:content
pnpm test:a11y
pnpm test:e2e
pnpm test:security
pnpm test:performance
pnpm build:production
pnpm verify:dist
pnpm verify:privacy
pnpm verify:container
pnpm verify:headers
pnpm verify:origin-isolation
pnpm verify:rollback
```

Use explicit production inputs:

```text
DIVAN_MIN_HAFEZ_COUNT=60
DIVAN_MIN_RUMI_COUNT=60
```

Set `DIVAN_PUBLIC_ORIGIN`, `DIVAN_RELEASE_ID`, `DIVAN_BRANDING_MODE`, approval values, and `SOURCE_DATE_EPOCH` from validated release facts. Never use placeholder domains or identifiers in the production build.

If the repository's historical `pnpm audit --prod` endpoint still returns HTTP 410, record the exact environmental failure and supplement it with a current dependency vulnerability scanner rather than treating the 410 as a clean audit.

Before release, prove:

- exact 60/60/120 counts;
- zero fixture markers in production;
- zero private authoring files, source books, mapping reports, credentials, Git data, or source maps in `dist` or the final image;
- exact English-before-Persian and live `lang="fa" dir="rtl"` structure;
- no raw HTML rendering;
- no analytics, trackers, cookies, runtime poetry API, visitor identifier, public write endpoint, or draw request;
- no third-party runtime script, font, image, audio, or media request;
- correct service-worker release staging and failed-update retention;
- complete Hafez and Rumi flows on mobile and desktop;
- visible back-to-selection behaviour from intention and result;
- automatic cinematic traversal from Begin;
- keyboard, focus, browser Back/Forward, refresh, reduced motion, offline, share, and failure paths;
- controlled performance budgets against the final 120-record build.

Do not weaken or delete a test to obtain green. Fix genuine defects and add regression coverage first.

## Final branch, PR, merge, tag, and release identity

1. Put any necessary release fixes on a dedicated release branch.
2. Keep commits focused and reviewable.
3. Update the root instruction/change log and public changelog exactly as repository rules require.
4. Create or update a PR describing code, operational, security, and documentation changes.
5. Merge only after the complete predeployment suite passes.
6. Update local `main` to the resulting remote `main` without rewriting history.
7. Confirm the tree is clean and the deployed commit is reachable from `origin/main`.
8. Create an annotated release tag using repository conventions. Do not overwrite an existing tag.
9. Derive a unique production release ID from the approved release name/date and final source SHA.
10. Record the source SHA and tag before building the image.

## Environment and account discovery

Using the safe `.env` inputs and provider CLIs/APIs where authorised, inspect and record privately:

### DigitalOcean and Droplet

- authorised Droplet identity and region;
- supported Ubuntu LTS and patch status;
- architecture, CPU, memory, disk, and available capacity;
- Docker Engine, Buildx, and Compose versions;
- current containers, networks, volumes, routes, and listening ports;
- non-root sudo deployment identity;
- SSH-key-only access, root login disabled, password login disabled;
- UFW/host-firewall policy;
- DigitalOcean Cloud Firewall attachment and rules;
- monitoring, disk/memory alerts, and backup status;
- baseline health of every unrelated service before mutation.

Do not expose these sensitive facts in Git. Store detailed evidence in the approved private evidence location.

Never stop, restart, reconfigure, join, inspect private data from, or reuse credentials belonging to the ballot, EOI, or any unrelated service. DIVAN must use a separate deployment directory, Compose project, networks, credential files, state, and route.

### Cloudflare

- authenticated account and controlled zone;
- final public hostname;
- stable short URL, when supplied or safely provisionable;
- dedicated DIVAN tunnel ownership;
- DNS/tunnel route ownership;
- API token scopes;
- Cloudflare Access policy state;
- cache rules, TLS mode, HSTS state, security settings, and provider logging/retention visibility.

Prefer an explicitly supplied `DIVAN_PUBLIC_HOSTNAME`. If none is supplied but the owner controls one suitable zone, a conservative `divan.<controlled-zone>` may be selected only after confirming it is unused, does not collide with another service, and uses no University-owned namespace or mark. Record the choice.

Do not delete or repurpose an existing DNS record, tunnel, route, Access application, redirect, Worker, or certificate belonging to another service.

## Build, SBOM, scanning, and immutable registry publication

Build off-host from the exact tagged source and lockfile using `ops/Dockerfile` and the repository's explicit production build arguments.

Requirements:

1. No server-side source build on the Droplet.
2. Production profile and `productionEligible: true` must be embedded and verified.
3. Base images remain digest-pinned.
4. Generate an SBOM for source dependencies and the final image.
5. Run dependency, secret, configuration, and final-image vulnerability scans with recorded tool versions.
6. No unresolved Critical finding is allowed.
7. No unmitigated exploitable High finding is allowed. A non-exploitable or unreachable High may proceed only with an evidence-backed exception containing owner, reason, compensating control, and expiry.
8. Scan the final filesystem and image history for `.env`, keys, tokens, credential names, source books, private content, Git metadata, maps, and local paths.
9. Push only the verified production image to the approved registry.
10. Capture the registry-returned immutable digest.
11. Deploy only `registry/name@sha256:<digest>`, never a mutable tag.

## Droplet hardening and isolated release layout

Use the existing repository runbooks and scripts. Do not replace them with an ad hoc reverse proxy or public port mapping.

Create the dedicated DIVAN deployment layout under the approved root, following the design's ownership and permission boundaries. The web container and cloudflared container must remain separate.

Enforce:

- dedicated Compose project name `divan` unless a verified collision requires a safe namespaced variant;
- dedicated `divan_origin` internal network;
- dedicated `divan_egress` bridge only for cloudflared;
- `divan-web` attached only to `divan_origin`;
- cloudflared attached to both networks;
- zero host-published application ports;
- web user `10001:10001` or the reviewed repository contract;
- cloudflared user `65532:65532` or the reviewed pinned-image contract;
- read-only roots;
- all capabilities dropped;
- `no-new-privileges`;
- bounded tmpfs, memory, CPU, and PID limits;
- no Docker socket;
- no host filesystem mounts in the web container;
- only the exact two read-only tunnel configuration/credential mounts in cloudflared;
- tunnel files canonical, non-symlinked, mode `0400`, and owned for the fixed cloudflared identity;
- access logs disabled and error logging minimised;
- no application response from the Droplet's direct IP.

Do not open ports 80, 443, or 8080 on the Droplet. Restrict SSH according to the approved operator source where possible. Account for Docker firewall behaviour rather than trusting UFW output alone.

Apply security updates only with a rollback-aware procedure that does not unexpectedly interrupt unrelated services. Record any reboot requirement rather than rebooting blindly.

## Cloudflare Tunnel, DNS, TLS, cache, and edge security

Provision or validate a dedicated named DIVAN tunnel. Use the existing tunnel config renderer and preserve its `/healthz` denial and final 404 catch-all.

Configure the final route so that:

- the approved hostname reaches only the DIVAN tunnel;
- public `/healthz` returns exact 404;
- no wildcard exposes another origin;
- TLS is strict and valid;
- HTML, document routes, `release.json`, and `service-worker.js` are not edge-cached as immutable;
- hashed assets and content-addressed corpus files retain immutable caching;
- the manifest uses the reviewed short cache lifetime;
- “Cache Everything” is not applied to HTML or the service worker;
- security headers exactly satisfy repository tests and the design authority;
- CSP has no blanket `unsafe-inline`, third-party source, or analytics exception;
- HSTS begins conservatively unless the controlled domain is already reviewed for a stronger policy;
- no Cloudflare analytics, beacon, Zaraz, injected script, tracking parameter, or visitor profiling is enabled for DIVAN;
- provider logging fields, access, and retention are inspected and documented honestly.

If a stable short URL is supplied, verify ownership and configure a temporary 302 or 307 redirect with `Cache-Control: no-store`, no UTM values, and no tracking identifier. If no separately approved short URL can be safely created, do not invent one. Generate the QR pack for the final approved stable destination and record the remaining short-URL gate honestly.

## Safe deployment sequence

Use the repository scripts in the intended order.

1. Render and inspect the tunnel config without exposing identity values.
2. Run deployment argument validation and dry-run preflight.
3. Run real non-mutating preflight.
4. Run deploy dry-run.
5. Confirm unrelated-service baseline is still healthy.
6. Activate the immutable candidate through `ops/scripts/deploy.sh` or its current reviewed successor.
7. Allow the script's fail-closed handler and automatic restoration logic to operate. Do not bypass it with raw `docker compose up` unless repairing the script itself under test.
8. Run `ops/scripts/verify.sh` again as an independent operator step.
9. Repeat neighbouring-service health checks.
10. Preserve the previous verified image and state.

If the candidate or restoration cannot be verified, leave DIVAN stopped or protected. Never leave an unknown release reachable.

## First-deployment rollback rehearsal

Rollback must be demonstrated before public launch.

If a previous verified DIVAN release exists, use it as the rollback target.

If this is the first DIVAN deployment, create a safe two-candidate rehearsal from the same reviewed source lineage:

1. build and verify a production-eligible baseline candidate with its own release ID;
2. deploy and verify the baseline;
3. deploy the final candidate;
4. execute the documented rollback to the baseline without rebuilding;
5. verify the baseline publicly and offline;
6. redeploy the final immutable candidate;
7. fully reverify the final candidate;
8. retain both immutable digests through the launch rollback window.

Do not fake rollback by restarting the same container or changing only a mutable tag.

## Independent live verification

Run public checks from the operator machine, not only from inside the Droplet.

Prove and record:

- public HTTPS root and every document route;
- exact final release ID, 60/60/120 counts, content hash, asset-manifest hash, and source/image identity;
- no public `/healthz`;
- no public application response from direct Droplet IP over HTTP, HTTPS, or port 8080;
- an external port scan shows no DIVAN application port;
- Cloudflare Tunnel is the only application path;
- exact CSP, `nosniff`, referrer, COOP, CORP, permissions, and cache headers;
- no `Server` disclosure prohibited by the contract;
- no cookies, analytics, third-party requests, visitor IDs, poem requests, or write endpoints;
- web access logs are disabled;
- the static web container has no egress network;
- tunnel credentials are absent from the web container;
- unrelated services are unchanged and healthy;
- first load, warm load, offline-after-first-load, failed-update retention, and service-worker activation;
- Hafez and Rumi complete flows;
- Begin cinematic traversal;
- visible return to poet selection;
- browser Back/Forward and refresh;
- reduced motion and failed-video fallback;
- keyboard, focus, 320 CSS-pixel reflow, 200% zoom, and available automated accessibility checks;
- final mobile performance and cache-size budgets.

Use browser network capture to verify no forbidden external requests.

Manual VoiceOver iOS, TalkBack Android, real-device camera, print distance, glare, and Persian pronunciation evidence may be recorded only if those devices and tests were actually available and performed. Otherwise list them as blockers for ungated public launch.

## QR and stall pack

After the stable destination is known:

1. generate the vector QR SVG and print-ready PDF using repository scripts;
2. use a plain light background, dark modules, four-module quiet zone, and the approved correction level;
3. do not overlay a logo;
4. include the readable short URL or final stable URL beneath the code;
5. generate A3 poster, A5 table stand, take-home card, monochrome backup, and staff troubleshooting assets where repository tooling supports them;
6. run deterministic QR decode, checksum, URL, redirect, cache-header, quiet-zone, and size verification;
7. record that digital QR verification is not a physical scan matrix;
8. pre-cache the final release on an authorised staff tablet only when the device is actually available;
9. never claim physical/device/glare/campus-Wi-Fi testing unless performed.

## Evidence and documentation

Detailed host, account, network, credential, provider, and scan evidence belongs in the restricted deployment evidence location, not Git.

Commit only sanitised public evidence, including:

- `docs/verification/<date>-production-deployment-and-launch-report.md`;
- a machine-readable sanitised report where existing conventions require it;
- updated deployment and rollback runbooks when real behaviour differs;
- updated launch-readiness matrix/checklist;
- updated `README.md` release status;
- root instruction/change log and `CHANGELOG.md` entries required by repository rules;
- QR asset checksums and non-sensitive metadata;
- exact public commands with secrets represented only as variable names.

The report must distinguish:

- repository tests;
- image/build evidence;
- private host evidence;
- Cloudflare evidence;
- live public checks;
- automated accessibility evidence;
- actually completed manual evidence;
- remaining external gates.

Do not commit Droplet IP, SSH identity, tunnel ID, account ID, zone ID, credential path, token scope details that aid abuse, private logs, full scans containing sensitive topology, or provider screenshots with identifiers.

## Public versus protected publication decision

At the end, make one of these exact decisions:

### `PUBLIC PRODUCTION PASS`

Use only when every implementation-complete criterion and public-launch gate in the v2 design authority has current evidence, including required manual accessibility and physical QR/device validation.

The site may remain publicly reachable through the final Cloudflare hostname.

### `PROTECTED PRODUCTION PREVIEW PASS`

Use when the complete technical production deployment, security verification, and rollback rehearsal pass, but one or more governance, provider-logging, manual accessibility, short-URL, or physical QR gates remain.

Keep Cloudflare Access or equivalent protection enabled. Return the protected URL and exact remaining gates.

### `FAIL CLOSED`

Use when the source, image, Droplet, tunnel, origin isolation, security, privacy, release identity, neighbouring-service isolation, or rollback cannot be verified.

Stop or protect DIVAN, preserve the last verified state, and report the exact failure. Do not return an unsafe public link.

## Final response contract

Finish with a concise report containing exactly:

```text
Final verdict: PUBLIC PRODUCTION PASS | PROTECTED PRODUCTION PREVIEW PASS | FAIL CLOSED
Public/protected URL:
Stable short URL:
Cloudflare Tunnel path: PASS/FAIL
Direct-origin isolation: PASS/FAIL
Droplet firewall: PASS/FAIL
Unrelated-service isolation: PASS/FAIL
Final source branch:
Final source commit SHA:
Annotated release tag:
Production release ID:
Hafez count: 60/60 or FAIL
Rumi count: 60/60 or FAIL
Total count: 120/120 or FAIL
Production image digest:
SBOM: PASS/FAIL
Dependency scan: PASS/FAIL
Image scan: PASS/FAIL
Critical findings open: 0 or count
Unmitigated exploitable High findings open: 0 or count
Format/lint/typecheck: PASS/FAIL
Unit/content/security/performance tests: PASS/FAIL with totals
Accessibility automation: PASS/FAIL with evidence
Manual accessibility evidence: PASS/FAIL/NOT AVAILABLE
End-to-end tests: PASS/FAIL with totals
Production build: PASS/FAIL
Distribution/leak verification: PASS/FAIL
Privacy verification: PASS/FAIL
Security/header verification: PASS/FAIL
Offline/update-coherence verification: PASS/FAIL
Back-to-poet-selection: PASS/FAIL
Automatic Begin cinematic: PASS/FAIL
Rollback rehearsal: PASS/FAIL
Digital QR pack: PASS/FAIL
Physical QR/device matrix: PASS/FAIL/NOT AVAILABLE
Provider logging review: PASS/FAIL
Final release deployed: YES/NO
Final release publicly ungated: YES/NO
Previous verified image preserved: YES/NO
Repository pushed: YES/NO
Remaining blockers:
```

Include links to the GitHub PR, release/tag, sanitised verification report, and final URL. Never include secrets or sensitive infrastructure identifiers.

Do not call the task complete merely because the page loads. Completion is the final verdict plus evidence for every line above.

# END CODEX GOAL
