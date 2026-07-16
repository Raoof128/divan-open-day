# DIVAN Cinematic Enhancement — Evidence Ledger

Started 2026-07-16 (Australia/Sydney). Task worktree: `/Users/raoof.r12/Desktop/Raouf/OpemDay-cinematic`.
Every architectural claim in this ledger is verified against the repository or a live command; adaptations
from the v3 gauntlet-final package are recorded in §9.

## 1. Repository state

- Branch: `feat/cinematic-threshold`, created from `origin/main` @ `e771aa9` ("Add MIT license").
- Dedicated git worktree; the translation/poetry pipeline works elsewhere (branch
  `feat/poetry-source-ingestion` in the primary checkout). Never run both writers in one directory.
- Toolchain: Node 22.16.0 (nvm; repo pin `.node-version`), pnpm 10.33.0 via corepack,
  ffmpeg + ffprobe (Homebrew), Higgsfield CLI 1.1.13, Claude Code 2.1.210.
- Framework: Vite 8 + React 19 + strict TypeScript; hand-written service worker in `src-sw/`.
- Package scripts confirmed against `package.json`; `build:production` is fail-closed by design
  (launch gates). The honest release-gate build is `build:fixture`.

## 2. Pack installation (Phase 0)

- `.claude/` pack (v3 gauntlet-final) installed from
  `New_Frontend/2026-07-15-divan-fable5-claude-skills-pack-v3-gauntlet-final/`.
- `node .claude/scripts/validate-pack.mjs` → PASS (8 skills, 28 required files).
- `node .claude/scripts/configure-divan-project.mjs` → wrote `.claude/divan-project.json`.
  Corrections applied after inspection: `build` → `pnpm build:fixture`; documented extra keys
  (security, performance, verifyDist, verifyPrivacy) covered by `pnpm check` at Phase 7.
- `bash .claude/scripts/activate-cinematic-task.sh` → protected baseline captured (1 file:
  `content-private/README.md` — the only protected path present on this branch; the poetry roots
  live on other branches and remain absent here).
- `releaseGateEnabled` remains `false` until final verification.

## 3. Baseline verification (all fresh, this worktree)

- `pnpm check --quick` → PASS: format:check, lint, typecheck, vitest 499/499 (34 files).
  - Required repo adaptation: ESLint and Prettier now ignore `.claude/**` (pack tooling is not
    product code; typed-lint project service rejected the `.mjs` pack scripts).
- `pnpm build:fixture` → "Built fixture release test-only-fixture-release (40 items)".
- `pnpm verify:dist` → PASS (40 items). `pnpm verify:privacy` → PASS.
- dist inventory: 772 KB total — 6 self-hosted woff2 fonts, 1 CSS, 1 JS, icon.svg,
  manifest.webmanifest, offline.html, index.html, release.json, service-worker.js,
  1 fixture audio mp3, 2 content JSON.

## 4. Baseline UI walk (fixture preview @ 127.0.0.1:4173)

Screenshots (git-ignored, regenerable) in `docs/audits/divan/screenshots/cinematic-baseline/`:

1. `01-welcome-mobile-390.png` — Welcome: night-lapis, gold khatam-star geometry, EN headline +
   Persian beneath, red "✦ Begin", Motion combobox in banner, offline-ready polite status.
2. `02-choose-poet-mobile-390.png` — "Whose words will you open?"; two poet buttons
   ("Open the Divan — Hafez…", "A Moment of Reflection — Rumi…").
3. `03-intention-mobile-390.png` — "Take a quiet moment." + "Press to reveal" + cultural disclaimer.
4. `04-reveal-result-mobile-390.png` — parchment result card "Your verse", English first,
   Persian beneath (fixture sentinels), "A reflection, not a prediction".
5. `05-welcome-desktop-1440.png` — desktop welcome.

Flow truth: boot → welcome → choose-poet → intention → reveal(result). Accessible names stable:
"Begin", "Press to reveal", "Reveal another", "Save this verse", "Download verse card".
One shared polite live region announces via `onAnnounce`.

## 5. Higgsfield truth (live CLI, 2026-07-16)

- Authenticated; workspace `Private` (eefeb319…) selected. **Credits: 10 (free plan).**
- Models live: `gpt_image_2` (image; 9:16/16:9; quality low/med/high; res 1k/2k/4k),
  `seedance_2_0` (video; 9:16/16:9; `image_references` + `end_image` → frame-lock capable;
  `generate_audio` false supported; res 480p–4k; mode std/fast), `seedance_2_0_mini` (480p/720p),
  cheap exploration models `z_image` (0.15cr), `flux_2` (1cr), `seedream_v5_lite` (1cr).
