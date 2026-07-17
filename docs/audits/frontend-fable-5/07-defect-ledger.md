# Fable 5 frontend audit — Phase 7 defect ledger

## Post-repair status (Phase 8, 2026-07-17)

| ID | Severity | Repair commit | RED→GREEN | Rendered re-verification |
| --- | --- | --- | --- | --- |
| D-1 | Medium (impact-critical) | `3930a47` | 3 failing tests reproduced → 56/56 offline | Chromium: evicted release cache + online reload now fully recovers (welcome renders, 0 failed requests, SW still controlling) |
| D-7 | Medium latent | `3930a47` | range-audio passthrough pinned | (latent; test-pinned) |
| D-2 | Medium | `ac9d164` | styles guard RED → 25/25 a11y | WebKit/Chromium: `#persian-heading` now computes `DIVAN Noto Nastaliq Urdu…`; full-page capture confirms Nastaliq heading, colour keying intact |
| D-3 | Low | `ac9d164` | styles guard RED → GREEN | Chromium aria snapshot: `button "Begin"` (glyph gone from name) |
| D-4 | Medium | `973b876` | prime+pause component test RED → 140/140 comp+unit | WebKit: Begin at poster state enters in ~205ms (no 4s stall) |
| D-6 | Low | `1e01609` | deferral pinned (3 tests) → 27/27 share | download event verified in C/W/F pre-repair; deferral strictly widens validity |
| D-5, I-1…I-8 | Info | no repair (documented) | — | — |

Full vitest suite after all repairs: **713/713** (baseline 705 + 8 net-new regressions; none weakened — the one adjusted assertion now proves the query-variant response comes from the network, a strictly stronger coherence check than the fabricated 504 it replaced).

---

# Original pre-repair ledger (unchanged below)

Created before any implementation edit. Severity: Blocker/Critical/High/Medium/Low/Informational. Every entry lists reproduction, evidence, and the minimal proposed repair. Deduplicated by root cause.

## D-1 (was F-SW-1) — SW serves 504 for release assets with no network fallback after cache eviction

