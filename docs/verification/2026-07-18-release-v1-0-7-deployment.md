# Release v1.0.7 — deployment evidence (2026-07-18)

## What shipped

Tag `v1.0.7` on `d908de34cd6a48738d4a629c55c8db1bdbe1e69e` (main, CI green), the merge of:

- **PR #17** — backend audit repairs: `no-transform` on the immutable cache class,
  case-exact `/healthz`, gitignore hardening for private poetry reports, removal of the
  fail-open OSV toggle from CI, schema-parity test binding `FIXED_BROWSER_ASSETS` ↔
  `FIXED_MIME`.
- **PR #18** — the audited full corpus repair (60 Hafez + 60 Rumi; the explicit, reviewed
  purpose of this release; evidence `docs/audits/corpus-fable-5/`).
- **PR #19** — cinematic motion polish: paced Begin walk (device parity incl. iOS),
  amethyst butterfly with perpetual hover, softened book settle, and closure of the
  four-reviewer frontend audit (all Mediums fixed, RED-first).
- **PR #20** — the Macquarie Persian Society maker credit on Credits, About, and the
  share card. No University mark; branding stays `society_only`.
- **PR #21** — CI restored: the `osv-scan` caller job again grants the permissions its
  pinned reusable workflow declares (`actions: read`, `security-events: write`); every
  main push after the #17 merge had failed at workflow startup until this fix.

## Build

- Built off-host from `git archive v1.0.7` (clean tree), sanity: 60 + 60 records,
  `hafez-ghazal-025-bell.yaml` present, `046` absent.
- `docker buildx --platform linux/amd64`, `DIVAN_RELEASE_ID=divan-release-1-v1-0-7`,
  `SOURCE_DATE_EPOCH` = tag commit time, `DIVAN_BRANDING_MODE=society_only`.
- Image label `divan-build-mode=production`; platform `linux/amd64`.
- `release.json` from the image: `buildProfile production`, `productionEligible true`,
  120 items (60/60), `contentSha256 0744cc06…`; content JSON self-addressed (its SHA-256
  equals its filename and the manifest value).
- **Docker Scout: 0C / 0H / 0M / 0L** (159 packages, 31 MB).
- Pushed by digest: `ghcr.io/raoof128/divan-open-day:v1.0.7@sha256:2f3257a6a1177f69c3116f0db0fda059d466712cd4b0f69092a9510bbc6aa5c0`.

## Corpus change — proven to be exactly the audited repair

Diff of the image's content JSON against the live v1.0.6 corpus (`f5420697…`):

| Delta | Count | Audited cause |
| --- | --- | --- |
| id removed / added | `hafez-ghazal-046-bell` → `hafez-ghazal-025-bell` | wrong-poem pairing replacement (Bell VIII = ghazal 25) |
| `translationCredit` | 119/119 | credit strings aligned to `rights-evidence.yaml` `required_public_credit` |
| `text` + `disclosures` | 56 | OCR/typography recoveries + disclosure additions |
| `verificationStatus` | 12 | documented `MACHINE_VERIFIED` → `…_WITH_DISCLOSURE` flips (13 audited − the replaced record) |
| `source` | 1 | ghazal 65's recovered opening hemistich |
| `contentHash` | 119 | follows from the above |

No unexplained field changed on any record.

## Deployment

- Origin `ops/` hash-compared to the tag: five of six matched; `ops/scripts/verify.sh`
  was stale (pre-#17 Cache-Control pin, would have wrongly failed the release — the
  v1.0.5 drift class in reverse) and was synced from the tag before any script ran
  (`8272ada39f918631` confirmed on origin).
- Origin GHCR login via stdin (post-v1.0.6 credential wipe made this required).
- `preflight.sh --dry-run` then full preflight: "Preflight passed without changing
  running services."
- Previous digest recorded for rollback: `…v1.0.6@sha256:9f22b897…`.
- `deploy.sh`: "Activated immutable image …v1.0.7@sha256:2f3257a6…".
- Independent `verify.sh` re-run: automated private and public checks passed.

## Live public bytes (verified independently of the scripts)

- `/release.json`: `divan-release-1-v1-0-7`, 120 items, 60/60.
- Live content JSON **byte-identical** to the one extracted from the image (`cmp` clean).
- `/service-worker.js` carries `divan-release-1-v1-0-7`.
- Immutable content header now observed live: `cache-control: public, max-age=31536000,
  immutable, no-transform` (the #17 fix, previously unobservable pre-deploy).
- Live CSS carries the `--amethyst` tokens and `divan-butterfly-hover` keyframes; live JS
  carries the walk announcement and 3 occurrences of "Macquarie Persian Society"; live
  corpus serves `hafez-ghazal-025-bell` with the Bell credit and no `046`.

## Operator gate

`persian-society-eoi-*` (3 containers), `reasoning-engine-mcp`, `nexus-api`: all at
**5-day uptimes, healthy — unbroken**. `divan-cloudflared-1` **not recreated** (38 h).
Only `divan-divan-web-1` changed (Up 50 s, healthy, at the moment of the check).
Registry credentials removed from origin and workstation immediately after verification.

## Not claimed

- Provider logging/retention review (human operator gate) — not performed.
- Physical-device, branded-Safari, VoiceOver/TalkBack evidence — none; the device-parity
  walk was verified in Playwright Chromium and unit tests, not on physical iOS hardware.
- Cultural review, QR deliverable, University branding — gates remain closed.
- Credential rotation from the 2026-07-17 exposure — still outstanding.
- Cloudflare Web Analytics remains enabled at the zone (edge injection is mitigated by
  `no-transform` + the SW's failure-tolerant navigation, but disabling it remains the
  correct fix for the "no analytics" invariant).

## Rollback

`state/previous-image.txt` holds the verified v1.0.6 digest; `rollback.sh` path
unchanged and hash-verified against the tag.
