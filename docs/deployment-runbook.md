# DIVAN deployment runbook

Status: **operator procedure; not evidence that deployment occurred**. Run only after every content, governance, cultural, accessibility, security, domain, tunnel, provider-log, rollback, and physical-QR gate has an approved record.

## Safety and ownership boundaries

- Use a dedicated non-root sudo deployment identity with SSH key authentication. Password SSH and root SSH login must be disabled and verified before launch.
- Treat Docker access as root-equivalent. Only the dedicated operator may own the deployment directory and evidence.
- Keep DIVAN in its own deployment directory and Compose project. Never join an existing service's network, mount its volume, read its environment, reuse its route, or copy its credentials.
- Provision both tunnel files outside Git with mode `0400`, owned by the cloudflared container identity, UID/GID `65532:65532`. This is deliberately different from deployment-directory ownership: the deployment identity owns state/evidence, while root provisions the two read-only bind-mounted files for the fixed container UID. The web container never receives either mount.
- Back up the administrator SSH private key and the separate encrypted-backup recovery key material to an approved password manager before launch. The public repository intentionally omits local credential paths. Losing both the SSH key and its approved backup locks out remote administration; losing encrypted-backup key material makes those backups unrecoverable. A console password is emergency console access, not an SSH fallback.
- Confirm automated host backups, monitoring, disk/memory alerts, MFA, security updates, and recovery ownership. A Droplet backup does not replace Git tag, lockfile, content approvals, registry digest, and verification evidence.
- Never print or paste credential contents. Record only non-sensitive check results, release IDs, commit/tag, and immutable digests.

## 1. Build and inspect off-host

Use a clean tagged checkout and exact lockfile. The default image build is intentionally production-only and fails when an approved production corpus is absent:

```bash
docker build -f ops/Dockerfile -t divan-open-day:production .
```

The no-argument command above must continue to fail closed whenever approved
content or any required public release input is absent. Once the corpus and all
independent approvals exist, set the non-secret, evidence-backed build inputs:

```bash
DIVAN_PUBLIC_ORIGIN='https://approved-hostname.example'
DIVAN_RELEASE_ID='approved-release-id'
DIVAN_MIN_HAFEZ_COUNT='24'
DIVAN_MIN_RUMI_COUNT='16'
DIVAN_BRANDING_MODE='society_only'
DIVAN_UNIVERSITY_APPROVAL_ID=''
SOURCE_DATE_EPOCH='1783814400'
```

These values become public build provenance. Never pass credentials, tokens,
host addresses, private permission records, or tunnel identity as build args.
Build the approved production image with every compiler input explicit:

```bash
docker build \
  --build-arg DIVAN_PUBLIC_ORIGIN="$DIVAN_PUBLIC_ORIGIN" \
  --build-arg DIVAN_RELEASE_ID="$DIVAN_RELEASE_ID" \
  --build-arg DIVAN_MIN_HAFEZ_COUNT="$DIVAN_MIN_HAFEZ_COUNT" \
  --build-arg DIVAN_MIN_RUMI_COUNT="$DIVAN_MIN_RUMI_COUNT" \
  --build-arg DIVAN_BRANDING_MODE="$DIVAN_BRANDING_MODE" \
  --build-arg DIVAN_UNIVERSITY_APPROVAL_ID="$DIVAN_UNIVERSITY_APPROVAL_ID" \
  --build-arg SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH" \
  -f ops/Dockerfile \
  -t divan-open-day:production .
```

The example timestamp and identities above are syntax-only, not approval or
launch evidence. Use `university_approved` only with a reviewed non-secret
approval reference; otherwise retain `society_only` and an empty approval ID.

The only local fixture build is an explicit non-production action. Never push or deploy it:

```bash
docker build --build-arg DIVAN_BUILD_MODE=fixture -f ops/Dockerfile -t divan-open-day:fixture .
```

Before registry publication, run all repository checks, generate an SBOM, scan dependencies and the final image, inspect the image labels, and prove the final filesystem contains no source, authoring records, source maps, Git data, credentials, or private evidence. Push only the approved production image and record the registry-returned digest.

## 2. Provision release files

Create the dedicated deployment layout with owner-only permissions. The exact host root is an operational decision; examples below use a neutral shell variable rather than a live path:

```bash
install -d -m 0700 "$DIVAN_DEPLOY_ROOT/runtime" "$DIVAN_DEPLOY_ROOT/state" "$DIVAN_DEPLOY_ROOT/evidence"
sudo install -o 65532 -g 65532 -m 0400 /secure/operator-source/tunnel.json "$DIVAN_DEPLOY_ROOT/runtime/tunnel.json"
```

Render the non-secret configuration from approved environment-provided identity values:

```bash
sudo ops/scripts/render-tunnel-config.sh \
  --hostname "$DIVAN_PUBLIC_HOSTNAME" \
  --tunnel-id "$DIVAN_TUNNEL_ID" \
  --output "$DIVAN_DEPLOY_ROOT/runtime/config.yml"
```