- **Severity:** Medium (impact Critical × likelihood Low — research correction: normal quota eviction is per-origin all-or-nothing per MDN, so the pointer-survives-cache-loss state arises from cache corruption/failed writes, manual/devtools Cache Storage clearing, or engine anomalies rather than routine eviction; when it arises the breakage is total and permanent)
- **Status:** CONFIRMED (rendered repro, Chromium)
- **Affected files:** `src-sw/releaseManager.ts` (`respond()` asset branch, lines ~201–219); regression coverage in `tests/offline/runtimeStrategies.test.ts`
- **Affected state:** SW-controlled page whose active release cache is missing/incomplete (browser storage-pressure eviction; pointer cache retained), online navigation
- **User impact:** the app is *permanently* broken while online — navigation HTML loads, every hashed JS/CSS/font/image request returns 504, page shows raw fallback text; no self-healing because staging runs only at SW install. A visitor at the stall with an evicted cache cannot use the site at all until a new release deploys or they manually clear site data.
- **Reproduction (exact):** load app once (SW active) → DevTools/CDP: `await caches.delete('divan-release-v2:<releaseId>')` keeping `divan-release-pointers-v2` → online reload → observe 504 on `/assets/index-*.js`, `/assets/index-*.css`, font; root renders no app. Reproduced 2026-07-17, Chromium, production build `fable5-rendered-audit`.
- **Source evidence:** `respond()` returns `cached ?? new Response('Release asset unavailable.', {status:504})` for `/assets|/content|/fonts|/images|/icons|manifest.webmanifest|offline.html` with `active` possibly `null`; no network path.
- **Design authority:** §16.4 "hashed assets: cache first" (cache-first implies network fallback); §16.3 protects *release coherence*, which network fallback preserves for content-addressed paths (URL embeds the digest) and, when `activeCache()` is null, for fixed paths too (the shell HTML itself just came from the network's current release).
- **Skill/research basis:** web-perf/SW research: Cache Storage eviction is real under quota pressure; sw research pending on per-cache eviction granularity (browsers may evict whole origins, but partial loss via failed writes/corruption is also observed in the wild). Even for whole-origin eviction, the pointer cache can be repopulated before release caches on partial restore.
- **Regression-test strategy (TDD):** new tests in `tests/offline/runtimeStrategies.test.ts`: (a) active pointer present + release cache deleted → asset request is served from network (200, correct body); (b) active release complete → asset still served from cache (no network hit); (c) cached-shell coherence test unchanged. Adjust the existing "query-mutated hashed asset" test: the invariant (never fuzzy-match the cache) is preserved by asserting the response comes from the network passthrough, not the cache (fake network 404 → expect 404-from-network rather than SW-fabricated 504).
- **Minimal repair:** in the asset branch, `const cached = await active?.match(request); if (cached) return cached; return this.#fetch(request);` — i.e. fall through to network exactly like unknown paths (Range/conditional semantics preserved by passing the original request). No staging, no cache writes (avoids poisoning a verified cache with unverified bytes; §16.2 caching remains install-time-verified only).
- **Risk of repair:** low — network responses are what an uncontrolled page would get; coherence risk only for fixed-path images when an *older complete* cached shell coexists with a *newer* deployed origin, but in that case `activeCache()` is non-null and cache still wins; fallback only fires when the cache cannot answer at all, where a network answer strictly dominates a 504.

## D-2 (was F-TYPO-1) — Persian result heading rendered on the Latin display-font stack

- **Severity:** Medium (typography / bilingual design-system correctness)
- **Status:** CONFIRMED (computed style + visual capture, Chromium/WebKit/Firefox)
- **Affected files:** `src/styles/visual.css` (`.context-page h2, .poem-result h2`); guard test in `tests/accessibility/styles.test.ts`
- **Affected state:** every poem result (both poets), all viewports/engines — the `متن فارسی` heading
- **User impact:** the only Persian heading in the core flow renders in whatever per-glyph system Arabic fallback the platform finds behind Cormorant Garamond/Georgia (Geeza Pro on macOS, varies on Android/Windows) — off the curated Vazirmatn/Nastaliq system; inconsistent brand typography and platform-dependent rendering quality for the most culturally significant label. Violates design §8.1 (Persian faces) and divan-brand-art-direction (typography contract).
- **Reproduction:** open any result → `getComputedStyle(document.querySelector('#persian-heading')).fontFamily` → `"DIVAN Cormorant Garamond", Georgia, serif`. Cross-engine identical; WebKit full-page capture shows naskh-style system fallback.
- **Root cause:** `.poem-result h2` specificity (0,1,1) > `[lang='fa']` (0,1,0); the fa override in core.css only sets family via the lower-specificity selector.
- **Regression-test strategy (TDD):** extend `tests/accessibility/styles.test.ts` with a rule assertion that a `.poem-result [lang='fa'] h2` (or equivalent) declaration assigns the Persian display stack and a Nastaliq-safe line-height; assert it appears after/overrides the generic h2 rule.
- **Minimal repair:** add to visual.css after the h2 rule: `.poem-result [lang='fa'] h2 { font-family: var(--font-persian-display); line-height: 2; font-weight: 400; }` (Nastaliq ships only weight 400; weight 600 would synthesize). Keeps deep-red/lapis colour keying untouched. Authored-CSS budget impact ≈ +90 B (≤45 KB lock holds).
- **Risk:** minimal — one additive rule; visual change is intentional (heading joins the Persian stack, taller line box; layout below shifts by a few px — no locked screenshot pins this).

## D-3 (was F-CIN-2) — decorative CSS glyphs pollute accessible names

- **Severity:** Low (accessibility polish; WCAG 4.1.2/2.5.3 adjacent)
- **Status:** CONFIRMED (Chromium accessibility tree)
- **Affected files:** `src/styles/visual.css` (`.primary-action::before`, `.result-actions button:first-child::before`), `src/styles/flow-navigation.css` (`.flow-back::before`), `src/pages/*` (`.return-link::before` in visual.css)
- **User impact:** screen readers announce "✦ Begin", "✦ Reveal another", "← Choose another poet", "← Return to the poetry experience" — decorative glyphs read aloud (star may be announced as "black four-pointed star"); visible-label/accessible-name mismatch degrades voice-control matching ("Begin" still matches by substring, so 2.5.3 is not violated outright).
- **Reproduction:** CDP a11y snapshot shows `button "✦ Begin"`, `button "← Choose another poet"`.
- **Research basis:** CSS generated content participates in accessible-name computation (accname spec); CSS alternative-text syntax `content: '✦' / ''` excludes it (supported Chrome 77+, Safari 17.4+, Firefox 128+; older engines simply keep current behaviour — progressive fix, no regression).
- **Regression-test strategy:** styles test asserting the `/ ''` alt form on the four ::before ornament declarations (string-level, deterministic); rendered spot-check in Phase 10.
- **Minimal repair:** change the four `content:` declarations to the two-value alt form.
- **Risk:** none functional; older Firefox (<128) ignores nothing (two-value syntax is parsed or the declaration falls back — verify: unsupported parsers drop the declaration entirely, which would REMOVE the glyph; mitigation: keep a preceding plain `content: '✦';` line then override with the alt form so unsupporting engines keep the glyph, supporting engines use alt form).

## D-4 (was F-CIN-1) — WebKit cold-start first-frame flakiness; missing user-gesture video prime

- **Severity:** Medium (feature availability on WebKit/iOS family; UX latency)
- **Status:** PARTIALLY CONFIRMED (flaky in emulated WebKit: 1 of 3 cold runs demoted to poster at the 4s gate; 2 promoted ~1s; muted `play()` probe presented reliably). Real Safari/iOS unverifiable in this environment (Playwright WebKit ≠ Safari).
- **Affected files:** `src/components/CinematicThreshold.tsx`; tests `tests/components/cinematicThreshold.test.tsx`
- **User impact:** when the first frame never presents, WebKit visitors get the poster route (complete, safe experience) and a Begin press during the gate waits up to 4s ("Preparing the entrance") before direct entry. The cinematic is silently unavailable on those runs. Project skill divan-cinematic-threshold explicitly mandates: "Prime muted inline video only after user interaction where the browser requires it" — not implemented.
- **Reproduction:** Playwright WebKit, cold browser, load `/`, wait 5s → `data-cinematic-state="poster"`, video removed (observed matrix run 2026-07-17); repeat runs promote at ~1s (flaky).
- **Regression-test strategy (TDD):** component test: with a video stubbed to never fire rVFC-present until `play()` is called, pressing Begin during `poster` state calls `video.play()` (muted prime); on `presented`, video is paused and pending Begin proceeds through the corridor. Existing timeout/demote tests unchanged.
- **Minimal repair:** in `requestEntrance` (a user gesture) when `scrubbing && thresholdState !== 'playing'`, call `videoRef.current?.play()?.catch(() => {})`; in the first-frame `presented()` callback, `video.pause()` (idempotent — video is never intentionally playing). No autoplay introduced (gesture-gated, muted, inline).
- **Risk:** low — play is muted+inline+gesture-gated (policy-safe per research); pause-on-presented keeps scrub semantics; if play rejects, behaviour is exactly today's.

## D-5 — Reflection block absent product-wide (documented deviation, no repair)

- **Severity:** Informational (content scope, not frontend)
- **Status:** CONFIRMED (0/120 records carry a reflection)
- **Detail:** design §7.6 mandates a reflection per result; the machine-authority corpus deliberately fabricates none, so the "A reflection, not a prediction" section never renders in production. The frontend handles `null` correctly. Owner decision needed at content level; no frontend change.

## D-6 — Blob URL revoked synchronously after the download click

- **Severity:** Low (download reliability)
- **Status:** PLAUSIBLE (primary-source bug-tracker evidence: Mozilla #1282407, Chromium #41380177 — synchronous revocation races the download commit; my three-engine Playwright run succeeded on current versions, which does not refute the tracked race)
- **Affected files:** `src/lib/share/shareService.ts` (`downloadShareCard` `finally` block); tests `tests/share/shareService.test.ts`
- **User impact (when racing):** "Download verse card" silently produces no file.
- **Regression-test strategy (TDD):** test that `revokeUrl` is NOT called synchronously during `downloadShareCard` and IS called after the injected timer runs; keep the existing "created and revoked exactly once" assertion via timer flush.
- **Minimal repair:** replace the `finally` synchronous revoke with a deferred revoke (injectable timer, default `setTimeout(..., 1000)`); still exactly-once, still revoked long before tab close (§15.2 preserved).
- **Risk:** none — strictly widens the validity window of the URL.

## D-7 — SW direct-audio path answers range-bearing requests with a full 200 (latent)

- **Severity:** Medium latent (production corpus has 0 audio records today; breaks recitation seeking/playback on WebKit when audio ships — WebKit bug 184447 semantics; web.dev sw-range-requests: never answer a `Range:` media request with a bare 200)
- **Status:** CONFIRMED by code inspection (`#audioResponse` → `#fetchBytes(path)` refetches by path string, dropping the request's `Range` header, and `respondWith`s a reconstructed 200)
- **Affected files:** `src-sw/releaseManager.ts` (`#audioResponse`); tests `tests/offline/runtimeStrategies.test.ts`
- **Regression-test strategy (TDD):** a direct audio request carrying a `Range` header must be passed through to the network with the original Request (Range preserved) and must not trigger the verify-and-cache path; rangeless direct audio requests keep today's verified cache-after-use behaviour.
- **Minimal repair:** at the top of `#audioResponse` (after the direct-request check): `if (request.headers.has('range')) return this.#fetch(request);`
- **Risk:** minimal — range requests stream from network exactly as uncontrolled pages; the verified-cache fallback still serves subsequent full requests offline.

## Informational notes (no repair planned)

- I-1: mixed reducer-dispatch/direct-setState in App.tsx (style consistency; fully test-covered).
- I-2: `navigator.serviceWorker` container 'message' listener accumulates one filtered listener per registration retry (bounded, no functional harm).
- I-3: iOS `apple-touch-icon` is SVG (falls back to screenshot on iOS home screens) — pre-documented 2026-07-13; PNG icon requires a release-contract addition; left with launch gates.
- I-4: WebKit spurious font-preload warning (O-3); no CLS measured.
- I-5: welcome corner-motif strokes intersect headline glyph area at phone widths — accepted locked direction, legibility unaffected (O-2).

## Repair order (Phase 8)

1. D-1 (Medium, impact-critical) — TDD in `tests/offline/runtimeStrategies.test.ts`, repair `releaseManager.ts`.
2. D-7 (Medium latent) — TDD alongside D-1 in `runtimeStrategies.test.ts`, repair `#audioResponse`.
3. D-2 (Medium) — TDD in `tests/accessibility/styles.test.ts`, repair `visual.css`.
4. D-4 (Medium) — TDD in `tests/components/cinematicThreshold.test.tsx`, repair `CinematicThreshold.tsx`.
5. D-3 (Low) — styles-test pin + CSS alt-text form with fallback-preserving cascade.
6. D-6 (Low) — TDD in `tests/share/shareService.test.ts`, deferred revoke in `shareService.ts`.

No dependency upgrades required for any repair. No test weakened; the single adjusted assertion (query-mutated asset) preserves its invariant with a stronger check (response provably not from cache).
