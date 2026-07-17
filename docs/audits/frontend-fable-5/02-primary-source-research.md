# Fable 5 frontend audit — Phase 2 primary-source research

Access date for all fresh sources: **2026-07-17**. Research was executed by six read-only research agents (full reports retained in session transcripts); this document is the lead's consolidated, classification-tagged synthesis. Classifications: **REQUIRED / RECOMMENDED / NOT APPLICABLE (N/A) / ALREADY SATISFIED (AS — verified in this repo during Phase 5/6) / POSSIBLE DEFECT (PD → ledger ID)**.

**Provenance caveat:** the React/Vite/TypeScript agent's live web access was denied mid-session; its report is training-knowledge (≤Jan 2026) with canonical URLs supplied for verification but no fresh access records. Every actionable item from that report was **independently verified against this repository** during Phase 5 (noted per item below), so no repair rests on an unverified claim. All other five reports used fresh primary sources (MDN, W3C, web.dev, WebKit/Chromium/Mozilla trackers, caniuse/web-features, Playwright docs, Google Search Central).

## 1. Core Web Vitals & performance (fresh sources)

- INP replaced FID (stable since Mar 2024); thresholds LCP ≤2.5s / INP ≤200ms / CLS ≤0.1 (p75 field). **AS** — repo docs/tests reference LCP/CLS/INP, never FID.
- **INP cannot be lab-measured**; with analytics prohibited it is structurally unmeasurable here — audit the interaction-handler mechanism instead, use TBT as weak proxy. **REQUIRED framing** — adopted in 06-matrix and this audit's claims.
- Soft-navigation metrics still origin-trial (Chrome 147→151 plan): SPA in-app transitions aren't captured by stable CWV. **RECOMMENDED note**, not a defect.
- Font loading: `swap` for branding, `optional`/metric-overrides (`size-adjust`) to kill swap-CLS. **AS** — all faces swap; measured CLS 0.00/0.0053, so no repair warranted. Preload ≤1–2 critical fonts: **AS** (exactly one, measured rationale in build.ts).
- Arabic-script subsetting risk (unicode-range splitting shaping): **AS** — fontsource arabic subset files, no unicode-range declarations, shaping verified rendered with real corpus (Phase 6).
- Noto Nastaliq Urdu is Urdu-optimized; Persian usage descriptive not QA'd (Noto specimen; Google Fonts nastaliq blog). **RECOMMENDED verify rendered** — done (Phase 6: real-corpus Nastaliq lines render correctly, ZWNJ intact, no clipping); residual: native-device shaping remains a launch-gate item.
- LCP image guidance (`fetchpriority=high`, never lazy-load LCP): posters ship via release manifest and are painted from `<img>` without `loading="lazy"`; **AS** (decoding=async on poster is acceptable given measured LCP 1396ms; no change).
- Sources: web.dev/articles/inp, /font-best-practices, /fetch-priority; developers.google.com Core Web Vitals; notofonts.github.io NotoNastaliqUrdu specimen; caniuse per-feature tables.

## 2. Browser compatibility verdicts for APIs actually used (fresh; caniuse/MDN BCD 2026-07-17)

