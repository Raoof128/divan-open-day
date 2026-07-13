# DIVAN — Frontend Performance Baseline (Audit 05)

Static offline-first bilingual poetry SPA (Vite + React 19 + strict TS + hand-written service worker).

- **Artifact audited:** `dist/` fixture build (`buildProfile: fixture`, `productionEligible: false`), served by the pre-running `vite preview` at `http://127.0.0.1:4173/`.
- **Date:** 2026-07-13
- **Method:** read-only. Static byte/gzip/brotli measurement of `dist/`, source inspection, and Node-Playwright (Chromium 1.61.1) runtime traces with CPU 4x throttle + CDP network emulation (~1.6 Mbps down / 150 ms RTT), viewport 390×844, 3 runs, median reported.
- **Headline:** All §21 budgets and §21.2 targets pass with wide margin. No high-severity defects. The findings are production-readiness optimizations, chiefly around the 159 KB Nastaliq font that the ASCII fixture never exercises but a real Persian corpus will.

---

## 1. Transfer & bundle budgets (§21.3)

Compressed sizes measured with `gzip -9` and `brotli -q 11` on each `dist/` file.

| Asset                      |         Raw |       gzip | brotli | Notes                                                 |
| -------------------------- | ----------: | ---------: | -----: | ----------------------------------------------------- |
| `index.html`               |       1,525 |        736 |    493 | external module script + stylesheet, no inline        |
| `assets/index-*.js`        |     312,227 | **93,628** | 80,650 | single entry chunk (React 19 + react-dom + zod + app) |
| `assets/index-*.css`       |      18,589 |  **4,840** |  4,278 | whole design system                                   |
| `service-worker.js`        |      87,564 |     23,981 | 21,404 | hand-written SW (own zod schemas)                     |
| `manifest.webmanifest`     |         479 |        310 |    233 |                                                       |
| `offline.html`             |         967 |        515 |    330 |                                                       |
| `icon.svg`                 |         685 |        307 |    262 | SVG app icon (raster budget = 0)                      |
| `release.json`             |         561 |        325 |    273 |                                                       |
| `content/<sha>.json`       |      53,187 |      3,551 |  2,527 | fixture corpus (40 items)                             |
| `assets/<sha>.json`        |       2,681 |      1,170 |    962 | asset manifest                                        |
| inter-latin-400            |      23,664 |          — |      — | woff2 (already compressed)                            |
| inter-latin-700            |      24,356 |          — |      — | woff2                                                 |
| cormorant-garamond-500     |      23,312 |          — |      — | woff2                                                 |
| cormorant-garamond-600     |      23,396 |          — |      — | woff2                                                 |
| vazirmatn-arabic-400       |      21,088 |          — |      — | woff2 (Persian sans)                                  |
| **noto-nastaliq-urdu-400** | **159,368** |          — |      — | woff2 (Persian display) — dominates font weight       |

### Against §21.3 compressed budgets

| Budget                      |                      Limit |                                             Measured | Verdict |
| --------------------------- | -------------------------: | ---------------------------------------------------: | ------- |
| HTML                        |                      40 KB |                                         0.72 KB gzip | PASS    |
| Critical CSS                |                      45 KB |                            4.7 KB gzip (18.6 KB raw) | PASS    |
| Initial JavaScript          |                     200 KB |                    **93.6 KB gzip / 80.7 KB brotli** | PASS    |
| Critical fonts combined     |                     180 KB |              **91.5 KB** (welcome, measured; see §3) | PASS    |
| Initial images              |                     500 KB |                                    0 (SVG icon only) | PASS    |
| Initial transfer            |                     1.2 MB |   **~194 KB** cold-load through full flow (measured) | PASS    |
| Initial audio preload       |                          0 |                                                    0 | PASS    |
| Offline release excl. audio | 5 MB target / 8 MB ceiling | **0.66 MB** required-offline / 0.72 MB whole `dist/` | PASS    |

**JS composition.** Single entry chunk, no code-splitting. Fingerprint counts in the minified bundle: `zod` 326, `useState` 18, `react-dom` 1, `createRoot` 2, `Minified React error` present and `react-dom.development` absent (confirms the **production** React build). react-dom + zod are the two heavyweights. React 19 + react-dom is justified by the design (§18.1 mandates React) and the app's stateful reducer/history/offline orchestration; migrating off React would violate the design and is out of scope. zod is used at runtime for release/corpus schema validation and is the largest single dependency after react-dom — it is duplicated conceptually across `src/` and `src-sw/` (the SW ships its own zod-based schemas inside `service-worker.js`), but they are separate execution contexts so this is not a tree-shaking defect, just intrinsic weight. No `eval(`/`new Function` present.