- Measured costs (`higgsfield generate cost`):
  - gpt_image_2 1k: high 4cr, medium 2cr, low 0.5cr; 2k high 7cr.
  - seedance_2_0 5s: 1080p 45cr, 720p fast 17.5cr, 480p fast 7.5cr. mini 720p 12.5cr.
- **Budget consequence:** two native Seedance clips (≥25cr) exceed available credits.
  Decision in §6; Seedance remains the documented upgrade path (external gate: credit top-up).

## 6. Asset strategy decision (within 10 credits)

1. Explore compositions with `z_image` (0.15cr each), then generate four finals with
   `gpt_image_2` (1k, medium→high as budget allows): garden 9:16, garden 16:9,
   alcove 9:16, alcove 16:9. Estimated spend ≈ 8.5–9 credits.
2. Build the cinematic motion deterministically with ffmpeg (slow zoompan glide on the garden
   still, crossfade, settle on the alcove still). Zero credits; native 9:16 and 16:9 encodes;
   H.264 yuv420p faststart, no audio; measured GOP for seek-friendliness.
3. **Frame-lock by construction:** the clip's final frame IS the alcove still, and the live
   BookStage composites over the same alcove still as its backdrop layer — the handoff
   compares identical bytes, verifiable by image difference.
4. Upgrade path recorded: `seedance_2_0` with `image_references`=garden still and
   `end_image`=alcove still preserves the same contract when credits exist.

## 7. Mobile performance ceilings (pack budgets.json, adopted as project gates)

poster-mobile ≤ 220 KiB · poster-desktop ≤ 320 KiB · cinematic-mobile ≤ 3 MiB ·
cinematic-desktop ≤ 6 MiB · decorative ≤ 600 KiB · all released ≤ ~10.5 MiB ·
initial compressed transfer ≤ 1.2 MiB · initial JS gzip ≤ 220 KiB · critical fonts ≤ 180 KiB ·
LCP ≤ 2.5 s · CLS ≤ 0.1 · INP ≤ 200 ms. Cinematic variants are never both precached;
poster-only is the offline guarantee.

## 8. Files owned by this task

- New: cinematic threshold components, book-stage layers, atmosphere components, capability
  profile, public cinematic assets under `public/assets/divan/`, focused tests, this ledger,
  `docs/verification/divan-cinematic-enhancement-report.md`, asset manifest.
- Modified (contract-coupled, each change mirrored in its locked tests): `src/lib/content/release.ts`
  (FIXED_BROWSER_ASSETS), `src-sw/schemas.ts` (FIXED_MIME), `scripts/build.ts` (public allow-list),
  `tests/content/release.test.ts`, `tests/offline/helpers.ts`, `tests/content/buildRelease.test.ts`,
  `tests/offline/artifacts.test.ts`, plus scene/app wiring in `src/app/` and `src/scenes/`.
- Never touched: `content-private/`, poetry/ballot/EOI paths, launch gates, `.env`, corpus tooling.

## 9. Adaptations from the v3 package (repository truth wins)

1. `build:production` → `build:fixture` for the gate (production fail-closed is a repo invariant).
2. ESLint/Prettier ignore `.claude/**` so the committed pack cannot fail the repo's own gate.
3. Seedance native clips deferred to an external credit gate; ffmpeg-from-stills motion ships
   first with an exact-frame handoff (§6). No dependency on video to reach the poem (unchanged).
4. Chrome DevTools MCP writes screenshots only inside workspace roots; evidence is captured to
   the primary checkout then moved under this worktree's git-ignored screenshots path.

## 10. Frontend architecture map (verified by read-only subagent sweep, spot-checked)

- **Reducer** (`src/contracts/app.ts:3-12`, `src/app/state.ts`): stages
  `boot → welcome → choose_poet → intention → revealing → result → result_action`; every
  dispatch validated by `isValidState`, invalid states recover via `recoverToNearestSafeState`
  (never throws). Scene switch in `App.tsx:632-731`; context routes and blocking error
  short-circuit first. Focus is requested via `focusRequestRef` before dispatch; skip control
  arms at 100 ms; reveal duration keyed by effective motion.
- **Current reveal animation**: CSS-only book inside `RevealScene.tsx:53-82`
  (`.reveal-object/.reveal-paper/.reveal-cover`) — this is what Phase 5 upgrades into the
  layered BookStage.
