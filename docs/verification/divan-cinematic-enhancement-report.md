# DIVAN Cinematic Enhancement Verification Report

Completed at: 2026-07-16T04:05:00Z

## Repository state

Branch: `feat/cinematic-threshold` (dedicated worktree, based on `origin/main` @ `e771aa9`)
Tested code HEAD: `4ee014a831f4e91b6038764b365b54abab8398e3`
Working tree at test time: clean apart from this report, the evidence ledger updates, and the
`AGENT.md`/`CHANGELOG.md` change-protocol entries, which are committed immediately after this
report and before the armed release gate runs. Git-ignored local evidence (screenshots, raw
generation masters under `docs/evidence/runtime/`, `.claude/runtime/`) is intentionally untracked.

## Changed files

- Contract: `src/contracts/release.ts`, `src/lib/content/release.ts`, `src-sw/schemas.ts`,
  `scripts/build.ts`, `scripts/verify-dist.ts`, `vite.config.ts`.
- App: `src/app/App.tsx`, `src/scenes/WelcomeScene.tsx`, `src/scenes/RevealScene.tsx`.
- New components: `src/components/CinematicThreshold.tsx`, `BookStage.tsx`, `CandleScene.tsx`,
  `ButterflyField.tsx`, `PoetryMotes.tsx`; new libraries `src/lib/cinematic/capability.ts`,
  `src/lib/cinematic/scrollScrub.ts`.
- Styles: `src/styles/visual.css`, `src/styles/motion.css`; timing `src/lib/accessibility/motion.ts`.
- Released assets: `public/images/divan-poster-{mobile,desktop}.webp`,
  `public/images/divan-alcove-{mobile,desktop}.webp`,
  `public/video/divan-cinematic-{mobile,desktop}.mp4`.
- Tests: `tests/unit/cinematicCapability.test.ts`, `tests/unit/scrollScrub.test.ts`,
  `tests/components/cinematicThreshold.test.tsx`, updates to `tests/content/release.test.ts`,
  `tests/content/buildRelease.test.ts`, `tests/offline/helpers.ts`,
  `tests/components/appFlow.test.tsx`.
- Tooling/docs: `.claude/` pack (committed), `eslint.config.js`, `.prettierignore`, `.gitignore`,
  `docs/design/divan-cinematic-enhancement-ledger.md`, `docs/design/divan-cinematic-design-lock.md`,
  `docs/verification/divan-cinematic-assets.json`, `docs/verification/divan-cinematic-provenance.md`,
  this report.

## Asset integrity

Roles, bytes, and SHA-256 are machine-recorded in `docs/verification/divan-cinematic-assets.json`
(6 assets, 5,857,556 bytes; `node .claude/scripts/check-media-budget.mjs` → "Media budget PASS").
Summary: poster-mobile 202,136 B (720×1280 webp) · poster-desktop 199,096 B (1280×720 webp) ·
backdrop-mobile 66,134 B · backdrop-desktop 64,474 B · cinematic-mobile 2,624,919 B
(720×1280, 8.0 s, H.264 yuv420p faststart GOP 24, no audio) · cinematic-desktop 2,700,797 B
(1280×720, 7.0 s, same treatment). Provider/model/job, prompt lineage, generation dates, human
selection, and rights posture (no overclaim) are recorded in
`docs/verification/divan-cinematic-provenance.md`. Stills: OpenAI `gpt-image-2`, 2026-07-16.
Motion: Gemini `gemini-omni-flash-preview`, 2026-07-16. Handoff verification: SSIM between each
released clip's final decoded frame and its released backdrop webp — mobile 0.9662, desktop
0.9832 (codec noise only); posters are the clips' first decoded frames (exact seam).

## Commands and results

All run in this worktree, Node 22.16.0, pnpm 10.33.0 via corepack, 2026-07-16 (AEST):

- `pnpm format:check` -> exit 0
- `pnpm lint` -> exit 0 (max-warnings 0)
- `pnpm typecheck` -> exit 0
- `pnpm test` -> exit 0 — 37 files, 529 tests passed (includes 21 new cinematic unit tests and
  7 threshold component tests). One earlier suite-order flake of
  `tests/accessibility/appAccessibility.test.tsx` did not reproduce across two full re-runs.
- `pnpm build:fixture` -> exit 0 ("Built fixture release test-only-fixture-release (40 items)")
- `pnpm verify:dist` -> exit 0 (exact dist set incl. images/ and video/, mp4 ftyp signatures)
- `pnpm verify:privacy` -> exit 0
- `pnpm test:e2e` -> exit 0 — 5/5 Playwright (keyboard flows + axe, motion precedence,
  offline release coherence, locked visual matrix, bounded reveal choreography)
- `bash scripts/check.sh --e2e` — every step green except `pnpm audit --prod`, which fails with
  HTTP 410 because npm retired the audit endpoints; the identical command fails identically in
  the untouched main checkout, so this is environmental, not introduced by this change.
- `node .claude/scripts/validate-pack.mjs` -> exit 0 · `node .claude/scripts/check-protected-diff.mjs`
  -> exit 0 (1 protected file unchanged) · `node .claude/scripts/check-media-budget.mjs` -> exit 0.