---

## 2. Runtime metrics (§21.2 targets)

Median of 3 cold-load runs, new context each run, CPU 4x + net ~1.6 Mbps/150 ms RTT, 390×844.

| Metric                                | §21.2 target / limit       |                           Median | Verdict |
| ------------------------------------- | -------------------------- | -------------------------------: | ------- |
| LCP                                   | ≤ 2.0 s target / 2.5 s max |                     **1,464 ms** | PASS    |
| FCP                                   | —                          |                           940 ms | —       |
| TTFB                                  | —                          |                18 ms (localhost) | —       |
| CLS                                   | ≤ 0.05 target / 0.1 max    |                       **0.0064** | PASS    |
| Press-to-feedback ("Press to reveal") | ≤ 100 ms                   |                       **3.3 ms** | PASS    |
| Longest task during reveal            | none > 200 ms              | **0 ms** (no long task observed) | PASS    |
| Reveal render completed               | —                          |                    1/1 every run | PASS    |

Per-run: LCP 1472/1464/1460 ms, CLS 0.0064 all runs, press 3.3/3.3/2.6 ms, max long-task 0 ms all runs. The reveal animation produced **no** `longtask` entries across all three runs — the animation is composited (transform/opacity only; see §5) so the main thread stays clear. Press latency is effectively a synchronous React state dispatch; feedback is a DOM mutation ~3 ms after click.

**Caveat:** these numbers are from the ASCII fixture. See §3 — a real Persian corpus adds a 159 KB Nastaliq download on the Reveal screen that the fixture never triggers, which can affect Reveal-screen CLS and perceived latency in ways this run cannot measure. TTFB is localhost-flattered; on the real tunnel it will be higher but is not the bottleneck.

---

## 3. Fonts

Four families, all self-hosted WOFF2 via `@fontsource/*`, all `font-display: swap`, no remote URL (verified: 0 remote `url()` in CSS). Weights shipped: Inter 400/700, Cormorant Garamond 500/600, Vazirmatn 400, Noto Nastaliq Urdu 400.

**Measured transfer by phase** (CDP `Network.loadingFinished` encoded bytes):

| Phase                                  | Fonts actually downloaded                          |       Bytes |
| -------------------------------------- | -------------------------------------------------- | ----------: |
| Welcome paint (before any interaction) | inter-400, inter-700, cormorant-500, vazirmatn-400 | **91.5 KB** |
| After full flow to Reveal (fixture)    | same four; nastaliq + cormorant-600 = **0 bytes**  |     91.5 KB |

The Nastaliq font (159 KB) and Cormorant-600 never download in the fixture because the fixture's "Persian" lines are ASCII placeholders — no Arabic-range glyph is ever laid out, so the browser skips the fetch. **With a real corpus the Nastaliq 159 KB WILL download on the Reveal screen** (Persian display glyphs), served with `font-display: swap`, i.e. the Persian verse first paints in a fallback then reflows to Nastaliq. That reflow is the single largest unmeasured performance/CLS risk and is invisible to this audit. See PERF-02.

**No `<link rel="preload">` for any font** (verified in `dist/index.html`). Fonts are discovered only after the CSS is fetched and parsed. With `swap` this is functionally safe (no FOIT), but the welcome display face (Cormorant) and Vazirmatn swap in slightly after first paint. See PERF-01.

Critical (welcome) font bytes 91.5 KB are **within** the 180 KB budget. There is headroom, but it is consumed by shipping two Inter weights and two Cormorant weights; only Inter-400 + Cormorant-500 (+ Vazirmatn) are actually used on welcome — Inter-700/Cormorant-600 load on welcome too (measured) yet may only be needed later. Subsetting, not swapping families, is the lever (PERF-02).

---

## 4. Service worker (§16.3)

`src-sw/serviceWorker.ts` + `src-sw/releaseManager.ts` → `dist/service-worker.js` (87.6 KB raw / 24 KB gzip).

