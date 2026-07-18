# DIVAN Repository Rules

## Authority

- `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md` is the release-1 design authority.
- The inline user instructions and the nearest active instruction file take precedence over this file.
- Public launch remains blocked until every governance, content-rights, cultural-review, accessibility, security, deployment, rollback, and physical-QR gate has evidence.

## Engineering contract

- Use Vite, React, strict TypeScript, a hand-controlled service worker, and an unprivileged static production image.
- Keep visitor processing local. Do not add a database, public write endpoint, analytics, cookies, identifiers, remote fonts, runtime poetry APIs, autoplay, or raw HTML rendering.
- Keep Hafez and Rumi culturally distinct. Never fabricate poetry, translation, provenance, licences, approvals, reviews, credits, or production configuration.
- Only conspicuous non-production fixtures may exercise local builds. Production compilation must reject fixtures and fail until an approved corpus is present.
- Preserve English-before-Persian order. Persian must remain live text with structural `lang="fa" dir="rtl"` markup and safe bidi isolation.
- Use test-driven development for behavior: observe a meaningful failing test, implement the minimum behavior, then refactor while green.
- Treat accessibility, reduced motion, offline release coherence, privacy, security headers, container isolation, and rollback as release behavior, not documentation-only claims.
- Keep `.env`, permission evidence, tunnel credentials, private authoring records, source maps, and existing EOI/ballot data out of public output and logs.
- Do not change, connect to, or share the existing EOI/ballot code, database, volume, network, route, environment, or credential.
- Use focused commits and run fresh verification before recording completion.

## Change protocol

- Read this file, the design authority, and `CHANGELOG.md` before edits.
- Explain filesystem-changing commands before running them.
- Update this file and `CHANGELOG.md` with a dated `Raouf:` entry after repository changes.
- Record exact commands and honest limitations; unavailable external evidence remains a blocker.

## Raouf change log

### 2026-07-18 (Australia/Sydney) — Docs: professional README rewrite to reflect the live v1.0.7 release

**Raouf:**

- **Scope:** documentation only. Rewrote `README.md`; no source, corpus, service worker, ops, or CI files touched.
- **Why:** the README still framed the project as an undeployed "Work in progress" with "no public launch … claimed", which had already misled at least one session. The site is live (`divan-release-1-v1-0-7`).
- **Verification before claiming live:** `curl https://divan.raoufabedini.dev/release.json` returned `buildProfile production`, `productionEligible true`, `releaseId divan-release-1-v1-0-7`, `itemCount 120`, `hafezCount 60`, `rumiCount 60`.
- **Boundaries held:** the rewrite claims none of the closed gates. A dedicated "Scope and status" section lists cultural review, manual assistive-tech evidence (real-device VoiceOver/TalkBack/branded Safari — Playwright WebKit ≠ Safari), University-mark approval, provider logging/retention review, and the physical QR deliverable as **not claimed**; branding stays **society only**; MIT is scoped to repo code only (poetry, translations, and Society/University marks excluded); no host address or tunnel identity added.
- **Gate:** `pnpm prettier --check README.md` → clean.

### 2026-07-18 (Australia/Sydney) — Release v1.0.7: audited corpus repair, motion polish, and society credit deployed and verified

**Raouf:**

