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

| Purpose           | Pinned reference                                                                                                             | Linux x86_64 child manifest                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| BuildKit frontend | `docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e`                              | `sha256:b5f3b260a9678e1d83d2fce86eeddf79420b79147eaba2a25986f47133d73720` |
| Build stage       | `node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca`                            | `sha256:4437d7c27c4b9306c577caa17577dc7b367fc320fb7469dbe2c994e23b11d11c` |
| Caddy toolchain   | `golang:1.26.5-alpine3.23@sha256:622e56dbc11a8cfe87cafa2331e9a201877271cbff918af53d3be315f3da88cc`                           | `sha256:73f9732658b30852522ee5ebe698daa27e1829add9a70ff4f4a828409f8d0a99` |
| Static runtime    | final empty `scratch` runtime; no registry parent                                                                            | Not applicable                                                            |
| Tunnel source     | `cloudflare/cloudflared:2026.7.2@sha256:4f6655284ab3d252b7f28fedb19fe6c8fc82ee5b1295c20ac74d475e5398a52d`                    | `sha256:18626b1baac4450214535cd5bc40ef44c0635244d585ebf707749c22b6f3408f` |
| Tunnel runtime    | `ghcr.io/raoof128/divan-open-day-cloudflared:v1.0.1@sha256:80c6b602be5657a9af7843736137099f1e7f23ad1de1c00855c539c41bcc9460` | Linux x86_64 single-platform image                                        |

Verification commands:

```bash
docker buildx imagetools inspect docker/dockerfile:1.7
docker buildx imagetools inspect docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
docker buildx imagetools inspect node:22.16.0-alpine3.21
docker buildx imagetools inspect node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca
docker buildx imagetools inspect golang:1.26.5-alpine3.23
docker buildx imagetools inspect golang:1.26.5-alpine3.23@sha256:622e56dbc11a8cfe87cafa2331e9a201877271cbff918af53d3be315f3da88cc
docker buildx imagetools inspect cloudflare/cloudflared:2026.7.2
docker buildx imagetools inspect cloudflare/cloudflared:2026.7.2@sha256:4f6655284ab3d252b7f28fedb19fe6c8fc82ee5b1295c20ac74d475e5398a52d
```

The reviewed tunnel runtime copies the exact statically linked binary and CA roots from the pinned official cloudflared source into `scratch`; unused source-image glibc and zlib packages do not enter the final image. It runs as `65532:65532`. Root must provision its fixed config and credential bind mounts as UID/GID `65532:65532`, mode `0400`; deployment preflight rejects operator-owned or more permissive files, and runtime verification requires both exact read-only mounts on a running container with that identity. Caddy 2.11.4 is rebuilt from its authenticated Go module with Go 1.26.5 because its published image embeds an older standard library with a fixed High-severity CVE. The same toolchain compiles the release-integrity health verifier. The final empty `scratch` runtime switches to the reviewed dedicated UID/GID `10001:10001`, serves on unprivileged port 8080, and receives only those two binaries, verified `dist/`, and the Caddy configuration; it contains no shell, package manager, or OS library set.

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