- **Release contract**: `FIXED_BROWSER_ASSETS` (`src/lib/content/release.ts:34-42`) =
  icon.svg, index.html, manifest.webmanifest, offline.html, service-worker.js — mirrored
  byte-identically in `src-sw/schemas.ts:266-272` (`FIXED_MIME`). MIME enum (11 types,
  `release.ts:20-32`) has **no `video/*`**. Content-asset path rules: `audio/*`, `fonts/*`,
  `icons/*`, `images/*.avif|.webp|.png`. Build allow-list `scripts/build.ts:635-650`.
  Locked by four tests (`tests/content/release.test.ts:61-67`, `tests/offline/helpers.ts:141-189`,
  `tests/content/buildRelease.test.ts:371-381`, `tests/offline/artifacts.test.ts:8-41`).
- **Service worker** (`src-sw/releaseManager.ts`): stages release.json → sha-verified corpus →
  manifest → fetches every `requiredOffline` asset under the 8 MB offline ceiling → ready marker →
  pointer activation. `respond()` (`:178-220`) serves only /audio, /assets, /content, /fonts,
  /images, /icons (+ shell); audio is network-verify-then-cache with `requiredOffline:false`.
  **A `/video/` path needs a new branch or it is never served.**
- **Performance locks** (`tests/performance/visualBudgets.test.ts`): 17 named colors exactly once
  in tokens.css; four self-hosted font families with swap and no remote URL; animated properties
  limited to transform/opacity (no width/height/top/left transitions or keyframes), blur < 20 px;
  `[data-motion='reduced']` and `@media (pointer: coarse)` must exist; authored CSS ≤ 45,000 bytes
  uncompressed; gzip shell budgets HTML ≤ 40 k, CSS ≤ 45 k, JS ≤ 200 k, critical fonts ≤ 180 k,
  **initial raster images = 0 bytes**, total ≤ 1.2 MB. Offline release hard limit 8 MB
  (`src-sw/schemas.ts:25`).
- **CSP**: not in index.html — served by `ops/Caddyfile`, locked by
  `tests/security/opsConfig.test.ts:161-189`. `media-src 'self'` and `img-src 'self' data: blob:`
  already permit same-origin video and posters. No CSP change required.
- **Tokens** (`src/styles/tokens.css`): ink-night #0b1026, ink-deep #11182d, lapis #174a7e,
  lapis-light #2e6e9e, turquoise #2c8c8a, turquoise-light #9fd8d6, pomegranate #a6192e,
  bright-red #d6001c, deep-red #76232f, ember #3c0f1b, gold #d4a64a, gold-light #e7c777,
  parchment #f2e6cf, paper #fff9ee, cypress #204f40, charcoal #2e302e, muted-ink #6e675d,
  error #b42318, focus #78d6ff (+ semantic aliases). Fonts: Inter / Cormorant Garamond /
  Vazirmatn / Noto Nastaliq Urdu, all self-hosted; only cormorant-500 preloaded.
- **Motion preference**: three enforcement paths (resolveEffectiveMotion, `[data-motion='reduced']`
  CSS kill-switch, `@media prefers-reduced-motion`); stored in localStorage
  `divan.motionPreference`.
- **check.sh order**: format:check → lint → typecheck → vitest → build:fixture → verify:dist →
  verify:privacy → audit --prod → (e2e) → launch gates asserted fail-closed.

## 11. Integration consequences (design inputs for Phases 2–6)

1. **Posters** ship as release content assets under `images/` (webp), `requiredOffline: true`
   (the offline poster guarantee), passing existing path rules — no new MIME needed.
2. **Cinematic video** needs a deliberate contract extension: `video/mp4` MIME in
   `contracts/release.ts` + `release.ts` + `src-sw/schemas.ts` (both sides), an `video/*.mp4`
   path rule, mp4 (`ftyp`) magic-byte signature in `verify-dist.ts`, a `/video/` branch in
   the SW `respond()` (network pass-through so HTTP range seeking works; offline → capability
   falls to poster-only), and `requiredOffline: false` so it is never precached.
3. **Threshold placement**: the cinematic threshold lives inside the Welcome scene
   (poster-first shell, scrub, skip); the BookStage upgrade lives in RevealScene; the reducer's
   stages stay authoritative, with a separate capability profile
   (motion/media/network/cinematic/save-data) module — repository-native equivalent of the
   pack's state model.
4. **CSS budget**: all new cinematic/book/atmosphere CSS must fit inside the 45,000-byte
   authored ceiling with the existing sheets; measure before and after.

## 12. Open items

- [ ] Motion recording of current reveal animation (baseline) — deferred; CSS reveal is
      fully described in code and screenshots.
- [ ] Design lock (Phase 2) and shot board.