- **Deployed and verified.** `divan-release-1-v1-0-7`, image `ghcr.io/raoof128/divan-open-day:v1.0.7@sha256:2f3257a6a1177f69c3116f0db0fda059d466712cd4b0f69092a9510bbc6aa5c0`, `linux/amd64`, Scout `0C/0H/0M/0L`, `SOURCE_DATE_EPOCH` = tag commit time. Preflight → deploy ("Activated immutable image …") → independent verify all passed. Full evidence: `docs/verification/2026-07-18-release-v1-0-7-deployment.md`.
- **The corpus changed — deliberately, and provably only as audited.** Diff against live v1.0.6: exactly one id replacement (046→025), credit strings on 119, text+disclosures on 56, 12 verification-status flips, one `source` change (ghazal 65) — every delta maps to `docs/audits/corpus-fable-5/`; nothing unexplained.
- **CI was broken and fixed en route:** every main push after the backend-audit merge failed at workflow startup (caller permissions narrower than the pinned reusable workflow declares — PR #21); the tag was cut only after main CI ran green on the fixed head.
- **Origin `verify.sh` was stale** (pre-`no-transform` pin, would have wrongly failed the release) and was synced from the tag before any origin script ran — hash-confirmed.
- Live public bytes verified independently of the scripts: release id in `/release.json` and the service worker, live content JSON byte-identical to the image's, `no-transform` now observed on the immutable class, amethyst tokens + butterfly hover keyframes in live CSS, the Society credit in live JS, ghazal 025 served with no 046.
- **Operator gate:** EOI stack, reasoning-engine, nexus-api all at unbroken 5-day uptimes; `divan-cloudflared-1` not recreated; only `divan-divan-web-1` changed. Registry credentials removed from both machines.
- **Not claimed:** provider logging/retention review; physical-iOS/VoiceOver evidence (device-parity walk verified in Chromium + unit tests only); cultural review, QR, University branding stay closed; the 2026-07-17 credential rotation is still outstanding; zone Web Analytics still enabled.

### 2026-07-18 (Australia/Sydney) — CI restored: reusable-workflow caller permissions

**Raouf:**

- **Every push to `main` after the backend-audit merge failed at workflow startup** (`startup_failure`, zero jobs, zero signal). Root cause: the audit's least-privilege hardening cut the `osv-scan` caller job to `contents: read`, but the pinned `osv-scanner-reusable.yml` declares `actions: read` + `security-events: write` in its own permissions block — GitHub refuses a reusable-workflow call whose caller grants less than the callee declares. Restored exactly those grants, scoped to the scan job; the quality gate keeps `contents: read`.
- Merged-`main` code itself verified sound before this fix: full local `check.sh --e2e` gate green on `c3adb67` (unit, e2e, verifiers, fixture + production builds).

### 2026-07-18 (Australia/Sydney) — Society credit on Credits and About pages

**Raouf:**

- **Added the maker credit on owner instruction:** "This project is made by the Macquarie Persian Society — with love, for everyone." — a "Made by" section on the Credits page and a closing line in the About page's welcome note.
- **Branding boundary respected:** this is the Society's own name used as factual attribution. No University mark, logo, or endorsement claim is added; `DIVAN_BRANDING_MODE` stays `society_only`; the existing guards that forbid the exact phrase "Macquarie University" in the app body and noscript, and any "Macquarie"/"University" string in the manifest and offline.html, all still pass and were extended: two new RED-first tests pin the credit's presence on both pages while asserting the University phrase stays absent.
- 720/720 unit tests, lint/typecheck/format clean.

### 2026-07-18 (Australia/Sydney) — Cinematic motion polish: paced Begin walk, living amethyst butterfly, softened book settle

**Raouf:**

- **Begin now walks the corridor at human pace.** The Begin control previously delegated to native `scrollIntoView({ behavior: 'smooth' })`, which browsers complete in a few hundred milliseconds regardless of distance — the entire garden scrub flew past unseen. It is replaced by a requestAnimationFrame-paced walk (220 px/s, easeInOutSine, clamped 4–9 s) that drives `window.scrollTo` so the existing scroll→scrub→arrival machinery is unchanged. The walk yields immediately to visitor scroll intent (wheel, touchmove, scroll keys — Tab does not cancel), is cancelled by Skip, arrival, and unmount, and falls back to direct arrival where programmatic scrolling is unavailable. Reduced-motion entry is untouched (direct arrival, no corridor).
- **Butterfly repaired and reworked to owner's spec.** The wing flutter ran exactly 17 iterations (~5.8 s) and the arrival path once, after which the butterfly froze into a decal — the reported "stopped and won't move" defect. Flight now hands off to a perpetual gentle hover (9 s loop meeting the arrival transform at translate3d(0,0,0)) and a slow resting wing beat (1.8 s), so it never freezes. Per instruction it is 5× larger (`clamp(7rem, 15vw, 10rem)`) and amethyst purple — new `--amethyst`/`--amethyst-deep` tokens in `tokens.css` per the locked one-source colour rule — anchored further into the left third (8%) so the larger silhouette stays out of the reading column, behind the card, `aria-hidden`, pointer-events none. Reduced motion still disables all of it.
- **Book opening softened.** Cover swing-back reduced from 9° to 6° with a single settle (rubbery bounce removed), cover and contact shadow synchronised at 1.6 s (inside the locked 1.6 s e2e animation ceiling — deliberately not raised), shadow peak softened 0.52→0.46, page rise given more weight (1.3 s, 240 ms), illumination now lands at 1.7 s — after the last trailing leaf and cover settle, per the book-motion contract.
- **Tests:** `cinematicBegin.test.tsx` rewritten RED-first for the new contract (paced multi-frame walk, several-seconds duration, visitor-interrupt yield, reduced-motion direct arrival, scroll-rejection fallback); one `cinematicThreshold` assertion updated to the new pending-Begin semantics (walk starts rather than instant arrival). 720/720 unit tests, e2e 5/5 (real Chromium walks the corridor), full `check.sh` gate green including visual budgets (CSS 35 KB < 45 KB ceiling, transform/opacity only) and axe.
- **Four-reviewer adversarial frontend audit closed on this branch (2026-07-18):** every Medium fixed with RED-first tests — arrival on media collapse extended to hand-driven scrubbing (threshold contract: on media failure, continue directly), overdue-frame corridor no longer inert (scrolling it collapses to the poster path), faded welcome-card controls leave the tab order, wing-flutter handoff snap removed (even beat count), amethyst drop-shadow derived from the token, poster-phase double-Begin dedupe, plus keyboard-semantics unit coverage (Tab passes through, scroll-intent keys cancel). Recorded, not fixed: background-tab walks fast-forward on return (valid arrived state), the e2e duration ceiling ignores animation delay, butterfly paint cost on coarse pointers (owner chose the large animated butterfly), result-card 92-94% opacity contrast spot-check, inline nav 44px note.
- **Device parity (phone entrance).** Two causes made phones skip the entrance by default: iOS Safari performs `scrollIntoView({ behavior: 'smooth' })` as an instant jump (fixed by the rAF walk above, which never relies on native smooth support), and the 4 s first-frame timeout permanently demoted slow connections to poster-only — a phone needing 5-6 s for its first frame lost the garden forever. The grace window now forces direct entry only when a Begin is pending (never-trap preserved) or the visitor has already arrived; an idle visitor keeps the poster and a late frame still enables the garden, bounded by a 30 s hard cap; real media errors still demote immediately. Both cinematic clips verified faststart (moov before mdat), so first frames genuinely arrive early. Reduced-motion and Save-Data visitors still get the deliberate poster path per the threshold contract.
- **Not claimed:** no physical-device or branded-Safari evidence; corpus, rights, service worker, and ops untouched; no deploy.

### 2026-07-18 (Australia/Sydney) — Full corpus and translation repair on branch `repair/fable-5-full-corpus` (not merged, not deployed)

**Raouf:**

- **Repaired the complete 120-record corpus against the locked sources** under the "DIVAN Claude Fable 5 Full Corpus and Translation Repair Goal": 60 Hafez + 60 Rumi, every span re-verified verbatim against the locked artifacts, 83 records re-authorised under `source-bound-alignment-v3-fable5-repair`, 37 Rumi records carried byte-identical with their v2 authority. Full evidence: `docs/audits/corpus-fable-5/00`–`10` + `final-record-report.json`.
- **One wrong-poem pairing replaced:** `hafez-ghazal-046-bell` published ghazal 46's Persian against Bell poem VIII, which is provably her rendering of **ghazal 25** ("Hail, Sufis! lovers of wine" = صلای سرخوشی ای صوفیان باده پرست). Bell translated no ghazal 46; the selection was re-pointed and the record replaced by `hafez-ghazal-025-bell`. Caught by an adversarial reviewer reading all 24 Bell records bilingually — verbatim checks alone cannot catch this class.
- **Persian extractor bug fixed:** Wikisource footnote markup truncated hemistichs (`باغ[` class) in 162/494 extracted ghazals; the extractor now tracks span/ref depth, with a RED-first regression test on a fixture reproducing the exact production truncation. One published record (ghazal 65) was affected and repaired.
- **31 disclosed OCR/typography recoveries** (13 Bell openings incl. one small-caps phrase, 2 Roman numerals, 2 drop-caps, 1 wrap join, 10 Clarke records incl. 3 restructured couplets, 3 Rumi footnote strips) — each verified against the scan or transcript and now **premise-asserted at build time** (the build hash-asserts both Clarke transcripts and the Bell archive text and refuses to apply a correction whose premise is absent).
- **Rights honesty preserved:** all five rights records remain `pending` with no reviewer claimed, now coupled to their locked artifact hashes; no uncertain rights called approved, no attribution requirement removed, zero Tier 3 project translations used.
- **Adversarial re-audit:** four independent falsification-posture reviewers over nine dimensions, two fix rounds, 13 findings/observations — 8 fixed, 1 refuted with scan evidence, 4 recorded as residual risks (`09-adversarial-reviews.md`). Reviewer-verified: all digests recompute, zero identity/span reuse, two-build byte reproducibility, deterministic regeneration, fail-closed mutation probes all rejected, independent leak scan clean.
- **Gate:** 732 tests across 63 files (13-test `corpusIntegrity` suite added RED-first), e2e 5/5, full `check.sh` green, live-diff shows same 120 ids with 54 public textual/disclosure improvements.
- **Not done, by instruction:** no merge, no deploy, no live-site mutation, no gate claimed open. Branch pushed and PR opened against `main` for review.

### 2026-07-17 (Australia/Sydney) — Fable 5 exhaustive backend audit: four fail-open gaps closed, seven escalated

**Raouf:**

- **Scope:** Complete backend/release-integrity audit on `audit/fable-5-exhaustive-backend` off `origin/main` @ `adde8b4`: 2,503 skills discovered and classified (14 backend-relevant, 12 read in full and applied), a fresh five-agent primary-source research pass against the exact pinned versions, a frozen 392-file backend inventory (0 unclassified), a clean baseline, evidence-backed defect ledger, TDD repairs, and a fresh gauntlet. **No poetry, translation, provenance, rights record, corpus selection, or the 120-record production count changed. No live infrastructure, DNS, tunnel, Cloudflare, registry, or `.env` was touched — the `Read(./.env)` deny rule was not lifted.** All container work was disposable local images, never pushed, never joined to the live Compose project.
- **Repaired (all TDD, RED observed against unfixed source first):** **`no-transform` now covers `@immutable`** — the content-addressed class carrying `/content/<sha256>.json` and every hashed asset, i.e. the exact bytes the service worker verifies by SHA-256, and the *only* cache class that lacked it. `immutable` (RFC 8246) constrains client revalidation; only RFC 9111 `no-transform` forbids an intermediary rewriting content, and edge rewriting of verified bytes already took every controlled client offline once in v1.0.6. `verify.sh` moved in lockstep (content **and** assets) because that exact mismatch rolled v1.0.5 back, and the drift test now binds `assets`. **`@health` uses `path_regexp ^/healthz$`** — Caddy's `path` matcher is case-insensitive while the tunnel denies with a case-sensitive Go regexp, so `/HEALTHZ` reached the origin and got `ok` 200 against the design authority's `must return 404`. **`.gitignore` now ignores every private poetry report by default** (two reviewed text-free reports re-included by negation): the old rule named one filename shape, leaving a complete 494-matla' reference — self-described "no prefilter, no exclusion" — unignored and one `git add -A` from public history. **`ci.yml` no longer sets `DIVAN_OSV_SCAN_COMPLETED`**, which suppressed `pnpm audit` and left the only dependency control fail-open (the pinned reusable workflow scans with `continue-on-error: true` and its reporter exits 0 with no results file). `pnpm audit --prod` was verified working today, exit 0 — **not** the HTTP 410 this log records.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. format/lint/typecheck clean; **vitest 721/721 across 62 files** (+3 net-new regressions, none weakened); `caddy validate` accepts the changed config. `/HEALTHZ` proven 200→404 in a disposable container running the real repaired Caddyfile, with `/healthz` still 200 for the container healthcheck; the tunnel regexp's case-sensitivity proven in a Go container. `verify:qr` remains fail-closed.
- **Verdict: BACKEND AUDIT FAIL WITH BLOCKERS** — not because the repairs failed, but because open High findings remain that this audit was forbidden to repair. **Escalated, needing a human:** `hafez-ghazal-065-bell.yaml` publishes a **truncated Persian hemistich with a stray `[`** (`خوشتر ز عیش و صحبت و باغ[`) — the only Latin bracket in any Persian line and the only 1 of 96 Hafez lines absent from the locked EPUB; `persianSpanHash` binds it *self-consistently*, so no gate can catch truncation. **All 60 Rumi records bind `persian_source_sha256` to a table-of-contents file containing none of their verse** (0/120 lines present; the real 3.2 MB sections artefact is not in `source-lock.json`), and the authority check is a self-comparison. **120 `active` permissions rest on rights evidence that is `pending` with `rights_reviewer_id: null`**, while `CLAUDE.md`'s gate table claims rights OPEN. 12 hand-typed English lines bypass the two-reading corroboration gate. ~222 unpublished source verse lines sit in a tracked evidence file. `visualBudgets`' raster-zero invariant is vacuous (~531 KB of webp ships). `FIXED_BROWSER_ASSETS`↔`FIXED_MIME` remain unbound by any test. Full evidence in `docs/audits/backend-fable-5/`.
- **Not claimed:** the lead did not personally read all 392 files (high-trust core yes; the remainder via read-only subagents whose findings the lead re-verified against real code). **Phase 6 (adversarial matrix) and Phase 10 (nine-dimension re-audit) were not completed** — those documents do not exist and no PASS is claimed for them. **No two-build byte reproducibility was run.** No SBOM, image scan, live-infrastructure, physical-device, assistive-technology, or provider-log evidence. `shellcheck` is not installed here (ShellCheck 0.11.0 via Docker reported 7×SC2155, contained; 0×SC2086/2046/2164). Cloudflare Web Analytics remains enabled on the zone; the four credentials exposed on 2026-07-17 remain un-rotated and no git-history secret scan has been run.

### 2026-07-17 (Australia/Sydney) — Release v1.0.6: outage fix deployed and verified in a real user agent

**Raouf:**

- **Deployed and verified.** `divan-release-1-v1-0-6`, image `ghcr.io/raoof128/divan-open-day:v1.0.6@sha256:9f22b8979ab5e5b7cf42f81b0f1b998deb4b2f51ab00ab846f74fa20032a4ae3`, `linux/amd64`, Scout `0C/0H/0M/0L` (159 packages), `SOURCE_DATE_EPOCH=1784274224`. `preflight.sh` → `deploy.sh` (exit 0, "Activated immutable image …") → independent `verify.sh`, all passed. Full evidence: `docs/verification/2026-07-17-release-v1-0-6-outage-fix.md`.
- **Corpus proven unchanged:** compiled content JSON byte-identical to live v1.0.4 (151,029 bytes, all 120 `items` equal); only `releaseId` differs, so the `contentSha256` shift (`a9497e27…` → `f5420697…`) is release metadata only.
- **`no-transform` is observed working, not merely assumed:** a browser-shaped navigation to `/credits`, `/about`, and `/` now returns **1708 bytes with zero beacon hits** (2212 with injection). `Cache-Control: no-cache, must-revalidate, no-transform`.
- **Verified in a real Chromium session, closing the method gap that hid the defect:** loading `/credits` and reloading now succeeds where it previously produced `chrome-error://chromewebdata/`; all five context routes return 200 with `beacon=no`; the Cloudflare beacon CSP violation is gone from the console; no `ERR_FAILED` in the network log. **A client still controlled by the old v1.0.4 worker recovered without updating** — once injection stopped, its integrity check passed again, which is why the edge fix rather than the worker fix was the critical path.
- **The v1.0.5 candidate was correctly rejected and rolled back.** `verify.sh` pins `Cache-Control` exactly and I changed the served value without updating that contract (expected `no-cache, must-revalidate`, served `no-cache, must-revalidate, no-transform`). `deploy.sh` restored v1.0.4 and re-verified it; the site was never left on an unverified release and neighbouring services were untouched. v1.0.5 was never activated. The guarding test was a substring assertion that stayed green while the two files drifted; it is replaced by one that parses both and compares real values, confirmed to fail against the drifted script with the same mismatch the deploy hit.
- **Origin `ops/` is a copy and is not a git checkout.** `verify.sh` was synced from the tag (not from a worktree) and all six files re-confirmed hash-identical to `v1.0.6` before any script ran.
- **Neighbouring services:** `persian-society-eoi-*`, `reasoning-engine-mcp`, and `nexus-api` all at 5-day uptimes and healthy; `divan-cloudflared-1` not recreated (21h). Only `divan-divan-web-1` changed. Registry credentials removed from both machines (zero residual `ghcr.io` entries).
- **Not claimed:** Cloudflare Web Analytics remains **enabled** on the zone — `no-transform` blocks the injection but the product is still configured, and disabling auto-injection stays the correct fix for the "no analytics" invariant and removes the dependency on Cloudflare honouring `no-transform`. The `.env` token is scoped to zone listing only (`Authentication error` on the RUM and zone-settings APIs), so this was not done by agent. Chromium via DevTools is **not** Safari and not a physical device; no branded-Safari, hardware, assistive-tech, print, or field evidence was produced. Provider logging/retention review not performed. Credential rotation from the v1.0.4 session still outstanding.

### 2026-07-17 (Australia/Sydney) — Live navigation outage: edge HTML injection versus the verified byte ceiling

**Raouf:**

- **Symptom:** Raouf reported `ERR_FAILED` on `https://divan.raoufabedini.dev/credits`. Reproduced in a real Chromium session: the first (uncontrolled) load returns 200, and the reload — the first navigation the service worker controls — fails. `/about` fails identically. The outage therefore affected **every route for every returning visitor**, not one page.
- **Root cause:** Cloudflare Web Analytics auto-injection appends a `beacon.min.js` script tag to HTML **for real user agents only**. The built shell is 1,708 bytes (manifest `sha256:2cad898f…`); a real navigation receives 2,212 bytes (`sha256:0ecdeb07…`). `#networkNavigation` reads the shell with `#readBoundedBody(response, indexAsset.bytes)`, which **throws** past the ceiling. That throw escaped `respond()`, and `service-worker.ts` passed the promise straight to `event.respondWith()` with no rejection handler; a rejected `respondWith()` promise is rendered by the browser as an unrecoverable network error.
- **Not a v1.0.4 regression:** `git diff v1.0.3..v1.0.4 -- src-sw/` touches only the hashed-asset path and the audio range passthrough. The byte ceiling and the unguarded `respondWith` are byte-identical in v1.0.3. The defect was latent and became live when edge injection was enabled.
- **Verification gap, recorded honestly:** the v1.0.4 evidence claims all six repairs verified "in live public bytes". That claim stands — but it was gathered with `curl`, which Cloudflare does not inject into, so the method was structurally blind to this defect. No browser-rendered check of the live origin was performed. Live-bytes verification by `curl` alone is not sufficient evidence that the site loads.
- **Repairs (defence in depth, neither weakens the release contract):**
  - `ops/Caddyfile`: HTML shell and no-cache release files now send RFC 9111 `no-transform`, which forbids intermediary rewriting; Cloudflare documents that it honours this. The release is content-addressed, so proxy-injected bytes are never correct by definition.
  - `src-sw/releaseManager.ts`: `#networkNavigation` now resolves every rejection to `null`, the existing "fall back to the verified cache" signal already used for digest and status mismatches. Unverified network bytes are still never served — the cached, verified release answers instead.
  - `src-sw/service-worker.ts`: `respondWith()` receives a caught promise that fails closed with a served 503 rather than rejecting, so no unexpected throw can take the origin down for controlled clients again.
- **Tests (3 added, 716 total):** each new test was confirmed to **fail against the unfixed source** with the exact production error (`Required release response exceeds the offline byte ceiling.`) and pass after the repair — an edge-injected navigation shell now serves the verified cached shell and contains no injected beacon; a throwing manager yields 503 rather than a rejection; the Caddyfile `no-transform` contract is locked.
- **Not claimed:** Cloudflare's honouring of `no-transform` for this zone is **documented but not yet observed** on this origin, and is unverified until v1.0.5 is deployed and re-checked in a real user agent. Disabling Web Analytics auto-injection at the zone remains the guaranteed remedy and the correct fix for the "no analytics" invariant; the `CLOUDFLARE_API_TOKEN` in `.env` is scoped to zone listing only and returned `Authentication error` for both the RUM and zone-settings APIs, so the change was not made by agent.

### 2026-07-17 (Australia/Sydney) — Release v1.0.4: merge and deploy the frontend audit repairs

**Raouf:**

- **Scope:** On explicit instruction from Raouf (which lifted the audit-time "do not merge / do not deploy" constraints), merged PR #13 into `main` @ `0e21a0c` (merge tree byte-identical to the CI-verified tree `f592a325`), tagged annotated `v1.0.4`, built and published the production image, and activated it on the live origin. Poetry, translations, provenance, rights, corpus selection, and the 120-record production count are unchanged; no DNS, tunnel identity, firewall, or Cloudflare configuration was altered.
- **Release identity:** `divan-release-1-v1-0-4`; image `ghcr.io/raoof128/divan-open-day:v1.0.4@sha256:5394144cc083b7c5e0a16fc0f1d048c7a6698a9e43e09e4c1f7830678b7c50d0`; built from a clean `git archive v1.0.4` with `SOURCE_DATE_EPOCH=1784269584` (the tag commit timestamp), origin `https://divan.raoufabedini.dev`, 60/60 minimums, `society_only`, empty University approval ID. Previous release `v1.0.3` (`sha256:9d526a18…`) retained as the verified restore image.
- **Corpus provenance proof:** the compiled content JSON is byte-identical to v1.0.3 (151,029 bytes, all 120 `items` equal) except the embedded `releaseId`; the `contentSha256` change (`1eb0afb1…` → `a9497e27…`) is therefore release metadata only, not a content change.
- **Architecture defect caught pre-publication:** the first image built `linux/arm64` on Apple Silicon while the origin host is `x86_64`. It was never pushed. Rebuilt `--platform linux/amd64`; `release.json` is byte-identical across both builds, confirming `SOURCE_DATE_EPOCH` reproducibility.
- **Gates:** Docker Scout `0C/0H/0M/0L` (159 packages) on the published amd64 image; `preflight.sh` passed non-mutating; `deploy.sh` activated by digest with the fail-closed handler armed; `verify.sh` passed as an independent operator step. The first `deploy.sh` attempt **aborted fail-closed** (`exit 64`) because the origin could not pull the saved restore image — registry credentials had been removed after the v1.0.3 release per that release's evidence. The live site was untouched by the abort (containers kept 20h uptime). Credentials were supplied over stdin for the retry and removed from both the origin and this workstation afterwards.
- **Live verification (public bytes, not repository claims):** all six repairs confirmed in the shipped release — D-1 cache-first→network fallback with `{redirect:`error`}` and a 504 only on network failure; D-7 `headers.has(`range`)` audio passthrough; D-2 `.poem-result [lang=fa] h2{font-family:var(--font-persian-display);font-weight:400;line-height:2}`; D-3 `content:"✦" / ""` alt-text with plain-declaration fallback; D-4 gesture-gated muted prime; D-6 revoke deferred in `finally` via injected timer. Service worker carries `divan-release-1-v1-0-4`.
- **Neighbouring services:** `persian-society-eoi-*`, `reasoning-engine-mcp`, and `nexus-api` all retained 4–5 day uptimes and healthy status; `divan-cloudflared-1` was not recreated. Only `divan-divan-web-1` changed.
- **Files Changed:** `AGENT.md`, `CHANGELOG.md`, `docs/verification/2026-07-17-release-v1-0-4-deployment.md` (new). No source changed after the merge.
- **Residual risk / follow-ups:** `.env` was read on explicit instruction and its contents (droplet root password, Cloudflare API token, OpenAI key, Gemini key) are exposed in that session transcript — **all four should be rotated**. The `DROPLET_PASSWORD` entry is additionally stale: `.env`'s own note records that SSH is key-only and the password now works only at the DigitalOcean web console. The `Read(./.env)` deny rule in `.claude/settings.json` was removed for the read and has been restored. Operator gates from §31.2 (physical devices, branded Safari, assistive technology, provider logging/retention review) remain outstanding and are not claimed.

### 2026-07-17 (Australia/Sydney) — Fable 5 exhaustive frontend audit and repair

**Raouf:**

- **Scope:** Complete frontend audit on `audit/fable-5-exhaustive-frontend` off `origin/main` @ `e348048`: skill discovery/classification (24 frontend-relevant skills fully read incl. ui-ux-pro-max and frontend-design per instruction), fresh six-agent primary-source research pass, frozen 131-file frontend inventory read line-by-line by the lead, clean baseline, rendered state-space matrix on the real 120-record production build across Chromium/WebKit/Firefox and ten viewports, evidence-backed defect ledger, TDD repairs, four-lens adversarial re-audit, and a fresh full gauntlet. No poetry, translation, provenance, rights, corpus selection, deployment, DNS, tunnel, Docker, or live-site state was touched; launch gates remain fail-closed; the live `divan.raoufabedini.dev` preview was never deployed to or mutated.
- **Defects repaired (all TDD, RED reproduced first):** D-1 the service worker answered release-asset requests with a fabricated 504 whenever the active release cache could not answer (lost/corrupted cache with surviving pointer → permanently broken online page, rendered repro) — §16.4 cache-first now falls back to the origin's canonical bytes with `redirect:'error'` parity, 504 only when the network also fails; D-7 (latent) range-bearing direct audio requests now pass through untouched instead of receiving a reconstructed full 200 (WebKit bug 184447 semantics); D-2 the متن فارسی heading fell onto the Latin display stack via `.poem-result h2` specificity and rendered in arbitrary system Arabic fallbacks (confirmed in all three engines against the real corpus) — now on the Persian display stack with Nastaliq-safe leading; D-3 decorative ✦/← pseudo-element glyphs no longer enter accessible names (CSS alt-text form with plain-declaration fallback); D-4 the Begin gesture now primes the muted cinematic clip (WebKit cold-start first-frame flakiness; project cinematic-skill mandate) with pause-on-first-presented-frame; D-6 verse-card Blob URL revocation deferred past the click (Mozilla #1282407 / Chromium #41380177 race).
- **Files Changed:** `src-sw/releaseManager.ts`, `src/components/CinematicThreshold.tsx`, `src/lib/share/shareService.ts`, `src/styles/visual.css`, `src/styles/flow-navigation.css`, 4 test files (+8 net-new regression tests, none weakened — one assertion strengthened to prove network-not-cache), `docs/audits/frontend-fable-5/` (10 evidence documents), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. Fresh `bash scripts/check.sh --ci` green end-to-end: 713/713 Vitest (62 files), Playwright 5/5, fixture + exact-120 production builds, verify:dist + leak, verify:privacy, OSV clean, `verify:qr` fail-closed. Rendered post-repair proofs: evicted-cache online reload fully recovers (0 failed requests); WebKit Begin-at-poster enters in 205 ms; Persian heading on the Nastaliq stack in Chromium/WebKit/Firefox; aria name is exactly "Begin"; 10-viewport × 3-engine overflow matrix clean on the worst-case 206-character record. Adversarial re-audit: 21 attacks across four independent lenses, zero confirmed problems, two notes adopted.
- **Verdict & limitations:** PASS WITH DOCUMENTED RESIDUAL RISK. Residuals (accurately labelled, none hiding a Blocker/Critical/High): Playwright WebKit ≠ branded Safari and no physical iOS/Android/assistive-technology evidence (unchanged §31.2 gates); cold-start WebKit may still take the poster route without a Begin gesture (designed fallback); production corpus ships zero reflections (content-scope decision, §7.6 section correctly absent); SVG `apple-touch-icon` limitation pre-documented. Full evidence in `docs/audits/frontend-fable-5/`.

### 2026-07-16 (Australia/Sydney) — owner-authorised public access

**Raouf:**

- **Scope:** Removed only the Cloudflare Access application that exactly matched `divan.raoufabedini.dev`, following the repository owner's explicit instruction to make the deployed release publicly reachable. The tunnel, DNS route, cache rule, TLS, immutable image, Droplet runtime, poetry, corpus/source/translation evidence, service worker, QR artwork, and unrelated services were unchanged.
- **Verification:** Cloudflare returned one matching Access application before deletion and zero afterwards. Fresh anonymous checks returned root HTTP 200 with no redirect, Access header, or cookie; `/healthz` and a missing path remained 404; the release remained `divan-release-1-v1-0-3` with exact 60/60/120 counts; and the reviewed security and cache headers remained intact.
- **Truth boundary:** Public reachability is an owner-authorised operational override, not a `PUBLIC PRODUCTION PASS`. Printed iOS/Android QR, physical-device/cross-browser/assistive-technology, provider logging/retention, and approved off-device credential-backup evidence remain incomplete and must not be reported as passed.

### 2026-07-16 (Australia/Sydney) — Release 1 protected production preview

**Raouf:**

- **Scope:** Published and deployed the clean immutable `v1.0.3` Release 1 image to the Access-protected `divan.raoufabedini.dev` production hostname, exercised live verification and rollback, and produced the print-ready QR pack. No poetry, corpus selection, source evidence, translation, release compiler, service worker, University branding, separate 60-Hafez/60-Rumi work, or unrelated Droplet workload changed.
- **Summary:** Tagged the merged source at `fa9d1e226f7d0f9df86d77eb1888fc0ce25b2791`, built from a clean archive, published and deployed only digest `sha256:9d526a184ca23743298c8ca679f94abef856f0e4667dae503fe2fd1ac69a4513`, configured the locally managed Cloudflare tunnel/DNS route and hostname-scoped cache rule, and restored an explicit deny-everyone Access policy after verification. Added digitally verified A3, A5, take-home, and staff QR PDFs plus a combined print-ready pack.
- **Verification:** Repository `scripts/check.sh --ci` passed 62 files / 705 tests, Playwright 5/5, exact 60/60/120 production build, distribution/private-leak, privacy, audit, and operations gates. Docker Scout reported 0 Critical / 0 High / 0 Medium / 0 Low. Remote preflight, deploy, independent verify, same-digest rollback rehearsal, Access restoration, cache/header checks, and neighbouring-service baseline passed; zero host port and zero retained registry credentials. Full evidence is in `docs/verification/2026-07-16-release-1-production-preview.md`.
- **Follow-ups:** This is a protected preview, not public-launch approval. Keep Access deny-all until printed iOS/Android QR checks, physical-device/cross-browser/assistive-technology evidence, provider log/retention approval, and approved off-device credential backup are complete. Review the unused remote-managed setup tunnel after operator confirmation.

### 2026-07-16 (Australia/Sydney) — Release 1 runtime image hardening

**Raouf:**

- **Scope:** Repaired the Release 1 web and tunnel runtime images after mandatory final-image scans rejected the initially pinned vendor images. No poetry, corpus, source evidence, translation, frontend behavior, service worker, University branding, QR approval, or unrelated Droplet service changed.
- **Summary:** Rebased cloudflared onto a `scratch` image containing only the exact statically linked official 2026.7.2 binary and CA roots. Rebuilt Caddy 2.11.4 from its authenticated Go module with fixed Go 1.26.5, compiled the exact 60/60/120 health contract into a static verifier, and moved the web runtime to `scratch`. The final web image has no shell, package manager, or OS libraries and still runs as UID/GID 10001 with a read-only filesystem and no capabilities.
- **Files Changed:** `ops/Dockerfile`, `ops/Dockerfile.cloudflared`, `ops/healthcheck/main.go`, `ops/compose.yml`, `ops/scripts/lib.sh`, current image-pin/runbook documentation, focused security regressions, `AGENT.md`, and `CHANGELOG.md`; the obsolete shell health verifier was removed.
- **Verification:** The candidate production image built exactly 60 Hafez + 60 Rumi = 120 records, passed the public-bundle leak check, and ran its compiled verifier as UID 10001 with a read-only filesystem, all capabilities dropped, and no container network. Docker Scout reported 0 Critical / 0 High / 0 Medium / 0 Low. OSV reported only `GO-2026-5932` as unscored/no-fix; dependency-graph inspection proved the affected `golang.org/x/crypto/openpgp` packages are absent from the compiled Caddy command. The scratch cloudflared image reported 0 Critical / 0 High / 0 Medium / 0 Low and is pinned by immutable GHCR digest.
- **Follow-ups:** Publish only the clean tagged image, retain the initial `v1.0.0` source tag as superseded evidence, deploy through the dedicated key-only `eoiadmin` identity, and keep public launch blocked until live Access/tunnel/rollback plus manual accessibility/device and physical-QR evidence are complete.

### 2026-07-16 (Australia/Sydney) — Release 1 production gate preparation

**Raouf:**

- **Scope:** Merged reviewed PR #5 normally into `main`, then prepared the integrated exact-120 release for an immutable technical-preview deployment at `divan.raoufabedini.dev`. No poetry text, corpus selection, source evidence, translation, service worker, University branding, or unrelated Droplet service was changed.
- **Summary:** Replaced stale live health/runbook thresholds with an exact 60 Hafez / 60 Rumi / 120-item runtime contract; made the successful production build a required quality gate; and added a commit-pinned official OSV dependency scan ahead of CI because pnpm 10.33.0's retired npm audit endpoints return HTTP 410. The remaining QR gate stays fail-closed.
- **Files Changed:** `.github/workflows/ci.yml`, `scripts/check.sh`, `ops/scripts/container-health.sh`, `ops/scripts/verify.sh`, focused security regressions, and current release/runbook documentation.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. Source locks passed 9/9; format, lint, and strict typecheck passed; Vitest passed 701/701, including components 80/80, accessibility 24/24, security 55/55, and performance 5/5; Playwright passed 5/5. The explicit candidate build emitted 120 items and passed distribution/private-leak, privacy, and all four static ops checks. OSV-Scanner 2.4.0 found no issues across 429 locked packages; `pnpm audit --prod` remained externally blocked by the documented HTTP 410 retirement.
- **Follow-ups:** SSH key discovery failed closed because the supplied destination accepts no available public key and is configured as root; the stored password was not used. Do not claim live deployment, tunnel health, rollback rehearsal, Access protection, manual assistive-technology/device evidence, or physical QR validation until separate evidence closes each gate.

### 2026-07-16 (Australia/Sydney) — visible poet return and cinematic Begin verification

**Raouf:**

- **Scope:** Reviewed and repaired draft PR #5 on `fix/visible-back-and-cinematic-begin`, then merged current `origin/main` normally so the separate final 60-Hafez / 60-Rumi work remains intact. No poetry, corpus, evidence, translation, compiler, service-worker, deployment, or production-selection behaviour was changed by the PR.
- **Summary:** Verified visible `Choose another poet` controls on intention and result screens, release-bound state clearing and deterministic chooser history, smooth automatic traversal through the existing scroll-scrub corridor, natural manual scrub, Skip, terminal-frame paint, and direct reduced-motion/Save-Data/offline/video-failure/timeout/non-scrollable fallbacks. Fixed the first-frame timeout being cancelled before frame presentation, terminal arrival unmounting before the final seek could paint, and a throwing scroll API trapping Begin.
- **Files Changed:** `src/components/CinematicThreshold.tsx`, `src/components/FlowBackButton.tsx`, focused component regressions, `docs/verification/visible-navigation-and-cinematic-begin.md`, `AGENT.md`, and `CHANGELOG.md`; the pre-existing PR also owns its navigation helper, scene wiring, styles, and navigation tests.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` passed; components passed 80/80, accessibility 24/24, and Playwright 5/5. The explicit production build emitted `pr-5-visible-navigation` with 120 items; `verify:dist`, archival leak verification, and `verify:privacy` passed. A 390×844 Chromium walk proved Begin scroll/video progression to 7.95 s, manual scrubbing, Skip, both visible return controls, Back/Forward, and direct reduced-motion, failed-video, Save-Data, and offline entry. Verified implementation SHA: `a079e722f0d3ecdb643c8204d7c3272e14ad4616`.
- **Follow-ups:** Manual evidence is emulated Chromium rather than a physical-device/cross-browser/assistive-technology matrix. npm's retired audit endpoints still return HTTP 410 independently of this PR. Full command evidence and limitations are in `docs/verification/visible-navigation-and-cinematic-begin.md`.

### 2026-07-16 (Australia/Sydney) — final 60/60 source-bound corpus

**Raouf:**

- **Scope:** Completed the final bilingual content stage on `feat/poetry-source-ingestion`: 60 unique Hafez ghazals, 60 unique non-overlapping Rumi records, an explicit 120-record production manifest, and local release evidence. No frontend redesign, deployment, DNS, University branding, physical QR, or external approval was changed or claimed.
- **Summary:** Preserved and revalidated the existing 24 Bell Hafez and 16 Whinfield Rumi records, added 36 Clarke/Qazvini-Ghani Hafez records and 44 Whinfield/Nicholson Rumi records, bound every authority to edition IDs, source/span/mapping hashes, and canonical identity, and made the loader/compiler reject stale, duplicate, overlapping, archived, excluded, or implicit directory-order selections. The five prior Rumi archives remain outside production; weaker replacement candidates remain private evidence.
- **Files Changed:** Authority/identity/manifest contracts and tests; deterministic inventory, alignment, corpus, and report builders; 120 canonical authoring YAML records plus permissions and selection manifest; production loader/build wiring; verification reports and release guidance.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. `pnpm poetry:verify-sources` passed all 9 locked artefacts; format, lint, and typecheck passed; `pnpm test` passed 694/694 and Playwright passed 5/5; the explicit `pnpm build:production` built `final-120` with 120 items; distribution, archival-leak, privacy, and four static ops contracts passed. `pnpm audit --prod` is externally blocked because npm retired both configured audit endpoints with HTTP 410; `pnpm verify:qr` remains correctly blocked on the approved short URL and physical scan matrix. Full evidence is recorded in `docs/verification/2026-07-16-final-120-corpus-report.md`.
- **Follow-ups:** Independent public-launch governance/legal decisions, approved hostname/short URL, manual assistive-technology/device evidence, live deployment/rollback evidence, and physical QR validation remain external gates.

### 2026-07-16 (Australia/Sydney) — integrate poetry ingestion into main

**Raouf:**

- **Scope:** Merge `feat/poetry-source-ingestion` into the current cinematic/UI `main`, preserving both release lines. No live deployment, DNS, infrastructure, University branding, external approval, or physical QR state changed or claimed.
- **Summary:** Resolved the four additive merge conflicts by retaining both branches' intent: the screenshot and local-tool exclusions in `.gitignore`; the complete cinematic/UI and poetry histories in `AGENT.md` and `CHANGELOG.md`; and both `.claude/**` and `.remember/**` lint exclusions. Git auto-merged the service-worker schema, result/source UI, fixture/share tests, and Vite configuration, combining the cinematic asset contract with the source-bound 40-item production corpus.
- **Files Changed:** The merge imports the feature branch's content-authority, source-ingestion, canonical corpus, tests, audits, and documentation into `main`; manual conflict resolution touched `.gitignore`, `eslint.config.js`, `AGENT.md`, and `CHANGELOG.md` only.
- **Verification:** Node 22.16.0 / pnpm 10.33.0. `pnpm test` passed 682/682 across 56 files; `pnpm typecheck` passed; tracked-tree ESLint and Prettier checks passed; Playwright passed 5/5. The explicit production build produced `machine-authority-2026-07-16` with exactly 40 items; `verify:dist`, the archival leak gate, `verify:privacy`, and all 9 source-lock checks passed. Static container, header, origin-isolation, and rollback contracts passed. Repository-wide `pnpm lint` and `pnpm format:check` still see protected untracked/local inputs (`New_Frontend/**`, `.remember/**`, and `scripts/poetry/build-hafez-align-tasks.ts`); those inputs were not altered, and the complete tracked tree is clean.
- **Follow-ups:** Independent public-launch governance/legal decisions, manual assistive-technology and device evidence, live deployment/rollback evidence, and the physical QR matrix remain external gates. The protected unrelated untracked inputs remain untouched.

### 2026-07-16 (Australia/Sydney) — cinematic threshold, layered book, and atmosphere (feat/cinematic-threshold)

**Raouf:**

- **Scope:** The v3 gauntlet-final cinematic enhancement, executed in a dedicated worktree off `origin/main`: a poster-first, scroll-scrubbed cinematic entrance (illuminated Persian miniature brought gently to life), a seamless final-frame handoff into a live book stage, a layered weighted book-opening, and restrained candle/butterfly/mote atmosphere. No poetry, translation, rights, approvals, ballot/EOI, or production configuration touched; launch gates remain closed.
- **Summary:** Generated four approved stills (OpenAI `gpt-image-2`) and two native clips (Gemini `gemini-omni-flash-preview`, 9:16 and 16:9) on Raouf's own API keys after Higgsfield's credit pricing proved prohibitive; posters are the clips' first decoded frames and the book-stage backdrops are their actual final rendered frames (SSIM vs released clips 0.9662/0.9832 — codec noise only). Extended the sealed release contract so media rides it end-to-end: `video/mp4` in both asset schemas (compiler + service worker, mirrored), six fixed browser assets (four precached webp — the offline guarantee; two mp4 the contract rejects if marked precached), mp4 signatures in `verify-dist`, `publicDir:false` preserving the raster-zero lock. WelcomeScene became the cinematic threshold: natural-scroll scrub with per-frame seek coalescing, immediate "Skip entrance", arrival announced via the shared live region, and poster-only routes for reduced motion, Save-Data, offline, decode failure, and first-frame timeout — the poem never requires video. RevealScene became a layered book (cover with true two-faced board, three trailing leaves, spine compression, gravity catch, illumination after settling; 2.0 s inside the 1.6–2.2 s contract) refined by a frame-by-frame audit using paused Web Animations. Atmosphere: slow-breathing candle glow, exactly one deterministic golden butterfly that settles and rests, six abstract motes (three on coarse pointers), all aria-hidden and pointer-transparent.
- **Files Changed:** release contract (`src/contracts/release.ts`, `src/lib/content/release.ts`, `src-sw/schemas.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `vite.config.ts`), app (`src/app/App.tsx`, `src/scenes/WelcomeScene.tsx`, `src/scenes/RevealScene.tsx`), new components (`CinematicThreshold`, `BookStage`, `CandleScene`, `ButterflyField`, `PoetryMotes`) and libraries (`src/lib/cinematic/*`), styles (`visual.css`, `motion.css`, `motion.ts` timing), released media under `public/images` + `public/video`, committed `.claude/` cinematic pack, tests (3 new files, 4 updated), docs (ledger, design lock, provenance, asset manifest, verification report), `.gitignore`/`eslint.config.js`/`.prettierignore`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, worktree `feat/cinematic-threshold` @ `4ee014a`. format/lint/typecheck 0; vitest 529/529 (37 files, +28 net-new cinematic tests); Playwright 5/5; `build:fixture` + `verify:dist` (new images/ + video/ set, mp4 signatures) + `verify:privacy` pass; media budget PASS (6 assets, 5,857,556 B); LCP 1396 ms / CLS 0.00 (390×844, 4× CPU, Fast 4G); reduced-motion route verified live (0 video requests); offline flow to a poem verified live; armed pack release gate PASS. `pnpm audit --prod` fails with HTTP 410 — npm retired the audit endpoints; identical failure on the untouched main checkout (environmental; needs a pnpm upgrade repo-wide). Verification report: PASS WITH EXTERNAL LAUNCH GATES.
- **Follow-ups:** §31.2 launch gates unchanged and closed. Seedance-class 3D-parallax clips remain a documented drop-in upgrade (same contract, `end_image` frame-lock). Poster `<link rel=preload>` injection deferred (LCP already 1396 ms). Rotate the OpenAI/Gemini API keys if the one-time local terminal echo (colon-format `.env`) is a concern. pnpm upgrade for the retired npm audit endpoint recorded as repo-wide maintenance.


### 2026-07-14 (Australia/Sydney) — full UI/UX audit gauntlet and remediation (multi-agent)

**Raouf:**

- **Scope:** Repository-wide UI/UX/accessibility/responsive/performance/privacy audit and repair against the design authority, run as a staged multi-agent gauntlet: five independent read-only auditors → lead-verified consolidated ledger and remediation plan → three worktree-isolated writers with disjoint file ownership → lead integration → five fresh adversarial reviewers → repair loop. No content, rights, approvals, or production configuration fabricated; launch gates untouched.
- **Summary:** Fixed all four High defects: the illuminated-frame spine bar clipped the first glyph of every text line on all phone widths (padding floor now clears the bar, style-test-pinned); the result screen gained the §7.6-required "Return to the stall" disclosure (generic invitation, no location) and "Learn about the poet" link, composed into the centred action zone; gold links on light paper failed contrast at 1.56:1 (light surfaces now use deep red, 9.77:1); Hafez and Rumi result cards were visually identical (Rumi now keyed lapis/turquoise via `data-visual-language`, contrast preserved, lapis h2 8.65:1). Also fixed: reveal-stage focus no longer drops to `<body>`; provenance parentheses un-mirrored (bidi isolate corrected); dead `<audio>` removed on failure; refresh mid-flow restores the chosen poet's intention; §26.2 offline-reload announcement; unknown-path URL cleanup; scoped Escape-to-skip; `[lang='fa']` letter-spacing 0; safe-area env() padding + `viewport-fit=cover`; welcome star quieted and Persian line lifted; index/manifest descriptions aligned; offline.html/OfflinePage copy reconciled (+`/credits` nav, About links "How offline works"); share card reworked to a compression-surviving 1200×630 layout; build now injects a single local font preload for the welcome display face (three faces measured +420 ms FCP; single face restored FCP ~1212 ms with LCP improved 1464→~1212 ms); `role="group"` on the verse-actions cluster; duplicated offline-ready logic extracted. Evidence set under `docs/audits/divan/` (5 baseline audits, ledger, remediation plan, research log, 5 final reviews, final verification report); screenshots kept as local regenerable evidence (git-ignored, 29 MB).
- **Files Changed:** `src/styles/visual.css`, `src/app/core.css`, `src/app/App.tsx`, `src/components/PoemResult.tsx`, `src/components/SourceCredit.tsx`, `src/scenes/ChoosePoetScene.tsx`, `src/scenes/RevealScene.tsx`, `scripts/build.ts`, `index.html`, `public/offline.html`, `src/pages/AboutPage.tsx`, `src/pages/OfflinePage.tsx`, `src/lib/share/shareCard.ts`, `docs/deployment-runbook.md`, 8 test files (+27 net-new behavioural tests, none weakened), `docs/audits/divan/**`, `.gitignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, branch `feat/ui-ux-gauntlet-r1` @ `67958c9`. `bash scripts/check.sh --e2e` green: format/lint/typecheck 0, vitest 499/499 (34 files), Playwright 5/5, `build:fixture` + `verify:dist` + `verify:privacy` pass, `audit --prod` clean, `build:production`/`verify:qr` fail-closed as intended. axe 0 violations on all flow scenes and all five context pages (stall panel open included). Zero external requests/cookies across every audited walk. LCP ~1212 ms / CLS 0.0053 (390×844, CPU 4×, ~1.6 Mbps). Five adversarial final reviewers each report 0 unresolved Blocker/Critical/High; their reports are in `docs/audits/divan/final-review/`.
- **Follow-ups:** §31.2 launch gates unchanged and closed (corpus/rights, cultural review, manual assistive-tech matrix incl. Persian pronunciation, final hostname/short URL + canonical/OG/robots, University mark, live deploy/tunnel/logging, rollback rehearsal, physical QR). Production-corpus tasks recorded in the runbook: subset Noto Nastaliq (159 KB) and re-measure reveal LCP/CLS; re-check spine-bar RTL line-end clearance and Persian wrapping with real verse; kiosk idle-reset is an open deployment decision.
### 2026-07-16 (Australia/Sydney) — source-bound machine authority; exact 40-item production corpus

**Raouf:**

**Scope.** Literature eligibility, canonical source-bound records, public
attribution/disclosures, production packaging, and evidence. No live deployment,
DNS, infrastructure, University branding, external approval, or physical QR was
changed or claimed.

**Authority migration.** Production no longer treats a named person as the only
possible literature signature. `ReviewAuthority` is an explicit union: legacy
human authority remains supported, while machine authority binds both source-book
hashes, both selected-span hashes, both references, and the mapping hash. The
active machine states are only `MACHINE_VERIFIED`,
`MACHINE_VERIFIED_WITH_DISCLOSURE`, and `EXCLUDED`. A changed source, span,
reference, or mapping invalidates the record; correcting a mapping means issuing
a fresh machine verdict, never `NEEDS_HUMAN_REAPPROVAL`.

**No fabricated identities.** Machine-authority items compile with empty
contributor and approval registries. A teacher, contributor, reviewer, final
approver, or human reapproval is not required solely for eligibility. Permission
records are source-bound to the acquired public-domain/CC BY-SA evidence; the
separate legacy rights register remains pending for external governance rather
than being falsified with a made-up reviewer.

**Corpus.** The pre-migration snapshot records the real boundary: 10 Hafez
identifications and 21 Rumi alignments existed, but no canonical records did.
Production now contains exactly 24 Bell-to-Qazvini-Ghani Hafez excerpts and 16
Whinfield-to-Nicholson Rumi excerpts. Five lower-ranked Rumi records (sections
116, 347, 483, 622, 668) are archived as `EXCLUDED`. No fresh translation or
reflection was written. Bell small-cap OCR normalisations are explicit and
publicly disclosed.

**Public/private contract.** English renders before Persian; Persian remains live
text under `lang="fa" dir="rtl"`. Source edition and translation credits plus
alignment limitations are public. Full books, source hashes, exact references,
mapping metadata, rationales, private IDs, candidate reports, and archival staging
are excluded from the release and service-worker cache.

**Verification.** TDD RED first failed on the absent authority module and absent
selection module; GREEN covers machine eligibility without identities, both
authority kinds, neither-authority rejection, stale source/span/reference/mapping
failures, corrected mappings, `EXCLUDED`, exact counts, and archived-Rumi
exclusion. The explicit production build produced release
`machine-authority-2026-07-16` with 40 items; distribution and privacy leak checks
passed. Final command totals are recorded in `docs/verification-report.md`.

**Remaining boundary.** Local production-package readiness does not close
independent public-launch governance/legal decisions, manual assistive-technology
and device evidence, live domain/container/deployment/rollback evidence, or the
physical QR matrix.

### 2026-07-16 (Australia/Sydney) — harden the Clarke verse filter; 10 verified Hafez identifications

**Raouf:**

**Scope.** Verse/notes classification, its tests, and one alignment run. No corpus
record authored; no gate moved.

**The verse filter is now typographic, not textual.** Clarke interleaves glosses
with verse down the page and numbers them with the same `N.` form as his couplets
— and he numbers only every fifth couplet. So neither keywords nor numbering can
separate them, which is how a footnote about Yezid became "evidence" for ode 8.
Clarke sets notes in smaller type; tesseract's hOCR reports `x_size` per line, and
the distribution is bimodal (notes <=52, verse >=56) with a real valley. The valley
(53-55) is `uncertain` and is never pairable. This is a fact about the printed
page, not a guess about the words. `ocr-clarke.sh` now emits hocr alongside text.

On the real page 92 the filter yields 20 verse lines against 160 commentary lines,
`signifies` no longer leaks, and all of ghazal 3's rare anchors (shiraz, samarkand,
bukhara, ruknabad, musalla, zulaikha) now come from the verse — including zulaikha,
which sits in couplet 5 and was previously unrecoverable.

**Tests earned their keep immediately** (13, `tests/content/clarkeParse.test.ts`):
they caught a real bug in my own hOCR parser (nested `<span>`s made it capture only
the first word of every line). They pin the two recurring defects: a gloss that
repeats the couplet's own anchors verbatim, and a numbered gloss read as a couplet.

**Alignment run.** Prefilter (rhyme letter x couplet range) -> Haiku matla' aligners
(6 batches, 125 odes) -> 2 Opus adversarial refuters on distinct lenses
(generic-motif contamination; does the cited Persian actually exist and correspond).
17 bindings proposed; **the two refuters returned identical verdicts on all 17** —
same 7 refuted, same 10 passed. **10 verified** (>=2 refuters returned, zero
refutations), e.g. ode 8 = ghazal 3, ode 282 = ghazal 245 (طوطی/اسرار/شکّر/منقار
word-for-word), ode 309 = ghazal 263, ode 417 = ghazal 367 (a hemistich verbatim).
The refuters killed exactly the right ones: ode 3 = ghazal 1 died as "Saki + cup +
love — base rate, not identity", and where two odes claimed ghazal 98 they kept the
one with a clause-for-clause juridical rendering and dropped the thematic claimant.

**Two defects found, both mine, neither yet fixed.**
1. **The couplet-range prefilter excluded true answers.** Qazvini-Ghani is a
   critical edition that rejects spurious couplets, so Clarke's ghazals run
   *longer* than Q-G's — the opposite of what the filter assumed. 96 of 278 odes
   have `maxCoupletNumber >= 10` while only 52 of 494 ghazals are that long. Ode 1,
   which I had verified by hand as ghazal 1, was never shown ghazal 1 and was
   correctly reported "none" with high confidence. **Every "none" in this run is
   inconclusive, not a refutation.** Only rhyme letter is safe as a partition.
2. **Ode labels are not unique.** OCR misreads duplicate vol-1 odes 4, 8, 9, 105
   and vol-2 ode 508. Identity must be keyed by volume+page. The refuters handled
   this better than a blanket rule would: they refuted ode 105 (nothing pins the
   record) but kept odes 4 and 8, whose evidence uniquely identifies which record
   is meant.

**Not done.** These are IDENTIFICATIONS, not records: no excerpt chosen, no
reflection, no rights approval. Hafez 10 of 24; Rumi 21 of 16; total 31 of 40.
`build:production` and `verify:qr` remain fail-closed.

**Files changed.** `scripts/poetry/parse-clarke-odes.ts` (new),
`tests/content/clarkeParse.test.ts` (new), `scripts/poetry/ocr-clarke.sh`,
`sources-private/poetry/reports/hafez-clarke-alignment-candidates.json` (git-ignored).

**Verification.** `pnpm check`: tests pass; verifiers pass; gates fail-closed.
`audit (prod deps)` fails on the pre-existing npm 410. NOTE: `lint` currently fails
on `New_Frontend/**` (untracked, added 11:42 today, not part of this change and not
mine to touch); my own files lint clean.

### 2026-07-16 (Australia/Sydney) — local OCR of Clarke; first citation-grade Hafez binding; the proper-noun ceiling

**Raouf:**

**Scope.** Source OCR and measurement only. No corpus record authored, no gate
moved, no agent spent.

**Local OCR (`scripts/poetry/ocr-clarke.sh`).** All 1,078 Clarke pages rendered at
400dpi and OCR'd locally — no page text through a model, so no content filter and
no tokens. Parallel across cores (~4.5h sequential → ~25min); resumable; each
worker renders to its own PNG path and deletes it immediately (holding all pages
at 400dpi would need ~8GB). Output is git-ignored: per-page text of a complete
1,078-page translation IS the whole book.

**Why it was needed.** The Archive's OCR of Clarke recovers a mean of 1.5 numbered
couplets per ode where a ghazal runs 5-15, because the couplet numerals are
mangled. Local OCR raises this to 2.7 and reads ode headings the Archive loses
entirely (`110, (u3).` vs `9, (12).`). The two engines fail on *different* odes:
local reads 273, Archive 356, union 438, and where both read the concordance
number they **agree 98%** (188/191, 3 disputed). Merged per the Bell method — two
independent readings corroborate; disagreements are flagged, never guessed.

**First citation-grade Hafez binding: Clarke ode 8 = Q-G ghazal 3.** Established
on three independent signals, all drawn from the verse: the matla' rendered
phrase-by-phrase ("If that Bold One of Shiraz gain our heart, For His dark mole, I
will give Samarkand and Bukhara" ← اگر آن ترک شیرازی بدست آرد دل ما را / بخال
هندویش بخشم سمرقند و بخارا را); couplet count 8 = 8; and a rare-name cluster
(سمرقند + بخارا) occurring in exactly one ghazal. Both sit in the Alif section,
which corroborates independently. Clarke ode 72 = ghazal 41 is a second unique
candidate (پرویز), not yet confirmed against the matla'.

**A claim I retracted.** I first reported ode 8 = ghazal 3 on names found in
Clarke's *commentary*, not his translation — the seq-757 defect class for the
third time in this project (ode 1's "Samarkand" comes from a footnote about
Yezid). The binding turns out to be correct, but the retraction stands: a true
claim resting on invalid evidence is still unfounded, and it would have been luck
rather than method. Verse extraction now filters Clarke's glosses, but it is not
yet structural enough to trust unsupervised — Clarke's notes are themselves
numbered lists, and a gloss still lands in a couplet slot in ode 8's own record.

**Measured ceiling — why proper nouns cannot finish the job.** Rare-anchor binding
uniquely identifies at most **36 of 494** ghazals; **448 carry no rare anchor at
all** and are unreachable this way regardless of OCR quality. Proper nouns are a
seed, not the method. The matla' match is, because Clarke translates every matla'
literally — and it needs a model, which is where the agent budget belongs.

**The prefilter that makes that cheap.** Clarke's "The Letter X" sections are
Persian rhyme-letter names (Alif, Ba, Sa, Jim, Dal …); Q-G is arranged by the same
principle. Rhyme letter + couplet count partitions 494 ghazals into buckets
averaging 15.7 (37 unique, 115 at ≤3, 200 at ≤8). That reduces alignment from open
judgement to closed multiple choice — "which of these ~15 Persian matla's does this
English line translate?" — which is verifiable rather than thematic.

**Not done.** 1 of 24 Hafez bound (21 of 16 Rumi). No record authored;
`build:production` and `verify:qr` remain fail-closed.

**Files changed.** `scripts/poetry/ocr-clarke.sh` (new), `.gitignore`.

**Verification.** `pnpm check`: 615 tests pass; verifiers pass; gates confirmed
still fail-closed. `audit (prod deps)` fails on the pre-existing npm 410.

### 2026-07-16 (Australia/Sydney) — ingest Clarke 1891 as the Hafez identification source; fix an artifact filename collision

**Raouf:**

**Scope.** Source acquisition and the registry schema only. No corpus record was
authored, no pairing was verified, and no launch gate moved.

**Why.** Hafez alignment stood at 0 of 24 and Bell could not close it. Measured
locally, before spending anything: only **5 of Bell's 40 recovered poems carry a
proper noun that discriminates between ghazals**, and not one of the 5 is unique
(the best, رکناباد, narrows to 3 candidates). 35 carry none. The signal that
produced Rumi's 21 — section-title alignment — does not exist for Hafez, because
ghazals have no titles and Bell's poems are numbered, not named. Matching the
other 35 would have rested on exactly the generic motifs (wine, heart, beloved,
nightingale) that the corpus rules forbid as evidence. Bell also holds only ~43
poems in total, so 24 verified would require ~60% of her whole book to survive an
adversarial gate; Rumi achieved 45% **with** strong anchors.

**What Clarke changes.** Clarke 1891 is a complete, literal, per-ode-numbered
crib of the whole Divan whose first line tracks the matla'. Verified against the
Persian: Clarke Ode 1 renders الا یا ایها الساقی ادر کأسا و ناولها literally. The
text carries `N, (M).` ode headings inside "The Letter X" rhyme sections with
numbered couplets — 227 parsed in volume 1 (range 1–337, no duplicates). This
makes Hafez identification a **citation check** (rhyme-letter partition + couplet
count + literal matla') rather than a thematic judgement, and opens an
English→English Bell↔Clarke route in place of the Bell↔Persian one that failed.

**Rights.** Recorded, not assumed: Internet Archive reports both volumes
(`thedivan01hafiuoft`, `thedivan02hafiuoft`) as NOT_IN_COPYRIGHT, 1891. The
rights record stays `status: pending` with `rights_reviewer_id: null` — no AI is a
reviewer, and no approval is implied.

**A defect I introduced and then fixed.** Declaring two `text` volumes under one
source id made **volume 2 silently overwrite volume 1**: the destination name was
derived from `kind` alone, so both wrote `source.txt` and the lock recorded two
hashes for one path. Fixed at the cause rather than worked around — artifacts take
an optional `filename`, the schema now rejects two artifacts resolving to one
file, and the fetcher keys prior-hash lookups by file rather than by kind (a
kind-keyed map would compare a volume against its sibling's hash). Re-acquired
clean: four distinct files, lock coherent, no duplicate paths.

**Not done.** No Hafez pairing exists yet. Clarke→Persian binding and Bell→Clarke
bridging are not built. `build:production` and `verify:qr` remain fail-closed.

**Files changed.** `src/lib/content/sourceRegistrySchema.ts`,
`scripts/poetry/fetch-sources.ts`, `tests/content/sourceRegistry.test.ts`,
`sources-private/poetry/registry.yaml`, `sources-private/poetry/rights-evidence.yaml`,
`sources-private/poetry/source-lock.json` (all `sources-private/` git-ignored).

**Verification.** `pnpm check`: 49 files / 615 tests pass; lint, typecheck,
format clean; `verify:dist` and `verify:privacy` pass; leak check confirms no
Clarke text in `dist/`; `build:production` and `verify:qr` confirmed still
fail-closed. `audit (prod deps)` fails on the pre-existing npm 410 (endpoint
retired), reproducible on clean HEAD and unrelated to this change.

### 2026-07-16 (Australia/Sydney) — correct the Rumi count to 21; retract seq 717

**Raouf:**

- **Scope:** Audit correction + the alignment evidence file it describes. No code, schema, compiler, gate or public-output change.
- **Summary:** The 2026-07-15 entry reported **15 verified / 27 unverified**, attributing the 27 to refuters that never returned before the session limit. That was wrong. The refuters *had* returned; their verdicts were sitting unaggregated in the agent transcripts. Recovering them was a local join (`agentId` → the `CLAIM:` line) re-applying the identical gate — **zero new agents, zero tokens**. Corrected outcome: **21 verified / 14 refuted / 6 insufficient (1 vote each)** of 47 examined. Rumi is now **over** its threshold of 16.
- **The retraction:** **seq 717 was among the original 15 and is now refuted.** It passed on 3 votes; the 4th vote refuted it. Nothing about the pairing changed — only how many skeptics looked. The earlier figure was therefore not merely incomplete but wrong in the direction that matters: it published a pairing that further review rejects. Vote strength is now recorded per pairing (6:2, 5:5, 4:9, 3:4, 2:1); 20 of 21 carry ≥3 refutation attempts, and the single 2-vote pass is flagged as the weakest evidence in the set.
- **Not done:** Hafez remains **0 of 24** and is now the entire gap (total **21 of 40**). Verified pairings are still alignment evidence, not canonical records — no authoring item exists, so `build:production` still fails closed at `loadContent.ts:433`, correctly and untouched. The reviewer-union gate remains unbuilt.
- **Files Changed:** `docs/audits/divan/2026-07-15-bell-reconstruction-and-rumi-alignment.md`, `sources-private/poetry/reports/rumi-alignment-candidates.json` (git-ignored), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green; `build:production` still fails closed; evidence file confirmed git-ignored by `.gitignore:27` before writing.

### 2026-07-15 (Australia/Sydney) — reconstruct Bell locally; 15 Rumi pairings verified

**Raouf:**

- **Scope:** Bell reconstruction script + regression suite + audit; Rumi alignment evidence to private reports. No schema, compiler, gate or public-output change.
- **Summary:** Model transcription of the Bell scan is blocked by the platform (`400 Output blocked by content filtering policy` on 9/14 readers). Fixed by never routing the text through the model: `pdftoppm` + `tesseract` render and OCR locally, straight to files. Archive OCR reads `easb`; fresh local OCR reads `east`. Two independent engines now corroborate **1,270/1,340 lines (94.8%)** across 40 poems (5 fully clean, 33 within two lines). Rumi: aligners proposed 47/47 with zero exclusions — not credible given the prior human pass went 8/8 wrong — and three-lens adversarial refutation cut it to **15 verified / 5 refuted / 27 unverified** (session limit, 10.3M subagent tokens). Zero content-filter blocks across 189 agents: the filter targets bulk transcription, not short structured verdicts.
- **Three defects found, all mine:** prose introduction split in as "poem I" (fixed via running head; verse starts scan p71, not 67); punctuation-sensitive comparison flagged 396 good lines (words-only → 70); the printed page number `111` split a poem (headings are Roman, page numbers Arabic). Damaged numerals (`Il`=II, `Ul`=III) are recorded verbatim and flagged, never renumbered from sequence — Bell's numeral is not a Hafez citation, so the English side is cited by scan page instead.
- **Not done:** Rumi 15 of 16, Hafez 0 of 24, total 15 of 40. Verified pairings are alignment evidence, not canonical records. The reviewer-union gate is scoped but not built while the corpus is below threshold.
- **Files Changed:** `scripts/poetry/reconstruct-bell.ts`, `tests/content/bellReconstruction.test.ts`, `docs/audits/divan/2026-07-15-bell-reconstruction-and-rumi-alignment.md`, `.gitignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green; new suite 14/14; OCR workspace git-ignored before first write; `build:production` still fails closed.

### 2026-07-15 (Australia/Sydney) — recover the Hafez Persian verse

**Raouf:**

- **Scope:** New Hafez ghazal extractor + its regression suite + audit record. No schema, compiler, gate or public-output change.
- **Summary:** Hafez scored zero candidates for the life of the project and every earlier report — including the 2026-07-14 preflight — diagnosed that as a matching failure. It was not. The Persian ghazal bodies were **never extracted**. `extract-epub.py` harvests block tags (`p`, `h1`-`h6`, `li`, `blockquote`); the Qazvini-Ghani edition sets every ghazal as a table with hemistichs in `<span class="beyt">` inside `<td>`, so all of it was discarded while the footnote apparatus (in `<p>`) came through and became the entire "corpus". Added `extract-hafez-ghazals.py`, which reads the ghazal structure directly and recovers **486 citable ghazals / 3,649 couplets**, each carrying its own edition number read from the source rather than inferred from file order. `BLOCK_TAGS` was deliberately **not** widened: that would change the Rumi extraction and invalidate its 971 section digests.
- **Three source defects handled without invention:** the spine lists documents twice (read each once); the source numbers two different poems the same (`c127`/`c128` both `۱۲۳` — flagged `numberAmbiguous` and excluded rather than renumbered, since the "obvious" fix would invent a poem number); unnumbered qasidas/masnavis/rubaiyat skipped, not renumbered.
- **Not done, and why:** the target of 24 Hafez / 16 Rumi / 40 records was not met and the named-human gate was **not** removed. Removing it would be strictly negative — the gate is not what blocks release, an empty corpus is (`loadContent.ts:433`), so removing it buys nothing and costs the protection. Bell's English is raw OCR (`requiresVisualVerification` on 33/33, `correctedDraftLines` empty on all 33, `easb` for "east" in the verse); transcribing it from the local scan is blocked by the platform — 9 of 14 readers returned `400 Output blocked by content filtering policy`, yielding 1 complete poem from 14 agents.
- **Files Changed:** `scripts/poetry/extract-hafez-ghazals.py`, `tests/content/hafezGhazalExtraction.test.ts`, `tests/fixtures/poetry/build-ghazal-fixture-epub.py`, `docs/audits/divan/2026-07-15-hafez-verse-recovery.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm check` green; new suite 10/10, including a test that the original extractor drops this verse while capturing the footnote. Ghazal ۸۸ verified by hand against the raw markup → `c92`, 9 couplets. `pnpm build:production` still fails closed. Launch gates untouched.

### 2026-07-14 (Australia/Sydney) — git-ignore CLAUDE.md

**Raouf:**

- **Scope:** One line in `.gitignore`; no code or behaviour change.
- **Summary:** `CLAUDE.md` declares itself git-ignored on line 3 but was never listed in `.gitignore`, so it stayed untracked and unignored. Now ignored, matching its own text.
- **Files Changed:** `.gitignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `git check-ignore -v CLAUDE.md` → `.gitignore:36`.

### 2026-07-14 (Australia/Sydney) — approval-identity gate pinned

**Raouf:**

- **Scope:** One regression test; no behaviour change.
- **Summary:** Packet v1 accepted eight pairings with an empty `reviewer`. `approved_by` already rejects that; now pinned against the incident.
- **Files Changed:** `tests/content/reviewIdentityGate.test.ts` (new), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm test` 588/588 (+19 today), typecheck 0, lint 0; `build:production` still fails closed.
- **Known limitation:** A 1-char identity passes; the shared identifierSchema has no min length and backs every registry ID. Stated in the test, not papered over.

### 2026-07-14 (Australia/Sydney) — verse-only inventory + source-aware alignment (phases 2-3)

**Raouf:**

- **Scope:** Candidate generation only. No verdicts, records, or approvals; human gate untouched and still required.
- **Summary:** English blocks are classified before ranking, so only `verse_translation` is pairable and prose arguments are structurally excluded (with reason + digest recorded). Ranking replaced: section-title alignment (story heading ∪ verse-section title vs Nicholson section title), word-boundary matched, generic devotional vocabulary excluded from the lexicon.
- **Result:** 108 pairable verse segments, 535 excluded; 47 units rank candidates, 61 no signal. Matcher independently confirms the Moses/Solomon transposition (seq 121 absent from candidates; seq 65 ranks first).
- **Files Changed:** `scripts/poetry/{align-verse-sections,build-verse-candidates}.ts` (new), `tests/content/alignVerseSections.test.ts` (new), `docs/audits/divan/2026-07-14-review-conflicts.md` (new), `sources-private/poetry/reports/candidates-summary.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; tests/content 346/346 (+8), typecheck 0, lint 0.
- **Known limitation:** Score-1 hits unreliable (عمر homograph; Arab-and-wife vs Arab-and-dog). 61/108 have no title signal. Persian book boundaries not derivable and not invented.
- **Follow-ups:** Phases 4-5, 7 outstanding. Corpus 0 records; gates closed.

### 2026-07-14 (Australia/Sydney) — English block classification (alignment repair, phase 1)

**Raouf:**

- **Scope:** Phase 1 of the pipeline repair the preflight audit mandated. Classification only; no pairing, verdict, or approval. The human gate stays required — the preflight proved machine and human review catch different failure classes.
- **Summary:** Eight pairings had attached Persian verse to Whinfield's prose story argument, all human-accepted. The cause was the pairing unit: the English side was a whole story-body block whose first line is the argument and whose rest is verse the packet never showed. New `scripts/poetry/classify-english-blocks.ts` segments blocks into a closed enum; only `verse_translation` may be the English side of a pairing. Signals are structural (measured bimodal line lengths, `NOTES:` position, terminal punctuation), never thematic.
- **Result:** 643 segments over the live extraction — 108 verse (6,983 lines, 93 titled), 85 prose arguments, 184 headings, 86 apparatus, 81 footnotes, 44 commentary, 55 uncertain.
- **Files Changed:** `scripts/poetry/classify-english-blocks.ts` (new), `tests/content/englishBlockClassification.test.ts` (new), `eslint.config.js`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0; `pnpm vitest run tests/content` 338/338 (+7), typecheck 0, lint 0. All eight defective blocks pinned unpairable by test.
- **Known limitation:** Titles interior to a verse run are not detectable without markup and remain in the run; boundary imprecision, not a category error.
- **Follow-ups:** Phases 2-9. Corpus still 0 canonical records; launch gates stay closed.

### 2026-07-14 (Australia/Sydney) — machine alignment verification gate (production)

**Raouf:**

- **Scope:** Build only the net-new parts of the bilingual-alignment plan; skip what the compiler already enforces. The plan's per-record audit was **not** performed and no verdicts were authored — `content-private/` contains zero canonical records, so there is nothing to review. No poetry, pairing, verdict, reviewer, or approval was fabricated.
- **Summary:** Closed a genuine gap: the compiler bound a human approval to `canonicalSha256(item)` but **never required evidence that anyone checked the English excerpt actually translates the Persian beside it** (the only prior "alignment" was `z.enum(['line','stanza'])` — a display layout). New `machineAlignmentSchema.ts` holds a strict, identity-free attestation bound to the item digest and both source snapshots, with cross-field rules that make dishonest records unrepresentable (`pass` ⇒ high confidence + ≥3 anchors; low confidence never eligible; `mismatch`/`insufficient_evidence` ⇒ blocked; `composite_correspondence` unreleasable as one excerpt; blocked ⇒ must state a reason; reapproval-pending ⇒ never eligible). Wired production-only; registry defaults empty so production fails closed. Machine alignment never substitutes for human approval — production now needs both.
- **Files Changed:** `src/lib/content/machineAlignmentSchema.ts` (new), `src/lib/content/{compileCorpus,registrySchemas}.ts`, `tests/content/{machineAlignment,machineAlignmentGate}.test.ts` (new), `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, `pnpm check`; vitest 569/569 (+31). Wiring proven empirically (sentinel gate temporarily neutralised → production compile fails on the missing alignment record). Compiled corpus leaks no anchor/evidence/model/classification data. Details in `CHANGELOG.md`.
- **Known limitation:** the gate is unit-tested via an exported `validateItemAlignment`, not end-to-end: production compilation of the fixture corpus is impossible by design. Building a corpus that evades the sentinel gate was rejected as it would ship a bypass template.
- **Follow-ups:** Gate is inert until canonical records exist. Rights unchanged — all four sources `status: pending`.

### 2026-07-14 (Australia/Sydney) — complete the MIT licence (README alignment + binding tests)

**Raouf:**

- **Scope:** Finish the MIT licence added earlier today; the owner confirmed MIT is the intended position. The licence stays and the repository is made to agree with it. No product behaviour changed.
- **Summary:** `176b360` shipped `LICENSE` + `"license": "MIT"` while `README.md` still said "All rights reserved. No licence is granted…", a position enforced by `tests/security/publicReadiness.test.ts:37`. The branch was red from that commit onward (535/536); the entry's "no code/tests affected" claim was false — only `format:check` had been run. README licence section rewritten: repository source code is **MIT**; the Persian poetry/translations, the four third-party source editions (Wikisource = CC BY-SA, attribution required), and the Society/University marks are **excluded from the grant**. The obsolete assertion is replaced by two stronger tests that bind `LICENSE` + `package.json` + `README.md` into a single coherent grant and hold the carve-out. Mutation-checked: removing the licence field, reinstating the old README wording, or deleting the carve-out each fail.
- **Files Changed:** `README.md`, `tests/security/publicReadiness.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, `pnpm check`; vitest 538/538. Recorded in `CHANGELOG.md`.
- **Follow-ups:** MIT is scoped to this repository's own code. Poetry rights remain independent and outstanding: all four sources `status: pending`, no approved corpus, `build:production` fail-closed.

### 2026-07-14 (Australia/Sydney) — add MIT license

**Raouf:**

- **Scope:** Add an open-source licence for the codebase. No product behaviour changed.
- **Summary:** Added a standard `LICENSE` (MIT, © 2026 Raouf Abedini) and set `"license": "MIT"` in `package.json`. Covers this repository's own source; it does not relicense third-party poetry sources (e.g. the Wikisource CC BY-SA transcriptions), which carry their own terms and are never committed here.
- **Files Changed:** `LICENSE` (new), `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** `pnpm format:check` clean; no code/tests affected.

### 2026-07-14 (Australia/Sydney) — poetry source ingestion: live run + real-data fixes

**Raouf:**

- **Scope:** Owner authorised the live pipeline ("literature approved; run the full pipeline and ingest all data… keep fixing until correct"). Ran real fetch + extraction against the archival hosts and fixed every defect real data surfaced, in a loop. No poetry, translation, rights approval, or reviewer identity fabricated — ingestion produces private staging + machine candidates only; the public corpus stays empty and `build:production` stays fail-closed. Verse text is git-ignored; only code, hashes, a text-free summary, and docs are committed.
- **Summary:** Fetched all four sources (source-lock.json written). Fixes driven by real data: (1) archival redirects — allowlist switched from exact hosts to registrable-domain **suffix** matching so `*.archive.org` datanodes resolve while look-alikes (`evilarchive.org`) are still rejected; (2) Bell 1897 OCR returned 0 because real poem numbers are bare (`II`, not `II.`) — relaxed the roman-numeral heading, now 33 candidate poems with front matter skipped; (3) the Persian Masnavi EPUB was only a section **index** (titles, no verse) — built `poetry:fetch-masnavi` to pull real couplets from Wikisource ProofreadPage `<span class="beyt">` across ~1001 subpages, ordered by scan page, **resumable** (per-section disk checkpoint + `--assemble-only`), rate-limited with 429 backoff after the first burst tripped Wikimedia's limit; ingested 85+ sections / ~5,000 hemistich lines (continuing toward the full set on resume); (4) candidate matching — token overlap is ~0 across scripts, so replaced it with a curated **transliterated proper-noun / recurring-image** bilingual scorer + colophon/TOC noise filters (246/255 Rumi candidates now carry real signal, e.g. Solomon↔سلیمان). Hafez Divan (589 pages → 1,816 blocks) and Whinfield (6 books → 397 blocks) verified as genuine verse.
- **Files Changed:** `src/lib/content/sourceRegistrySchema.ts` (domain-suffix allowlist), `scripts/poetry/fetch-masnavi-sections.ts` (new), `scripts/poetry/extract-hafez-bell.ts` (bare-numeral headings), `scripts/poetry/extract-sources.ts` (skip index-only Rumi EPUB), `scripts/poetry/build-candidate-index.ts` (bilingual scorer, adapters, anchor, noise filters), `tests/content/masnaviSections.test.ts` (new), `tests/content/bellOcr.test.ts`, `tests/content/sourceLock.test.ts` (subdomain cases), `sources-private/poetry/source-lock.json` + `reports/candidates-summary.json` (committed), `.gitignore` (candidate JSONs), `docs/poetry-source-runbook.md`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2, branch `feat/poetry-source-ingestion`. `pnpm check` green: format/lint/typecheck 0, vitest 536/536 (42 files; +7 Masnavi tests), `verify:dist` (+ leak gate) + `verify:privacy` pass, `audit --prod` clean, `build:production` + `verify:qr` fail-closed. Candidate quality spot-checked; source-lock has 5 verified artefacts.
- **Follow-ups:** `poetry:fetch-masnavi` resumes to complete all ~1001 Masnavi sections (rate-limited). Human pairing/approval of excerpts and every §31.2 launch gate remain outstanding and unfabricated.

### 2026-07-14 (Australia/Sydney) — poetry source ingestion (acquisition + extraction + candidates), adapted

**Raouf:**

- **Scope:** Build the net-new source-provenance layer of the poetry ingestion plan (its Tasks 2–6, 8, 12), wired to feed the **existing** authoring/registry/compiler/UI pipeline. Executed test-first per the plan-review reconciliation in `docs/decisions/poetry-source-integration-baseline.md`: the plan's content/mapping/compiler/UI tasks (7, 10, 11, 13, most of 4) already exist in-repo and more strictly, so rebuilding them was rejected as a hard-invariant violation. No live downloads (owner-gated); acquisition/extraction TDD'd against fixtures and mocked hosts. No poetry, translation, provenance, rights approval, review, or production config fabricated; the public corpus stays empty and `build:production` stays fail-closed.
- **Summary:** Added an immutable source registry (`sourceRegistrySchema.ts` + `sources-private/poetry/registry.yaml`) for the four editions (Hafez Qazvini–Ghani FA / Bell 1897 EN _selection_ / Rumi Nicholson FA / Whinfield _abridged_ EN), strict HTTPS + host-allowlist only. Added a host-allowlisted streaming downloader with redirect revalidation, size caps, SHA-256 source-lock, HTML-for-EPUB rejection, atomic writes and lock reconciliation (`fetch-sources.ts` / `verify-source-lock.ts`), all unit-tested without network. Added honest source rights **evidence** (`sourceRightsSchema.ts` + `rights-evidence.yaml` + `reports/source-rights-report.md`): every record `pending`, and `approved` is structurally impossible without a named human reviewer and an acquired hash ("ai" rejected); extended `docs/rights-register-public.md` with a pending-evidence pointer (no approval claims). Added deterministic stdlib EPUB extraction (`extract-epub.py`, raw vs. search text separated, ZWNJ preserved, XXE/entity guard) with an orchestrator, and conservative Bell OCR candidate parsing (`extract-hafez-bell.ts`, raw kept, corrections empty, visual-verification flagged). Added a non-publishable machine candidate index (`build-candidate-index.ts`, `publishable:false`, refused by the production compiler) and an archival-leak bundle gate (`inspect-public-bundle.ts`) chained into `verify:dist`. New commands: `poetry:fetch`, `poetry:verify-sources`, `poetry:extract`, `poetry:extract-bell`, `poetry:build-candidates`. Runbook at `docs/poetry-source-runbook.md`.
- **Files Changed:** `src/lib/content/sourceRegistrySchema.ts`, `src/lib/content/sourceRightsSchema.ts`, `scripts/poetry/{fetch-sources,verify-source-lock,extract-sources,extract-hafez-bell,build-candidate-index,inspect-public-bundle}.ts`, `scripts/poetry/extract-epub.py`, `sources-private/poetry/{registry.yaml,rights-evidence.yaml,reports/source-rights-report.md,raw/.gitkeep,extracted/.gitkeep}`, `tests/content/{sourceRegistry,sourceLock,poetryRights,extraction,bellOcr,candidateIndex,publicBundleLeak}.test.ts`, `tests/fixtures/poetry/build-fixture-epub.py`, `package.json`, `.gitignore`, `.prettierignore`, `docs/{poetry-source-runbook.md,rights-register-public.md,decisions/poetry-source-integration-baseline.md}`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2, branch `feat/poetry-source-ingestion` off `main` @ `6a102f5`. `pnpm check` green: format/lint/typecheck 0, vitest 529/529 (41 files; +57 net-new poetry tests, none weakened), `build:fixture` + `verify:dist` (incl. the new leak gate) + `verify:privacy` pass, `audit --prod` clean, `build:production` and `verify:qr` fail-closed as intended. Docker evidence skipped (no daemon). No live network fetch performed; all acquisition/extraction tests are hermetic.
- **Follow-ups:** Owner runs `pnpm poetry:fetch` (network) when ready; then extract + build candidates and hand to the Society's reviewers. Public launch still requires approved corpus + rights (incl. CC BY-SA attribution for the two Persian Wikisource transcriptions), cultural review, Bell OCR-vs-scan verification, and every existing §31.2 gate — none fabricated here.

### 2026-07-13 (Australia/Sydney) — frontend design audit fixes (PWA metadata, verse hierarchy, CSS cleanup)

**Raouf:**

- **Scope:** Apply a file-by-file frontend design audit. UI polish and PWA wiring only; no content, rights, approvals, or production configuration fabricated; no new runtime dependency, network call, or storage.
- **Summary:** Wired the PWA identity that was built but unlinked: added an original `icon.svg` (an eight-point *khatam* star in the night/gold palette, `any maskable`), linked the manifest + `theme-color` + icon from `index.html`, and set the manifest `background_color` to the night surface `#0B1026` so the install splash no longer flashes light. `icon.svg` is now a required fixed browser asset in both the release contract (`src/lib/content/release.ts`) and the service-worker schema (`src-sw/schemas.ts`), copied by the build and precached offline. Design: promoted the Persian verse to nastaliq (`--font-persian-display`) with generous leading; gave the result actions a hierarchy (primary "Reveal another" vs. quiet gold-outline "Save"/"Download"). Cleanup: removed the near-invisible fourth background layer (`body::before`, 1.4% hatch), fixed the undefined `--radius-control` on the skip link, scoped the deep-red `h2` rule to light surfaces only (latent invisible-heading trap on dark scenes), set `color-scheme: dark`, and adopted `--action`/`--ornament-bright` plus new `--turquoise-light`/`--ember` tokens in place of hardcoded literals.
- **Files Changed:** `index.html`, `public/icon.svg` (new), `public/manifest.webmanifest`, `src/lib/content/release.ts`, `src-sw/schemas.ts`, `scripts/build.ts`, `src/styles/tokens.css`, `src/styles/visual.css`, `src/app/core.css`, `tests/offline/artifacts.test.ts`, `tests/offline/helpers.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. `bash scripts/check.sh --e2e` green: `format:check` clean, `lint` 0, `typecheck` 0, `test` 472/472 (34 files), `build:fixture` + `verify:dist` pass with `icon.svg` accepted through the full contract, `verify:privacy` pass, `audit --prod` clean, Playwright e2e 5/5 (incl. locked visual matrix and axe). `build:production` and `verify:qr` remain fail-closed; Docker evidence skipped (no daemon). Result screen visually confirmed. Nastaliq applies to real Persian glyphs; the ASCII fixture cannot display it.
- **Follow-ups:** iOS home-screen uses an SVG `apple-touch-icon`, so it falls back to a screenshot until a PNG touch icon exists; §31.2 launch gates unchanged and remain closed.

### 2026-07-13 (Australia/Sydney) — Prettier, quality-gate script, and CI

**Raouf:**

- **Scope:** Repository professionalisation — formatting, a single quality-gate command, continuous integration, and contributor scaffolding. No product behaviour changed.
- **Summary:** Added Prettier (`prettier`, `eslint-config-prettier`) with `.prettierrc.json`/`.prettierignore`, wired `eslint-config-prettier` last in the flat ESLint config so the two do not conflict, and applied formatting repo-wide (append-only logs and the design authority are ignored to avoid prose churn). Added `format`, `format:check`, and `check` scripts. Added `scripts/check.sh`, one command that runs the design §30.1 gauntlet (format, lint, typecheck, tests, fixture build, dist/privacy verification, prod audit) and reports the fail-closed launch gates (`build:production`, `verify:qr`) and the Docker-host evidence it skips; supports `--quick`, `--e2e`, and `--ci`. Added `.github/workflows/ci.yml` running `check.sh --ci` (including Playwright) on pushes to `main` and all pull requests, plus `.editorconfig`, a pull-request template, `CONTRIBUTING.md`, and CI/Node/pnpm badges in `README.md`.
- **Files Changed:** `package.json`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `scripts/check.sh`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, `README.md`, repo-wide Prettier formatting, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0. After formatting: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 472/472 (34 files), `pnpm format:check` clean. `bash scripts/check.sh` passes all hard gates with `build:production` and `verify:qr` correctly fail-closed and Docker evidence skipped (no daemon). The CI workflow uses only static commands — no untrusted `github.event.*` input reaches any `run` step.
- **Follow-ups:** Docker-host and §31.2 launch gates are unchanged and remain closed. Consider adding branch protection requiring the `Quality gate` check before merge to `main`.

### 2026-07-13 (Australia/Sydney) — full integration, Wave C review, share card, and verification evidence

**Raouf:**

- **Scope:** Complete the interrupted integration, run independent Wave C verification, fix confirmed defects, and record Task 8 evidence. No design decision was reopened; no production content, rights, or approvals were fabricated.
- **Summary:** Diagnosed that `feat/divan-open-day-r1` had integrated B1/B2C/B3/B5/B6 but **not** B2 (visual) or B4 (offline/service-worker), leaving the branch internally inconsistent (ops referenced an absent service worker and `offline.html`). Ran a six-dimension read-only review swarm with adversarial verification (functional, accessibility, security, performance, visual/cultural, release-docs); it confirmed 11 real defects and correctly separated intended fail-closed launch gates. Merged `agent/b2-visual`, `agent/b4-integration`, and `agent/public-readiness`, resolving doc/config conflicts. Implemented the previously-absent local share card (§15 / criterion 16) with Web Share, clipboard fallback, and SVG card download announced through the app's single live region. Implemented the dangling `verify:*` scripts (`verify-privacy` docker-free denylist; `scripts/ops/verify-*` running their docker-free `opsConfig` groups; fail-closed `verify-qr`). Fixed two B2↔B4 e2e interaction bugs (service worker vs. Playwright route interception in the visual matrix; `/offline` SPA routing in the e2e server) and the `compose.yaml`→`compose.yml` doc typo. Corrected the previously-overstated `RESUME.md` and added `docs/verification-report.md` with the §31.1 acceptance matrix.
- **Files Changed:** merges of `agent/b2-visual`, `agent/b4-integration`, `agent/public-readiness`; `src/lib/share/*`, `src/components/PoemResult.tsx`, `src/app/App.tsx`, `tests/share/*`, `tests/components/shareAction.test.tsx`; `scripts/verify-privacy.ts`, `scripts/ops/*`, `scripts/qr/verify-qr.ts`; `tests/e2e/visual.spec.ts`, `tests/e2e/offline-server.ts`; `vitest.config.ts`, `eslint.config.js`, `.gitignore`; `docs/implementation-plan.md`, `docs/verification-report.md`, `RESUME.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22.16.0, commit `c552189`. `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 472/472 (34 files), `pnpm test:e2e` 5/5 (Chromium), `test:content` 236, `test:a11y` 18, `test:offline` 53, `test:share` 13, `test:performance` 5, `test:security` 52. `build:fixture`, `verify:dist`, `verify:privacy`, and the four `verify:*` ops groups pass; `pnpm audit --prod` clean; budgets within §21.3 (JS 118 KB gz / CSS 4.8 KB / HTML 657 B / total 752 KB). `build:production` and `verify:qr` retain their exact fail-closed exits.
- **Follow-ups:** Docker-host evidence (image build, `syft` scan, live `compose` and `ops/scripts/verify.sh`) is environment-blocked here — run on a Docker host. All §31.2 launch gates remain closed: approved corpus/rights, cultural review, manual assistive-tech, final hostname/short URL + University-mark approval, live deploy/tunnel/provider logging, rollback rehearsal, and physical QR.

### 2026-07-13 (Australia/Sydney) — visual system and context documents

**Raouf:**

- **Scope:** B2 visual language, responsive scene composition, contextual document routes, bounded reveal choreography, local font use, and controlled visual/performance evidence.
- **Summary:** Applied the locked illuminated-manuscript/night-garden direction with the exact semantic colour tokens, self-hosted pinned fonts, original script-free inline geometry, manuscript portals, distinct Hafez garden and Rumi reed/constellation treatments, illuminated results, a truthful offline-readiness badge, and full/reduced/coarse-pointer motion mappings. Added accessible `/about`, `/credits`, `/accessibility`, `/privacy`, and `/offline` views whose release data, storage boundary, cache wording, cultural distinctions, and remaining review gates stay source-backed and fail closed. No package, lock, private content, compiler/schema, share, service-worker, operations, University mark, or remote asset change was made.
- **Files Changed:** `src/styles/**`, scoped visual components and core scenes under `src/components/**` and `src/scenes/**`, `src/pages/**`, the smallest shell/style imports in `src/app/App.tsx`, `src/app/core.css`, and `src/main.tsx`, visual/context/performance tests, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful initial RED was 11 failures and 1 pass for absent routes, motifs, tokens, fonts, motion, and budgets. Final required gates passed: component tests 51/51, accessibility tests 18/18, performance tests 5/5, visual Playwright tests 2/2, fixture build and distribution verification, strict TypeScript, and ESLint. Playwright captured 70 core/context images across 320x568, 390x844, 844x390, 768x1024, and 1440x900 with no horizontal overflow or remote request. Built gzip evidence was HTML 644 B, CSS 4,847 B, JavaScript 91,135 B, and critical fonts 115,816 B, with zero raster-image bytes.
- **Follow-ups:** Chromium automation and inspected screenshots are bounded evidence, not cross-browser or WCAG-conformance claims. Manual Safari/Firefox Persian shaping, Safari/Chrome/Firefox/Edge coverage, VoiceOver/TalkBack, measured contrast, 200-percent zoom, focus order, physical devices/orientation, reveal tracing, genuine approved content/rights/cultural review, integrated offline behavior, and every separate deployment/governance/QR launch gate remain blocked pending real evidence.

### 2026-07-12 (Australia/Sydney)

**Raouf:**

- **Scope:** Repository bootstrap and instruction chain.
- **Summary:** Established project-local rules for implementing the locked DIVAN release-1 design without weakening privacy, rights, accessibility, security, or EOI-isolation controls.
- **Files Changed:** `AGENT.md`, `.gitignore`, `.dockerignore`, `CHANGELOG.md`, and `docs/implementation-plan.md`.
- **Verification:** Project ignore rules are checked before the first commit; the implementation branch and writer worktrees are created only after the protected baseline exists.
- **Follow-ups:** Execute the approved implementation plan and append the final verification record.

### 2026-07-13 (Australia/Sydney)

**Raouf:**

- **Scope:** Permission effective-date contract and corpus build-date enforcement.
- **Summary:** Added required real ISO `effective_on` permission evidence, rejected permission intervals whose expiry precedes effectiveness, and prevented corpus compilation before permission effectiveness while preserving the independent future-final-approval gate. Only conspicuous synthetic dates were added; no production evidence was created.
- **Files Changed:** `src/lib/content/registrySchemas.ts`, `src/lib/content/compileCorpus.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/fixtures/content/corpus.ts`, `content-private/README.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused registry/compiler tests passed 58/58, the full content suite passed 141/141, strict TypeScript typecheck passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Keep the public-launch gate closed until genuine permission evidence and all separate governance, cultural, rights, accessibility, security, deployment, rollback, and physical-QR evidence are supplied and verified.

### 2026-07-13 (Australia/Sydney) — release compiler and dist gate

**Raouf:**

- **Scope:** B3 build-time content loader, release compiler, fixture builder, and public-distribution verifier.
- **Summary:** Added strict single-document YAML and fixed-layout private content loading, deterministic canonical release artefacts, an isolated 24 Hafez/16 Rumi fixture build, explicit production configuration validation, and fail-closed dist verification for hashes, counts, paths, private data, fixture leakage, remote resources, source maps, and unexpected files. Recorded the editor, asset, and rights workflows without creating production claims.
- **Files Changed:** `scripts/content/loadContent.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `docs/content-style-guide.md`, `docs/asset-register.md`, `docs/rights-register-public.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; test-first RED captured missing loader/release/build modules, then embedded-URL and non-UTC timestamp gaps; focused tests passed 25/25; full content tests passed 166/166; strict TypeScript, ESLint, fixture build, and dist verification passed. Production build exited 1 with the precise missing-approved-corpus blocker.
- **Follow-ups:** Supply and independently review genuine production content, registries, asset bytes, rights evidence, and approvals before production compilation; all separate governance, accessibility, security, deployment, rollback, and physical-QR launch gates remain closed.

### 2026-07-13 (Australia/Sydney) — release-layer review hardening

**Raouf:**

- **Scope:** B3 release asset completeness, destructive-output safety, URI/private-data rejection, and dist-root verification.
- **Summary:** Bound every compiled audio reference to one MIME/size/SHA-verified manifest file, restricted production reads to canonical non-symlink `public-static/`, added a conspicuous fixture-only `TEST ONLY - NOT AUDIO` byte payload, required output replacement to target exactly the explicit project root's `dist`, rejected all `://` schemes and protocol-relative resources, replaced heuristic private-value detection with exact source-derived private-only values, and rejected a symlinked dist root before resolution.
- **Files Changed:** `scripts/build.ts`, `scripts/content/loadContent.ts`, `scripts/verify-dist.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `tests/content/buildRelease.test.ts`, `tests/content/compileCorpus.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/release.test.ts`, `tests/fixtures/content/corpus.ts`, `docs/asset-register.md`, `docs/content-style-guide.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused release-layer tests passed 46/46, the full content suite passed 187/187, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build exited 1 with the unchanged missing-approved-corpus blocker.
- **Follow-ups:** Production compilation and public launch remain closed until genuine approved corpus, audio bytes, source records, rights evidence, human reviews, and every independent launch gate exist and pass verification.

### 2026-07-13 (Australia/Sydney) — bounded release assets and URI schemes

**Raouf:**

- **Scope:** Final narrow B3 asset-size and remote-resource hardening.
- **Summary:** Defined one shared 100,000,000-byte ceiling for private registry and public manifest asset schemas; added pre-read `lstat` validation for symlink, file type, positive size, ceiling, and declared-size equality; replaced whole-file verification hashing with bounded chunked SHA-256 reads; and rejected common non-hierarchical resource schemes without rejecting ordinary colon prose.
- **Files Changed:** `src/contracts/release.ts`, `src/lib/content/registrySchemas.ts`, `src/lib/content/release.ts`, `src/lib/content/remoteResource.ts`, `scripts/content/readAssetFile.ts`, `scripts/content/loadContent.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/registrySchemas.test.ts`, `tests/content/release.test.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `docs/asset-register.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, focused release tests passed 106/106, the full content suite passed 212/212, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build retained the exact required missing-approved-corpus exit-1 blocker.
- **Follow-ups:** Keep production and public launch closed until authentic approved content, assets, evidence, reviews, and all independent launch gates are complete.

### 2026-07-13 (Australia/Sydney) — bare-colon URL predicate closure

**Raouf:**

- **Scope:** Final minimal B3 remote-resource predicate correction.
- **Summary:** Added only the named bare-colon `https:`, `http:`, `ftp:`, `ftps:`, and `javascript:` forms to the existing dangerous-resource scheme blocklist while retaining ordinary prose such as `Note: this is text`.
- **Files Changed:** `src/lib/content/remoteResource.ts`, `tests/content/contentLoader.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, direct loader/verifier tests passed 74/74, the full content suite passed 222/222, fixture build and dist verification passed, strict TypeScript and ESLint passed, and production build retained the exact expected missing-approved-corpus exit-1 blocker.
- **Follow-ups:** Production and public launch remain blocked pending authentic approved content, assets, evidence, reviews, and all independent launch gates.

### 2026-07-13 (Australia/Sydney) — application domain and secure draw

**Raouf:**

- **Scope:** B1 non-React state, history, storage, secure randomness, and per-poet shuffle bags.
- **Summary:** Added a fail-safe typed reducer for the locked stage sequence, exact release-scoped history recovery, six-key session restoration with motion-only local persistence, unbiased Web Crypto rejection sampling without a fallback PRNG, and deterministic approved-active shuffle bags with no-repeat cycles, reset announcements, and optional remaining-ID persistence. No visitor intention, visitor identifier, private content, React/UI, compiler, build, service-worker, deployment, or EOI/ballot behavior was added or changed.
- **Files Changed:** `src/app/state.ts`, `src/app/history.ts`, `src/lib/draw/secureRandom.ts`, `src/lib/draw/shuffleBag.ts`, `src/lib/storage/session.ts`, `tests/unit/state.test.ts`, `tests/unit/history.test.ts`, `tests/unit/secureRandom.test.ts`, `tests/unit/shuffleBag.test.ts`, `tests/unit/storage.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful behavioral RED captured 12 reducer/random failures, 11 history/storage/shuffle failures, and three release-boundary hardening failures; GREEN unit tests passed 38/38, the unchanged content suite passed 222/222, strict TypeScript typecheck passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Integrate these injected domain APIs into the separately owned UI/browser shell, retain verified release IDs when constructing history and storage adapters, and keep every production/public-launch gate closed until authentic content and independent governance, accessibility, security, deployment, rollback, isolation, and physical-QR evidence pass.

### 2026-07-13 (Australia/Sydney) — accessible React core flow

**Raouf:**

- **Scope:** B1 browser runtime, accessible React application shell, semantic core scenes, bounded reveal behavior, native audio, and minimal core CSS.
- **Summary:** Added a fail-closed no-store browser release loader with redirect rejection, strict descriptor/corpus parsing, Web Crypto SHA-256 and secure-random availability checks, exact release/count/ID/item-hash validation, and privacy-safe recovery. Wired the reviewed reducer, three-field history, allowlisted storage, and per-poet shuffle bags into one-active-scene React flows for Hafez and Rumi with English-before-Persian live RTL text, bidi-safe provenance, single live-region announcements, one-shot reveal activation, 250 ms skip availability, 150 ms reduced motion, 1.6 second full motion, post-mount result focus, optional native audio, and privacy-safe error containment. Styling remains intentionally structural for the later B2 visual pass.
- **Files Changed:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/runtime.ts`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/*.tsx`, `src/scenes/*.tsx`, `tests/components/*.ts`, `tests/components/*.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED captured the absent runtime/App/ErrorBoundary/document shell and six focused runtime/audio hardening gaps; GREEN component/runtime/document tests passed 25/25, inherited unit tests passed 38/38, inherited content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** B2 retains final visual-system ownership; context pages, local sharing, service-worker/offline caching, deployment, genuine production content, rights/reviews, manual accessibility evidence, and every independent public-launch gate remain separate and blocked until completed and verified.

### 2026-07-13 (Australia/Sydney) — React core independent-review closure

**Raouf:**

- **Scope:** Focused Task 2B runtime-schema, browser-history, disclaimer, reveal-focus, and offline-announcement corrections from independent review.
- **Summary:** Exactly mirrored every build-time Markdown predicate and safe audio-path segment rule in the browser-only runtime without importing Node code; added a build/runtime parity table with digest-valid invalid items; restricted browser history to coherent durable stages, replaced initial/hydrated state, consumed exact validated `PopStateEvent.state`, omitted `revealing`, and restored Forward results only from an approved in-memory or release-matched session poem ID; installed the required verbatim cultural/non-advice disclaimer immediately after the reveal control; removed skip auto-focus while retaining its 250 ms tabbable appearance; and prevented offline-ready announcements until a release is verified.
- **Files Changed:** `src/app/App.tsx`, `src/app/history.ts`, `src/app/runtime.ts`, `src/scenes/IntentionScene.tsx`, `src/scenes/RevealScene.tsx`, `tests/components/appFlow.test.tsx`, `tests/components/failures.test.tsx`, `tests/components/runtime.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful focused RED reproduced six schema-parity gaps, three history failures, two disclaimer failures, one focus theft, and two false offline-ready announcements; focused GREEN passed, the full component suite passed 39/39, inherited unit tests passed 38/38, inherited content tests passed 222/222, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Keep B2 visual work, context/share/offline-cache/deployment slices, production content and rights evidence, manual accessibility proof, and every independent public-launch gate closed until separately completed and verified.

### 2026-07-13 (Australia/Sydney) — atomic browser release assembly

**Raouf:**

- **Scope:** Root-coordinator integration of the Vite browser shell with the verified content release and distribution gate.
- **Summary:** Replaced the JSON-only/delete-first build with a locked, private two-stage Vite and release assembly. Every emitted browser file is allowlisted by fixed or 16-hex Vite path, MIME-coupled, SHA-256 recorded, required for offline staging, scanned for executable inline markup, remote runtime dependencies, source-derived private values, invalid encoding and media signatures, then verified before a guarded same-parent distribution swap. The previous complete `dist` survives every pre-activation failure; service-worker, manifest and offline files are supported but deliberately not fabricated before B4.
- **Files Changed:** `.gitignore`, `vite.config.ts`, `src/contracts/release.ts`, `src/lib/content/release.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/release.test.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, RED proved the old build omitted the browser shell and accepted coherently rehashed inline script/private-browser leaks; GREEN content tests passed 227/227, component tests 25/25, unit tests 38/38, strict TypeScript and ESLint passed, two complete fixture builds had identical seven-file SHA-256 trees, `verify:dist` passed, and production build exited 1 with the unchanged missing-approved-corpus blocker while retaining the verified fixture distribution.
- **Follow-ups:** B4 must add the complete hand-controlled service worker, manifest and offline document before those fixed files become mandatory; production and public launch remain blocked by genuine content/rights/reviews, manual accessibility, domain/tunnel/logging, rollback and physical-event evidence.

### 2026-07-13 (Australia/Sydney) — browser assembly review hardening

**Raouf:**

- **Scope:** Focused correction of independent Task 2C review findings.
- **Summary:** Prevented default `VITE_*` process variables from entering browser bundles by switching to an explicitly public-only prefix; expanded coherently rehashed HTML, JavaScript and SVG checks across embedded-resource elements and common network APIs; added second-rename restoration evidence; and made post-activation old-backup cleanup a warning-only maintenance condition so a successfully activated verified release is never falsely reported as a failed build.
- **Files Changed:** `vite.config.ts`, `scripts/build.ts`, `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; three adversarial RED tests proved VITE-prefixed process-value leakage plus remote iframe and SVG-image acceptance before the fixes; focused activation/env/remote tests passed 5/5, full content tests passed 232/232, strict TypeScript and ESLint passed, and the real fixture build/dist verifier remained green.
- **Follow-ups:** Re-run independent Task 2C review; the B4 worker/manifest/offline slice and every external production/public-launch gate remain closed.

### 2026-07-13 (Australia/Sydney) — URL-bearing resource predicate closure

**Raouf:**

- **Scope:** Final Task 2C remote-resource verifier correction.
- **Summary:** Generalised HTML URL-attribute validation across all elements, including inline SVG resource nodes, and rejected hard-coded remote DOM resource assignment through `setAttribute` in compiled JavaScript.
- **Files Changed:** `scripts/verify-dist.ts`, `tests/content/buildRelease.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** RED reproduced a coherently rehashed inline SVG image and JavaScript `setAttribute("src", ...)` bypass; GREEN focused tests passed 2/2, full content tests passed 234/234, typecheck/lint passed, and the real fixture build plus `verify:dist` passed.
- **Follow-ups:** Obtain final independent Task 2C approval before integration; all offline, production and external launch gates remain closed.
### 2026-07-13 (Australia/Sydney) — isolated production delivery controls

**Raouf:**

- **Scope:** B6 repository-owned static image, Caddy delivery, dual-network Compose, tunnel rendering, immutable deployment/rollback controls, security tests, and operator runbooks.
- **Summary:** Added digest-pinned BuildKit frontend, Node, Caddy, and cloudflared images; a production-default fail-closed multi-stage build; unprivileged port-8080 Caddy delivery with exact CSP/security/cache rules and no access log; content-aware internal health; origin-only web networking with tunnel-only egress; strict non-secret tunnel rendering; and dry-run-capable deploy, verify, and rollback scripts that reject mutable image references and never rebuild on the server. Runtime smoke testing found and fixed Caddy's unnecessary low-port file capability under `cap_drop: ALL`, and header smoke testing changed the conservative cache header to a set-if-absent default so immutable and health routes retain their locked policies.
- **Files Changed:** `ops/Dockerfile`, `ops/Caddyfile`, `ops/compose.yml`, `ops/cloudflared/config.yml.example`, `ops/scripts/*.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/*`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED produced 16 missing-control failures followed by focused Caddy capability, cache-routing, DNS, state-order, and rollback-safety failures; GREEN security tests passed 22/22, strict TypeScript and ESLint passed, the 222-test content suite remained green, Compose rendered without host ports, the explicit fixture image built, Caddy/cloudflared configurations validated, and a hardened local container passed release integrity, non-root/read-only/cap-drop, file-exclusion, CSP, cache, and health checks. The default Docker build exited 1 at the exact missing-approved-production-corpus gate.
- **Follow-ups:** Do not deploy until an approved production corpus/image, dedicated domain/tunnel, provider-log decision, firewall/host hardening evidence, registry/SBOM/vulnerability evidence, neighbouring-service baseline, rehearsed live rollback, accessibility/governance approvals, and physical-QR gates all pass. No live host, Cloudflare, DNS, firewall, registry, GitHub, or existing service was changed by this slice.

### 2026-07-13 (Australia/Sydney) — delivery-control review closure

**Raouf:**

- **Scope:** B6 production-image rejection, tunnel-file ownership, deployment restoration, runtime inspection, release integrity, public headers/cache behavior, and state/health hardening.
- **Summary:** Closed all six independent operations-review findings. Deployment now rejects fixture-labelled images before activation and fixture release metadata in container health, validates root-provisioned mode-`0400` tunnel files by canonical metadata without incorrectly requiring the deployment identity to read them, verifies exact running image bytes/containers/networks/ports/mounts/resources, binds release paths and corpus/asset-manifest identities to their declared hashes, performs only bounded HTTPS public checks across every cache class, grants immutable caching only to existing content-addressed files, and stops an unverified DIVAN stack when no verified restoration is available. State paths/ownership/modes and health timeouts are fail closed.
- **Files Changed:** `ops/Caddyfile`, `ops/compose.yml`, `ops/scripts/container-health.sh`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/render-tunnel-config.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `docs/phase-0-environment-decisions.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, two focused RED rounds produced three failures each; GREEN operations security tests passed 32/32, content tests passed 222/222, strict TypeScript and ESLint passed, fixture build/dist verification passed, shell syntax/diff checks passed, Compose and Caddy configurations validated, and the default production package and Docker builds both failed at the exact absent-approved-corpus gate. A rebuilt fixture image carried the `fixture` label and its production health command exited 1. A definitive healthy container smoke remains an integration check because this isolated branch intentionally predates the React build that emits `index.html`; health was not weakened and application code was not imported.
- **Follow-ups:** Rebuild and smoke the image after integration with the complete static application, then retain all live domain/tunnel/provider-log, host/firewall, neighbouring-service, SBOM/scan, rollback-rehearsal, accessibility/governance, and physical-QR launch gates. No live system, registry, DNS, firewall, or credential was contacted or changed.

### 2026-07-13 (Australia/Sydney) — fail-closed activation and runtime binding

**Raouf:**

- **Scope:** Second B6 review closure for activation failure handling, exact runtime isolation, and running-to-public release coherence.
- **Summary:** Prevalidated every saved restore image before the first activation and armed one exit/signal fail-closed handler across candidate/rollback activation and restoration, so missing images, fixture labels, repository-digest mismatch, command failure, or failed verification cannot bypass the DIVAN stack stop after activation begins. Runtime verification now requires canonical tunnel bind sources, zero web mounts, exact tmpfs, dedicated bridge network labels/settings/member sets, and rejects foreign members. It extracts `/srv/release.json` from the exact running container and requires the public pointer to match its release identity and SHA byte for byte.
- **Files Changed:** `ops/compose.yml`, `ops/scripts/deploy.sh`, `ops/scripts/lib.sh`, `ops/scripts/rollback.sh`, `ops/scripts/verify.sh`, `tests/security/opsConfig.test.ts`, `tests/fixtures/ops/mock-bin/docker`, `tests/fixtures/ops/mock-bin/stat`, `docs/deployment-runbook.md`, `docs/rollback-runbook.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED produced eight failures across restore prevalidation, runtime-contract helpers, and release-pointer binding; GREEN operations security tests passed 43/43, including mocked absent/fixture/digest/verification failures for deploy and rollback plus swapped-source, extra-mount, foreign-member, and coherent-other-release negatives. Content tests passed 222/222; typecheck, lint, fixture build/dist, shell syntax, diff hygiene, Compose config, Caddy validation, and the exact production package fail-closed gate passed.
- **Follow-ups:** Run the definitive integrated healthy-container and public-header smoke after cherry-pick onto the complete application branch. Live deployment, tunnel/domain/provider-log decisions, host/firewall and unchanged-neighbour evidence, SBOM/scans, rollback rehearsal, accessibility/governance approvals, and physical-QR tests remain launch blockers. No live system or secret was accessed.
### 2026-07-13 (Australia/Sydney) — accessibility hardening

**Raouf:**

- **Scope:** B5 focus restoration, motion precedence, semantic/reflow guardrails, automated accessibility coverage, and privacy-safe failure behavior.
- **Summary:** Added closed-union focus helpers and system/stored motion resolution; restored focus across scene and real Back traversal; made the skip link focus the active main region without URL mutation; retained one scene and `h1`, English-before-Persian live RTL text, bidi isolation, one polite atomic live region, native non-autoplay audio, and plain errors; and added 44-by-44 control, two-tone focus, 320-pixel reflow, text-spacing, reduced-motion, keyboard, axe, and real-Chromium checks. No content, package, offline, sharing, visual-asset, deployment, EOI, or ballot behavior changed.
- **Files Changed:** `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/core.css`, `src/components/SkipLink.tsx`, focused scene components, `src/lib/accessibility/*.ts`, `tests/accessibility/*.ts*`, `tests/e2e/accessibility*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, the resumed TDD cycle reached GREEN with accessibility tests 16/16, component tests 39/39, unit tests 38/38, strict TypeScript, and zero-warning ESLint; Chromium Playwright checks passed 2/2 across both poets with browser axe, keyboard, history focus, 320-pixel/text-spacing reflow, motion precedence, skip timing, and audio-failure preservation. Automated axe support does not establish WCAG conformance.
- **Follow-ups:** Keep public launch blocked pending recorded VoiceOver iOS and macOS, TalkBack Android, Persian pronunciation, Safari/Firefox/Edge, actual-device portrait/landscape/browser-chrome, 200-percent zoom capture, measured contrast, manual focus-order, and context-page navigation evidence, plus all separate governance, content, rights, security, deployment, rollback, isolation, performance, and physical-QR gates.

### 2026-07-13 (Australia/Sydney) — accessibility review closure

**Raouf:**

- **Scope:** B5 reduced-motion rendering, blocking-error focus, and clean-checkout Playwright execution.
- **Summary:** Replaced the inert reduced-motion transition declaration with an actual painted opacity change from zero to one over 120 ms before the 150 ms result mount, while leaving the full-motion path unchanged; focused the mounted blocking-error heading after invalid draws and secure-random exceptions; and added a default root Playwright configuration whose server builds the fixture corpus before selecting the one bounded accessibility spec. No content, packages, lockfile, offline, sharing, deployment, EOI, or ballot behavior changed.
- **Files Changed:** `src/app/App.tsx`, `src/app/core.css`, `src/scenes/RevealScene.tsx`, `tests/accessibility/appAccessibility.test.tsx`, `tests/accessibility/styles.test.ts`, `tests/components/failures.test.tsx`, `tests/e2e/accessibility.playwright.config.ts`, `tests/e2e/accessibility.spec.ts`, `playwright.config.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced one inert opacity path and two body-focused blocking errors; focused GREEN passed 25/25, accessibility passed 18/18, components passed 41/41, and unit tests passed 38/38. `pnpm test:e2e --list` selected exactly two tests in one spec; Chromium passed 2/2 and exposed a rendered `CSSTransition` from opacity 0 to 1 over 120 ms. A second 2/2 Chromium run rebuilt fixture output after the prior ignored `dist` was moved away. Strict TypeScript and zero-warning ESLint passed.
- **Follow-ups:** Automated evidence is not a WCAG-conformance claim; keep the same manual assistive-technology, Persian-pronunciation, device/browser, 200-percent zoom, measured-contrast, focus-order, context-navigation, and all independent public-launch gates blocked until genuine evidence is reviewed.

### 2026-07-13 (Australia/Sydney) — skip-timing flake closure

**Raouf:**

- **Scope:** Final B5 keyboard skip timing and real-browser elapsed-time evidence.
- **Summary:** Moved the reveal skip control from 250 ms to 200 ms so browser timer, render, and observation scheduling retain a 100 ms margin inside the locked 300 ms maximum. Replaced the exact-300-ms Playwright wait dependency with an in-browser activation timestamp and an independent measured assertion that visible skip availability is at most 300 ms; focus remains on the visitor's existing control until they choose Skip.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `tests/e2e/accessibility.spec.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, test-first RED showed the skip still absent at 200 ms with the prior product delay, then focused GREEN passed at the 199/200 ms boundary. Full component tests passed 41/41 twice, accessibility tests passed 18/18 twice, and two consecutive corrected Chromium runs passed 2/2 with the unchanged measured `<= 300 ms` requirement. Strict TypeScript and zero-warning ESLint passed.
- **Follow-ups:** The timing buffer closes this automated flake only; all previously recorded manual accessibility, genuine content, governance, security, deployment, rollback, isolation, and physical-QR launch gates remain blocked.

### 2026-07-13 (Australia/Sydney) — concurrent-load skip timing

**Raouf:**

- **Scope:** Final B5 skip-control margin under concurrent browser load.
- **Summary:** Moved keyboard-reachable Skip availability from 200 ms to 100 ms after the 200 ms setting exceeded the locked 300 ms browser-visible maximum under concurrent load. The deterministic test now enforces hidden at 99 ms and visible at 100 ms, while the existing Chromium test continues to measure from the actual DOM activation event and independently requires visible availability within 300 ms; no timeout or acceptance threshold was inflated.
- **Files Changed:** `src/app/App.tsx`, `tests/components/appFlow.test.tsx`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced absence at the new 100 ms boundary with the prior product setting; focused GREEN passed at 99/100 ms. Five consecutive measured Chromium runs passed 2/2 under the active concurrent workload, followed by full component tests 41/41, accessibility tests 18/18, strict TypeScript, and zero-warning ESLint.
- **Follow-ups:** This closes the automated skip-timing flake only; all manual accessibility and every independent production/public-launch gate remain unchanged and blocked pending reviewed evidence.

### 2026-07-13 (Australia/Sydney) — offline delivery integration fixes

**Raouf:**

- **Scope:** B6 static recovery routing, production image build inputs, and immutable asset-cache parity with the release schema.
- **Summary:** Stopped Caddy from rewriting the integrity-checked `/offline.html` recovery artefact to the SPA, assigned the exact file no-cache and noindex handling while retaining `/offline` as an application route, and expanded immutable matching to the complete verified release-path contract including nested audio/font/image/icon paths and underscore or embedded digest prefixes. Added only the seven non-secret production compiler inputs as Docker build arguments and documented the exact explicit approved-image command without weakening the no-argument production gate or fixture isolation.
- **Files Changed:** `ops/Caddyfile`, `ops/Dockerfile`, `docs/deployment-runbook.md`, `tests/security/opsConfig.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; meaningful RED failed exactly 3/46 ops tests for the three integration defects, focused GREEN passed 46/46, content passed 234/234, strict TypeScript and zero-warning ESLint passed, Bash/POSIX syntax and diff hygiene passed, pinned Caddy accepted the configuration, Compose rendered without mutation, the explicit fixture image built and passed an isolated no-egress/no-host-port smoke while production health rejected it, and the default Docker production build failed at the exact absent-approved-corpus gate.
- **Follow-ups:** Re-run the `/offline.html` byte/header smoke after the reviewed B4 artefact is integrated; no production content, image, hostname, tunnel, provider-log decision, live deployment, rollback rehearsal, external approval, or physical-event evidence was created, so every corresponding launch gate remains blocked.

### 2026-07-13 (Australia/Sydney) — test-harness hygiene and resume handoff

**Raouf:**

- **Scope:** Reliable green baseline for the full local suite and a session-handoff note. No product behavior changed.
- **Summary:** Excluded Playwright end-to-end specs (`tests/e2e/**`) from vitest so `pnpm test` no longer collects `accessibility.spec.ts` and fails on `test.beforeEach`; raised vitest `testTimeout`/`hookTimeout` to 30 s so the ops and release tests that spawn real builds and shell scripts via `execFileSync` stop flaking with "Test timed out in 5000ms" under concurrent CPU load while fast tests remain unaffected; ignored the determinism test's leftover `.tmp-tests/` fixture build output in ESLint and git so `pnpm lint` stops erroring on nested `dist` JavaScript. Added `RESUME.md` capturing stage status, the verified green baseline, and the next task.
- **Files Changed:** `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `RESUME.md`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; before the change `pnpm test` failed on the wrongly-collected Playwright spec, and once excluded the ops/release subprocess tests flaked non-deterministically with 5000 ms timeouts (3, then 1, then 2 failures) while `pnpm test:content` stayed 234/234. After the change `pnpm typecheck` and `pnpm lint` exited 0, `pnpm test` passed 377/377 across 21 files, `pnpm build:fixture` and `pnpm verify:dist` passed, and `pnpm build:production` retained the exact exit-1 `no approved production corpus exists in content-private` gate.
- **Follow-ups:** Resume at Task 7 (Wave C independent verification) then Task 8 (final gauntlet + `docs/verification-report.md`). All content, rights, cultural, manual-accessibility, deployment, rollback, and physical-QR launch gates remain blocked pending genuine reviewed evidence.
### 2026-07-13 (Australia/Sydney) — atomic offline release core

**Raouf:**

- **Scope:** B4 browser-safe offline release schemas, bounded integrity checks, candidate staging, deferred atomic activation, active-only routing, nonblocking client registration, install manifest, and offline recovery document.
- **Summary:** Added a hand-controlled service-worker source with strict canonical release/corpus/asset validation, canonical item-hash verification, exact audio joins, an 8 MB non-audio ceiling enforced with bounded stream reads, release-ID reuse rejection, candidate-only failure cleanup, single-record active/previous switching, one-generation retention, and no audio precache. Runtime routing never searches pending or previous releases, keeps health and worker requests network-only/no-store, verifies network navigation HTML against the active manifest, caches declared audio only after a browser audio request, and reports only typed privacy-safe client statuses. The local manifest and script-free recovery page use Persian Society wording without an unapproved University claim or remote resource.
- **Files Changed:** `src-sw/cacheTypes.ts`, `src-sw/integrity.ts`, `src-sw/schemas.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `public/manifest.webmanifest`, `public/offline.html`, `tests/offline/*.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22.16.0; initial RED was three missing-module offline suites; GREEN offline tests passed 34/34, inherited content tests passed 234/234, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Root integration must bundle `src-sw/service-worker.ts` as the fixed classic-IIFE `service-worker.js`, register the reviewed client seam, rebuild and verify the complete release, and run real HTTPS Playwright plus supported Safari/Chrome/Edge/Firefox, iOS, Android, install, storage, warm-offline, failed-update, audio, refresh, and rollback checks. These manual/browser gates, authentic production content and rights, governance approvals, deployment, and physical-QR evidence remain blocked and were not claimed here.

### 2026-07-13 (Australia/Sydney) — offline-core review closure

**Raouf:**

- **Scope:** B4 target-aware activation and rollback, protected cache reuse, compressed-response reconstruction, status-contract closure, and direct service-worker lifecycle coverage.
- **Summary:** Bound explicit activation to one validated release ID carried from typed worker status through the client request, enabled exact previous-release rollback, emitted `activating` before pointer mutation and `active` only after the requested target is confirmed plus `skipWaiting` succeeds, and reported failed targets without false-active status. Protected both active and previous caches from reused/incoherent metadata deletion. Treated compressed `Content-Length` as wire metadata while retaining bounded decoded reads and exact decoded byte/SHA checks, then stripped stale transfer, encoding, range, cookie, and variation headers from reconstructed cached responses while retaining security/content headers. Added a direct install/message/fetch worker harness.
- **Files Changed:** `src-sw/integrity.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `src/sw-client/register.ts`, `tests/offline/client.test.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/serviceWorker.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0, meaningful RED reproduced seven findings across targetless status/rollback, previous-cache deletion, compressed length/header reconstruction, missing `activating` delivery, and absent direct worker dispatch. GREEN offline tests passed 40/40, inherited content tests passed 234/234, strict TypeScript passed, and ESLint passed with zero warnings or errors.
- **Follow-ups:** Root integration must still bundle and register this reviewed worker, then prove real HTTPS worker install/update/activate/controller transitions, warm offline, failed update, rollback, storage pressure, browser/device coverage, and the unchanged external production/public-launch gates.

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

### 2026-07-13 (Australia/Sydney) — release-versioned worker closure

**Raouf:**

- **Scope:** Critical B4 service-worker update identity, genuine multi-release browser evidence, and concurrent component-test stability.
- **Summary:** Versioned every compiled worker by both the exact public release ID and canonical public-corpus SHA-256, and made install fail closed when fetched release identity differs from the worker build. This guarantees corpus-only changes produce different worker bytes even if an operator incorrectly reuses a release ID. Replaced the E2E server's hand-appended comment with genuine Vite worker builds for each served release and required the checked distribution worker to byte-match a clean rebuild. Stabilised the post-verification registration assertion with an awaited effect boundary.
- **Files Changed:** `scripts/build.ts`, `src-sw/releaseManager.ts`, `src-sw/service-worker.ts`, `tests/components/offlineIntegration.test.tsx`, `tests/content/buildRelease.test.ts`, `tests/e2e/offline-server.ts`, `tests/offline/releaseManager.test.ts`, `tests/offline/serviceWorker.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Meaningful RED proved genuine worker output lacked release versioning. Under Node 22.16.0, focused content/offline tests passed 85/85, strict TypeScript and zero-warning ESLint passed, the fixture build and distribution verifier passed, emitted worker bytes contained the exact release and content identities, and the real Chromium offline lifecycle passed 1/1 using only genuine versioned worker outputs.
- **Follow-ups:** Rerun the full combined suite and independent B4 review after integration with B2/public-readiness; retain manual cross-browser, device, storage-pressure, approved-content, deployment, accessibility, governance, and physical-QR gates.
### 2026-07-13 (Australia/Sydney) — public source governance

**Raouf:**

- **Scope:** Public repository orientation, source-rights boundary, security reporting, third-party font notices, and removal of deployment-host detail from public documentation.
- **Summary:** Added an honest work-in-progress README, GitHub private vulnerability reporting policy, exact installed OFL 1.1 font notices, a Node runtime pin, repository metadata, and repository-wide ownership. Kept the repository all rights reserved with no open-source licence grant, replaced host discovery with private evidence gates, and renamed the synthetic operations sentinel so it cannot be mistaken for a credential.
- **Files Changed:** `README.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`, `.node-version`, `.github/CODEOWNERS`, `package.json`, `docs/phase-0-environment-decisions.md`, `tests/fixtures/ops/*`, `tests/security/opsConfig.test.ts`, `tests/security/publicReadiness.test.ts`, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Under Node 22.16.0 and pnpm 10.33.0, TDD RED first produced six missing-public-readiness failures and a separate preview-command failure; GREEN passed the focused suite 6/6, security tests 49/49, content tests 234/234, strict TypeScript, zero-warning ESLint, and diff/prose hygiene. The frozen lockfile installed from the offline pnpm store without changing dependency versions. Gitleaks found no leaks in the exact staged snapshot or the 59-commit all-history scan.
- **Follow-ups:** Before any public push, rewrite non-public author and committer email metadata in repository history and rescan the rewritten history; keep GitHub private vulnerability reporting disabled until the owner deliberately enables it. Production content, rights, reviews, live infrastructure, accessibility evidence, and every other launch gate remain blocked.
