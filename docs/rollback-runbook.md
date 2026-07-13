# DIVAN rollback runbook

Rollback uses the previously verified immutable image and performs no build. Rehearse this procedure before public launch; a written procedure without a timed rehearsal is not rollback evidence.

## Preconditions

- Stop if the canonical mode-`0700` state directory, mode-`0600` current/previous digest, or the canonical mode-`0400` tunnel files are missing, symlinked anywhere in their paths, unreadable, or have unexpected ownership. State belongs to the invoking deployment identity; both tunnel files belong to UID/GID `65532:65532`.
- Confirm `previous-image.txt` identifies the last independently verified production release, not a fixture image.
- Preserve incident evidence without copying request, IP, visitor, session, selected-poem, or share-card data.
- If content approval or credential compromise is suspected, disable the public route first under the separate incident procedure; do not reactivate an untrusted prior release.

## Dry run

Using the same owner-only variables from the deployment runbook:

```bash
ops/scripts/rollback.sh \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN" \
  --dry-run
```

Dry-run validates both state digests and every path but does not pull, rebuild, start, stop, or rewrite state.

## Activate the previous release

```bash
ops/scripts/rollback.sh \
  --state-dir "$DIVAN_STATE" \
  --config "$DIVAN_CONFIG" \
  --credentials "$DIVAN_CREDENTIALS" \
  --public-origin "$DIVAN_ORIGIN"
```

The script pulls the previous digest, rejects it unless its immutable repository digest and production image label agree, starts it with Compose `--no-build`, waits at most 90 seconds for health, and runs the same bounded private/public verifier. The verifier also rejects fixture release flags or running bytes that do not match the approved digest. Only then are current and previous state files swapped. If verification fails or times out, the script restores and re-verifies the current production image and does not record the rollback target as current. If restoration also fails verification, it stops the DIVAN tunnel and origin so an unverified release is not left reachable.

## Required post-rollback checks

1. Confirm the web container is healthy and its internal release ID/checksum/count relationship matches the previous evidence pack.
2. Confirm public `/healthz` is 404 and no host port is published.
3. Confirm the stable public route, exact headers, release pointer, service worker, and immutable assets belong to one coherent previous release.
4. Complete one Hafez flow and one Rumi flow, then repeat warm/offline with no network.
5. Compare nginx, UFW, Docker networks, existing containers, and neighbouring-service health with the pre-deployment baseline.
6. Record timestamp, operator, reason, previous/current digests, command exit codes, and non-sensitive evidence checksums.
7. Do not purge unrelated edge caches. Purge only reviewed DIVAN pointers if needed; content-addressed assets stay immutable.
8. Keep the failed candidate digest quarantined until the incident is understood. Do not rebuild on the server.

## Recovery boundary

Git tag, frozen lockfile, approved content and permissions, registry digest, SBOM/scan record, and verification report are the recovery source of truth. Host backups help recover infrastructure but do not prove a release is authentic or approved. If the administrator SSH key or encrypted-backup recovery key material is unavailable, stop and use the approved console/account-recovery procedure; never weaken SSH authentication or copy credentials into Git or chat.
