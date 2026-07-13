# Phase 0 environment decisions

Status: **launch blocked**. This public document records repository-level image
decisions and the evidence required before deployment. It is not deployment
evidence.

## Deployment evidence boundary

No machine survey is published in this repository. An authorised operator must
capture the following as private deployment evidence for the approved target:

- supported operating system, architecture, security-update status, and
  capacity for the reviewed resource limits;
- exact container and tunnel tooling versions;
- inbound and outbound firewall state, direct-origin exposure, and the
  dedicated network, route, volume, and credential boundaries;
- pre-deployment and post-deployment health for unrelated services;
- approved public hostname, tunnel ownership, registry, backups, monitoring,
  operator access, and provider-log retention.

Keep that evidence outside Git with restricted access. Do not publish machine
capacity, installed versions, addresses, user names, service identities,
account IDs, tunnel IDs, DNS names, credential paths, or neighbouring-service
inventory.

## Immutable upstream images

Resolved from official registry manifests on **2026-07-13**. The Dockerfiles
and Compose file pin each multi-platform index digest. The Linux x86_64 child
digest supplies a public supply-chain reference. Operators record the approved
deployment architecture in private evidence.

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
- pre-deployment and post-deployment isolation evidence proving that DIVAN
  shares no code, volume, database network, secret, or route with an unrelated
  service.

No repository script resolves these decisions or mutates the host.