**Update algorithm vs §16.3 — conformant.** The `OfflineReleaseManager` implements: staging cache named per release ID (`divan-release-v2:<id>`); SHA-256 + item/poet-count verification via Web Crypto (`#verifyCorpus`, `#fetchBytes` with `expectedSha256`); required-asset presence check (`#candidateComplete`); fail-closed staging that deletes the staging cache on any error (`#stageCurrentRelease` catch → `caches.delete`); a `READY_PATH` marker written **last** as the atomic complete-candidate boundary; single-`put` pointer swap as the commit boundary (`#activateRelease`); previous-release retention (`previousReleaseId`, protected-rollback path); older-cache deletion only after commit (`#maintainCommittedActivation`, idempotent, failure-tolerant). "Never combine HTML/script from one release with corpus from another" is enforced by per-release cache isolation. Operations are serialized (`#serialized`) to prevent interleaving. This is a careful, spec-faithful implementation.

**Runtime strategies (§16.4) — conformant:** navigation network-first with 2.5 s timeout then cached shell (`#navigationResponse`/`#timedFetch`); `release.json` network-first no-store; `service-worker.js`/`healthz` network-only; hashed assets & corpus cache-first after verification; audio network-first with post-action item caching (`#audioResponse`). Navigation even re-verifies the network `index.html` against the manifest SHA before serving it — stronger than required.

**Registration timing — does not delay first paint.** `registerOfflineWorker` (`src/sw-client/register.ts`) is invoked from a `useEffect` in `src/app/App.tsx:411` gated on `verifiedRelease !== null`, i.e. after React mount and after the release descriptor is fetched and verified. First paint and LCP happen before registration. Confirmed by the LCP trace (1.46 s) being unaffected.

**Cache-size ceiling:** `OFFLINE_RELEASE_BYTES_HARD_LIMIT` (8 MB) is enforced during staging (`#stageCurrentRelease` accumulates `totalBytes` and throws past the ceiling); current required-offline set is 0.66 MB, far under.

**Stale-SW risk:** low. `service-worker.js` and `release.json` are network-only/no-cache in both the SW and the Caddyfile (`Cache-Control: no-cache, must-revalidate`), so a new worker/pointer is always revalidated; activation is gated on a fully-verified candidate.

---

## 5. CSS

- **Authored size 22.6 KB** across `src/styles/*` + `src/app/core.css` (visual.css 14.5 KB, core.css 2.9 KB, motion.css 2.9 KB, tokens.css 1.5 KB, fonts.css 1.3 KB, index.css 0.1 KB) — under the 45 KB lock and the shipped bundle is 18.6 KB raw / 4.7 KB gzip.
- **`!important`: 7 total, all legitimate** — every one is inside a reduced-motion or forced-colors override (`motion.css` ×3, `core.css` ×4: `animation/transition/transform/scroll-behavior: none/auto`). No specificity fights in normal styling.
- **Animated properties: transform/opacity/box-shadow/border-color only.** `transition` targets found: `opacity .12s`, `transform .18s, box-shadow .18s, border-color .18s`. Five `@keyframes` (`divan-boot-line`, `divan-portal-arrival`, `divan-cover-open`, `divan-paper-rise`, `divan-ornament-resolve`) — no `width/height/top/left/margin` animation. This matches the locked `tests/performance/visualBudgets.test.ts` guarantee; the runtime trace corroborates it (0 long tasks, composited reveal). No inline-style animation sneaks through (`dist/index.html` has 0 `style="`).
- **Coverage: 31.1% unused across the main draw flow** (5.8 KB of 18.6 KB): context-page (`About/Privacy/Credits/Accessibility`), `BlockingError`, and offline-state rules that the happy path never mounts. Given the 4.7 KB gzip total this is not worth splitting; documented for completeness.

---

## 6. Hydration / architecture

- **Single client-render mount** (`src/main.tsx` `createRoot(...).render`), no SSR, so no hydration and no hydration warnings possible. Console was clean across runs.
- **No code-splitting.** `vite.config.ts` defines no `manualChunks`; context routes (`src/pages/*`) are statically imported and bundled into the single 312 KB/93.6 KB-gzip entry. Under budget, but the About/Privacy/Credits/Accessibility routes — never needed for the core stall interaction — ride in the critical bundle. See PERF-03.
- **Unused deps:** none found in `dependencies` (react, react-dom, zod, four `@fontsource` packages all used). `pdfkit`/`qrcode`/`sharp`/`svgo` are devDependencies (build/QR/ops tooling), correctly out of the browser bundle.

