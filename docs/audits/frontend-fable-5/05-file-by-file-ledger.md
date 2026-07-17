# Fable 5 frontend audit — Phase 5 file-by-file ledger (working; finalized before Phase 7)

Lead-read, complete files only. Skills applied per file are drawn from the Phase 1 inventory (ui-ux-pro-max, frontend-design, divan-* contracts, scroll-world cross-checks, a11y-debugging, web-perf, test-creator). Research rules cross-referenced from 02-primary-source-research.md. Severity scale: Blocker/Critical/High/Medium/Low/Info.

## Entry + app core

### index.html — READ, findings
- Purpose: document shell; strict-CSP-compatible (no inline script/style); noscript block per §26.7; `viewport-fit=cover`; theme-color; SVG icon + manifest.
- Findings: `apple-touch-icon` points at SVG — iOS requires PNG; **known limitation** already recorded in AGENT.md 2026-07-13 follow-ups (Info, pre-documented; PNG icon would need release-contract change). No canonical/OG image — §27 items tied to final-hostname launch gate, intentionally absent (NOT A DEFECT — launch-gated). No `fetchpriority` poster preload: poster ships via release manifest, not index.html; build injects single font preload (verified in build.ts). Description wording matches privacy posture. `lang="en" dir="ltr"` correct.
- Verdict: NO DEFECT (2 documented/launch-gated absences).

### src/main.tsx — READ
- StrictMode + ErrorBoundary + createRoot; throws if #root missing. Minimal, correct.
- Verdict: NO DEFECT.

### src/app/App.tsx (795) — READ, findings
- Orchestrates reducer+history+focus+offline+draw; single LiveRegion; `main` tabIndex=-1 + skip link target; BookStage mounted for flow stages; timers cleared on unmount + popstate; StrictMode-safe load effect (`cancelled` flag); Save/restore via sessionStorage adapters (guarded try/catch for storage access).
- Observations: (a) mixed state mutation styles — reducer dispatch vs direct `setState` in popstate/`onRevealAnother` (Maintainability, Low/Info; behaviour verified by tests); (b) `activeContextRoute` read from `window.location.pathname` at render — context routes are document-level navigations so no reactivity needed — OK; (c) offline `update_ready` only surfaced for the same release the page verified; newer releases activate on next clean navigation by design (§16.3) — OK; (d) `announceOfflineReady` on 'offline' event + on `active` status while `navigator.onLine === false` (§26.2) — OK; (e) reveal double-activation guarded by `revealActiveRef`; skip control 100ms; focus routed to reveal-scene heading (documented reason) — OK.
- Verdict: NO DEFECT (maintainability note Info-1 recorded in ledger).

### src/app/state.ts (282) — READ
- Closed-union reducer; validity per stage; recover-to-nearest-safe; exhaustive switch (TS `noFallthrough` + no default = compile-checked); event payload validation (public-ID regex, poet/motion allowlists).
- Verdict: NO DEFECT.

### src/app/history.ts (132) — READ
- Durable stages only (welcome/choose_poet/intention/result); strict shape parse incl. exact key set + release binding + poet coherence; `resolveBackHistoryState`/`resolveDirectHistoryState` helpers.
- Note: `revealing`/`result_action` intentionally non-durable per review-closure entry. `resolveBackHistoryState`/`resolveDirectHistoryState` appear unused by App (App uses `resolvePopHistoryState`) — check for dead exports in Phase 5 sweep (Info if unused; kept for tests?).
- Verdict: NO DEFECT pending dead-export check.

### src/app/runtime.ts (440) — READ
- Fail-closed browser release loader: capability check (fetch/subtle.digest/getRandomValues), no-store + redirect:error fetches, strict zod schemas mirroring build predicates (HTML/MD/bidi-control rejection, safe audio paths, poet/mode pairing, hemistich for Hafez, 45–90-word reflection), corpus digest + per-item canonical SHA-256 verification, count/ID binding. All failures collapse to a single privacy-safe ReleaseLoadError.
- Note: `new TextEncoder()` per item in verifyItemHashes (micro-alloc; 120 items — negligible). Canonical stringify safe.
- Verdict: NO DEFECT.