- Final release-gate evidence: `.claude/runtime/release-gate-pass.json` (hash-bound to HEAD and
  worktree state; produced by `bash .claude/scripts/run-divan-gate.sh` after this report).

## Accessibility

- Keyboard-only: e2e `accessibility.spec.ts` completes both poet flows by keyboard with axe checks
  (0 violations) and 320 CSS px reflow assertions — exit 0.
- The threshold adds no keyboard trap: "Begin" is reachable immediately in every route; the
  "Skip entrance" control is a plain button; arrival announces through the single shared polite
  live region ("You have arrived at the reading alcove." observed in-browser).
- Reduced motion (verified live in Chromium with `divan.motionPreference=reduced`): no `<video>`
  element, zero `/video/` network requests, no scroll corridor, poster route with Begin — measured
  `{hasVideoElement:false, videoNetworkRequests:0, state:"poster"}`.
- English-first order and Persian `lang="fa" dir="rtl"` unchanged (component tests + e2e assert).
- Decorative layers (`.cinematic-media`, `.book-stage`, candle, butterfly, motes, book layers)
  are `aria-hidden="true"` and pointer-transparent.
- 200% zoom and manual assistive-technology passes on physical devices remain part of the §31.2
  launch-gate matrix (external gate, unchanged).

## Performance

Measured on the built fixture (vite preview, Chromium, 390×844 mobile emulation, 4× CPU
throttle, Fast 4G): **LCP 1396 ms** (gate ≤ 2500), **CLS 0.00** (gate ≤ 0.1). INP: not directly
measurable in the lab pass; interactions are plain button activations with no long tasks
observed in the trace (INP gate re-checked at the physical-device launch gate).
Compressed shell (gzip, measured from dist): HTML 1,415 B (≤ 40 k) · CSS 6,583 B (≤ 45 k) ·
JS 120,366 B (≤ 200 k) · critical fonts 115,816 B raw (≤ 180 k) · initial raster images 0 B
(posters ship via the release manifest, never the Vite payload). Media: posters 401,232 B,
backdrops 130,608 B, cinematic mobile 2,624,919 B (≤ 3 MiB), desktop 2,700,797 B (≤ 6 MiB);
dist total 6,629,130 B. Authored CSS 34,466 B ≤ 45,000 B lock. Video is never precached;
posters+backdrops are precached (offline guarantee, within the 8 MB offline ceiling).

## Privacy and security

- CSP unchanged (`ops/Caddyfile`, locked by `tests/security/opsConfig.test.ts`): `media-src 'self'`
  and `img-src 'self' data: blob:` already cover same-origin video/posters; no directive touched.
- Public network inspection: all requests same-origin (`127.0.0.1:4173`) during the full walk;
  zero third-party hosts; `verify:privacy` passes over src and dist.
- No analytics, cookies, identifiers, autoplay audio (released clips carry no audio stream — the
  Omni Flash masters' AAC track is stripped), no WebGL, no runtime remote fonts.
- No raw generation records, API responses, or `.env` values in the public build; `verify:dist`
  leak scan passes; API tokens live only in the git-ignored, untracked `.env` (mode 600).
- Protected-content baseline unchanged throughout (`check-protected-diff.mjs` PASS at start,
  during, and in the gate).

## Offline and failure paths

- Offline reload (Chromium offline emulation, SW active): app shell + poster served from the
  verified release cache; full flow to a poem completed offline ("Your verse is ready."
  announced). Poem never requires video.
- Video failure routes (component-tested + live): decode `error` → poster route, entry keeps
  working; no first frame within 4 s → poster route, video element removed; both leave Begin as
  the path in. Corridor cannot auto-arrive before layout (regression-tested).
- Save-Data and reduced motion never create the video element (unit + component + live evidence).
- The 9:16/16:9 clip is chosen once per visit by media class; the unselected variant is never
  fetched; neither variant is ever precached.
- SW `/video/` requests pass through to the network (HTTP range seeking preserved); offline they
  fail silently into the poster route.

## Rollback

The enhancement is a linear commit sequence on `feat/cinematic-threshold` over `e771aa9`:
`ca459cc` (pack+ledger) → `6796aad` (design lock) → `7cecfab` (assets+manifest+provenance) →
`31e5568` (release contract) → `f4dcc74` (threshold) → `1fb6f18` (book+atmosphere) →
`4ee014a` (opening polish) → docs/report commit. Roll back the whole feature by deleting the
branch (main untouched), or a single layer with `git revert <commit>`; released media disappear
from dist on the next `pnpm build:fixture` once their `public/` files and contract entries are
reverted together (the locked tests enforce consistency in both directions). Offline caches
self-heal: the SW stages any newer release atomically and prunes old caches; a stale client can
be cleared by unregistering the worker (documented in the deployment runbook).

## Final verdict

PASS WITH EXTERNAL LAUNCH GATES

External gates, unchanged and intentionally closed: approved corpus + rights, cultural review,
manual assistive-technology matrix on physical devices (incl. INP and Persian shaping with a real
corpus), University-mark approval, final hostname/QR/deploy/rollback rehearsal (design §31.2);
`build:production` and `verify:qr` remain fail-closed by design; `pnpm audit --prod` is blocked
by npm's retired endpoint (environmental; affects the base branch identically).
