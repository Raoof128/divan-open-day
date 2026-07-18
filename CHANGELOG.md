# Changelog

## 2026-07-18 — Cinematic motion polish: paced Begin walk, living amethyst butterfly, softened book settle

**Raouf:**

- Begin now walks the scroll corridor at human walking pace (rAF, 220 px/s, easeInOutSine, 4–9 s clamp) instead of a native smooth scroll that skipped the garden cinematic in under a second; the walk yields to visitor scroll input, Skip, and unmount, and falls back to direct arrival where scrolling is unavailable.
- Fixed the frozen butterfly (flutter died after 17 iterations): flight hands off to a perpetual gentle hover and slow resting wing beat. Per owner instruction it is now 5× larger and amethyst purple (new tokens), repositioned to stay in the left third behind the reading column; reduced motion still disables it.
- Book opening polished: rubbery cover bounce removed, shadow synchronised with the cover, softer shadow peak, weightier page rise, illumination waits for the motion to settle. All inside the locked 1.6 s animation ceiling.
- Four-reviewer adversarial frontend audit closed: media-collapse arrival extended to hand-driven scrubbing, overdue corridor collapses on scroll, faded controls leave the tab order, wing handoff snap removed, amethyst literal tokenized, double-Begin dedupe, keyboard-semantics tests added.
- Device parity: phones no longer skip the entrance — the rAF walk replaces iOS Safari's instant `scrollIntoView` jump, and a slow first frame no longer permanently demotes idle visitors to poster-only (grace window fails only a pending Begin; 30 s hard cap; errors still demote). Clips verified faststart.
- 722/722 unit tests (Begin suite rewritten RED-first), e2e 5/5, full gate green; corpus, service worker, and ops untouched.

## 2026-07-18 — Full corpus and translation repair (branch `repair/fable-5-full-corpus`, PR only)

**Raouf:**

- Repaired the complete 120-record corpus (60 Hafez + 60 Rumi) against the locked sources: every Persian and English span verbatim-verified, 83 records re-authorised under `source-bound-alignment-v3-fable5-repair`, 37 carried byte-identical under v2. Evidence: `docs/audits/corpus-fable-5/`.
- Replaced one wrong-poem pairing: Bell poem VIII is ghazal **25**, not 46; `hafez-ghazal-046-bell` → `hafez-ghazal-025-bell` with the verbatim ghazal-25 opening couplet.
- Fixed the Persian extractor's footnote-truncation bug (162/494 ghazals re-extracted; ghazal 65's published hemistich recovered) with a RED-first regression test.
- 31 disclosed OCR/typography recoveries across Bell, Clarke, and Whinfield records, each verified against scan or transcript and premise-asserted at build time; zero project translations — every English line is the registered historical translator's.
- Rights records stay honest (`pending`, no reviewer claimed) and are now coupled to their locked artifact hashes.
- Four adversarial reviewers over nine dimensions, two fix rounds, 13 findings — 8 fixed, 1 refuted with scan evidence, 4 recorded as residual risks. 732 tests green, full gate green, two-build byte reproducibility, deterministic regeneration, independent leak scan clean.
- Not merged, not deployed, no live-site mutation; branch pushed and PR opened against `main`.

## 2026-07-17 — Backend audit: four fail-open gaps closed, seven escalated

**Raouf:**

- Complete backend/release-integrity audit on `audit/fable-5-exhaustive-backend` off `origin/main` @ `adde8b4`. **No poetry, translation, provenance, rights record, corpus selection, or the 120-record count changed; no live infrastructure was touched and `.env` was never read.**
- **Repaired (TDD, RED first):** `no-transform` now covers `@immutable` — the content-addressed class holding `/content/<sha256>.json` and every hashed asset, the exact bytes the service worker verifies by SHA-256, and the only cache class that lacked it (`immutable` per RFC 8246 constrains client revalidation; only RFC 9111 `no-transform` forbids intermediary rewriting — the failure mode that caused the v1.0.6 outage on HTML). `verify.sh` moved in lockstep and the drift test now binds `assets` as well as `content`. `@health` switched to `path_regexp ^/healthz$`: Caddy's `path` is case-insensitive while the tunnel denies with a case-sensitive Go regexp, so `/HEALTHZ` was publicly answered `ok` 200 against the design authority's `must return 404` — **proven 200→404 in a disposable container**. `.gitignore` now ignores every private poetry report by default (two reviewed text-free reports re-included by negation) — the old shape-specific rule left a complete 494-matla' reference unignored. `ci.yml` no longer sets `DIVAN_OSV_SCAN_COMPLETED`, restoring `pnpm audit --prod` (**verified working, exit 0 — not the HTTP 410 recorded here previously**) as a fail-closed backstop under a fail-open OSV job.
- **Verification:** format/lint/typecheck clean; vitest **721/721** across 62 files (+3 net-new, none weakened); `caddy validate` passes; `verify:qr` still fail-closed.
- **Verdict: FAIL WITH BLOCKERS.** Open Highs this audit was forbidden to repair: a **truncated Persian hemistich with a stray `[`** shipping in `hafez-ghazal-065-bell.yaml`; all 60 Rumi records binding `persian_source_sha256` to a table-of-contents file containing **none** of their verse; 120 `active` permissions resting on `pending` rights evidence with a null reviewer; 12 hand-typed English lines bypassing the corroboration gate; ~222 unpublished source verse lines in a tracked evidence file; a vacuous raster-zero budget; and `FIXED_BROWSER_ASSETS`↔`FIXED_MIME` unbound by any test. Each is escalated with evidence, an owner, and a next safe action in `docs/audits/backend-fable-5/`.
- **Not claimed:** the lead did not read all 392 inventoried files personally; Phases 6 and 10 (adversarial matrix, nine-dimension re-audit) were **not completed** and no PASS is claimed for them; no two-build reproducibility, SBOM, image scan, or live-infrastructure evidence was produced.

## 2026-07-17 — Release v1.0.6: outage fix deployed, verified in a real user agent

**Raouf:**

- Deployed `divan-release-1-v1-0-6` (`ghcr.io/raoof128/divan-open-day:v1.0.6@sha256:9f22b8979ab5e5b7cf42f81b0f1b998deb4b2f51ab00ab846f74fa20032a4ae3`, `linux/amd64`, Scout `0C/0H/0M/0L`) by digest. `preflight.sh`, `deploy.sh` (exit 0), and an independent `verify.sh` all passed. Evidence: `docs/verification/2026-07-17-release-v1-0-6-outage-fix.md`.
- The outage is fixed and the fix is **observed**, not assumed: a browser-shaped navigation now returns 1708 bytes with zero beacon hits (2212 with injection), and in a real Chromium session loading `/credits` and reloading succeeds where it previously produced `chrome-error://chromewebdata/`. A client still controlled by the old v1.0.4 worker recovered without updating.
- Poetry, translations, provenance, rights, and the 120-record count are unchanged: content JSON byte-identical to v1.0.4 (151,029 bytes, all 120 items equal) apart from `releaseId`.
- The v1.0.5 candidate was **correctly rejected by its own verification and rolled back** — `verify.sh` pins `Cache-Control` exactly and the `no-transform` repair changed the served value without updating that contract. v1.0.5 was never activated; the site stayed on v1.0.4 and neighbouring services were untouched. The substring test that let the two files drift is replaced by one that compares their real values.
- Neighbouring services (EOI stack, reasoning-engine, nexus-api) at 5-day uptimes and healthy; `divan-cloudflared-1` not recreated. Registry credentials removed from both machines.
- Not claimed: Cloudflare Web Analytics is still enabled on the zone (disabling auto-injection remains the correct fix for the "no analytics" invariant); Chromium via DevTools is not Safari and not a physical device; provider logging/retention review not performed; credential rotation still outstanding.

## 2026-07-17 — Fix: edge HTML injection took every controlled client offline

**Raouf:**

- Fixed a live outage in which every route failed with `ERR_FAILED` for any returning visitor. Reported against `/credits`; reproduced in a real Chromium session and confirmed to affect all routes — the first load succeeds, and the first navigation the service worker controls fails.
- Root cause: Cloudflare Web Analytics auto-injection appends a beacon script to HTML for real user agents only, taking the shell from 1,708 bytes (the manifest digest the worker verifies) to 2,212. The navigation integrity read throws past that ceiling, and the throw reached `event.respondWith()` unguarded — a rejected `respondWith()` promise is an unrecoverable browser network error, not a fallback.
- Not a v1.0.4 regression: the byte ceiling and the unguarded `respondWith` are byte-identical in v1.0.3. The v1.0.4 "verified in live public bytes" evidence was gathered with `curl`, which Cloudflare does not inject into, so the method could not have caught this. Recorded in `AGENT.md`.
- Repairs: `ops/Caddyfile` now sends `no-transform` on the HTML shell and no-cache release files, forbidding intermediary rewriting; `#networkNavigation` resolves rejections to the existing fall-back-to-verified-cache path; `respondWith()` fails closed with a served 503. Unverified network bytes are still never served.
- 3 tests added (716 total), each confirmed to fail against the unfixed source with the exact production error before passing.
- Not claimed: Cloudflare honouring `no-transform` on this zone is documented but unobserved until v1.0.5 is deployed and re-checked in a real user agent. Disabling Web Analytics auto-injection at the zone remains the guaranteed remedy and the correct fix for the "no analytics" invariant.

## 2026-07-17 — Release v1.0.4: frontend audit repairs deployed to the live origin

**Raouf:**