### src/app/ErrorBoundary.tsx (40) — READ
- Class boundary; renders own `main#main-content` with `role="alert"` (replaces children, so single main). No logging by design (privacy). h1 tabIndex=-1 present; role=alert announces without focus move — acceptable.
- Verdict: NO DEFECT.

### src/app/core.css (185) — READ
- 44px min targets on a/button/select; two-tone `:focus-visible` (ink outline + #78D6FF shadow); `[lang='fa']` letter-spacing:0 + Vazirmatn stack (Persian shaping protected); visually-hidden live region; reduced-motion kill (data-attr + media query) for `animation`/`scroll-behavior`; reduced-reveal opacity transition (120ms); safe-area padding in header/skip link; dl reflow at ≤24rem.
- Note: kill-switch uses `animation:none` but not `transition:none` — intentional (reduced reveal itself uses a transition); motion.css must gate its transitions separately (verified below).
- Verdict: NO DEFECT.

### src/contracts/{app,content,release}.ts — READ
- Closed const unions; session keys per design §5.4; ReleaseAsset MIME allowlist incl. video/mp4. Match SW schemas checked at src-sw read.
- Verdict: NO DEFECT.

### src/lib/accessibility/{focus,motion}.ts — READ
- Focus by data-focus-target within main; verified activeElement return. Motion: reduced 150ms / full 2000ms (within §7.5 range as amended by book contract 1.6–2.2s); matchMedia guarded, modern addEventListener; correct precedence (explicit user pref beats system).
- Verdict: NO DEFECT.

### src/lib/draw/{secureRandom,shuffleBag}.ts — READ
- Rejection sampling, no Math.random fallback, range guard 1..2^32; UnsupportedSecureRandomError code. Fisher–Yates with secure ints; dedupe + pattern-validate candidates; empty bag fail-closed; persistence release-scoped and re-validated on read; cycleReset announced.
- Verdict: NO DEFECT.

### src/lib/storage/session.ts (309) — READ
- All storage access try/caught; strict validation on restore (release binding, approved-ID sets, dupes rejected, invalid keys removed); release change clears scoped keys; motion pref read/write validated. Matches §5.4 contract exactly (keys, local-only motion pref).
- Verdict: NO DEFECT.

### src/lib/navigation/flowNavigation.ts (55) — READ
- Clears poet/poem session keys, pushes validated release-bound choose_poet state, dispatches synthetic popstate consumed by App's handler; history.back() fallback when releaseId unknown or pushState throws.
- Verdict: NO DEFECT.

### src/lib/cinematic/capability.ts (65) — READ
- Plan resolver: video only when full-motion && !saveData && online; mobile/desktop by portrait-or-<900px. `readSaveData` safely feature-detects (saveData is Chromium-only per research — false elsewhere → video loads; enhancement posture correct).
- Verdict: NO DEFECT.

### src/lib/cinematic/scrollScrub.ts (91) — READ
- Progress clamp; END_MARGIN 0.05s (avoids decoder snap-to-zero); ARRIVAL 0.985; coalescer = ≤1 seek/frame, never while decoding, cancellable. Matches scroll-world hardening guidance.
- Verdict: NO DEFECT.

### src/components/CinematicThreshold.tsx (344) — READ
- Poster-first; first-frame gate (rVFC + 0.001 seek; 4s timeout demotes to poster); Begin captured via [data-cinematic-begin]; pending-Begin honoured on ready or on failure (arrive direct); scroll listener passive with per-frame coalesced seeks; terminal-frame settle (seeked + 2×rAF, 1s fallback); Skip while playing; exhaustive cleanup (listeners, timers, rAF ids, coalescer); media wrapper aria-hidden, video tabIndex=-1; no resize handler (immune to URL-bar noise by design).
- **Finding F-CIN-1 (Medium, POSSIBLE — needs rendered verification):** no play()-based first-frame priming after user interaction. Project skill divan-cinematic-threshold mandates "Prime muted inline video only after user interaction where the browser requires it"; scroll-world documents iOS Safari's never-played-muted-video blank-frame behaviour. Likely real-iOS outcome: first-frame gate never presents → 4s timeout → poster route (safe, complete experience) + up to 4s "Preparing the entrance" latency if Begin pressed early. Fallback is sound; the cinematic path may be silently unavailable on iOS. Cannot be proven here without a physical device (WebKit-Playwright ≠ Safari); recorded as skill-contract deviation + residual risk, candidate for repair only with verifiable regression.
- Note (Low): `plan` reads `navigator.onLine`/saveData once per motion change — not reactive mid-visit; matches "chosen once per visit" design.
- Verdict: 1 candidate defect (F-CIN-1), otherwise clean.

### src/scenes/*.tsx (6 files) — READ
- Welcome (threshold + portal, Persian line lang/dir, Begin + info nav); Boot (aria-busy, decorative line svg); BlockingError (role=alert, retry, §26.3 copy); ChoosePoet (real buttons, distinct visual-language data attrs, Persian labels bdi-safe via lang/dir spans); Intention (poet copy per §7.4, verbatim disclaimer after control, FlowBackButton); Reveal (reduced-motion 2-value opacity via rAF, Escape-to-skip scoped away from header chrome, layered book object aria-hidden, skip button when shown, aria-busy).
- Note: Reveal h1 'Opening the Divan'/'Revealing a passage' + <p>Revealing your verse</p> duplicates the live-region announcement text visually — fine (visible + announced once).
- Verdict: NO DEFECT.

### src/components/ (12 small) — READ
- BookStage (backdrop = final rendered frame, aria-hidden, scrim + atmosphere; plan resolver reused with inert conditions for path only — mild indirection, Info); CandleScene (2 gradient layers, aria-hidden); ButterflyField (exactly 1 gold butterfly, left third, aria-hidden — within max-2 contract); PoetryMotes (6 abstract specks, right margin, aria-hidden, no glyphs); FlowBackButton ("Choose another poet"); IlluminatedFrame/ManuscriptPortal (ornament + content wrappers); LiveRegion (single role=status polite atomic); MotionControl (labelled select, 3 options); OfflineBadge (text span); SkipLink (#main-content + programmatic focus); SourceCredit (dl provenance, bdi on mixed refs, hemistich lang=fa dir=rtl, classification labels).
- Verdict: NO DEFECT (Info: BookStage plan indirection).

### src/components/PoemResult.tsx (206) — READ
- Mandatory §7.6 order: English (h1 Your verse, focused on mount) → Persian (lang/dir, h2 متن فارسی) → reflection (skippable when null) → disclosures → SourceCredit → optional audio (controls, preload=metadata, error → status + message, credit) → actions group (Reveal another / Save / Download / Return-to-stall disclosure) → stall invitation (aria-expanded/controls, no location) → Learn about the poet.
- Share outcomes announced via onAnnounce; cancelled silent; failures keep poem (§26.6).
- Note: `headingRef.current?.focus()` on mount + App-level focusRequest both target result — App's effect targets [data-focus-target] only for certain stages; result focus handled here. No conflict observed (App sets focusRequest only on reveal→heading of reveal scene). OK.
- Verdict: NO DEFECT.

### src/components/DecorativeGeometry.tsx (95) — READ
- Four original stroke motifs; aria-hidden, focusable=false, no script/remote refs; currentColor strokes.
- Verdict: NO DEFECT.

### src/lib/share/shareCard.ts (119) — READ
- Placeholder society wording (conspicuous, launch-gated); text payload excludes reflection + private data; SVG card 1200×630, XML-escaped, live text, accent-aware colors, no remote refs.
- Verdict: NO DEFECT.

### src/lib/share/shareService.ts (125) — READ
- Web Share first (transient activation OK — click handler), AbortError → 'cancelled' (research-required behaviour ✓), non-abort share failure → clipboard fallback → 'copy-unavailable' message; Firefox-desktop-no-share covered by clipboard path ✓.
- **Finding F-SHARE-1 (Low, POSSIBLE):** `downloadShareCard` revokes the Blob URL synchronously in `finally` immediately after `anchor.click()`. Chromium tolerates this; MDN/WebKit guidance is to defer revocation (task boundary) because the download request may not have latched the blob in all engines. Verify in rendered pass; candidate micro-fix (defer revoke via setTimeout 0) with regression test.
- Verdict: 1 candidate defect (F-SHARE-1).

### src/pages/routes.ts, index.tsx, ContextLayout.tsx — READ
- Closed route union; switch exhaustive; layout has return link + h1 title.
- Verdict: NO DEFECT.

### src/pages/{About,Accessibility,Privacy,Offline,Credits}Page.tsx — READ
- About: Fāl-e Hafez vs Rumi reflection distinction, translation/adaptation/reflection explanation, inclusive note, related links (incl. "How offline works") — §7.7 satisfied. Accessibility: keyboard/motion/audio guidance + honest "testing still required" gates. Privacy: §23 wording verbatim, exact storage keys documented, no zero-logging claim. Offline: §26 recovery guidance, no false network claims, wording matches offline.html contract. Credits: release facts (ID/date/checksum), unique edition/translation/performer credits from verified release only, fixture disclaimer, font licences, no invented reviewers — §7.8 satisfied.
- Verdict: NO DEFECT.

### src/styles/index.css, tokens.css, fonts.css, flow-navigation.css — READ
- tokens: single authoritative palette + semantic aliases + spacing/radius/shadow scale (locked by visualBudgets test). fonts: 6 self-hosted woff2 faces, all `font-display: swap`, no remote URL; only weights actually used (Inter 400/700, Cormorant 500/600, Vazirmatn 400, Nastaliq 400). flow-navigation: pill back-control, night+paper variants (deep-red on paper for contrast), forced-colors border.
- Research cross-check (02 §2): swap-without-metric-overrides is a CLS consideration; measured CLS is 0.00 (cinematic) / 0.0053 (earlier audit) — budgets already met, no defect. Fontsource `vazirmatn-arabic` subset carries the full Arabic block incl. Persian letters; no unicode-range declared so per-glyph fallback is safe. **Persian shaping with the real corpus is verified in Phase 6 rendered pass** (fixture is ASCII).
- Verdict: NO DEFECT (rendered verification pending).

### src/styles/visual.css (1048) — READ
- Locked visual system: night/paper surfaces, portal, poet cards (distinct Hafez/Rumi treatments), illuminated frame (spine-bar padding floor ≥2rem documented + pinned), lapis keying for Rumi results, deep-red links on paper (9.77:1 documented), cinematic threshold (fixed media, 260vh corridor, sticky card, skip control with safe-area insets), book-stage backdrop + scrim, layered book, atmosphere layout, forced-colors blocks, narrow/landscape/wide media queries, `text-wrap: balance` on h1 (progressive enhancement — Firefox 121+ ok per research).
- Notes: `.cinematic-card` opacity calc can go sub-zero (browser clamps — fine). `.poet-label-fa` Nastaliq at 1.45rem/line-height 2 + 3.4rem min-block — Nastaliq descender clearance to verify rendered (Phase 6). h1 letter-spacing -0.025em never applies to fa content (no fa h1 exists; [lang=fa] resets tracking anyway).
- Verdict: NO DEFECT (2 rendered checks queued).

### src/styles/motion.css (351) — READ
- All keyframes transform/opacity (+ bounded stroke-dash, allowed by locked budget test); reduced-motion resets animation+transform across every animated class; coarse pointers drop hover transitions and 3 of 6 motes; butterfly finite (17 flutters), glow breathe infinite-alternate (slow ambience; Motion control = WCAG 2.2.2 pause mechanism), motes infinite 11–14s (same mechanism); leaf turns staggered, illumination settles at 1.5s within the 1.6–2.2s contract.
- Verdict: NO DEFECT.

### src/sw-client/register.ts (263) — READ
- Secure-context + container guard → 'unsupported'; `updateViaCache:'none'`; updatefound/installed → update_ready; strict status parsing (exact shape + message binding + release filter); activation request: waiting-worker binding, statechange→activated→location.replace, redundant cleanup, 15s timeout, WeakMap dedupe, postMessage failure → false.
- Note (Info): the container 'message' listener is added per registration call and never removed; repeated retry cycles accumulate filtered listeners (bounded by user retries; no functional harm observed — candidate cleanup only if touched anyway).
- Verdict: NO DEFECT (Info note).

### src-sw/cacheTypes.ts, integrity.ts — READ
- Canonical stringify (mirrors runtime), bounded SHA-256, response reconstruction strips wire/transfer/cookie/vary headers, fatal-UTF8 JSON + canonical-encoding equality check.
- Verdict: NO DEFECT.

### src-sw/service-worker.ts (195) — READ
- Compile-time release identity binding (worker bytes versioned per release+corpus); install stages fail-closed with identity check; first-install bootstrap activates exact verified candidate; message-driven exact-target activation with skipWaiting only after pointer confirmed; typed status posts to window clients; fetch delegated to manager.
- Verdict: NO DEFECT.

### src-sw/schemas.ts (388) — READ
- Mirrors runtime corpus/descriptor schemas independently (no import from src/lib); FIXED_MIME includes 11 fixed browser assets incl. 4 webp (precache) + 2 mp4 (integrity-listed, never precached — `mustPrecache = mime !== 'video/mp4'`); Vite asset pattern (16-hex); audio never precached; digest-in-filename rule for content-addressed asset families; 8MB offline hard limit.
- Cross-checked against `src/lib/content/release.ts` FIXED_BROWSER_ASSETS in boundary check (Phase 5 sweep) — must stay in sync (locked by tests).
- Verdict: NO DEFECT.

### src-sw/releaseManager.ts (871) — READ
- Serialized ops; staging: canonical parse, descriptor/corpus/manifest verification incl. per-item hashes, byte ceilings (8MB) with bounded streaming reads, candidate cache with READY marker last, pending marker after; activation: pointer write = commit boundary, previous release retained, cleanup idempotent/non-fatal; release-ID reuse with different hashes rejected (rollback-protected); navigation: network-verified-HTML-against-manifest else cached shell else offline.html; release.json network-first w/ verified snapshot fallback; `/video/` + unknown paths pass through untouched (Range preserved ✓); audio cached only after direct audio request; health/SW script network-only.
- **Finding F-SW-1 (Medium→confirm in Phase 6, POSSIBLE):** for `/assets|content|fonts|images|icons|manifest.webmanifest|offline.html`, response is `activeCache.match ?? 504` with **no network fallback**, including when `activeCache()` is null (pointer present but release cache evicted/incomplete — e.g. storage-pressure eviction of one cache). An online, SW-controlled page then gets network HTML (navigation path) but 504 assets → broken app that cannot self-heal until a new SW version installs (staging runs only at install). Design §16.4 says "hashed assets: cache first" (implying network fallback). Repair nuance: network fallback is release-coherent ONLY for content-addressed paths (`/assets/[name]-[hash]`, `/content/<sha>.json`, digest-named fonts/images/icons) — fixed-path assets (posters, offline.html, manifest) could mix releases and must keep fail-closed or verify against manifest. Needs rendered repro (Phase 6: delete release cache via CDP, reload online) + TDD repair if confirmed.
- Verdict: 1 candidate defect (F-SW-1).

## Public assets, configs, build scripts

### public/manifest.webmanifest — READ
- Complete install identity (id/start_url/scope/display standalone, night background, lang/dir), SVG `any maskable` icon, no remote refs, no University claim. Research note: Chromium accepts SVG manifest icons; iOS ignores the manifest icon and needs a PNG `apple-touch-icon` (documented limitation, launch-gated). Verdict: NO DEFECT (documented residual).

### public/offline.html — READ
- Script/style-free recovery page, honest copy, local links only, robots noindex. Pinned by artifacts test. NO DEFECT.

### public/icon.svg — READ
- Original khatam-star geometry, night/gold palette, no script/remote refs; `role="img"` + aria-label. NO DEFECT.

### public/images/*.webp (4), public/video/*.mp4 (2) — INSPECTED (binary)
- Dimensions verified (720×1280 / 1280×720); bytes match `docs/verification/divan-cinematic-assets.json` manifest; VP8 webp; MP4 faststart per provenance; SSIM handoff evidence recorded. Provenance doc read. NO DEFECT.

### vite.config.ts, tsconfig.json, eslint.config.js, playwright.config.ts, vitest.config.ts, src/vite-env.d.ts — READ
- publicDir:false + explicit allow-list (raster-zero lock), no sourcemaps, hex 16 hashes, modulePreload polyfill off (Vite 8 change documented in-file); TS strict + noUncheckedIndexedAccess/exactOptionalPropertyTypes; ESLint typed rules + prettier last; Playwright single-worker Chromium with fixture webServer; vitest excludes e2e, jsdom, coverage thresholds. NO DEFECT.

### scripts/build.ts (1176) — READ
- Locked release assembly: env validation (HTTPS origin, kebab release ID, minimums cannot weaken 24/16 floors + check.sh pins 60/60, branding gate, SOURCE_DATE_EPOCH), build lock, symlink/containment guards everywhere, per-release SW bytes (`__DIVAN_RELEASE_ID__`/`__DIVAN_CONTENT_SHA256__` define), fixed public allow-list copy, single Cormorant display-face preload injection (measured rationale), audio signature/size/hash verification, staged dist + verifyDist before atomic swap with backup restore. NO DEFECT.

### scripts/verify-dist.ts (727) — READ
- Exact file-set verification; canonical JSON equality; private-key/value + fixture-sentinel scans; per-MIME binary signatures; HTML/CSS/JS/SVG remote-reference and inline-executable rejection; index.html semantic contract. NO DEFECT.

### scripts/verify-privacy.ts (149) — READ
- Host-based tracker/analytics/ad/social/fingerprint scans over src+dist, cookie/geolocation patterns, storage posture assertion. NO DEFECT.

### scripts/check.sh (126) — READ
- Single gate; OSV fallback for retired npm audit; launch gates asserted fail-closed; production build required with pinned 60/60. NO DEFECT.

## Tests (all fully read)

### tests/unit/* (7 files) — READ
- cinematicCapability, scrollScrub (coalescer semantics incl. settle/cancel), secureRandom (rejection sampling boundaries, no Math.random), shuffleBag (no-repeat/exclusion/persist/release-scope), state (locked transitions, recovery, injected-key stripping), history (three-field record, malformed→welcome), storage (restore matrix, throw-safety, six-key allowlist). Behaviour-anchored, negative-path rich. NO DEFECT.

### tests/components/* (12 files incl. fixtures) — READ
- appFlow (result order, single h1/main, focus movement, Escape single-completion, durable history Back/Forward excl. revealing, session-restore matrix §5.3, storage allowlist); cinematicBegin + cinematicThreshold (poster gate, timeout-demote, pending-Begin honoured, terminal-frame paint sequencing, skip); contextRoutes (5 pages + honesty assertions); document (shell metadata, noscript, no inline script/style); failures (privacy-safe blocking errors, focus, audio failure §26.4, offline-readiness truthfulness, ErrorBoundary containment); offlineIntegration (register-after-verify, typed status dedupe/release filter, explicit activation); poetSelectionNavigation (back control clears state, history-depth-independent); runtime (no-store/redirect:error pinning, fail-closed matrix, build↔runtime Markdown/bidi parity cases); shareAction (outcomes, cancel silent, §7.6 secondary actions, stall disclosure content rules); visualLanguage (distinct portals, safe SVG, asset register). NO DEFECT.

### tests/accessibility/* (2) — READ
- Keyboard completion both poets, English-before-Persian + bdi isolation incl. §8.3 parenthesis mirroring case, skip link semantics, history focus restoration, reduced-motion two-phase paint, live-region dedupe, motion precedence, audio failure, crash containment, axe (A/AA incl. wcag22aa) on every scene incl. boot/error (color-contrast delegated to real-browser e2e). styles.test locks 44px floor, two-tone focus, skip-link, reflow permissions, scoped reduced-motion, 120ms reveal, spine-bar clearance, light-surface link colour, poet keying, letter-spacing 0, safe-area env names. NO DEFECT.

### tests/offline/* (6) — READ
- helpers (faithful Cache double rejecting 206, release fixture with 11 fixed assets incl. never-fetched video); artifacts (manifest/offline.html locked); client (registration statuses, secure-context, explicit activation w/ replace-after-activated, listener dedupe/timeout); releaseManager (staging negatives: counts/paths/hashes/reuse/8MB/audio-precache-hostile/206/compressed-length; activation atomicity incl. pointer-write failure, maintenance-not-failure, pending retry); runtimeStrategies (release coherence, bounded nav timeout, 206 nav rejection, health/SW no-store, query-mutated asset 504, incomplete-candidate nav, exact pending activation, stale-candidate cleanup, audio direct-request caching); serviceWorker (install identity binding, first-install bootstrap, rollback via message, invalid target error). NO DEFECT (F-SW-1 unpinned either way — repair would extend, not weaken).

### tests/share/* (2) — READ
- shareCard (§15.1 fields, reflection excluded, injection-escaped, 1200×630, legibility floors incl. ≥8 stroke widths, URL omitted without approved short URL); shareService (share/copy/cancel/unavailable matrix, AbortError benign, blob create+revoke once). NO DEFECT (F-SHARE-1: revoke-timing not covered by any test — regression will be added if repair confirmed).

### tests/performance/visualBudgets.test.ts — READ
- Locked visual system: 17 tokens exactly once, 4 font families swap/no-remote, transform/opacity/bounded-stroke only, authored CSS ≤45KB, compressed shell budgets (HTML 40k/CSS 45k/JS 200k/fonts 180k/initial images 0/total 1.2MB). NO DEFECT.

### tests/e2e/* (4 specs + config + server) — READ
- accessibility.spec (320×568 keyboard both poets + axe wcag22aa in real Chromium + reflow + text-spacing overlay + Back-focus restoration + skip timing ≤300ms measured from DOM activation + reduced-motion transition introspection + audio-failure §26.4); offline.spec (full SW lifecycle: outage reload, gzip round-trip, no audio precache, update via clean navigation, broken-update redundancy, rollback pointer proof); visual.spec (5-viewport matrix × 13 captures + no remote requests + overflow guard + poet-card distinctness + reveal animation property/duration introspection + reduced static); offline-server (variant releases with genuine per-release SW builds, gzip, SPA routing mirror of Caddy). playwright config: Chromium only — WebKit/Firefox coverage gap acknowledged for Phase 6. NO DEFECT in tests themselves.

### tests/setup/vitest.ts, tests/components/fixtures.ts, tests/fixtures/content/corpus.ts — READ
- jest-dom setup; realistic bilingual fixtures (real Persian text in component fixtures — good shaping proxy); fixture corpus with conspicuous sentinels, exact 24/16, registries + approvals bound by canonical hash. NO DEFECT.

### tests/security/publicReadiness.test.ts — READ
- README/licence/security-policy/CODEOWNERS binding, OFL notices vs installed packages, ops evidence boundary, exact production release + OSV pin in CI. NO DEFECT.

### tests/content release-contract set (release, buildRelease, publicSchema, canonical, contentLoader, productionManifest) — READ (all 2,249 lines)
- Locked dist set incl. images/ + video/; cinematic media contract (video never precached, posters always); deterministic builds; unsafe-output/symlink/activation-restore matrix; VITE env leak guard; production audio verification; verify-dist adversarial rehash matrix (inline script, private values, remote vectors incl. setAttribute/iframe/SVG image, URI schemes, fixture-leak-in-production, non-UTC timestamps); strict YAML; publicSchema markup/bidi/wordcount/audio-path negatives; canonical JSON (sparse array/symbol rejection); production manifest 60/60 order/dupe rules. NO DEFECT.

## Docs (frontend verification)

### docs/verification/{visible-navigation-and-cinematic-begin, divan-cinematic-enhancement-report, divan-cinematic-provenance}.md + divan-cinematic-assets.json — READ
- Claims consistent with code as read; evidence honestly bounded (emulated Chromium, external gates listed). NO DEFECT.

## Phase 5 summary
- Files fully read: **131/131 frontend** (125 text read line-by-line; 6 binaries inspected via metadata + integrity manifest + provenance) + 14 boundary contracts checked at the boundary (FIXED_BROWSER_ASSETS ↔ FIXED_MIME sync verified).
- Candidate defects carried to Phase 7: **F-CIN-1** (iOS first-frame priming absent — skill-contract deviation, safe fallback), **F-SW-1** (SW asset routes have no network fallback when active cache evicted/incomplete), **F-SHARE-1** (synchronous Blob URL revocation after download click), plus Info notes (mixed setState/dispatch, SW container message-listener accumulation, BookStage plan indirection, resolveBack helpers unused by App).
- Rendered checks queued for Phase 6: Persian shaping + Nastaliq descender clearance with the real 120-record corpus; poet-label clipping; F-SW-1 repro; F-SHARE-1 download behaviour; long-content edge cases (§5.10); viewport matrix; WebKit/Firefox engines.
