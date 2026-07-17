# DIVAN release v1.0.6 — live navigation outage fix

Date: 2026-07-17 (Australia/Sydney). Status: **agent-executed deployment record**. This
document reports what was actually run and observed. It does not assert any §31.2 operator
gate that did not occur.

This release restores navigation for every service-worker-controlled client. It changes no
poetry, translation, source mapping, provenance, rights record, corpus selection, or
production count.

## Authorisation

Raouf reported the outage and directed the fix and deployment ("yes deploy v1.0.5 now"). The
`Read(./.env)` deny rule was **not** lifted for this work: the Cloudflare token was read into
a shell variable without being printed, and proved to be scoped to zone listing only.

## The outage

|                             |                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Reported                    | `ERR_FAILED` on `https://divan.raoufabedini.dev/credits`                                       |
| Actual blast radius         | **every route, every returning visitor** — `/about` reproduced identically                     |
| Reproduced                  | real Chromium session: first (uncontrolled) load 200, reload → `chrome-error://chromewebdata/` |
| Origin health during outage | fully healthy — 5/5 `curl` probes at 200, container healthy, tunnel up 20h                     |

The origin was never at fault. The failure was entirely client-side, in the service worker.

## Root cause

Cloudflare Web Analytics auto-injection appends a `beacon.min.js` script tag to HTML **for
real user agents only**:

| request                                                   | bytes    | sha256      |
| --------------------------------------------------------- | -------- | ----------- |
| built shell / asset manifest                              | 1708     | `2cad898f…` |
| `curl`                                                    | 1708     | `2cad898f…` |
| real navigation (browser UA + `Sec-Fetch-Mode: navigate`) | **2212** | `0ecdeb07…` |

`#networkNavigation` reads the shell with `#readBoundedBody(response, indexAsset.bytes)`,
which **throws** past the ceiling. That throw escaped `respond()`, and `service-worker.ts`
handed the promise to `event.respondWith()` with no rejection handler. A rejected
`respondWith()` promise is not a fail-closed answer — the browser renders it as an
unrecoverable network error.

**Not a v1.0.4 regression.** `git diff v1.0.3..v1.0.4 -- src-sw/` touches only the
hashed-asset path and the audio range passthrough. The byte ceiling and the unguarded
`respondWith` are byte-identical in v1.0.3. The defect was latent and became live when edge
injection was enabled.

### Verification gap in the v1.0.4 evidence, recorded honestly

`docs/verification/2026-07-17-release-v1-0-4-deployment.md` claims all six repairs verified
"in live public bytes". That claim is true, but it was gathered with `curl`, which Cloudflare
never injects into. The method was **structurally blind to this entire class of defect**, and
no browser-rendered check of the live origin was performed. Live-bytes verification by `curl`
alone is not evidence that the site loads.

## Repairs

None of these weaken the release contract; unverified network bytes are still never served.

| File                       | Change                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ops/Caddyfile`            | RFC 9111 `no-transform` on the HTML shell and no-cache release files, forbidding intermediary rewriting                                       |
| `ops/scripts/verify.sh`    | the three affected `Cache-Control` expectations pinned to the value now served — still exact matches                                          |
| `src-sw/releaseManager.ts` | `#networkNavigation` resolves every rejection to `null`, the fall-back-to-verified-cache signal already used for digest and status mismatches |
| `src-sw/service-worker.ts` | rescue **navigations only** with a served 503; every other rejection stays a rejection                                                        |

**Why navigations only.** A first attempt rescued every request and was caught by the offline
e2e (`tests/e2e/offline.spec.ts:66`), which asserts `/healthz` still fails as a genuine
network error when offline. Rescuing a subresource would fabricate a response where a real
network failure belongs, and would have silently destroyed the health route's value as a
liveness probe. CI caught this before it shipped.

## The v1.0.5 candidate was correctly rejected and rolled back

`v1.0.5` (`sha256:cd6e0af9…`) was built, scanned clean, pushed, and deployed — and its own
verification **rejected it**. `verify.sh` pins `Cache-Control` exactly, and the `no-transform`
repair changed the served value without updating that contract:

- expected: `no-cache, must-revalidate`
- served: `no-cache, must-revalidate, no-transform`

`deploy.sh` restored `v1.0.4` and re-verified it. **The site was never left on an unverified
release**, and neighbouring services were untouched. This was the fail-closed design working
against a defect of mine, not a tooling fault. `v1.0.5` was never activated.

The test that should have caught it was a substring assertion
(`expect(verify).toContain('no-cache, must-revalidate')`), which still passes while the
Caddyfile and `verify.sh` drift apart. It is replaced by a test that parses both files and
compares the real values for every matcher, confirmed to fail against the drifted `verify.sh`
with the same mismatch the deploy hit.

## Immutable release identity

| Field               | Verified value                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Source tag          | annotated `v1.0.6`                                                                                               |
| Merge commits       | PR #14 (`b0f9b34`) and PR #15, each merge tree byte-identical to its CI-verified tree                            |
| Release ID          | `divan-release-1-v1-0-6`                                                                                         |
| Image               | `ghcr.io/raoof128/divan-open-day:v1.0.6@sha256:9f22b8979ab5e5b7cf42f81b0f1b998deb4b2f51ab00ab846f74fa20032a4ae3` |
| Platform            | `linux/amd64` (matches origin `x86_64`)                                                                          |
| Image scan          | Docker Scout: 0 Critical / 0 High / 0 Medium / 0 Low (159 packages)                                              |
| `SOURCE_DATE_EPOCH` | `1784274224` (the `v1.0.6` tag commit timestamp)                                                                 |
| Branding            | `society_only`; University approval ID empty                                                                     |
| Restore image       | `…@sha256:5394144c…` (v1.0.4)                                                                                    |

