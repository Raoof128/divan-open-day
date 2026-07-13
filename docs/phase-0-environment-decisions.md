# Phase 0 environment decisions

Status: **launch blocked**. This document contains a sanitized discovery snapshot and repository-level image decisions only. It is not deployment evidence.

## Sanitized host snapshot

Snapshot date: **2026-07-13 (Australia/Sydney)**.

| Area | Sanitized observation | Decision or gate |
| --- | --- | --- |
| Operating system | Ubuntu 24.04 LTS, x86_64 | Confirm active security support and unattended-update evidence before launch. |
| Capacity | 2 vCPU, approximately 2 GiB memory, approximately 36 GiB disk free | Compose limits are deliberately small; prove them with runtime inspection and load evidence. |
| Container tooling | Docker Engine 29.3.1 and Docker Compose 5.1.1 | Supported for the checked-in Compose model; capture fresh production-host output at deployment. |
| Tunnel tooling | cloudflared 2026.3.0 is present on the host | The repository container uses a separately resolved immutable image. Do not reuse an existing service's tunnel identity. |
| Existing services | nginx, UFW, and other services are present | DIVAN must use a separate directory, project, networks, credentials, route, and evidence; compare neighbouring-service baselines before and after any deployment. |
| Public identity | No DIVAN-specific hostname or tunnel has been selected | Public preview and launch remain blocked. No identity is implied by repository examples. |

The snapshot deliberately omits addresses, user names, service identities, account IDs, tunnel IDs, DNS names, and credentials.

## Immutable upstream images

Resolved from official registry manifests on **2026-07-13**. The Dockerfiles and Compose file pin the multi-platform index digest so the same reviewed reference selects the correct platform manifest on a local ARM development machine and the intended Linux x86_64 host. The x86_64 child digest is recorded as independent evidence.

| Purpose | Pinned reference | Linux x86_64 child manifest |
| --- | --- | --- |
| BuildKit frontend | `docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e` | `sha256:b5f3b260a9678e1d83d2fce86eeddf79420b79147eaba2a25986f47133d73720` |
| Build stage | `node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca` | `sha256:4437d7c27c4b9306c577caa17577dc7b367fc320fb7469dbe2c994e23b11d11c` |
| Static runtime | `caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d` | `sha256:d8c17a862962def15cde69863a3a463f25a2664942eafd7bdbf050e9c3116b83` |
| Tunnel | `cloudflare/cloudflared:2026.7.0@sha256:5e49861633763e8933475477c20bae6039ed47f32c1d267a34babc347f28f0df` | `sha256:8c70a8c2d373e93caac1ee79fcc615908a49ccf3f3975775d1e10d24e41327af` |

Verification commands:

```bash
docker buildx imagetools inspect docker/dockerfile:1.7
docker buildx imagetools inspect docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
docker buildx imagetools inspect node:22.16.0-alpine3.21
docker buildx imagetools inspect node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca
docker buildx imagetools inspect caddy:2.10.2-alpine
docker buildx imagetools inspect caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d
docker buildx imagetools inspect cloudflare/cloudflared:2026.7.0
docker buildx imagetools inspect cloudflare/cloudflared:2026.7.0@sha256:5e49861633763e8933475477c20bae6039ed47f32c1d267a34babc347f28f0df
```

The official cloudflared x86_64 image configuration declares user `65532:65532`. Root must provision its fixed config and credential bind mounts as UID/GID `65532:65532`, mode `0400`; deployment preflight rejects operator-owned or more permissive files, and runtime verification requires both exact read-only mounts on a running container with that identity. The Caddy image does not declare a non-root user, so the final DIVAN image explicitly switches to the reviewed dedicated UID/GID `10001:10001`, serves on unprivileged port 8080, and receives only verified `dist/`, the Caddy configuration, and the release-health script.

Tags above provide human-readable provenance only. Digests select the bytes. Re-resolve, review release notes and vulnerability results, and update this table in the same change whenever an image is upgraded.

## Unresolved launch decisions

The following are explicit blockers, not implementation defaults:

- approved public hostname and stable Society-controlled short URL;
- dedicated DIVAN tunnel ownership and credential provisioning;
- Cloudflare and DigitalOcean request/network logging fields, access, and retention;
- Cloud Firewall and host-firewall evidence, including no application port exposure;
- dedicated deployment identity, directory ownership, registry, and immutable DIVAN image digest;
- production corpus, rights, cultural review, governance, accessibility, security, rollback, and physical-QR evidence;
- fresh neighbouring-service baselines and a reviewed proof that DIVAN shares no code, volume, database network, secret, or route with existing services.

No repository script resolves these decisions or mutates the host.