| Feature | Verdict | Consequence |
|---|---|---|
| `requestVideoFrameCallback` | Chrome 83+/Safari 15.4+/**Firefox 132+** — Baseline newly-available (widely-available projected 2027-04) | **AS** — code feature-detects with direct-present fallback; Firefox gap is closed (verified live: rVFC function in FF probe) |
| Web Share | **Firefox desktop: none (through 155)**; Safari 12.1+; Chrome desktop full 128+ | **AS** — clipboard fallback verified live in Firefox ("Verse text copied…") |
| `navigator.connection.saveData` | Chromium-only; no Safari/Firefox | **AS** — optional-shaped `readSaveData`, poster route Chromium-verified; W/F treat as enhancement |
| CSS `text-wrap: balance` | Chrome 114+/FF 121+/Safari 17.5+ | **AS** — progressive enhancement on h1 only |
| `env(safe-area-inset-*)`, `dvh/dvb`, `clamp()`, `:focus-visible`, `aspect-ratio` | Baseline widely available | **AS** |
| `forced-colors` MQ | Chrome 89+/FF 113+; **Safari: none through 27** | **RECOMMENDED note** — repo's forced-colors blocks are additive; Safari users get the normal (accessible) design; no repair |
| `scrollIntoView({behavior:'smooth'})` | Baseline (Safari 15.4+) | **AS**; reduced-motion never enters the smooth-scroll corridor at all (poster route) — satisfies the "smooth must fall back" rule at a stronger level |
| `scrollend` | Baseline since Safari 26.2 | N/A — not used; scrub uses per-frame coalescing + `seeked` |
| CSS scroll-driven animations | Not Baseline (FF flagged) | **AS** — deliberately not used; JS scrub is the portable path |
| Clipboard `writeText` | secure context + transient activation (FF/Safari); Permissions-query not cross-browser | **AS** — called directly in click handler, no `await` before it in the share path (`buildShareText` is sync); guarded feature-detect |
| `content: "x" / "alt"` alt-text syntax | Chrome 77+/Safari 17.4+/FF 128+; **unsupported parsers drop the whole declaration** | **PD → D-3** — fix must keep a preceding plain `content` declaration as fallback |
| CSS generated content in accessible names | accname includes ::before/::after text | **PD → D-3** (confirmed in a11y tree) |

## 3. Media / video-scrub engineering (fresh)

- `seeked` (not rVFC) is the reliable "seek settled" signal; coalesce `currentTime` writes to ≤1/frame gated on `seeked`. **AS** — exactly the coalescer contract (unit-tested).
- HTTP Range/206 required for seeking; SW must pass range-bearing media requests through or reconstruct 206; **Cache.put rejects 206** (spec). **AS** for cinematic video (`/video/` passes the original Request through; verified staging rejects 206 pre-put). **PD → D-7 (latent)**: the *direct audio* path fetches by path string (drops `Range`) and answers with a full 200 — breaks WebKit media semantics per WebKit bug 184447 + web.dev sw-range-requests; latent because production has 0 audio records.
- iOS/WebKit muted-inline first-frame: a never-played muted video may not composite seeked frames; documented fix = gesture-gated muted `play()`→`pause()` prime, poster until first paint. **PD → D-4** (WebKit flakiness observed; prime probe presents reliably; project skill mandates priming).
- Muted inline autoplay/priming is policy-allowed in all engines (Chrome autoplay policy; MDN autoplay guide). Supports the D-4 repair's safety.
- `MediaError` codes + spec "show poster flag" on error. **AS** — explicit error listener → poster route (rendered-verified).
- Background-tab rAF pauses everywhere; scrub rAF is scroll-event-driven (no free-running loop) and video is never playing → **AS**, no visibility handler needed.
- Save-Data guard must be optional-shaped. **AS**.
- Sources: MDN rVFC/Range/MediaError/autoplay/PageVisibility; WHATWG media spec; web.dev sw-range-requests + rvfc; WebKit bug 184447; Firefox bug 1919367; Chrome autoplay policy.

## 4. Accessibility & internationalisation (fresh)

- WCAG 2.2 (REC 2024-12-12): live AA obligations here = **2.4.11 Focus Not Obscured** (no sticky overlays over focus — verified: header is in-flow, skip link self-reveals) and **2.5.8 Target Size ≥24px** (repo enforces 44px floor — verified rendered 46px buttons at 320w). Recorded N/A with rationale: 2.5.7 (no drag anywhere — reveal is a plain button; scroll-scrub has button alternatives Begin/Skip), 3.2.6 (no help mechanism), 3.3.7/3.3.8/3.3.9 (no forms/auth). 4.1.1 obsolete — not audited. 1.4.10 Reflow 320px, 1.4.4 200%, 1.4.12 text-spacing: **AS** (Phase 6 rendered + baseline e2e text-spacing overlay).
- 2.2.2 Pause/Stop/Hide (Level A): ambient candle/motes loop >5s → mechanism required. **AS** — the Motion control (Reduced) halts all ambient animation; system preference honored on first paint (no flash of motion — reduced sets `animation:none` via data attr computed before first render from localStorage/system MQ).
- 2.3.3 (AAA) noted as project commitment — reduced-motion equivalents verified.
- Live regions: container must pre-exist in DOM (**AS** — single persistent LiveRegion at root); avoid dual regions and role=alert+assertive double-speak (**AS** — one region; BlockingError uses role=alert scene while the status region is separate — checked: announcement text differs from alert content, and offline tests pin single-region behaviour).
- SPA focus-on-view-change is a 2.4.3 obligation: **AS** — every scene change moves focus to the scene heading/control (rendered-verified incl. Back/Forward restoration to poet/reveal controls).
- Bidi/i18n (W3C qa-html-dir, inline-bidi): base direction in markup (`html dir=ltr`, fa regions `dir=rtl`) **AS**; `<bdi>` on mixed runs **AS** (incl. §8.3 parenthesis non-mirroring, test-pinned); logical CSS properties **AS** (audited stylesheets use inline/block logical properties throughout); no CSS `direction:` misuse (grep-verified).
- Persian shaping: `letter-spacing` breaks Arabic-script joining (MDN i18n warning) — **AS** (`[lang='fa']{letter-spacing:0}` + no tracking reaches fa runs; **except D-2's font-stack override** which is a family, not tracking, issue). No `text-align: justify` anywhere (grep-verified). ZWNJ preserved end-to-end (33 records, rendered-verified; share text path copies raw strings). Nastaliq line-height 2.5 verified uncut.
- Screen-reader language switching relies on `lang="fa"` per Persian run — **AS** (every Persian element carries lang/dir; welcome line, labels, poem, hemistich).
- Sources: w3.org/TR/WCAG22 + Understanding pages (2.4.11, 2.5.8, animation-from-interactions), MDN ARIA live regions (2026-03), W3C ALReq, MDN letter-spacing, W3C qa-html-dir & inline-bidi-markup, TPGi/VA.gov SPA focus guidance.

## 5. Service worker / storage / history (fresh)

- **Cache Storage eviction is per-origin, all-or-nothing** (MDN Storage quotas: "all of its data, not parts of it"); named caches cannot be evicted individually in the default bucket; Storage Buckets API (Chromium-only) is the only split. **Consequence:** D-1's partial-eviction trigger is *not* produced by normal quota eviction; remaining real triggers are cache corruption/failed writes, manual/devtools clearing of Cache Storage without unregistering the SW, and engine anomalies. Impact when triggered remains total and permanent → severity assessed Medium (impact critical × likelihood low), repair retained. Also **RECOMMENDED (recorded, not implemented — behaviour change beyond defect scope):** `navigator.storage.persist()` at stage time; and never describe previous-release retention as eviction durability (it is rollback protection only) — repo docs already do not.
- Safari ITP 7-day script-writable-storage cap deletes Cache API + SW registration together (installed PWAs exempt; WebKit storage-policy 2023). **RECOMMENDED note** for stall planning (tablet pre-cache within 7 days) — matches design §16.5.
- `Cache.put` rejects 206/Vary:* (spec) — **AS** (pre-put 200-exact check; test-pinned incl. zero rejected-partial-put attempts).
- skipWaiting/mixed-version straddle: **AS** — skipWaiting only after explicit same-target activation; navigations activate exact persisted pending target; worker bytes release-versioned.
- BFCache: `no-store` no longer blocks BFCache (Chrome 2025); no `unload` handlers in repo (grep-verified — eligible); restored page holds in-memory release N while SW may hold N+1 → previous-release cache retention covers N's content-addressed assets; poem data lives in memory. **Info I-6** (recorded; no repair — two-releases-behind restore is the only gap and ends at next navigation).
- `history.state` size/throttle: tiny 3-field records, pushed only on stage change — **AS**.
- sessionStorage per-tab copy semantics: duplicated tab diverges — **AS** (design §14.4 explicitly allows separate sequences; no cross-tab uniqueness claim).
- `navigator.onLine` is a hint only — **AS** (used only to gate optional video enhancement and an announcement; SW cache is the offline authority).
- `crypto.subtle` secure-context only; 127.0.0.1 is secure — **AS**; on-device QA over bare-IP HTTP would fail closed (correct posture; noted for launch checklist).
- Sources: MDN storage quotas/eviction, WebKit storage-policy 14403, SW spec cache.put, web.dev service-worker-lifecycle + bfcache (upd. 2026-07-02) + bfcache-ccns, MDN pushState/sessionStorage/onLine/SubtleCrypto, WebKit bug 184447.

## 6. Share / download / CSP / PWA / metadata (fresh)

- **Synchronous `URL.revokeObjectURL` immediately after `anchor.click()` is unsafe** — documented download breakage (Mozilla bug 1282407; Chromium issue 41380177); deferred revocation required. **PD → D-6** (my three-engine Playwright test succeeded, but current-version success does not refute the tracked race; fix is trivial and evidence is primary-source).
- Web Share `AbortError` = benign cancel, must not surface — **AS** (explicit 'cancelled' outcome, announcement suppressed, test-pinned).
- Safari clipboard transient-activation: no `await` before `writeText` — **AS** (sync text build, writeText is the first async op).
- iOS `download` attribute honours same-origin/blob + user gesture — **AS** (blob URL, gesture-gated).
- CSP: design §22.4 policy includes `style-src 'self'`, `font-src 'self'`, `connect-src 'self'` (the research flag about missing directives was against a summarized policy; the authoritative Caddyfile policy is complete and ops-tested — out of frontend scope). React inline `style` attributes: none in src (grep-verified; the one dynamic value is a CSS custom property set via CSSOM `style.setProperty`, which CSP does not govern). **AS**.
- Storage partitioning/referrer/noopener: first-party only, no cross-origin embeds; external links: none in-app (all nav links same-origin) — **AS**; anchor download uses `rel="noopener"`.
- PWA installability: Chrome install criteria want 192/512 PNG icons; iOS wants 180×180 PNG apple-touch-icon; SVG not honored for install/home-screen. **Documented deviation I-3** (pre-recorded in AGENT.md 2026-07-13): DIVAN is a QR-launched web experience, not an installability-gated product; adding PNGs requires a release-contract + budget-lock change → deferred to launch-gate review, not fabricated here.
- OG image/canonical: require absolute URLs on the final hostname → launch-gated by design; correctly absent. JSON noindex via `X-Robots-Tag` is a deploy-layer item (Caddyfile) — out of frontend scope.
- Sources: MDN revokeObjectURL/createObjectURL/content/style-src(-attr)/State-Partitioning/rel-noopener, W3C css-content-3, caniuse web-share/download/netinfo, Lighthouse installable-manifest, web.dev manifest, Google Search Central canonical/robots, WebKit bug 167341, Soueidan CSS-alt-text.

## 7. React 19 / Vite 8 / TypeScript 6 (training-knowledge report — every item repo-verified in Phase 5)

- Strict-Mode double effects + cleanup symmetry: **AS** (all effects audited; cancelled flags, listener/timer/rAF cleanup verified file-by-file).
- Ref callbacks with implicit returns (React 19 treats return as cleanup): **AS** — grep verified: all `ref={...}` usages are ref objects, no callback refs in src.
- "You Might Not Need an Effect": no derived-state effects found; event logic lives in handlers. **AS**.
- `useSyncExternalStore` for matchMedia/onLine: repo uses effect subscriptions — **RECOMMENDED**, not a defect (tear-free behaviour not load-bearing here; noted I-7).
- Render purity incl. randomness: draws happen in click handlers only — **AS**.
- createRoot `onUncaughtError`: ErrorBoundary already provides the fail-closed UI — **RECOMMENDED** enhancement only (I-8).
- Vite 8: `assetsInlineLimit: 0` (**AS** — explicitly set, protecting the no-data:-URI dist rule); modulePreload polyfill disabled (**AS**, documented in-config); sourcemaps off (**AS**); publicDir:false semantics (**AS**); Rolldown vs build scripts: build.ts consumes emitted files + top-level `rollupOptions.output` naming only — compatible (baseline build green).
- TS 6.0.3: strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + verbatimModuleSyntax all enabled (**AS**); typecheck clean at baseline.
- Caveat honoured: no claim above rests on the unverified web sources; each is grounded in this repo's own verified state. Canonical URLs for future verification: react.dev upgrade guide/reference, vite.dev/guide/migration + config, devblogs.microsoft.com/typescript.

## Consequences fed into the defect ledger

- D-1 severity calibrated (per-origin eviction fact) — repair retained (network fallback restores §16.4 semantics; protects corruption/manual-clear/anomaly cases).
- D-3 repair pattern fixed (plain declaration + alt-text override, per css-content-3 invalidation caveat).
- D-4 repair justified (gesture-gated muted prime; policy-safe; skill-mandated; WebKit flake observed).
- D-6 reinstated (deferred Blob-URL revocation; bug-tracker evidence).
- D-7 added (latent: direct-audio SW path must pass range-bearing requests through).
