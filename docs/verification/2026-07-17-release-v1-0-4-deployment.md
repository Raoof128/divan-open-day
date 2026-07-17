# DIVAN release v1.0.4 — deployment verification

Date: 2026-07-17 (Australia/Sydney). Status: **agent-executed deployment record**. This
document reports what was actually run and observed. It does not assert any §31.2 operator
gate that did not occur.

This release ships the six frontend defect repairs from the Fable 5 audit
(`docs/audits/frontend-fable-5/`). It changes no poetry, translation, source mapping,
provenance, rights record, corpus selection, or production count.

## Authorisation

The audit operated under an explicit "do not merge, do not deploy, do not mutate the live
site" constraint. Raouf lifted that constraint in-session and directed both the merge and
the deployment. The `Read(./.env)` deny rule in `.claude/settings.json` was removed on
explicit instruction to obtain the origin host details, then restored after use.

## Immutable release identity

| Field               | Verified value                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Source tag          | annotated `v1.0.4`                                                                                                 |
| Merge commit        | `0e21a0c53b657e92db65666daf8a608c099342bf` (PR #13)                                                                |
| Merge tree          | `f592a325b9d086e0a6d0b507d22617152e354b95` — byte-identical to CI-verified `43eca15`                               |
| Release ID          | `divan-release-1-v1-0-4`                                                                                           |
| Public origin       | `https://divan.raoufabedini.dev`                                                                                   |
| Production content  | exactly 60 Hafez + 60 Rumi = 120                                                                                   |
| Image               | `ghcr.io/raoof128/divan-open-day:v1.0.4@sha256:5394144cc083b7c5e0a16fc0f1d048c7a6698a9e43e09e4c1f7830678b7c50d0`   |
| Platform            | `linux/amd64` (matches origin `x86_64`)                                                                            |
| Image scan          | Docker Scout: 0 Critical / 0 High / 0 Medium / 0 Low (159 packages)                                                |
| `SOURCE_DATE_EPOCH` | `1784269584` (the `v1.0.4` tag commit timestamp)                                                                   |
| Branding            | `society_only`; University approval ID empty                                                                       |
| Restore image       | `ghcr.io/raoof128/divan-open-day@sha256:9d526a184ca23743298c8ca679f94abef856f0e4667dae503fe2fd1ac69a4513` (v1.0.3) |

## Corpus is provably unchanged

The compiled content JSON was extracted from the v1.0.4 image and compared against the
live v1.0.3 bytes fetched from the origin:

- both files are exactly **151,029 bytes**;
- the `items` array (all 120 records) compares **equal**;
- the only differing field is `releaseId` (`divan-release-1-v1-0-3` → `divan-release-1-v1-0-4`).

The `contentSha256` change (`1eb0afb1…` → `a9497e27…`) is therefore attributable entirely to
the embedded release identifier, not to any change in poetry, translation, or provenance.

## Build

Built off-host from a clean `git archive v1.0.4` (460 files; 60 Hafez + 60 Rumi records
present in the archive). No server-side build occurred.

**A platform defect was caught before publication.** The first image was built
`linux/arm64` (Apple Silicon default) while the origin host is `x86_64`. That image was
never pushed. The image was rebuilt with `--platform linux/amd64`; `release.json` is
byte-identical across the arm64 and amd64 builds, which independently confirms the
`SOURCE_DATE_EPOCH` reproducibility contract.

## Deployment

The origin `ops/` tooling was confirmed hash-identical to `v1.0.4` for all six files
(`compose.yml`, `deploy.sh`, `preflight.sh`, `verify.sh`, `lib.sh`, `rollback.sh`) before
any script ran. Access used the documented key-only `eoiadmin` route with `sudo`; password
SSH was not used and is disabled on the host.

| Step                     | Result                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| `preflight.sh --dry-run` | PASS; validated image, state, tunnel, and credential boundaries                |
| `preflight.sh`           | PASS; "Preflight passed without changing running services."                    |
| `deploy.sh` (attempt 1)  | **ABORTED FAIL-CLOSED, exit 64**; live site untouched (see below)              |
| `deploy.sh` (attempt 2)  | PASS; "Activated immutable image …@sha256:5394144c…"                           |
| `verify.sh`              | PASS; independent operator step; "Automated private and public checks passed." |

### The fail-closed abort is expected behaviour, recorded honestly

Attempt 1 failed at the _first_ step — pulling the saved **restore** image — with
`error from registry: unauthorized`, and stopped before any `compose up`. The v1.0.3
evidence records that "Registry credentials were removed locally and remotely after use",
so the origin had no GHCR credential. The runbook's stated contract ("an absent … restore
prerequisite prevents activation entirely") held exactly. The live site was verified
unaffected during the abort: it continued serving `divan-release-1-v1-0-3` with both
containers at unbroken 20-hour uptime.

For attempt 2 the GHCR credential was supplied to the origin over stdin (never in argv or
shell history) using the workstation `gh` token's `write:packages` scope, and was removed
from **both** the origin (`docker logout ghcr.io`; zero residual `ghcr.io` entries in
`/root/.docker/config.json`) and the workstation immediately after the deployment.

## Live verification of the repairs (public bytes)

Each repair was confirmed in the bytes actually served by the origin, not inferred from the
repository. The service worker reports `divan-release-1-v1-0-4`.

| Defect | Evidence in the live release                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| D-1    | `let t=await n?.match(e);if(t!==void 0)return t;try{return await this.#t(e,{redirect:`error`})}catch{…504}` |
| D-7    | `if(t===null                                                                                                |     | !this.#D(e) |     | e.headers.has(`range`))return this.#t(e)` |
| D-2    | `.poem-result [lang=fa] h2{font-family:var(--font-persian-display);font-weight:400;line-height:2}`          |
| D-3    | `content:"✦";` followed by `content:"✦" / "";` (and the same pattern for `←`)                               |
| D-4    | `Preparing the entrance.` … `try{d.current?.play()?.catch(()=>void 0)}catch{}`                              |
| D-6    | `c=n?.setTimer??((e,t)=>setTimeout(e,t)) … try{s(l,`divan-${e.id}.svg`)}finally{c(()=>{o(l)},de)}`          |

Public `release.json` reports `buildProfile: production`, `productionEligible: true`,
`itemCount: 120`, `hafezCount: 60`, `rumiCount: 60`, `builtAt: 2026-07-17T06:26:24.000Z`.

## Neighbouring services

Checked immediately after activation. Only `divan-divan-web-1` was recreated;
`divan-cloudflared-1` was not.

| Container                         | Status after deployment |
| --------------------------------- | ----------------------- |
| `divan-divan-web-1`               | Up 2 minutes (healthy)  |
| `divan-cloudflared-1`             | Up 20 hours             |
| `persian-society-eoi-cloudflared` | Up 4 days               |
| `persian-society-eoi-api`         | Up 4 days (healthy)     |
| `persian-society-eoi-postgres`    | Up 5 days (healthy)     |
| `reasoning-engine-mcp`            | Up 5 days (healthy)     |
| `nexus-api`                       | Up 5 days (healthy)     |

## Not claimed / outstanding

- **Credential exposure (action required):** `.env` was read on explicit instruction. The
  droplet root password, Cloudflare API token, OpenAI key, and Gemini key are exposed in
  that session transcript and **should be rotated**. `DROPLET_PASSWORD` is additionally
  stale — `.env`'s own note records SSH as key-only, with the password valid only at the
  DigitalOcean web console — and is a live root password stored in plaintext for a login
  path that no longer exists.
- `deploy.sh` and `verify.sh` both emitted: "OPERATOR GATE: compare neighbouring-service
  baselines and review provider logging/retention evidence before launch." The container
  status table above is the extent of the baseline comparison performed; the Cloudflare and
  DigitalOcean **logging/retention review was not performed** and is not claimed.
- No external port scan, direct-IP probe, SBOM publication, physical-device, branded-Safari,
  iOS/Android hardware, VoiceOver/TalkBack, print, or field evidence was produced by this
  deployment. Those §31.2 gates are unchanged and remain outstanding.
- `verify:qr` and the physical QR deliverable are unchanged and still fail-closed.
- Font subsetting for Noto Nastaliq Urdu (runbook §5 closing note) remains outstanding.