The renderer accepts only a lowercase DNS name and canonical UUID, writes mode `0400`, and when run as root assigns UID/GID `65532:65532`. It uses the fixed in-container credential path, denies public `/healthz` before the origin route, and retains a final 404 catch-all. A non-root local render is allowed only for inspection and is explicitly reported as not deployment-ready; real preflight rejects either file unless its canonical path, ownership, mode and readability contract are exact. Review the rendered file without recording its identity in public evidence.

The state directory must be canonical (no symlink in any path component), mode `0700`, and owned by the deployment identity invoking the scripts. Each release-state file is mode `0600`, non-symlinked, and owned by that same identity.

## 3. Preflight without mutation

Set an immutable production image reference returned by the approved registry:

```bash
DIVAN_IMAGE='approved-registry.example/divan@sha256:<64-lowercase-hex>'
DIVAN_CONFIG="$DIVAN_DEPLOY_ROOT/runtime/config.yml"
DIVAN_CREDENTIALS="$DIVAN_DEPLOY_ROOT/runtime/tunnel.json"
DIVAN_STATE="$DIVAN_DEPLOY_ROOT/state"
DIVAN_ORIGIN='https://approved-hostname.example'
```

The values above are syntax examples, not usable identities. First exercise argument validation without Docker changes:

```bash
ops/scripts/preflight.sh \
  --image "$DIVAN_IMAGE" \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN" \
  --dry-run
```

Then run the real non-mutating preflight:

```bash
ops/scripts/preflight.sh \
  --image "$DIVAN_IMAGE" \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
```

Separately record host version, capacity, firewall, Docker network, direct-IP, tunnel ownership, and neighbouring-service baselines. Stop if any baseline is unhealthy or DIVAN would share an existing network, volume, secret, or route.

## 4. Activate an immutable candidate

Preview the exact action:

```bash
ops/scripts/deploy.sh \
  --image "$DIVAN_IMAGE" \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN" \
  --dry-run
```

Activate only after approval:

```bash
ops/scripts/deploy.sh \
  --image "$DIVAN_IMAGE" \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
```

The script rejects mutable references and unsafe paths, runs no server-side build, records the prior digest, and pulls by digest. Before any activation it pulls and validates the saved restore image, if present, then validates the candidate; an absent, fixture-labelled, or repository-digest-mismatched restore prerequisite prevents activation entirely. Immediately before the first `compose up`, it arms an exit/signal fail-closed handler. The handler remains armed across candidate verification and restoration, and stops both DIVAN containers on every unverified exit. It is disarmed only after either the candidate is fully accepted and state is recorded or the previous release is fully restored and re-verified.

After activation the verifier requires the configured reference, running image ID, repository digest, `buildProfile: production`, and `productionEligible: true` to agree. It starts with `--no-build`, waits at most 90 seconds for health, uses bounded HTTPS verification, and restores then re-verifies the previous production digest if candidate verification fails or times out. If there is no verified prior release, or restoration itself cannot be verified, the armed handler stops the DIVAN tunnel and origin instead of leaving an unverified release reachable.

## 5. Verification and evidence

Run the verifier again as a separate operator step:

```bash
ops/scripts/verify.sh \
  --image "$DIVAN_IMAGE" \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
```

Automated checks cover:

- Compose rendering, exact immutable running image bytes, production labels/flags, two running containers, and private release health;
- verified content and asset-manifest checksum/path/count relationships inside the web container and again from public bytes;
- exact non-root users, read-only roots, all capabilities dropped, `no-new-privileges`, restart/resource/PID/tmpfs limits, exact network membership, zero web mounts, the two tunnel-only canonical read-only bind sources, and zero host-published ports for both containers;
- bridge driver, internal/egress setting, dedicated role/ownership labels, and exact member set for each DIVAN network, rejecting any unrelated container;
- tunnel files are canonical, mode `0400`, host-owned by UID/GID `65532:65532`, mounted read-only, and consumed by a running container using that same identity;
- bounded HTTPS-only requests, with public `/healthz` returning exact 404;
- exact CSP, `nosniff`, referrer, COOP, CORP, permissions, and cache headers; a `Server` value must not expose Caddy;
- byte-for-byte public `release.json` identity and SHA agreement with `/srv/release.json` extracted from the exact running image;
- `no-cache` documents/release/service worker, one-hour manifest cache, immutable existing content-addressed corpus/manifest files, and `no-store` for missing/unhashed static paths.

Operator evidence must additionally cover:

- external port scan and direct-IP requests showing no application response;
- CSP has no inline/third-party exceptions and no third-party request occurs;
- no cookies, analytics, visitor identifiers, request-body logs, or static access logs;
- Cloudflare and DigitalOcean logging fields/access/retention decision;
- tmpfs options and platform-specific host/runtime evidence not deterministically covered by the repository verifier;
- approved SBOM and vulnerability scans;
- unchanged nginx, UFW, Docker networks, existing containers, and neighbouring-service health baselines;
- public experience, warm/offline behavior, failed-update retention, accessibility matrix, and the release ID expected by the approved evidence pack.

Do not claim any listed operator gate from repository tests. Preserve the previous immutable image and evidence until the event rollback window closes.