- Merged PR #13 into `main` (`0e21a0c`, merge tree byte-identical to the CI-verified tree) and tagged annotated `v1.0.4`, on explicit instruction lifting the audit-time do-not-merge/do-not-deploy constraints.
- Published `ghcr.io/raoof128/divan-open-day:v1.0.4@sha256:5394144cc083b7c5e0a16fc0f1d048c7a6698a9e43e09e4c1f7830678b7c50d0` (release `divan-release-1-v1-0-4`) from a clean `git archive v1.0.4`, and activated it by digest on `https://divan.raoufabedini.dev`. Docker Scout `0C/0H/0M/0L`; `preflight.sh`, `deploy.sh`, and an independent `verify.sh` all passed; v1.0.3 retained as the verified restore image.
- Poetry, translations, provenance, rights, and the exact 120-record count are unchanged: the compiled content JSON is byte-identical to v1.0.3 apart from the embedded `releaseId`, so the `contentSha256` shift is release metadata only.
- Caught before publication: the first image built `linux/arm64` on Apple Silicon against an `x86_64` origin. Never pushed; rebuilt for `linux/amd64`, with a byte-identical `release.json` across both builds confirming reproducibility.
- The first `deploy.sh` run aborted fail-closed because the origin could not pull the saved restore image (registry credentials were removed after v1.0.3, as that release's evidence records). The live site was untouched by the abort; credentials were supplied over stdin and removed from origin and workstation after the retry.
- Verified in the live public bytes rather than by repository claim: all six audit repairs (D-1, D-2, D-3, D-4, D-6, D-7) are present in the shipped CSS, JS, and service worker, which reports `divan-release-1-v1-0-4`. Neighbouring services (EOI stack, reasoning-engine, nexus-api) retained 4–5 day uptimes and healthy status.
- Follow-up: `.env` was read on explicit instruction; the droplet root password, Cloudflare API token, OpenAI key, and Gemini key are exposed in that transcript and **should be rotated**. `DROPLET_PASSWORD` is also stale — `.env`'s own note records SSH as key-only. The `Read(./.env)` deny rule was restored after use. §31.2 operator gates remain outstanding and are not claimed.

## 2026-07-17 — Fable 5 exhaustive frontend audit and repair

**Raouf:**

- Ran the complete Fable 5 frontend audit on an isolated branch off `main` @ `e348048`: 24 frontend-relevant skills fully read and applied, fresh primary-source research (six read-only agents), all 131 inventoried frontend files read line-by-line, rendered state-space exercised on the real 120-record production build in Chromium, Playwright WebKit, and Firefox across ten viewports, defect ledger before any edit, TDD repairs, four-lens adversarial re-audit, fresh full gauntlet.
- Repaired six verified defects: service-worker cache-first network fallback (evicted/corrupted release cache no longer leaves an online page permanently 504-broken) with redirect-fail-closed parity; range-bearing direct audio passthrough (latent WebKit media break); the متن فارسی heading restored to the Persian display stack with Nastaliq-safe leading (was falling to the Latin stack via specificity in all three engines); decorative ✦/← glyphs removed from accessible names via CSS alt-text with graceful fallback; gesture-gated muted prime for the cinematic clip (WebKit cold-start first-frame flakiness); deferred verse-card Blob URL revocation past the download click.
- Added 8 regression tests (713/713 total, none weakened); `scripts/check.sh --ci` green end-to-end including exact-120 production build, Playwright 5/5, dist/privacy verifiers, OSV, and fail-closed `verify:qr`. Poetry, corpus, rights, deployment, DNS, tunnel, Docker, and the live preview were untouched; launch gates unchanged and closed. Audit evidence: `docs/audits/frontend-fable-5/` (preflight, skill inventory, research, inventory, baseline, file ledger, rendered matrix, defect ledger, adversarial review, final verification).
- Verdict: PASS WITH DOCUMENTED RESIDUAL RISK — residuals are the unchanged external §31.2 gates (physical devices, branded Safari, assistive technology), the designed WebKit poster fallback without a Begin gesture, the corpus-level absence of reflections, and the pre-documented SVG apple-touch-icon limitation.

## 2026-07-16 — Make the deployed DIVAN hostname publicly reachable

**Raouf:**

- Removed the single Cloudflare Access application matching `divan.raoufabedini.dev` after explicit owner instruction; no tunnel, DNS, cache, TLS, image, Droplet, application, corpus, service-worker, QR, or unrelated-service configuration changed.
- Verified anonymously that root returns HTTP 200 without a login redirect or cookie, `/healthz` and missing paths remain 404, the exact `divan-release-1-v1-0-3` 60/60/120 release is served, and the reviewed security/cache headers remain intact.
- Recorded this as an owner-authorised public-access override rather than claiming the still-missing printed-device, manual accessibility, provider logging/retention, or approved off-device-backup gates passed.

## 2026-07-16 — Release 1 protected production preview

**Raouf:**

- Published the annotated `v1.0.3` source at `fa9d1e226f7d0f9df86d77eb1888fc0ce25b2791` and deployed only the clean immutable GHCR digest to `divan.raoufabedini.dev` through the dedicated locally managed Cloudflare tunnel.
- Passed the exact repository gate (705 Vitest tests, Playwright 5/5, 60 Hafez / 60 Rumi / 120 production records, dist/private-leak, privacy, audit, and operations), a 0 Critical / 0 High / 0 Medium / 0 Low final-image scan, remote preflight/deploy/independent verification, and a same-digest rollback rehearsal.
- Preserved all five unrelated Droplet services, published no host port, shared no unrelated network/volume/credential, and removed registry authentication after deployment.
- Activated the hostname-scoped cache rule and restored exactly one explicit deny-everyone Cloudflare Access policy with no bypass. This is a protected production preview, not a public launch.
- Generated and digitally verified print-ready A3, A5, take-home, and staff QR PDFs plus a combined four-page pack. Printed iOS/Android distance and lighting checks remain blocked on human evidence.
- Left poetry, corpus/source/translation evidence, service-worker behaviour, University branding, release compilation, and the separate 60-Hafez/60-Rumi work unchanged. Physical-device/cross-browser/assistive-technology, provider logging/retention, and approved off-device credential-backup gates remain open.

## 2026-07-16 — Harden Release 1 runtime images

**Raouf:**

- Rejected the initial vendor-based web and tunnel candidates after mandatory image scanning found fixable Critical/High vulnerabilities; no rejected web image was published.
- Rebuilt Caddy 2.11.4 with fixed Go 1.26.5, replaced the shell health probe with a static verifier that preserves the exact 60 Hafez / 60 Rumi / 120-item and asset-digest contract, and moved the final web filesystem to `scratch`.
- Reduced cloudflared to a `scratch` image containing only the exact official 2026.7.2 static binary and CA roots; Compose and deployment validation pin its immutable GHCR digest.
- The hardened web candidate passed its production build, private/source leak check, read-only unprivileged runtime probe, and Docker Scout at 0 Critical / 0 High / 0 Medium / 0 Low. OSV's only unscored/no-fix advisory concerns unmaintained OpenPGP packages that are absent from the compiled Caddy dependency graph.
- Kept poetry, translations, corpus selection, source evidence, service worker, frontend behavior, branding, QR approval, and unrelated Droplet workloads unchanged.

## 2026-07-16 — Prepare the exact-120 Release 1 deployment gate

**Raouf:**

- Normally merged reviewed PR #5 into `main`, preserving the complete final 60-Hafez / 60-Rumi corpus and its evidence.
- Tightened container health and live verification from the historical minimum to exactly 60 Hafez, 60 Rumi, and 120 total records, and updated current operational runbooks without rewriting historical audit records.
- Made `build:production` a required quality-gate pass for `divan.raoufabedini.dev`; kept physical QR fail-closed.
- Added a commit-pinned official OSV dependency scan before CI. OSV-Scanner 2.4.0 found no issues across 429 locked packages; pnpm's retired audit endpoints still return HTTP 410.
- Local verification passed source locks 9/9, format/lint/typecheck, Vitest 701/701, components 80/80, accessibility 24/24, security 55/55, performance 5/5, Playwright 5/5, an exact 120-item production build, distribution/private-leak, privacy, and four static operations contracts.
- Live Droplet deployment remains blocked on a dedicated non-root SSH key; the password-only root fallback was deliberately not used. Tunnel, Access, live rollback, manual accessibility/device, and physical QR evidence remain open.

## 2026-07-16 — Visible poet return and cinematic Begin verification

**Raouf:**

- Reviewed draft PR #5 against current `main` and normally merged the final 60-Hafez / 60-Rumi baseline without changing its poetry, source evidence, translations, compiler, service worker, deployment, or production-selection work.
- Verified visible `Choose another poet` controls from intention and result, release-bound clearing of selected-poet/current-poem session state, deterministic return to both cards, and usable Back/Forward traversal.
- Kept Begin inside the existing cinematic: smooth automatic scrolling and manual scrolling use the same real video-scrub path, terminal arrival paints the `duration - 0.05` frame, and Skip remains available.
- Fixed three genuine failure edges without weakening tests: the first-frame timeout now waits for frame presentation rather than `loadeddata`, terminal seek paints before unmount, and a rejected programmatic scroll falls back directly.
- Node 22.16.0 verification passed: format/lint/typecheck; components 80/80; accessibility 24/24; Playwright 5/5; exact 120-item production build; distribution/private-leak and privacy verification. A 390×844 Chromium walk covered automatic/manual traversal, Rumi/Hafez returns, result return, Back/Forward, reduced motion, failed video, Save-Data, and offline. Verified implementation SHA: `a079e722f0d3ecdb643c8204d7c3272e14ad4616`.
- Limitations: browser evidence is emulated Chromium rather than the external physical-device/cross-browser/assistive-technology matrix; npm's retired audit endpoints still return unrelated HTTP 410 responses. Full evidence is in `docs/verification/visible-navigation-and-cinematic-begin.md`.

## 2026-07-16 — Final 120-record source-bound corpus

**Raouf:**

- Expanded production from the historical 24 Hafez / 16 Rumi baseline to exactly 60 unique Hafez ghazals and 60 unique, non-overlapping Rumi source identities.
- Preserved the existing 40 literary records, added 36 Clarke/Qazvini-Ghani Hafez alignments and 44 Whinfield/Nicholson Rumi alignments, and renewed all 120 machine authorities under the final source/edition/span/mapping/canonical-identity contract.
- Added a deterministic, schema-validated 120-record selection manifest. Production now rejects implicit directory selection, duplicate Hafez identities, overlapping or reused Rumi spans, stale authority digests, and archived/excluded records.
- Added pre-expansion inventory, final alignment evidence, reproducible corpus/report builders, 60/60 count and uniqueness regressions, and machine-readable plus human-readable verification reports.
- Verified all 9 source locks, 694 Vitest tests, 5 Playwright tests, format/lint/typecheck, the exact 120-item production build, distribution integrity and archival-leak checks, privacy, and four static ops contracts. npm's retired audit endpoints return HTTP 410; external launch, live deployment/rollback, manual accessibility, and physical QR gates remain separate.

## 2026-07-16 — Integrate poetry ingestion into main

**Raouf:**

- Merged `feat/poetry-source-ingestion` into the cinematic/UI `main` release line.
- Preserved both branches' ignore rules and complete audit histories while combining the cinematic asset contract with source-bound content authority and the exact 24 Hafez / 16 Rumi production corpus.
- Manual conflict resolution was limited to `.gitignore`, `eslint.config.js`, `AGENT.md`, and `CHANGELOG.md`; overlapping schemas, UI, tests, and Vite configuration merged automatically.
- Merged-tree verification passed: 682 tests, strict typecheck, tracked lint/format, 5 Playwright tests, exact 40-item production build, dist/leak/privacy checks, 9 source locks, and four static ops contracts. Repository-wide lint/format still see protected untracked/local inputs, which remain untouched. Public-launch governance, manual accessibility, live deployment/rollback, and physical QR gates remain external.

## 2026-07-16 — Cinematic threshold, layered book, and atmosphere (feat/cinematic-threshold)

**Raouf:**

- **Scope:** The v3 gauntlet-final cinematic enhancement in a dedicated worktree off `origin/main`: poster-first scroll-scrubbed entrance (illuminated Persian miniature), seamless final-frame handoff into a live book stage, layered weighted book-opening, restrained candle/butterfly/mote atmosphere. No poetry, translation, rights, approvals, ballot/EOI, or production configuration touched; launch gates stay closed.
- **Summary:** Four approved `gpt-image-2` stills + two native `gemini-omni-flash-preview` clips (Raouf's API keys; Higgsfield dropped on cost). Posters are the clips' first decoded frames; book-stage backdrops are their actual final rendered frames (handoff SSIM 0.9662/0.9832 — codec noise only). Release contract now carries media end-to-end: `video/mp4` in both mirrored schemas, four precached webp (offline guarantee) + two never-precached mp4 (contract-enforced), mp4 signatures in `verify-dist`, `publicDir:false` preserving the raster-zero lock. Threshold: natural-scroll scrub with per-frame seek coalescing, immediate "Skip entrance", live-region arrival, and poster-only routes for reduced motion / Save-Data / offline / decode failure / timeout — the poem never requires video. Book: two-faced cover with gravity catch, three trailing leaves, spine compression, illumination after settling (2.0 s), refined via a frame-by-frame paused-animation audit. Atmosphere: breathing candle glow, one deterministic settling golden butterfly, six abstract motes (three on coarse pointers), all aria-hidden.
- **Files Changed:** release contract (6 files), app scenes/orchestration (3), five new components + two cinematic libraries, styles + timing, released media (`public/images`, `public/video`), committed `.claude/` cinematic pack, 3 new + 4 updated test files, docs (ledger, design lock, provenance, asset manifest, verification report), lint/format/ignore config (see AGENT.md for the full list).
- **Verification:** Node 22.16.0, worktree @ `4ee014a`. format/lint/typecheck 0; vitest 529/529; Playwright 5/5; `build:fixture` + `verify:dist` + `verify:privacy` pass; media budget PASS (6 assets, 5,857,556 B); LCP 1396 ms / CLS 0.00 (390×844, 4× CPU, Fast 4G); reduced-motion route live-verified (0 video requests); offline poem flow live-verified; armed pack release gate PASS. `pnpm audit --prod` blocked by npm's retired endpoint (identical on main — environmental). Report verdict: PASS WITH EXTERNAL LAUNCH GATES.
- **Follow-ups:** §31.2 gates unchanged. Seedance-class parallax clips remain a drop-in upgrade (same `end_image` frame-lock contract). Poster preload deferred (LCP 1396 ms). Rotate the two API keys if the one-time local `.env` echo concerns you. Repo-wide pnpm upgrade for the retired npm audit endpoint.

## 2026-07-14 — Full UI/UX audit gauntlet and remediation (multi-agent)

**Raouf:**

- **Scope:** Repository-wide UI/UX, accessibility, responsive, performance, and privacy audit + repair against the design authority, executed as a staged multi-agent gauntlet (5 read-only auditors → verified ledger + plan → 3 worktree-isolated writers with disjoint file ownership → lead integration → 5 adversarial final reviewers → repair loop). No content, rights, approvals, or production configuration fabricated.
- **Summary:** Closed all four High defects — spine-bar glyph clipping on every phone width (padding floor, style-test-pinned); missing §7.6 "Return to the stall" (generic disclosure) and "Learn about the poet" result actions; 1.56:1 gold-on-paper link contrast (now deep red, 9.77:1); visually identical poet result cards (Rumi keyed lapis/turquoise, contrast preserved). Plus: reveal-stage focus fix, bidi parenthesis fix, honest audio-failure removal, poet-preserving refresh restore, §26.2 offline-reload announcement, unknown-path URL cleanup, scoped Escape-to-skip, `[lang='fa']` tracking guard, safe-area + `viewport-fit=cover`, welcome polish, metadata alignment, offline copy reconciliation, compression-surviving 1200×630 share card, single display-face font preload (FCP contained, LCP 1464→~1212 ms), `role="group"` actions cluster, offline-ready extraction. Full evidence in `docs/audits/divan/` (audits, ledger, plan, research log, final reviews, verification report).
- **Files Changed:** 14 src/build/doc files + 8 test files (+27 net-new tests, none weakened) + `docs/audits/divan/**` + `.gitignore` + `AGENT.md` + `CHANGELOG.md` (see AGENT.md entry for the full list).
- **Verification:** Node 22.16.0, branch `feat/ui-ux-gauntlet-r1` @ `67958c9`. `scripts/check.sh --e2e` green — lint/typecheck 0, vitest 499/499, Playwright 5/5, `verify:dist`/`verify:privacy` pass, `audit --prod` clean, `build:production` + `verify:qr` fail-closed as intended. axe 0 violations on all ten surfaces; zero external requests/cookies; LCP ~1212 ms / CLS 0.0053 throttled-mobile. Five adversarial reviewers report 0 unresolved Blocker/Critical/High.
- **Follow-ups:** §31.2 launch gates unchanged and closed. Production-corpus runbook tasks: subset Noto Nastaliq + re-measure reveal, re-check RTL clearance/wrapping with real verse; kiosk idle-reset remains a deployment decision.
## 2026-07-16 — Source-bound machine authority and 40-item production corpus

**Raouf:**

- Replaced the human-only literature-eligibility gate with a discriminated
  `ReviewAuthority`: legacy `human` evidence remains valid, while
  `machine_alignment` binds exact English/Persian source snapshots, selected
  spans, references, and mappings. The only machine verdicts are
  `MACHINE_VERIFIED`, `MACHINE_VERIFIED_WITH_DISCLOSURE`, and `EXCLUDED`.
- Production machine-authority records need no teacher, contributor, named
  reviewer, final approval, or human-reapproval state. Source/span/reference/
  mapping mutations fail closed; a corrected mapping receives a fresh machine
  verdict. Rights permissions join source-lock and licence evidence without
  fabricating a reviewer identity.
- Froze the honest pre-migration baseline (10 verified Hafez identifications and
  21 verified Rumi alignments, but zero canonical records), selected the strongest
  16 Rumi records, and archived sequences 116, 347, 483, 622, and 668 as
  `EXCLUDED` with ranking evidence.
- Built exactly 24 Hafez records from Bell scan spans aligned to Qazvini-Ghani and
  exactly 16 Rumi records from Whinfield/Nicholson evidence. Public output is
  English first, Persian live RTL below, with public-domain/CC BY-SA attribution
  and source limitations; reflections were not invented. Full books, hashes,
  mappings, rationales, reviewer metadata, and candidate reports remain private.
- Added deterministic regeneration (`pnpm poetry:build-production`), exact
  24/16/40 compiler enforcement, production-corpus/leak/archive tests, and disabled
  Vite 8's obsolete modulepreload-polyfill injection so the pinned Rolldown build
  stays on Vite's public exports.
- Local production packaging now succeeds with explicit non-secret configuration;
  `verify:dist` and `verify:privacy` pass. This is package readiness, not a claim
  that independent legal/governance, manual-accessibility, live deployment,
  rollback, or physical-QR launch gates have been completed.

## 2026-07-16 — Harden the Clarke verse filter; 10 verified Hafez identifications

**Raouf:**

- Replaced the Clarke verse/notes filter with a **typographic** one
  (`scripts/poetry/parse-clarke-odes.ts`). Clarke interleaves glosses with verse and
  numbers them with the same `N.` form as couplets, numbering only every fifth
  couplet — so no keyword or numbering rule can separate them. He sets notes in
  smaller type; hOCR reports `x_size`; the distribution is bimodal (notes ≤52, verse
  ≥56) with the 53–55 valley classified `uncertain` and never pairable.
- 13 tests pin it (`tests/content/clarkeParse.test.ts`), including the two defects
  that have recurred three times: a gloss repeating the couplet's own anchors, and a
  numbered gloss read as a couplet. They caught a real bug in the hOCR parser
  (nested spans captured only the first word per line).
- Alignment run: Haiku matla' aligners over 125 odes → 2 Opus adversarial refuters
  on distinct lenses. 17 proposed; the refuters returned **identical verdicts on all
  17**; **10 verified** (≥2 refuters, zero refutations). Hafez 10 of 24, Rumi 21 of
  16, total 31 of 40.
- Recorded two defects, both unfixed: the couplet-range prefilter excluded true
  answers (Qazvini-Ghani rejects spurious couplets, so Clarke's ghazals run *longer*
  than Q-G's — the filter assumed the reverse), which makes **every "none" in this
  run inconclusive rather than a refutation; and ode labels are not unique (five
  duplicated by OCR misreads), so identity must be keyed by volume+page.
- These are identifications, not records: no excerpt chosen, no reflection, no rights
  approval. No gate moved.

## 2026-07-16 — Local OCR of Clarke, and the first citation-grade Hafez binding

**Raouf:**

- Added `scripts/poetry/ocr-clarke.sh`: renders and OCRs all 1,078 Clarke pages
  locally at 400dpi, parallel across cores (~25min vs ~4.5h sequential) and
  resumable. No page text passes through a model — no content filter, no tokens.
  Output is git-ignored; per-page text of a complete translation is the whole book.
- Needed because the Archive's OCR of Clarke recovers ~1.5 numbered couplets per
  ode where ghazals run 5–15. Local OCR reaches 2.7 and reads headings the Archive
  loses. The engines fail on different odes (local 273, Archive 356, union 438) and
  agree on 98% of concordance numbers where both read them, so they are merged as
  two corroborating readings with disagreements flagged.
- **Clarke ode 8 = Qazvini-Ghani ghazal 3**, on three independent verse signals:
  literal matla' rendering, couplet count 8 = 8, and a rare-name cluster
  (Samarkand + Bukhara) unique to one ghazal. The first Hafez identification in
  this project resting on citable evidence rather than motif similarity.
- Retracted an earlier form of that same claim: it was first reported on names
  found in Clarke's commentary rather than his verse. The binding is real, but the
  evidence was not, and a true claim on invalid evidence is still unfounded.
- Measured the ceiling of rare-anchor binding: it can uniquely identify at most 36
  of 494 ghazals; 448 have no rare anchor at all. Proper nouns are a seed, not the
  method. Rhyme letter + couplet count narrows a typical ode to ~15 candidates,
  turning matla' alignment into closed multiple choice.
- 1 of 24 Hafez bound; 21 of 16 Rumi. No record authored, no gate moved.

## 2026-07-16 — Ingest Clarke 1891 as the Hafez identification source

**Raouf:**

- Added a fifth source edition, `hafez-clarke-1891-en` (H. Wilberforce Clarke,
  Calcutta 1891) — a complete, literal, per-ode-numbered translation of the whole
  Divan, acquired through the locked fetcher and hash-pinned in `source-lock.json`.
  Internet Archive records both volumes as NOT_IN_COPYRIGHT; the rights record
  stays `pending` with no reviewer.
- Reason, measured rather than assumed: only 5 of Bell's 40 recovered poems carry
  a ghazal-discriminating proper noun, none of them unique. Bell cannot identify
  her Persian counterparts on citable evidence, and at ~43 poems total she cannot
  reach 24 verified. Clarke's first line tracks the matla' (verified against
  ghazal 1), turning Hafez identification into a citation check instead of a
  thematic judgement.
- Fixed a source-acquisition defect surfaced by the two-volume ingest: artifacts
  of the same kind under one source id resolved to the same filename, so volume 2
  silently overwrote volume 1 and the lock recorded two hashes for one path.
  Artifacts now take an optional `filename`; the schema rejects colliding
  destinations; the fetcher keys prior hashes by file rather than kind.
- No pairing verified, no record authored, no gate moved. `build:production` and
  `verify:qr` remain fail-closed.

## 2026-07-16 — Correct the Rumi count to 21 verified, and retract seq 717

**Raouf:**

- **Scope:** Corrects the 2026-07-15 entry below and the audit it points to, plus the private alignment evidence file. No code, schema, compiler, release-gate or public-output change.
- **The 27 "unverified" were never unverified.** Yesterday's entry reported **15 verified / 5 refuted / 27 unverified**, attributing the 27 to refuters that never returned before the session limit hit. That reading was wrong. The refuters had returned; their verdicts were sitting in the agent transcripts, unaggregated. Recovering them was a local join — map each `agentId` to its `CLAIM:` line and re-apply the same gate — at a cost of **zero new agents and zero tokens**. Corrected: **21 verified / 14 refuted / 6 insufficient** of 47 examined. No verdict was re-derived, softened, or re-run toward a preferred answer.
- **Seq 717 is retracted.** It was among the original 15, passing on 3 votes. A 4th vote returned and refuted it. Nothing about the pairing changed — only the number of skeptics who examined it. This is the clearest evidence in the run that the vote threshold does real work rather than ceremony, and it means the earlier figure was not just incomplete but **wrong in the direction that matters**: it published a pairing that further review rejects. The recovery was run through the identical gate, which is precisely why it retracted 717 instead of confirming the number I had already published.
- **Vote strength is now recorded per pairing** (6 votes: 2 pairings, 5: 5, 4: 9, 3: 4, 2: 1). 20 of the 21 carry ≥3 independent refutation attempts; the lone 2-vote pass is flagged as the weakest evidence in the set and should be read as provisional — seq 717 shows what a low-vote pass risks.
- **Rumi is over threshold: 21 of 16**, with 5 pairings of margin. **Hafez is 0 of 24** and is now the entire remaining gap (total **21 of 40**).
- **Not done:** verified pairings remain alignment evidence, not canonical records — they assert that this English renders that Persian, and do not select excerpt boundaries, write reflections, or establish rights. No authoring item exists, so `pnpm build:production` still fails closed at `loadContent.ts:433`, correctly and untouched. The reviewer-union gate is still scoped but unbuilt while the total corpus is below threshold.
- **Files Changed:** `docs/audits/divan/2026-07-15-bell-reconstruction-and-rumi-alignment.md`, `sources-private/poetry/reports/rumi-alignment-candidates.json` (git-ignored), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green. Evidence file confirmed matched by `.gitignore:27` before writing. `pnpm build:production` still fails closed; launch gates untouched.

## 2026-07-15 — Reconstruct Bell locally; 15 Rumi pairings survive adversarial review

**Raouf:**

- **Scope:** New Bell reconstruction script + its regression suite + audit. Rumi alignment evidence written to private reports. No schema, compiler, release-gate or public-output change.
- **Bell — recoverable after all.** Model transcription of the scan is blocked by the platform (9/14 readers returned `400 Output blocked by content filtering policy`). The fix is to never route the text through the model: `pdftoppm` renders pages at 400dpi, `tesseract` OCRs them, and the text lands straight in files. No network, no new dependency (`ocrmypdf` absent and not needed), no model output, therefore no filter. On the line that named the problem, the archive OCR reads `easb` and the fresh local OCR reads **`east`**. Two independent engines (IA's ABBYY vs local Tesseract) now corroborate **1,270 of 1,340 lines (94.8%)** across **40 poems**; 5 are fully corroborated, 33 are within two lines of clean. Disagreements are flagged, never resolved by guessing.
- **Three defects found, all three mine:** (1) splitting on Roman numerals swept Bell's **prose introduction** in as "poem I" — 155 lines of essay, the same class of error that invalidated the Whinfield prose summaries; fixed by the running head (`INTRODUCTION` vs `POEMS FROM THE`), and the verse starts at scan page 71, not 67 as the stale metadata claimed; (2) my comparison counted `rise !` vs `rise!` as a conflict, flagging 396 good lines — comparing words only gives **396 → 70**; (3) the printed page number `111` split a poem in half, because the heading shape allowed digits.
- **Damaged numerals:** the OCR reads II as `Il` and III as `Ul`, so requiring a valid numeral MISSED the heading and merged poems into their predecessor. Boundary detection is now separate from identity: the numeral is kept verbatim and flagged, never repaired from sequence, since one missed heading would shift every later reference. This costs nothing — Bell's numeral is not a Hafez citation, and the English side is cited by scan page.
- **Rumi — 15 verified of 47 examined.** Aligners proposed **47 of 47 with zero exclusions**, which is not credible: the previous human pass accepted 8 of 8 and every one was wrong. Three-lens adversarial refutation cut it to **15 verified / 5 refuted / 27 unverified** (refuters never returned — session limit after 10.3M subagent tokens). The 27 are untested, not disproven. Zero content-filter blocks across 189 agents, confirming the filter targets bulk transcription, not short structured verdicts. The skeptics caught real defects: false boundaries, a better section named for seq 480, deviation understated 2× on seq 667 (8 unsupported English couplets), and — on seq 757 — an aligner citing **prose-summary text as verse evidence**, the packet-v1 defect resurfacing.
- **Not done:** target unmet (Rumi 15 of 16, Hafez 0 of 24, total 15 of 40). Verified pairings are alignment evidence, not canonical records. The reviewer-union gate is scoped but deliberately not built while the corpus is below threshold — removing protection before there is anything to compile costs the protection and buys nothing.
- **Files Changed:** `scripts/poetry/reconstruct-bell.ts`, `tests/content/bellReconstruction.test.ts`, `docs/audits/divan/2026-07-15-bell-reconstruction-and-rumi-alignment.md`, `.gitignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green; new suite 14/14. Rendered pages and OCR text are git-ignored before first write; `rumi-alignment-candidates.json` matches the existing excerpt-bearing ignore rule. `pnpm build:production` still fails closed. Launch gates untouched.

## 2026-07-15 — Recover the Hafez Persian verse, which was never extracted

**Raouf:**

- **Scope:** New Hafez ghazal extractor, its regression suite, and an audit record. No schema, compiler, release-gate, or public-output change.
- **Summary:** Hafez has scored **zero** candidates for the life of this project, and every earlier report — including the 2026-07-14 preflight — read that as a matching problem: Bell's 1897 selection has no concordance to Qazvini-Ghani, so nothing could pair. That diagnosis was wrong. **The Persian ghazal bodies were never in staging at all.** `extract-epub.py` collects block-level tags only, and the Wikisource Qazvini-Ghani edition sets every ghazal as a centred table — one couplet per `<tr>`, each hemistich in `<td class="b"><span class="beyt">`. None are block tags, so every poem was dropped while the footnote apparatus, which *is* in `<p>`, passed through and became the entire Hafez "corpus". The 91 documents that looked like ghazals held 94 rows between them, and they were manuscript-variant notes. No ranking repair could ever have fixed this; there was nothing to rank.
- **The repair:** `scripts/poetry/extract-hafez-ghazals.py` reads the ghazal structure directly, recovering **486 citable ghazals, 3,649 couplets, 7,428 hemistichs** — each with its own edition number read from the markup, so references are cited from the source rather than inferred. `BLOCK_TAGS` was deliberately not widened: it would change the Rumi extraction and invalidate its 971 section digests.
- **Three real source defects, handled without invention:** (1) the EPUB spine lists documents twice — read each once; (2) the source gives two different poems the same number (`c127` and `c128` both carry `۱۲۳`; likewise `c256`/`c257`, `c321`/`c362`) — file order hints the second "should" be 124/252/317, and those are exactly the numbers otherwise absent, but acting on that hint would **invent a poem number against the source**, so both sides are flagged `numberAmbiguous` and excluded (486 unambiguous remain; 24 are needed); (3) unnumbered qasidas, masnavis and rubaiyat are real verse but cannot be cited by ghazal number — skipped, not renumbered.
- **Not done, and why:** the 24/16/40 target was **not** met and the named-human gate was **not** removed. The gate is not what blocks release — an empty corpus is (`loadContent.ts:433`: "no approved production corpus exists"). Removing it without a corpus to compile buys nothing and costs the protection; the correct order is evidence, then policy, then compile. Bell's English remains raw OCR (`requiresVisualVerification` true on 33/33, `correctedDraftLines` empty on all 33, running heads inside poem bodies, `easb` for "east" in the verse). Transcribing it from the local 5.5 MB scan is blocked by the platform: 9 of 14 readers returned `400 Output blocked by content filtering policy`, yielding 1 complete poem from 14 agents. Publishing `easb` as Gertrude Bell's poetry would be exactly the fabrication this pipeline exists to prevent.
- **Files Changed:** `scripts/poetry/extract-hafez-ghazals.py`, `tests/content/hafezGhazalExtraction.test.ts`, `tests/fixtures/poetry/build-ghazal-fixture-epub.py`, `docs/audits/divan/2026-07-15-hafez-verse-recovery.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green; new suite 10/10, including a test pinning that the original extractor drops this verse while capturing the footnote, so the defect cannot silently return. Ghazal ۸۸ verified by hand against raw markup → `c92`, `شنیده‌ام سخنی خوش که پیر کنعان گفت`, 9 couplets. `pnpm build:production` still fails closed. Launch gates untouched.

## 2026-07-14 — Git-ignore CLAUDE.md, as it always claimed to be

**Raouf:**

- **Scope:** One line in `.gitignore`. No code, no behaviour, no content change.
- **Summary:** `CLAUDE.md` states on line 3 that it is "**git-ignored** (local, not committed)", but it was never actually listed in `.gitignore` — so it sat untracked and unignored, contradicting itself and appearing in every `git status`. Ignored it, which is what the file said all along.
- **Files Changed:** `.gitignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `git check-ignore -v CLAUDE.md` resolves to `.gitignore:36`; `git status` is clean but for the untracked audit screenshots, deliberately left alone.

## 2026-07-14 — Pin the approval-identity gate against the packet v1 defect

**Raouf:**

- **Scope:** One regression test. No behaviour change — the identity requirement already held; it was simply unpinned.
- **Summary:** Packet v1 accepted eight pairings with its `reviewer` field set to the empty string. An approval that names nobody is not an approval: there is no one to have been wrong, and nothing to revoke. `approvalRecordSchema.approved_by` already rejects it via the shared kebab-case identifier schema. Pinned against that concrete incident so it cannot be relaxed quietly.
- **Files Changed:** `tests/content/reviewIdentityGate.test.ts` (new), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; `pnpm test` 588/588 (47 files; +19 net-new across today's alignment repair), typecheck 0, lint 0. `pnpm build:production` still fails closed ("no approved production corpus exists in content-private").
- **Known limitation:** A single-character identity ("a") is accepted, and the test says so rather than asserting otherwise. The shared `identifierSchema` enforces lowercase kebab-case but no minimum length, and it backs every registry ID, so tightening it for approvers alone belongs in its own change rather than smuggled into a test.

## 2026-07-14 — Verse-only inventory and source-aware alignment (phases 2-3)

**Raouf:**

- **Scope:** Phases 2-3 of the alignment-pipeline repair. Candidate generation only. No canonical record, verdict, approval, or corpus change — the human approval gate stays required and machine output feeds review, never the compiler.
- **Summary:** Two repairs. (1) The English side is now classified before ranking, and only `verse_translation` segments are eligible, so Whinfield's prose arguments — the eight acceptances the preflight rejected — cannot reach a pairing at all. Every excluded segment is recorded with its classification, reason and digest, so exclusions are auditable rather than silent. (2) Ranking is source-aware. The old scorer matched transliterated proper nouns across whole bodies, which is near-noise across 51,614 Persian lines and put the correct passage outside the top 40 for 33 of 33 reviewed Rumi entries. The new matcher aligns section title against section title — Nicholson titles his Persian sections, and Whinfield titles his verse sections with a translation of the same heading — scoring the union of the story heading (which names the figures) and the verse-section title (which locates the passage). Matching is on word boundaries, not substrings (`نی` occurs inside unrelated words and buried `نی‌نامه`, the Song of the Reed itself), and generic devotional vocabulary is excluded from the lexicon outright, since two passages sharing "love" or "heart" is what the old scorer already produced.
- **Result:** 643 English segments → 108 pairable verse, 535 excluded (184 heading, 86 apparatus, 85 prose argument, 81 footnote, 55 uncertain, 44 commentary). Of 108 verse units, 47 rank at least one candidate and 61 have no signal. The matcher independently reaches the audit's Moses/Solomon verdict from titles alone: sequence 121 does not appear in *Moses and the Shepherd*'s candidate list, and `انکار کردن موسی بر مناجات شبان` (seq 65) ranks first. Ground-truth pairs verified: Prologue→`نی‌نامه`(0), Prince/Handmaid→`پادشاه و کنیزک`(1), Harper→`پیر چنگی`(466), Arab/Dog→(361).
- **Files Changed:** `scripts/poetry/{align-verse-sections,build-verse-candidates}.ts` (new), `tests/content/alignVerseSections.test.ts` (new), `docs/audits/divan/2026-07-14-review-conflicts.md` (new), `sources-private/poetry/reports/candidates-summary.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; `pnpm vitest run tests/content` 346/346 (21 files; +8 net-new), typecheck 0, lint 0. Excerpt-bearing `rumi-verse-candidates.json` is git-ignored by existing pattern; the tracked summary carries counts and caveats only.
- **Known limitation:** Ranking is a hint, not identification, and single-anchor (score 1) hits are demonstrably unreliable — `عمر` is both the name Omar and the common noun "life", and "The Arab and his Wife" ranks the Arab-and-**dog** story on `اعرابی` alone. Recorded in the tracked summary. 61 of 108 verse units have no title signal at all: abstract section titles ("Trust in God, as opposed to human exertions") name no figure. Persian book boundaries are NOT derived — Nicholson's sections carry no `دفتر` marker and the source offers no concordance, so book is recorded as English-side evidence only, never as a filter. Inventing one would fabricate provenance.
- **Follow-ups:** Phases 4-5, 7 (canonical records, per-record machine verdicts, packet v2) not done. Corpus remains 0 canonical records; launch gates stay closed and cannot open without human approval by design.

## 2026-07-14 — English block classification: stop prose arguments becoming poetry

**Raouf:**

- **Scope:** Phase 1 of the alignment-pipeline repair mandated by the preflight audit. Classification only — no pairing, verdict, approval, or corpus change. The human approval gate is untouched and stays required.
- **Summary:** The 2026-07-14 preflight found eight pairings that attached Persian verse to Whinfield's **prose story argument**, all eight accepted by a human reviewer. Root cause was the pairing unit, not reviewer inattention: the English side was the whole story-body block, whose first line is the argument and whose remaining lines are the verse — which the review packet never displayed. Whinfield's EPUB is flat (`<br/>`-separated, one `<p>` per story), so no markup distinguishes argument from verse; the split has to be structural. Added `classify-english-blocks.ts`: a closed enum (`verse_translation`, `prose_summary`, `commentary`, `heading`, `footnote`, `editorial_apparatus`, `uncertain`) with only `verse_translation` pairable. Signals are structural, never thematic — prose is never re-read as verse because it discusses the same story. Thresholds are measured, not guessed: across 8,004 extracted lines the distribution is strongly bimodal (verse p50 47, p90 56 characters; prose mean 571), with an empty band between ~70 and ~150. `NOTES:` is handled positionally, so footnote bodies short enough to look like verse are still apparatus. Section titles are peeled off the front of a verse run by terminal punctuation: of the 127 short lines directly following an argument, 103 end in a full stop and are titles, while verse landing there ends mid-clause ("Second causes only operate in subordination to,").
- **Result:** Over the live extraction — 643 segments: 108 `verse_translation` (6,983 verse lines, 93 carrying a section title), 85 `prose_summary`, 184 `heading`, 86 `editorial_apparatus`, 81 `footnote`, 44 `commentary`, 55 `uncertain`. Whinfield's genuine verse, never previously offered to the reviewer, is now the only pairable English.
- **Files Changed:** `scripts/poetry/classify-english-blocks.ts` (new), `tests/content/englishBlockClassification.test.ts` (new), `eslint.config.js`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. `pnpm vitest run tests/content` 338/338 (20 files; +7 net-new), `pnpm typecheck` 0, `pnpm lint` 0. Regression tests pin all eight defective English blocks as `prose_summary` and unpairable, and keep the reed-flute Prologue and Bell's lineated verse eligible.
- **Known limitation:** A section title sitting **between** two verse sections has no prose anchor before it and no markup to find it by, so it stays inside its verse run. That is a boundary imprecision within verse, not a category error — excerpt boundaries are settled downstream by review. Not guessed at.
- **Follow-ups:** Phases 2-9 (verse-only inventory, source-aware matching, canonical records, machine alignment, packet, gates). `eslint.config.js` now ignores `.remember/**` — a git-ignored local plugin artefact outside the TS project that was failing `pnpm lint`.

## 2026-07-14 — Machine alignment verification: require proof a pairing corresponds

**Raouf:**

- **Scope:** The net-new part of the bilingual-alignment plan — the parts that did not already exist. The plan's per-record audit was **not** performed and no verdicts were authored: `content-private/` holds zero canonical records, so there is nothing to review (see Follow-ups). Existing gates were left alone rather than duplicated.
- **Summary:** Closed a real gap. `compileCorpus` proved a human approved an item and bound that approval to `canonicalSha256(item)`, but **nothing required that anyone had verified the English excerpt is actually a translation of the Persian beside it** — the only prior "alignment" in the codebase was `z.enum(['line','stanza'])`, a display layout. A final approver could sign a mispaired record and it would compile. Added `machineAlignmentSchema.ts`: a strict, reviewer-identity-free attestation (verdict × classification × confidence × anchors) bound to the item digest and both source snapshot digests. Cross-field rules make dishonest records unrepresentable: `pass` demands high confidence and ≥3 independent anchors (one shared "love/heart/wine" is what a keyword scorer already yields); low confidence can never be release-eligible; `mismatch`/`insufficient_evidence` must be blocked; `composite_correspondence` (non-contiguous spans, common in Whinfield/Bell) cannot be released as one excerpt; blocked records must state a reason; a record needing reapproval is never eligible. Wired as a **production-only** gate refusing missing, stale-digest, blocked, reapproval-pending, future-effective, or wrong-edition records. Registry defaults to empty, so production fails closed.
- **Files Changed:** `src/lib/content/machineAlignmentSchema.ts` (new), `src/lib/content/{compileCorpus,registrySchemas}.ts`, `tests/content/{machineAlignment,machineAlignmentGate}.test.ts` (new), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, `pnpm check` — vitest 569/569 (44 files; +31 net-new), typecheck/lint 0, `verify:dist`(+leak gate)/`verify:privacy` pass, `build:production`+`verify:qr` still fail-closed. Fixture builds unaffected (40 items). A compiled corpus carries no anchor, evidence, model, or classification data. Wiring verified empirically: with the sentinel gate temporarily neutralised, a production compile fails `Item … is missing machine alignment verification of its Persian-English pairing`.
- **Known limitation:** `validateItemAlignment` is exported and unit-tested directly. Production compilation of the fixture corpus is impossible by design (the sentinel gate fires first), so the gate is not covered end-to-end — the same pre-existing limitation as `validateItemEvidence`. The alternative, a test corpus built to evade the sentinel gate, would ship a worked example of bypassing production protection and was rejected.
- **Follow-ups:** No machine alignment record has been authored, because no canonical record exists to bind one to. This gate is inert until real items exist, and it can never substitute for human approval — production requires both. Poetry rights unchanged: all four sources `status: pending`.

## 2026-07-14 — Complete the MIT licence: align README and bind the grant with tests

**Raouf:**

- **Scope:** Finish the MIT licence added earlier today. The licence stays; the repository is made to agree with it. No product behaviour change.
- **Summary:** `176b360` added `LICENSE` + `"license": "MIT"` but left `README.md` stating the opposite ("All rights reserved. No licence is granted to copy, modify, redistribute, or deploy"). `tests/security/publicReadiness.test.ts:37` guards that position with `not.toHaveProperty('license')`, so the branch was **red from `176b360` onward** (535/536) — the licence entry's "no code/tests affected" claim was false, as only `format:check` was run. Rewrote the README licence section: repository-authored **source code is MIT**, while the Persian poetry/translations, the four third-party source editions (Wikisource transcriptions are CC BY-SA and need attribution), and Persian Society/University marks are explicitly **excluded from the grant**. Replaced the obsolete assertion with two stronger tests binding `LICENSE` + `package.json` + `README.md` into one coherent grant, and asserting the poetry/marks carve-out survives. Verified by mutation: dropping the `license` field, restoring the old README wording, or deleting the carve-out each fail the suite.
- **Files Changed:** `README.md`, `tests/security/publicReadiness.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, `pnpm check` — see footer. Vitest 538/538 (+2 net-new licence tests); the `publicReadiness` failure introduced by `176b360` is resolved without weakening any gate.
- **Follow-ups:** MIT covers this repository's code only. Poetry-source rights are unaffected and independent — all four sources remain `status: pending`, no approved corpus exists, and `build:production` stays fail-closed.

## 2026-07-14 — Add MIT license

**Raouf:**

- **Scope:** Licence the codebase. No behaviour change.
- **Summary:** Added standard `LICENSE` (MIT, © 2026 Raouf Abedini) and `"license": "MIT"` in `package.json`. Applies to this repo's own source only — third-party poetry sources (e.g. Wikisource CC BY-SA transcriptions) keep their own terms and are never committed.
- **Files Changed:** `LICENSE` (new), `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm format:check` clean.

## 2026-07-14 — Poetry source ingestion: live run + real-data fixes

**Raouf:**

- **Scope:** Owner-authorised live run of the ingestion pipeline. Fetched + extracted the real sources and fixed every real-data defect in a loop. Nothing fabricated; verse stays git-ignored private staging; public corpus stays fail-closed.
- **Summary:** All four sources fetched (`source-lock.json`, 5 artefacts). Fixes: archival-redirect allowlist now matches registrable-domain **suffixes** (`*.archive.org` datanodes OK, look-alikes rejected); Bell OCR parser handles bare roman numerals (33 candidate poems); the Persian Masnavi EPUB was index-only, so added a **resumable, rate-limited** Wikisource ProofreadPage section fetcher (`poetry:fetch-masnavi`, `<span class="beyt">` verse, scan-page order, per-section checkpoint + `--assemble-only`) — 85+ sections / ~5,000 lines ingested, continuing on resume; candidate scoring replaced with a **transliterated proper-noun bilingual** matcher (token overlap is 0 across scripts) plus colophon/TOC filters. Hafez Divan (1,816 blocks) and Whinfield (397 blocks) verified as genuine verse.
- **Files Changed:** `src/lib/content/sourceRegistrySchema.ts`, `scripts/poetry/{fetch-masnavi-sections(new),extract-hafez-bell,extract-sources,build-candidate-index}.ts`, `tests/content/{masnaviSections(new),bellOcr,sourceLock}.test.ts`, `sources-private/poetry/{source-lock.json,reports/candidates-summary.json}`, `.gitignore`, `docs/poetry-source-runbook.md`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. `pnpm check` green — format/lint/typecheck 0, vitest 536/536 (42 files), `verify:dist`(+leak gate)/`verify:privacy` pass, `audit --prod` clean, `build:production`+`verify:qr` fail-closed.
- **Follow-ups:** Resume `poetry:fetch-masnavi` to finish all ~1001 sections; human excerpt pairing/approval and §31.2 gates remain outstanding.

## 2026-07-14 — Poetry source ingestion (acquisition + extraction + candidates), adapted

**Raouf:**

- **Scope:** Net-new source-provenance layer of the poetry ingestion plan (its Tasks 2–6, 8, 12), wired to feed the existing authoring/registry/compiler/UI pipeline. The plan's content/mapping/compiler/UI tasks already exist in-repo and more strictly, so they were not rebuilt (reconciliation in `docs/decisions/poetry-source-integration-baseline.md`). Test-first; no live downloads (owner-gated); nothing fabricated; production stays fail-closed.
- **Summary:** Immutable source registry + strict Zod schema (four editions, HTTPS + host-allowlist only). Host-allowlisted streaming downloader with redirect revalidation, size caps, SHA-256 source-lock, HTML-for-EPUB rejection, atomic writes, lock reconciliation — unit-tested without network. Honest source rights _evidence_ (all `pending`; `approved` structurally impossible without a named human reviewer + acquired hash; "ai" rejected). Deterministic stdlib EPUB extraction (raw vs. search text separated, ZWNJ preserved, XXE/entity guard) + orchestrator. Conservative Bell OCR candidate parsing (raw kept, corrections empty, visual-verification flagged). Non-publishable machine candidate index (refused by the production compiler). Archival-leak bundle gate chained into `verify:dist`. New `poetry:*` commands + `docs/poetry-source-runbook.md`.
- **Files Changed:** `src/lib/content/{sourceRegistrySchema,sourceRightsSchema}.ts`, `scripts/poetry/*` (6 TS + `extract-epub.py`), `sources-private/poetry/**` (registry, rights evidence, report, keeps), 7 new `tests/content/*.test.ts` + `tests/fixtures/poetry/build-fixture-epub.py`, `package.json`, `.gitignore`, `.prettierignore`, `docs/{poetry-source-runbook,rights-register-public,decisions/poetry-source-integration-baseline}.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2, branch `feat/poetry-source-ingestion` off `main` @ `6a102f5`. `pnpm check` green: format/lint/typecheck 0, vitest 529/529 (41 files; +57 net-new poetry tests), `verify:dist` (incl. new leak gate) + `verify:privacy` pass, `audit --prod` clean, `build:production` + `verify:qr` fail-closed. Docker skipped (no daemon); no live network fetch performed.
- **Follow-ups:** Owner-gated `pnpm poetry:fetch` then extract/build-candidates → Society reviewers. Public launch still needs approved corpus + rights (incl. CC BY-SA attribution for the Persian Wikisource transcriptions), cultural review, Bell OCR-vs-scan verification, and every existing §31.2 gate.

## 2026-07-13 — Frontend design audit fixes

**Raouf:**

- **Scope:** File-by-file frontend design audit applied. UI polish and PWA wiring only; no content/rights/approvals/production config fabricated; no new runtime dependency, network call, or storage.
- **Summary:** Wired the built-but-unlinked PWA identity — new original `icon.svg` (eight-point khatam star, night/gold, `any maskable`), manifest + `theme-color` + icon links in `index.html`, and manifest `background_color` corrected to `#0B1026` so the install splash matches the dark app. `icon.svg` is now a required fixed browser asset in the release contract and the service-worker schema, copied by the build and precached. Design: Persian verse promoted to nastaliq with generous leading; result actions given a primary/secondary hierarchy. Cleanup: removed the near-invisible `body::before` hatch layer, fixed the undefined `--radius-control` on the skip link, scoped the deep-red `h2` rule to light surfaces, set `color-scheme: dark`, and replaced hardcoded color literals with `--action`/`--ornament-bright`/`--turquoise-light`/`--ember` tokens.
- **Files Changed:** `index.html`, `public/icon.svg` (new), `public/manifest.webmanifest`, `src/lib/content/release.ts`, `src-sw/schemas.ts`, `scripts/build.ts`, `src/styles/tokens.css`, `src/styles/visual.css`, `src/app/core.css`, `tests/offline/artifacts.test.ts`, `tests/offline/helpers.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; `bash scripts/check.sh --e2e` green — `format:check`/`lint` 0/`typecheck` 0, `test` 472/472, `build:fixture`+`verify:dist` pass (`icon.svg` accepted end-to-end), `verify:privacy` pass, `audit --prod` clean, Playwright 5/5. `build:production` and `verify:qr` stay fail-closed; Docker evidence skipped. Result screen visually confirmed.
- **Follow-ups:** iOS home-screen falls back to a screenshot until a PNG `apple-touch-icon` exists; §31.2 launch gates unchanged and remain closed.

## 2026-07-13 — Prettier, quality gate, and CI

**Raouf:**

- **Scope:** Repository professionalisation. No product behaviour changed.
- **Summary:** Added Prettier + `eslint-config-prettier` (wired last so ESLint and Prettier do not conflict) with config/ignore files and `format`/`format:check` scripts, and applied formatting repo-wide (append-only logs and the design authority excluded). Added `scripts/check.sh` — one command running the §30.1 gauntlet with fail-closed launch-gate reporting and `--quick`/`--e2e`/`--ci` modes — exposed as `pnpm check`. Added `.github/workflows/ci.yml` (runs `check.sh --ci` incl. Playwright on `main` pushes and all PRs), `.editorconfig`, a PR template, `CONTRIBUTING.md`, and README badges.
- **Files Changed:** `package.json`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `scripts/check.sh`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, `README.md`, repo-wide formatting, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; post-format `typecheck` 0, `lint` 0, `test` 472/472, `format:check` clean, `scripts/check.sh` passes with launch gates fail-closed. CI workflow uses only static commands (no untrusted input in `run` steps).
- **Follow-ups:** Docker-host and §31.2 launch gates unchanged. Consider requiring the CI `Quality gate` check via branch protection on `main`.

## 2026-07-13 — Full integration, Wave C verification, share card, and evidence

**Raouf:**

- **Scope:** Finish the interrupted stage integration, verify independently, close confirmed defects, and record Task 8 evidence. No design decision reopened; no production content/rights/approvals fabricated.
- **Summary:** The integration branch had B1/B2C/B3/B5/B6 but not B2 (visual) or B4 (offline/service-worker). Merged `agent/b2-visual`, `agent/b4-integration`, and `agent/public-readiness`; ran a six-dimension adversarial review swarm (11 confirmed defects, intended gates separated); implemented the local share card (§15 / criterion 16) and the previously-dangling `verify:*` scripts; fixed two B2↔B4 e2e interaction bugs and the `compose.yaml`→`compose.yml` doc typo; corrected the overstated `RESUME.md`; added `docs/verification-report.md`.
- **Files Changed:** stage merges; `src/lib/share/*`, `src/components/PoemResult.tsx`, `src/app/App.tsx`, `tests/share/*`, `tests/components/shareAction.test.tsx`; `scripts/verify-privacy.ts`, `scripts/ops/*`, `scripts/qr/verify-qr.ts`; `tests/e2e/visual.spec.ts`, `tests/e2e/offline-server.ts`; `docs/implementation-plan.md`, `docs/verification-report.md`, `RESUME.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, commit `c552189`. typecheck 0, lint 0, vitest 472/472 (34 files), Playwright e2e 5/5, security 52, content 236; `verify:dist`/`verify:privacy`/ops `verify:*` pass; `audit --prod` clean; budgets within §21.3; `build:production` and `verify:qr` fail closed as intended.
- **Follow-ups:** Docker-host image/scan/live-verify evidence is environment-blocked here; all §31.2 launch gates (corpus/rights, cultural, manual AT, hostname/mark approval, live deploy, rollback rehearsal, physical QR) remain closed.

## 2026-07-13 — Test-harness hygiene and resume handoff

**Raouf:**

- **Scope:** Make the full local suite reliably green on a clean checkout and hand the work off. No product behavior changed.
- **Summary:** Excluded Playwright end-to-end specs from vitest (`tests/e2e/**`), so `pnpm test` stops collecting `accessibility.spec.ts` and failing on `test.beforeEach`; raised vitest `testTimeout`/`hookTimeout` to 30 s so ops/release tests that spawn real builds and shell scripts via `execFileSync` stop timing out at 5 s under concurrent load; ignored the determinism test's leftover `.tmp-tests/` output in ESLint and git so lint stops erroring on nested build JavaScript. Added `RESUME.md` with stage status, the verified baseline, and the next task.
- **Files Changed:** `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `RESUME.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 377/377 (21 files), `pnpm test:content` 234/234, `pnpm build:fixture` + `pnpm verify:dist` passed, `pnpm build:production` retained exit 1 with `no approved production corpus exists in content-private`.
- **Follow-ups:** Resume at Task 7 (Wave C verification) then Task 8 (final gauntlet + `docs/verification-report.md`); all content, rights, cultural, manual-accessibility, deployment, rollback, and physical-QR launch gates remain blocked.

## 2026-07-13 — Illuminated visual system and truthful context routes

**Raouf:**

- **Scope:** B2 production visual system, responsive core-stage polish, bounded motion, contextual documents, and visual/performance regression evidence.
- **Summary:** Added the exact locked colour system; local Fontsource Cormorant Garamond, Inter, Vazirmatn, and short-label Noto Nastaliq Urdu; original sanitised inline manuscript, garden, pomegranate/cypress, reed, rosette, and constellation geometry; distinct Hafez and Rumi portals; manuscript/reveal/result surfaces; and static reduced-motion/coarse-pointer fallbacks. Added `/about`, `/credits`, `/accessibility`, `/privacy`, and `/offline` with verified-release-derived credits and evergreen, conditional cache wording that never fabricates readiness. No remote or third-party artwork, University branding, production approval, private content, package/lock, service-worker/share, or operations change was introduced.
- **Files Changed:** `src/styles/**`, scoped visual components/scenes/pages and shell wiring, `tests/components/contextRoutes.test.tsx`, `tests/components/visualLanguage.test.tsx`, `tests/performance/visualBudgets.test.ts`, `tests/e2e/visual.spec.ts`, the Playwright test match, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; TDD RED 11 failed/1 passed before implementation. GREEN: components 51/51, accessibility 18/18, performance 5/5, Playwright visual/motion 2/2, fixture build, dist verification, typecheck, and lint. Seventy screenshots covered all core/context states across five required baselines with no horizontal overflow or remote request. Compiled gzip sizes: HTML 644 B, CSS 4,847 B, JavaScript 91,135 B, critical fonts 115,816 B; raster images 0 B.
- **Follow-ups:** Manual Persian shaping and typography in Safari/Firefox, physical iOS/Android/tablet/landscape and 200-percent zoom, measured contrast, focus order, screen-reader/pronunciation review, reveal performance traces, approved production content/rights/cultural review, integrated offline behavior, deployment/isolation evidence, rollback, and physical QR testing remain public-launch blockers.

## 2026-07-12 — Repository baseline

**Raouf:**

- **Scope:** DIVAN release-1 implementation bootstrap.
- **Summary:** Created the protected greenfield repository baseline, recorded active engineering rules, excluded credentials and generated output, and documented the evidence-driven implementation sequence.
- **Files Changed:** `.gitignore`, `.dockerignore`, `AGENT.md`, `CHANGELOG.md`, `docs/implementation-plan.md`.
- **Verification:** The initial commit is created on `main` with `.env` excluded; feature work proceeds on `feat/divan-open-day-r1` and isolated writer branches.
- **Follow-ups:** Build and independently verify every local acceptance criterion while keeping unavailable production, rights, human-review, and physical-event gates closed.

## 2026-07-13 — Permission effective-date enforcement

**Raouf:**

- **Scope:** Shared permission registry contract and corpus compiler evidence timing.
- **Summary:** Required real ISO permission effective dates, rejected incoherent effective/expiry intervals, and rejected permissions that are not yet effective on the injected corpus build date without merging that rule into final-approval timing. Updated only conspicuous synthetic fixtures; no production rights or approval evidence was added.
- **Files Changed:** `src/lib/content/registrySchemas.ts`, `src/lib/content/compileCorpus.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/fixtures/content/corpus.ts`, `content-private/README.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused registry/compiler tests 58/58; full content tests 141/141; strict TypeScript typecheck passed; ESLint passed with zero warnings or errors.
- **Follow-ups:** Production compilation and public launch remain blocked until authentic human permission records and every independent release gate are verified.

## 2026-07-13 — Deterministic content release build

**Raouf:**

- **Scope:** B3 private content loader, release compiler, fixture build, and distribution verification.
- **Summary:** Added strict YAML and filesystem boundaries, canonical content-addressed corpus and asset-manifest generation, exact non-production fixture output, secure production configuration parsing, the expected missing-corpus stop gate, and public-dist tamper/private-leak verification. Added editor, asset, and public-rights guidance that explicitly records the absence of approved production records.
- **Files Changed:** `scripts/content/loadContent.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `docs/content-style-guide.md`, `docs/asset-register.md`, `docs/rights-register-public.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful module-absence RED followed by embedded-URL and non-UTC timestamp RED; focused release-layer tests 25/25; full content suite 166/166; typecheck, lint, fixture build, and dist verification passed. `build:production` exited 1 with `Production build blocked: no approved production corpus exists in content-private.`
- **Follow-ups:** Keep production compilation and public launch closed until authentic content, asset, permission, approval, cultural-review, accessibility, security, deployment, rollback, and physical-QR evidence exists and passes every independent gate.

## 2026-07-13 — Release build security review fixes

**Raouf:**

- **Scope:** B3 asset completeness, filesystem replacement safety, private-source leakage, remote resources, and distribution verification.
- **Summary:** Made compiled audio, the asset manifest, and emitted bytes an exact verified join; limited production asset loading to canonical non-symlink `public-static/`; added only an explicit fixture `TEST ONLY - NOT AUDIO` payload; constrained destructive replacement to `<explicit projectRoot>/dist`; rejected all URI schemes using `://` and protocol-relative values; loaded exact private-only values from the matching fixture or production source records while preserving intended public credits and paths; and rejected symlinked dist roots before `realpath`.
- **Files Changed:** `scripts/build.ts`, `scripts/content/loadContent.ts`, `scripts/verify-dist.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `tests/content/buildRelease.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/fixtures/content/corpus.ts`, `docs/asset-register.md`, `docs/content-style-guide.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED captured 10 original reviewer gaps plus six production asset-loading gaps; focused tests 46/46; full content tests 187/187; fixture build and dist verification passed; typecheck and lint passed; production build retained the exact required exit-1 missing-corpus message.
- **Follow-ups:** No production content or asset has been created or approved; keep all production and public-launch gates closed pending authentic human evidence and complete independent verification.

## 2026-07-13 — Bounded asset reads and resource-scheme rejection

**Raouf:**

- **Scope:** Final B3 release-size, file-read, and resource-value controls.
- **Summary:** Reused one 100,000,000-byte maximum across private registry and public asset-manifest schemas, rejected invalid filesystem size/type/symlink metadata before content reads, hashed asset files in bounded chunks, capped production content collection, and blocked `data:`, `blob:`, `mailto:`, `file:`, `tel:`, `ws:`, `wss:`, `ssh:`, and `sftp:` alongside existing remote forms while allowing ordinary prose such as `Note: this is text`.
- **Files Changed:** `src/contracts/release.ts`, `src/lib/content/registrySchemas.ts`, `src/lib/content/release.ts`, `src/lib/content/remoteResource.ts`, `scripts/content/readAssetFile.ts`, `scripts/content/loadContent.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/release.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED captured 19 schema/resource failures and two pre-read `EACCES` failures; GREEN focused tests 106/106 and full content tests 212/212; fixture build, dist verification, typecheck, and lint passed; production build preserved the exact expected exit-1 blocker.
- **Follow-ups:** The production corpus and production assets remain absent by design; public launch stays blocked pending genuine evidence and every separate launch gate.

## 2026-07-13 — Bare-colon URL resource rejection

**Raouf:**

- **Scope:** Final narrow B3 URL predicate fix.
- **Summary:** Extended the existing explicit dangerous-scheme list to reject bare-colon `https:`, `http:`, `ftp:`, `ftps:`, and `javascript:` values in both source loading and public-dist verification without adopting an overbroad arbitrary `word:` rule.
- **Files Changed:** `src/lib/content/remoteResource.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced 10 loader/verifier acceptances; GREEN direct tests 74/74 and full content tests 222/222; fixture build, dist verification, typecheck, and lint passed; production build preserved the exact required exit-1 blocker.
- **Follow-ups:** No production content or approval was added; all production and public-launch gates remain closed.

## 2026-07-13 — Application domain and secure local draw

**Raouf:**

- **Scope:** B1 state machine, browser-history records, storage boundaries, secure integer selection, and per-poet shuffle bags.
- **Summary:** Implemented the locked application-stage reducer with stale-data recovery, exact three-field history state, release-matched session restoration using only the six approved keys, local motion preference persistence, Web Crypto rejection sampling across the full 1 through 2^32 contract, and Fisher-Yates bags restricted to approved active IDs. Bags return each eligible ID once per cycle, expose reset metadata, fail closed when empty, and persist only public remaining IDs while the release still matches.
- **Files Changed:** `src/app/state.ts`, `src/app/history.ts`, `src/lib/draw/secureRandom.ts`, `src/lib/draw/shuffleBag.ts`, `src/lib/storage/session.ts`, `tests/unit/state.test.ts`, `tests/unit/history.test.ts`, `tests/unit/secureRandom.test.ts`, `tests/unit/shuffleBag.test.ts`, `tests/unit/storage.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED produced 12 reducer/random assertion failures, 11 history/storage/shuffle assertion failures, and three security-review regression failures; final unit suite passed 38/38, content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Wire the domain layer into the separately owned React/browser shell with injected native storage and crypto adapters; production and public launch remain independently blocked pending genuine content, rights, human review, accessibility, security, deployment, rollback, isolation, and QR evidence.

## 2026-07-13 — Accessible React core flow

**Raouf:**

- **Scope:** B1 browser release runtime and semantic React core experience.
- **Summary:** Added a strict no-store, no-redirect release/corpus loader with Web Crypto verification and privacy-safe blocking recovery; composed the reviewed reducer, history, storage, and shuffle domains into the locked Hafez/Rumi flow; preserved one active scene and `h1`, English-before-Persian live RTL content, bidi-safe provenance, one persistent polite live region, bounded full/reduced reveal timing, keyboard skip, result focus, native optional audio, and safe Back/retry behavior; and added only minimal responsive accessibility CSS pending B2 visual ownership.
- **Files Changed:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/runtime.ts`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/*.tsx`, `src/scenes/*.tsx`, `tests/components/*.ts`, `tests/components/*.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful missing-module/document RED plus six runtime/audio hardening RED failures; GREEN component/runtime/document tests 25/25; inherited unit tests 38/38; inherited content tests 222/222; strict TypeScript and ESLint passed.
- **Follow-ups:** Keep B2 visual polish, context/share/offline/deployment slices, production corpus and rights evidence, manual accessibility proof, and all independent public-launch gates closed until their owners complete and verify them.

## 2026-07-13 — React core independent-review fixes

**Raouf:**

- **Scope:** Task 2B runtime parity, durable browser history, required disclaimer, focus stability, and verified-offline readiness.
- **Summary:** Mirrored the full build Markdown/audio-path rejection boundary in browser-safe code and tested both parsers against one digest-valid parity table; replaced current-state Back inference with exact validated pop-state traversal; excluded `revealing`, used replace-only initial/hydrated history, and restored approved results across real Back/Forward without putting poem IDs in history or URLs; installed the required verbatim disclaimer immediately after the reveal control; kept skip tabbable without focus theft; and suppressed offline-ready during pending or rejected verification.
- **Files Changed:** `src/app/App.tsx`, `src/app/history.ts`, `src/app/runtime.ts`, `src/scenes/IntentionScene.tsx`, `src/scenes/RevealScene.tsx`, `tests/components/appFlow.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/runtime.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused RED failures 6 schema parity, 3 history, 2 disclaimer, 1 focus, and 2 offline gating; GREEN component tests 39/39, unit tests 38/38, content tests 222/222, strict TypeScript and ESLint passed.
- **Follow-ups:** Final visual design, context/share/offline-cache/deployment work, approved production content, external reviews/evidence, and all public-launch gates remain outside this focused correction and blocked.

## 2026-07-13 — Atomic Vite and content distribution assembly

**Raouf:**

- **Scope:** Complete static browser/content build integration and non-destructive activation.
- **Summary:** Added deterministic local-only Vite output with no source maps or environment loading; allowlisted fixed and content-hashed browser assets with exact MIME, byte and SHA-256 records; expanded distribution verification to semantic HTML, UTF-8, local runtime resources, media signatures and private-source leak checks; and changed activation to verify a private staged tree before identity-checked rename/restore handling. No service-worker placeholder or production content was created.
- **Files Changed:** `.gitignore`, `vite.config.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; focused browser-shell, inline-script, private-leak, remote-runtime and previous-dist preservation RED/GREEN tests; full content suite 227/227; components 25/25; unit 38/38; typecheck and lint passed; repeated fixture tree hashes matched; fixture build/dist verification passed; production build retained the exact expected exit-1 approved-content blocker without replacing the good dist.
- **Follow-ups:** Add and independently verify the real B4 offline release before requiring its worker/manifest/offline files, and keep every production/public launch gate closed until external evidence is complete.

## 2026-07-13 — Static assembly review fixes

**Raouf:**

- **Scope:** Environment isolation, embedded remote-resource coverage, and activation-status correctness.
- **Summary:** Replaced Vite's default environment prefix with an explicit public-only namespace, rejected additional remote HTML embeds/SVG resources/JavaScript network forms after coherent rehashing, tested previous-dist restoration on activation failure, and kept verified activation successful when only obsolete-backup cleanup needs manual maintenance.
- **Files Changed:** `vite.config.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; adversarial environment/iframe/SVG RED reproduced all three gaps; focused fixes 5/5, full content 232/232, typecheck/lint and real fixture build/dist verification passed.
- **Follow-ups:** Obtain independent re-review before integration and retain the production/offline/external launch gates.

## 2026-07-13 — Browser URL-bearing resource closure

**Raouf:**

- **Scope:** Final narrow static-distribution remote-resource correction.
- **Summary:** Validated URL-bearing attributes generically in emitted HTML, including inline SVG, and blocked literal remote DOM resource assignment through compiled JavaScript `setAttribute` calls.
- **Files Changed:** `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; two adversarial RED cases became GREEN 2/2; content 234/234, typecheck/lint, fixture build, and dist verification passed.
- **Follow-ups:** Integrate only after final independent approval; retain every separate release and launch gate.
## 2026-07-13 — Isolated production delivery controls

**Raouf:**

- **Scope:** B6 immutable container, static delivery headers, tunnel isolation, digest-only deployment/rollback, and operator documentation.
- **Summary:** Added a digest-pinned BuildKit frontend and multi-stage image whose default production build fails closed, an unprivileged Caddy runtime with its unnecessary low-port file capability removed, exact security/cache behavior with disabled access logs, content-aware internal health, two explicitly named Compose networks with no host ports, a fixed-order tunnel template and validated renderer, and strict scripts that preserve verified image state and restore failed candidate or rollback attempts without server-side builds. Documented only the approved sanitized host snapshot, both multi-platform and x86_64 image digests, recovery boundaries, and unresolved launch gates.
- **Files Changed:** `ops/Dockerfile`, `ops/Caddyfile`, `ops/compose.yml`, `ops/cloudflared/config.yml.example`, `ops/scripts/*.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/*`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; security TDD RED 16 initial failures plus focused capability/cache/input/state failures; GREEN 22/22 security tests; unchanged 222/222 content tests; typecheck and lint passed; Compose config and cloudflared ingress validated; explicit fixture image build and hardened container smoke passed with exact CSP/cache/health behavior; default production image build failed at the expected absent-approved-corpus gate.
- **Follow-ups:** Production/public launch remains blocked until a genuine approved image and corpus, dedicated domain/tunnel, provider-log/firewall/host decisions, SBOM and scan evidence, unchanged-neighbour proof, live deployment and rollback rehearsal, and every independent governance, accessibility, cultural, rights, security, and physical-QR gate has evidence. No live system was contacted or changed.

## 2026-07-13 — Delivery-control review hardening

**Raouf:**

- **Scope:** Independent review fixes for immutable production activation, cloudflared file ownership, bounded restoration, exact runtime isolation, public release/header/cache verification, and health/state safety.
- **Summary:** Required production labels plus production-eligible release bytes, fixed the tunnel-file ownership contract so mode-`0400` UID/GID `65532:65532` files do not require operator read permission, verified exact image IDs/repository digests and complete runtime hardening for both containers, and made failed deploy/rollback restoration stop the DIVAN stack. Public verification now uses HTTPS-only bounded requests, reconciles release/content/manifest identity and hashes, checks exact browser headers and cache policies, and proves both hashed and unhashed missing paths stay no-store 404s. Caddy grants immutable caching only when a matching content-addressed file exists.
- **Files Changed:** `ops/Caddyfile`, `ops/compose.yml`, `ops/scripts/container-health.sh`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/render-tunnel-config.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; two meaningful RED rounds failed 3/32 tests each; final operations tests passed 32/32 and content tests 222/222; typecheck, lint, fixture build/dist verification, Bash/POSIX syntax, diff hygiene, Compose config, and Caddy validation passed. The fixture image was rebuilt and rejected by production health with exit 1. Both package and Docker default production builds failed with the exact missing-approved-corpus blocker. Full healthy-image runtime smoke is deferred only until these ops changes are integrated with the already completed application build that supplies `index.html`.
- **Follow-ups:** Run the definitive local hardened-container/header smoke after integration. Production and public launch remain blocked by authentic corpus/rights/reviews, domain/tunnel/provider-log decisions, host/firewall and unchanged-neighbour evidence, SBOM/scans, live rollback rehearsal, accessibility/device/governance approval, and physical-QR testing.

## 2026-07-13 — Fail-closed activation and runtime release binding

**Raouf:**

- **Scope:** Critical activation/restoration error handling and exact mount, network, tmpfs, and public-release runtime verification.
- **Summary:** Moved restore-image pull/label/digest validation ahead of activation and replaced scattered post-failure stops with an armed exit/signal handler that remains active until a candidate or restoration is fully verified. Exact runtime checks now reject swapped tunnel source files, any web bind/volume, tmpfs drift, wrong network driver/internal/role/ownership state, and unrelated network members. Public verification compares fetched `release.json` with the exact running container's `/srv/release.json` identity and SHA byte for byte.
- **Files Changed:** `ops/compose.yml`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/mock-bin/docker`, `tests/fixtures/ops/mock-bin/stat`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED 8/43; GREEN security 43/43 with mocked deploy/rollback prerequisite and verification failures plus isolation/release mismatch negatives; content 222/222; typecheck, lint, fixture build/dist verification, Bash/POSIX syntax, diff check, Compose rendering, Caddy validation, and the expected production-package blocker passed.
- **Follow-ups:** Re-run the healthy hardened-container and public delivery smoke on the integrated application branch. All authentic content, governance, accessibility, live infrastructure, provider logging, host isolation, security scanning, rollback rehearsal, and physical-QR gates remain closed.
## 2026-07-13 — Accessibility hardening and browser evidence

**Raouf:**

- **Scope:** B5 semantic flow, focus management, reduced-motion precedence, reflow, live status, audio resilience, and accessibility automation.
- **Summary:** Added narrow accessibility focus/motion helpers and focused shell corrections for predictable scene and Back focus, a useful skip link, one active landmark/heading flow, stored-versus-system motion behavior, two-tone focus, 44-by-44 targets, and unconstrained 320-pixel/text-spacing reflow. Added jsdom axe coverage for every core and blocking-error scene plus deterministic Chromium keyboard, browser-history, reflow, motion, skip, audio-failure, and browser-axe checks using only the conspicuous non-production fixture release.
- **Files Changed:** `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/SkipLink.tsx`, `src/scenes/*.tsx`, `src/lib/accessibility/*.ts`, `tests/accessibility/*.ts*`, `tests/e2e/accessibility*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; resumed TDD GREEN accessibility tests 16/16, component tests 39/39, unit tests 38/38, TypeScript and ESLint passed; real Chromium Playwright checks passed 2/2. Automated results are bounded evidence and are not a WCAG-conformance claim.
- **Follow-ups:** Manual VoiceOver/TalkBack, Persian-pronunciation, actual-device/browser, 200-percent zoom, contrast, focus-order, and unfinished context-navigation evidence remain launch blockers alongside every non-accessibility public-launch gate.

## 2026-07-13 — Accessibility review fixes

**Raouf:**

- **Scope:** Reduced-motion rendering, blocking-error focus, and deterministic default E2E setup.
- **Summary:** Made reduced reveal motion visibly interpolate opacity from zero to one over 120 ms before result mounting, without changing the full-motion path; moved focus to the mounted error heading when an invalid draw or random-provider exception blocks the experience; and made the default Playwright command build fixture release data before running only the accessibility spec from a clean checkout.
- **Files Changed:** `src/app/App.tsx`, `src/app/core.css`, `src/scenes/RevealScene.tsx`, `tests/accessibility/appAccessibility.test.tsx`, `tests/accessibility/styles.test.ts`, `tests/components/failures.test.tsx`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/accessibility.spec.ts`, `playwright.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced the non-rendering transition and both body-focus failures; GREEN focused tests 25/25, accessibility 18/18, components 41/41, unit 38/38, TypeScript and ESLint passed. The default E2E command listed exactly two tests in one file, Chromium passed 2/2, and a clean-dist rerun rebuilt fixture release output before passing 2/2 again.
- **Follow-ups:** Automated checks remain bounded evidence, not WCAG conformance; all manual accessibility and independent public-launch gates remain blocked pending reviewed evidence.

## 2026-07-13 — Stabilize skip availability timing

**Raouf:**

- **Scope:** B5 skip-control timing margin and browser measurement.
- **Summary:** Reduced skip-control availability from 250 ms to 200 ms, preserving the design's within-300-ms requirement while adding scheduling margin. Updated deterministic tests to enforce the 199/200 ms boundary and Chromium coverage to measure elapsed time from the actual DOM activation event instead of relying on a timeout equal to the requirement.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `tests/e2e/accessibility.spec.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED reproduced absence at 200 ms under the old delay; GREEN component tests 41/41 twice, accessibility tests 18/18 twice, and corrected Chromium tests 2/2 twice with measured skip availability at most 300 ms. Strict TypeScript and ESLint passed.
- **Follow-ups:** This change supplies automated timing evidence only; manual accessibility and every independent public-launch gate remain unchanged and blocked.

## 2026-07-13 — Increase skip timing margin under load

**Raouf:**

- **Scope:** Final B5 concurrent-load skip timing correction.
- **Summary:** Reduced skip availability from 200 ms to 100 ms after concurrent execution reproduced a browser-visible result beyond 300 ms. Updated the deterministic boundary to 99/100 ms and retained the unchanged actual-DOM elapsed assertion of at most 300 ms.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED failed at the 100 ms boundary under the prior setting; GREEN focused behavior passed, five consecutive Chromium runs passed 2/2 under concurrent load, components passed 41/41, accessibility passed 18/18, and TypeScript plus ESLint passed.
- **Follow-ups:** Manual accessibility evidence and all independent production/public-launch gates remain unchanged and blocked.

## 2026-07-13 — Align offline and production delivery contracts

**Raouf:**

- **Scope:** Exact offline recovery delivery, production Docker compiler inputs, and schema-parity immutable caching.
- **Summary:** Served `/offline.html` as its own verified static file with no-cache and noindex headers instead of rewriting it to `index.html`; retained `/offline` as the SPA route; aligned Caddy's existing-file immutable matcher with all build-valid content-addressed manifests, Vite assets, and nested audio/font/image/icon paths; and exposed only the public production compiler inputs as explicit Docker arguments. The deployment runbook now provides the complete approved production command and labels every value as public provenance while preserving the expected no-argument fail-closed build.
- **Files Changed:** `ops/Caddyfile`, `ops/Dockerfile`, `docs/deployment-runbook.md`, `tests/security/opsConfig.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** TDD RED 3/46 became GREEN 46/46; content 234/234, TypeScript, ESLint, shell syntax, diff hygiene, pinned-Caddy validation, and Compose rendering passed. The fixture image built and ran locally with no network or host port, retained its fixture label/flags, and was rejected by production health; the default Docker production build retained the exact missing-approved-corpus failure.
- **Follow-ups:** Perform the final recovery-file byte/header smoke after B4 integration. Production and public launch remain blocked by authentic content and reviews, explicit approved build values, immutable registry evidence, external governance/accessibility/security gates, live isolated deployment and rollback proof, and physical Open Day testing.
## 2026-07-13 — Atomic offline release core

**Raouf:**

- **Scope:** Browser-safe B4 release verification, candidate cache staging, deferred activation, coherent runtime routing, service-worker client events, web manifest, and offline recovery document.
- **Summary:** Implemented strict canonical descriptor, full corpus, item-hash, asset-manifest, and corpus/audio joins without importing Node-only content code. Required assets are status/length/SHA-verified through bounded reads and staged under one release ID; the ready marker is written last; failures remove only the candidate; one atomic pointer retains active plus the immediately previous complete release. Navigation cannot mix release HTML, cache lookups never search another release, health and worker paths have no cached fallback, all-audio precaching is rejected, and optional audio caching requires a direct browser audio request. Client failures remain nonblocking and sanitized; the local-only manifest and semantic recovery page make no remote or unapproved University-brand claim.
- **Files Changed:** `src-sw/cacheTypes.ts`, `src-sw/integrity.ts`, `src-sw/schemas.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `public/manifest.webmanifest`, `public/offline.html`, `tests/offline/*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; RED captured the three absent worker/client suites before implementation; GREEN offline 34/34, inherited content 234/234, strict TypeScript, and ESLint all passed.
- **Follow-ups:** Bundle and register the reviewed worker in the root build, then prove the assembled distribution and real HTTPS/browser/device install, warm-offline, timeout, failed-update, refresh, storage, audio, and rollback paths. Production content, rights/reviews, governance, deployment, and physical-event gates remain independently blocked.

## 2026-07-13 — Offline-core review fixes

**Raouf:**

- **Scope:** Exact activation targets, rollback retention, compressed responses, worker statuses, and lifecycle tests.
- **Summary:** Added release IDs to verified worker statuses and activation messages, activated only the requested ready release including the retained rollback release, emitted and consumed `activating`, and prevented active status after a failed target. Preserved active/previous caches when a release ID is reused incoherently. Accepted decoded bodies whose compressed wire length differs from manifest bytes, kept decoded size/SHA verification, removed stale transfer/encoding headers from reconstructed responses, and added direct install/message/fetch worker event tests.
- **Files Changed:** `src-sw/integrity.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `tests/offline/client.test.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/serviceWorker.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; seven behavior-specific RED failures became GREEN offline 40/40; inherited content 234/234, strict TypeScript, and ESLint passed.
- **Follow-ups:** Complete root bundling/registration and real HTTPS browser/device lifecycle evidence before any offline or public-launch readiness claim.

### 2026-07-13 (Australia/Sydney) — complete offline integration and lifecycle evidence

**Raouf:**

- **Scope:** B4 fixed-worker build integration, exact pending-release activation, secure client registration, accessible update control, coherent first install/update/rollback behavior, and real-browser outage evidence.
- **Summary:** The release builder now emits one fixed classic-IIFE `service-worker.js` plus the reviewed manifest and script-free recovery page, requires all four fixed browser assets in the signed manifest, and stages only exact HTTP 200 decoded bodies. A ready release persists one exact pending target; only a real `mode=navigate` request or explicit matching waiting-worker action can activate it, while scripted HTML-accepting fetches, stale later-built caches, partial responses, failed pointer writes, and failed installs cannot replace the active release. First install bootstraps the exact verified candidate, later activation retains one rollback release, typed release-matched statuses register only after browser release verification, and URL replacement is bound to the exact waiting worker reaching `activated` with retry/redundancy/timeout cleanup. Offline-ready copy is announced only for the exact active verified release.
- **Files Changed:** `scripts/build.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/app/App.tsx`, `src/lib/content/release.ts`, `src/sw-client/register.ts`, `tests/accessibility/appAccessibility.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/offlineIntegration.test.tsx`, `tests/content/buildRelease.test.ts`, `tests/content/release.test.ts`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/offline-server.ts`, `tests/e2e/offline.spec.ts`, `tests/offline/*.ts`, `vitest.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED covered missing fixed outputs, pre-verification registration, insecure registration, implicit/stale activation, scripted-fetch misclassification, HTTP 206 reaching CacheStorage, first-install pointer absence, activation-listener accumulation, and Playwright specs leaking into Vitest. GREEN passed all 426 Vitest tests across 27 files, including 49 offline and 235 content tests; strict TypeScript and zero-warning ESLint passed; fixture build and `verify:dist` passed. Chromium Playwright passed all 3 tests, with the offline test proving install/control, compressed-body staging, no audio precache, warm-offline reload, network-only `/healthz`, exact clean-navigation update, failed-update retention, explicit waiting-worker activation, controller-driven navigation, and rollback.
- **Follow-ups:** `pnpm verify:privacy` remains an inherited external blocker because the referenced B6B `scripts/verify-privacy.ts` is absent; it was not fabricated in B4. Keep Safari, Firefox, Edge, iOS, Android, storage-pressure/eviction, actual HTTPS/domain, production corpus/rights, governance, deployment, rollback rehearsal, accessibility/device, and physical-QR gates blocked until genuine evidence exists. No live system, secret, DNS, firewall, registry, or production content was changed by this slice.

### 2026-07-13 (Australia/Sydney) — committed activation maintenance closure

**Raouf:**

- **Scope:** B4 committed-release cleanup semantics and exact navigation response acceptance.
- **Summary:** Made the atomic active-pointer write the final activation commit boundary. Pending-marker and stale-cache cleanup now run as non-fatal, idempotent maintenance; a failed marker deletion leaves the candidate intact and an explicit same-target retry clears it before stale caches are considered. Navigation accepts only an exact HTTP 200 response for the verified running release, so matching partial-content responses fall back to the active cached shell.
- **Files Changed:** `src-sw/releaseManager.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/runtimeStrategies.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced an activation reported as failed after its pointer had committed and an HTTP 206 navigation returned as live content. GREEN focused release/runtime tests passed 38/38, offline tests passed 52/52, and the full Vitest suite passed 429/429 across 27 files, including stale-cache deletion failure and pending-marker deletion retry coverage. Strict TypeScript, zero-warning ESLint, fixture build/dist verification, three Chromium Playwright flows, diff hygiene, and the staged gitleaks scan passed.
- **Follow-ups:** Retain the existing real-browser, device, storage-pressure, production-content, rights, governance, deployment, accessibility, and physical-QR launch blockers until genuine evidence exists.

## 2026-07-13 — Version service workers by release content

**Raouf:**

- **Scope:** Service-worker byte identity and genuine release-update evidence.
- **Summary:** Embedded the exact public release ID and canonical public-corpus SHA-256 in every fixed worker build, rejected install-time release mismatches, and replaced synthetic E2E worker comments with genuine Vite builds for each update and rollback variant. Content changes now trigger browser worker installation even when source code is unchanged or a release ID is mistakenly reused.
- **Files Changed:** `scripts/build.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, focused content/offline/component/E2E tests, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** RED reproduced identical worker output; GREEN focused tests passed 85/85, typecheck/lint passed, fixture build/dist verification passed, emitted identities were verified, and Chromium offline lifecycle passed 1/1 with genuine versioned workers.
- **Follow-ups:** Run the final integrated gauntlet and independent re-review; all external launch gates remain closed.
## 2026-07-13 — Public source governance

**Raouf:**

- **Scope:** Public repository orientation, source-rights boundary, security reporting, third-party font notices, and removal of deployment-host detail from public documentation.
- **Summary:** Added an honest work-in-progress README, GitHub private vulnerability reporting policy, exact installed OFL 1.1 font notices, a Node runtime pin, repository metadata, and repository-wide ownership. Kept the repository all rights reserved with no open-source licence grant, replaced host discovery with private evidence gates, and renamed the synthetic operations sentinel so it cannot be mistaken for a credential.
- **Files Changed:** `README.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`, `.node-version`, `.github/CODEOWNERS`, `package.json`, `docs/phase-0-environment-decisions.md`, `tests/fixtures/ops/*`, `tests/security/opsConfig.test.ts`, `tests/security/publicReadiness.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0 and pnpm 10.33.0, TDD RED first produced six missing-public-readiness failures and a separate preview-command failure; GREEN passed the focused suite 6/6, security tests 49/49, content tests 234/234, strict TypeScript, zero-warning ESLint, and diff/prose hygiene. The frozen lockfile installed from the offline pnpm store without changing dependency versions. Gitleaks found no leaks in the exact staged snapshot or the 59-commit all-history scan.
- **Follow-ups:** Before any public push, rewrite non-public author and committer email metadata in repository history and rescan the rewritten history; keep GitHub private vulnerability reporting disabled until the owner deliberately enables it. Production content, rights, reviews, live infrastructure, accessibility evidence, and every other launch gate remain blocked.