---

## 7. Headers / CSP compatibility (§22.4)

`ops/Caddyfile` ships the §22.4 CSP verbatim: `default-src 'none'; … script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none';` plus `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, COOP/CORP `same-origin`, and the locked `Permissions-Policy`.

**The built app is CSP-compatible:**

- `dist/index.html` has **no inline `<script>` and no inline `style="`** (0 of each) — the only script is `<script type="module" src="/assets/...">` and the only style is an external `<link rel="stylesheet">`. `script-src 'self'` / `style-src 'self'` hold without any hash or `unsafe-inline`.
- **No `eval(` / `new Function`** in the bundle → `script-src 'self'` is not violated at runtime.
- The three remote-looking strings in the JS (`https://json-schema.org`, `https://react.dev`) are inert **string constants** (zod's `$schema` label and a React error-help URL); they are never fetched, so `connect-src 'self'` is not exercised and `verify-dist.ts` (which scans `href/src/data:` forms, not bare string literals) is unaffected.
- Fonts, worker, manifest all same-origin. `img-src` allows `data:`/`blob:` which the verse-card download (canvas → blob) needs; consistent with the build.

Cache headers (§22.6) in the Caddyfile are correct: immutable `max-age=31536000` for hashed/`content` paths, `no-cache, must-revalidate` for `index.html`/`release.json`/`service-worker.js`/`offline.html`, `max-age=3600` for the manifest, `no-store` default fail-closed.

---

## 8. Dependency audit

- **`pnpm audit --prod`: "No known vulnerabilities found."**
- Production dependency set is 7 packages (react, react-dom, zod, 4× @fontsource). Licenses are the standard permissive set for these (MIT for React/zod/fontsource wrappers; the bundled font files carry SIL OFL — relevant to the Credits/rights review, not to this performance audit). A full `pnpm licenses` enumeration was not run to avoid noise; flag for the rights/credits track if a machine-readable SBOM is required.

---

## Issue records

### PERF-01 — Critical welcome fonts are not preloaded

- **Severity:** Low · **Confidence:** High
- **Evidence:** `dist/index.html` contains no `<link rel="preload" as="font">`; measured welcome-paint fonts (91.5 KB across 4 files) begin downloading only after `index-*.css` is parsed. LCP is already 1.46 s so the impact is a modest font-swap after first paint, not a blocked render.
- **Design §:** 21.2 (LCP target), 16.2 (critical fonts are a cache target).
- **Root cause:** `public/index.html` (source of `dist/index.html`) declares no preload hints; fonts are reached only via `src/styles/fonts.css` `@font-face`.
- **Proposed fix:** add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/inter-latin-400-*.woff2">` (and Cormorant-500, optionally Vazirmatn-400) for the faces actually painted on Welcome. Because filenames are content-hashed, generate the preload tags in `scripts/build.ts` from the emitted asset names rather than hardcoding.
- **Files likely affected:** `public/index.html`, `scripts/build.ts`, and the dist-locking tests (`tests/content/buildRelease.test.ts`, `tests/performance/visualBudgets.test.ts` if it asserts head contents).
- **Verification:** re-run the Playwright font-phase script; confirm the preloaded faces start at ~TTFB instead of post-CSS, and LCP/CLS unchanged or improved; `pnpm verify:dist` still passes (preload `href` is local).

### PERF-02 — Nastaliq display font (159 KB) loads unpreloaded on the Reveal screen with a real corpus; swap reflow is unmeasured

- **Severity:** Medium · **Confidence:** Medium (behaviour inferred; fixture cannot exercise it)
- **Evidence:** `noto-nastaliq-urdu-arabic-400` is 159 KB — 58% of all font bytes and the single largest asset after the JS chunk. The ASCII fixture downloads 0 bytes of it (measured), so all §2 runtime numbers exclude it. A production corpus renders Persian display text on Reveal → the 159 KB downloads there, `font-display: swap`, causing a fallback→Nastaliq reflow on the verse block precisely at the emotional peak of the interaction. Reveal-screen CLS from that reflow is not captured by this audit.
- **Design §:** 21.2 (CLS ≤ 0.05, LCP), 21.3 (critical fonts 180 KB — Nastaliq is deferred so it's within budget, but it dominates the Reveal experience).
- **Root cause:** `@fontsource/noto-nastaliq-urdu` ships the full Arabic subset (`src/styles/fonts.css` references it whole); no glyph subsetting to the reviewed corpus.
- **Proposed fix (production track, not fixture):** subset Nastaliq to the union of glyphs in the approved corpus (e.g. `glyphhanger`/`fonttools subset` over the compiled `content/*.json`), typically cutting 159 KB → ~30–60 KB; and reserve vertical space / use `size-adjust`/`ascent-override` on the fallback `@font-face` so the swap does not shift layout. Optionally preload the (subset) Nastaliq at the moment the user picks a poet (before Reveal) so it is warm by reveal time. Keep it out of the Welcome critical path.
- **Files likely affected:** `scripts/build.ts` (subset step in the corpus/asset pipeline), `src/styles/fonts.css`, asset-manifest + release schemas if the font filename/bytes change (`src/lib/content/release.ts`, `src-sw/schemas.ts`, associated tests).
- **Verification:** with a real (or realistic non-sentinel Persian) corpus, drive Welcome→Reveal under throttle and measure Reveal-screen CLS and the Nastaliq request size/timing; assert CLS ≤ 0.05 and reduced bytes. Until a real corpus exists this stays a documented risk.

### PERF-03 — No code-splitting; context routes ship in the critical bundle

- **Severity:** Low · **Confidence:** High
- **Evidence:** `vite.config.ts` sets no `manualChunks`; `dist/` has exactly one JS file (312 KB/93.6 KB gzip). `src/pages/{About,Privacy,Accessibility,Credits,Offline}` are statically imported and bundled with the core draw flow, though the stall interaction never navigates to them.
- **Design §:** 21.3 (JS budget — currently PASS at 93.6 KB, so this is headroom-preservation, not a breach).
- **Root cause:** static imports of page components; single-chunk Rollup output.
- **Proposed fix:** `React.lazy` + `Suspense` for the context pages (or a `manualChunks` group) so the core bundle shrinks and the routes load on demand. Weigh against the release-integrity system: **every** new `dist/` chunk must be added to `FIXED_BROWSER_ASSETS`, `src-sw/schemas.ts` `FIXED_MIME`, `build.ts`, and the manifest/dist-lock tests — non-trivial coupling. Given the bundle is already < half budget, this is optional; do it only if the JS budget later tightens.
- **Files likely affected:** `src/app/*` route wiring, `vite.config.ts`, and the full release-asset schema/test chain noted above.
- **Verification:** `pnpm build:fixture` shows the core chunk shrink and separate context chunks; `pnpm check` green (dist-lock tests updated); Playwright confirms context routes still render.

### PERF-04 — 31% of shipped CSS is unused on the main flow (informational)

- **Severity:** Info · **Confidence:** High
- **Evidence:** CDP CSS coverage over Welcome→…→Reveal→Reveal-another: 5,784 of 18,585 bytes unused (context-page/error/offline rules).
- **Design §:** 21.3 (CSS budget — PASS at 4.7 KB gzip).
- **Root cause:** single global stylesheet includes route styles for pages not on the draw path.
- **Proposed fix:** none recommended — at 4.7 KB gzip, splitting CSS per route would add build/lock complexity for sub-kilobyte savings. Recorded so a future reviewer does not re-flag it.
- **Verification:** n/a.

---

## Limitations

- **No real mid-range hardware.** Runtime numbers use Chromium desktop with CPU 4x + network emulation as a mid-mobile proxy; they are directional, not device-certified. §21.2 explicitly calls for Lighthouse user flows + Chrome traces + Playwright timing on the actual test device — this audit supplies the Playwright leg only.
- **Lighthouse not run:** not installed in `node_modules` and the brief forbids installing packages. No LH scores are reported.
- **Fixture, not production corpus.** The largest performance factor on the Reveal screen — the 159 KB Nastaliq download and its swap reflow — is entirely absent from the ASCII fixture and therefore unmeasured (PERF-02). Real-corpus Reveal-screen LCP/CLS must be re-measured before launch.
- **TTFB is localhost-flattered** (~18 ms); the production Cloudflare-tunnel path will add real network latency not modelled here.
- Read-only audit: no source or `dist/` changes were made; the preview server was neither restarted nor rebuilt.