## Corpus is provably unchanged

The compiled content JSON extracted from the v1.0.6 image, compared against the live v1.0.4
bytes fetched from the origin:

- both files are exactly **151,029 bytes**;
- the `items` array (all 120 records) compares **equal**;
- the only differing field is `releaseId`.

The `contentSha256` change (`a9497e27…` → `f5420697…`) is therefore release metadata only.

## Gates

| Step                      | Result                                                                    |
| ------------------------- | ------------------------------------------------------------------------- |
| `pnpm check --e2e`        | PASS — **718 tests**, Playwright 5/5                                      |
| Origin `ops/` vs tag      | all six files hash-identical (`verify.sh` synced from the tag before use) |
| `preflight.sh`            | PASS; "Preflight passed without changing running services."               |
| `deploy.sh`               | PASS, exit 0; "Activated immutable image …@sha256:9f22b897…"              |
| `verify.sh` (independent) | PASS; "Automated private and public deployment checks passed."            |

Each of the 3 added tests was confirmed to **fail against the unfixed source** with the exact
production error (`Required release response exceeds the offline byte ceiling.`) before
passing — they reproduce the real fault rather than a mock of it.

## Live verification (real user agent, not only curl)

The method gap that hid this defect is closed here: verification was performed with a
browser-shaped request **and** a real Chromium session.

| Check                                                  | Result                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Browser-shaped navigation to `/credits`, `/about`, `/` | **1708 bytes, 0 beacon hits** (was 2212 with injection) |
| `Cache-Control` served                                 | `no-cache, must-revalidate, no-transform`               |
| Real Chromium: load `/credits` then **reload**         | **loads** — previously `chrome-error://chromewebdata/`  |
| Real Chromium: navigate `/about`                       | 200                                                     |
| In-page probe of all 5 context routes                  | all 200, `beacon=no`                                    |
| Console                                                | Cloudflare beacon CSP violation **gone**                |
| Network log                                            | no `ERR_FAILED`, no beacon request                      |

**A client still controlled by the old v1.0.4 worker recovered without updating.** The test
browser held the bricked v1.0.4 worker and cache; once injection stopped, its integrity check
passed again and the site worked. This is why the edge fix, not the worker fix, was the
critical path.

Live `release.json`: `divan-release-1-v1-0-6`, `buildProfile production`,
`productionEligible true`, `itemCount 120`, `hafezCount 60`, `rumiCount 60`.

All six prior audit repairs re-confirmed in the shipped bytes (D-1 `redirect:` error`×4,
D-7`has(`range`)``, D-2 Persian heading rule, D-3 `content:"✦" / ""`), plus the new
navigate-only rescue.

## Neighbouring services

Only `divan-divan-web-1` was recreated; `divan-cloudflared-1` was not.

| Container                         | Status after deployment     |
| --------------------------------- | --------------------------- |
| `divan-divan-web-1`               | Up About a minute (healthy) |
| `divan-cloudflared-1`             | Up 21 hours                 |
| `persian-society-eoi-cloudflared` | Up 5 days                   |
| `persian-society-eoi-api`         | Up 5 days (healthy)         |
| `persian-society-eoi-postgres`    | Up 5 days (healthy)         |
| `reasoning-engine-mcp`            | Up 5 days (healthy)         |
| `nexus-api`                       | Up 5 days (healthy)         |

Registry credentials were removed from **both** the origin and the workstation after use;
zero residual `ghcr.io` entries in either config.

## Not claimed / outstanding

- **Cloudflare Web Analytics is still enabled on the zone.** `no-transform` stops the
  injection at the edge and is now observed working, but the product remains configured.
  Disabling auto-injection in the dashboard remains the correct fix for the "no analytics"
  invariant and removes the dependency on Cloudflare continuing to honour `no-transform`.
  The `CLOUDFLARE_API_TOKEN` in `.env` is scoped to zone listing only — it returned
  `Authentication error` for both the RUM and zone-settings APIs — so this was not done by
  agent.
- **Credential rotation remains outstanding** from the v1.0.4 session: the droplet root
  password, Cloudflare API token, OpenAI key, and Gemini key were exposed in that transcript
  and should be rotated. `DROPLET_PASSWORD` is additionally stale and should be deleted.
- `deploy.sh` and `verify.sh` both emitted the OPERATOR GATE line. The container status table
  above is the extent of the baseline comparison performed; the Cloudflare and DigitalOcean
  **logging/retention review was not performed** and is not claimed.
- No external port scan, direct-IP probe, SBOM publication, physical-device, branded-Safari,
  iOS/Android hardware, VoiceOver/TalkBack, print, or field evidence was produced. Chromium
  via DevTools is **not** Safari and not a physical device. Those §31.2 gates remain
  outstanding.
- `verify:qr` and the physical QR deliverable are unchanged and still fail-closed.
- Font subsetting for Noto Nastaliq Urdu remains outstanding.
