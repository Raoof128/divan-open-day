# Fable 5 frontend audit — Phase 6 rendered state-space matrix

Date: 2026-07-17 (Australia/Sydney). Target: locally served **production** build `fable5-rendered-audit` (real 120-record corpus; 60/60), `vite preview` on 127.0.0.1:4173.

**Evidence honesty:** all browser evidence is emulated/automated — Chromium via Chrome DevTools (CDP) and Playwright; WebKit and Firefox via Playwright builds (Playwright's WebKit approximates but is NOT branded Safari, per Playwright's own docs). No physical-device, VoiceOver/TalkBack, print, or field evidence is claimed. Screenshots and probe scripts live in git-ignored `.tmp-tests/fable5-rendered/` (regenerable; described here rather than committed, per repository screenshot policy).

## Engines and viewports exercised

- **Chromium** (CDP interactive walk + Playwright): full flow matrix.
- **WebKit** (Playwright 2311): welcome/cinematic, worst-case result, share/download, 10-viewport overflow matrix.
- **Firefox** (Playwright 1532): same as WebKit.
- Viewports: 320×568, 360×640, 375×667, 390×844, 393×852, 412×915, 768×1024, 820×1180, 1024×768, 1440×900; plus 844×390 landscape (Chromium) and 320px reflow deep-check.

## Flow results

| # | Flow | Engine(s) | Result | Evidence |
|---|---|---|---|---|
| 1 | Welcome poster load | C/W/F | PASS — poster paints immediately; no console errors (WebKit logs a spurious font-preload warning, see O-3) | screenshots `*-welcome.png`, console logs |
| 2 | Begin automatic cinematic traversal | C | PASS — smooth corridor traversal, terminal-frame settle, arrival announced, chooser focused | CDP walk; arrival message observed |
| 3 | Manual cinematic scroll | C | PASS — scrollTo samples scrubbed `currentTime` monotonically; arrival at ≥0.985 progress unmounts threshold cleanly | CDP scroll loop |
| 4 | Skip entrance | C/W | PASS — immediate arrival, "Entrance skipped." announced | CDP + probe |
| 5 | Reduced motion | C/W/F | PASS — no `<video>` element, 0 `/video/` requests, poster route, direct Begin entry; reveal uses 120ms opacity | CDP: `{hasVideo:false, videoRequests:0}` |
| 6 | Save-Data | C | PASS — `navigator.connection.saveData=true` → poster route, 0 video requests (API is Chromium-only; W/F correctly treat it as an enhancement and load video) | CDP initScript run |
| 7 | Offline before first load | (Playwright e2e baseline) | PASS — offline.spec proves recovery + `/healthz` network-only; CDP network-throttle emulation does not flip `navigator.onLine`, so CDP offline evidence is limited and the Playwright spec is the authority | baseline e2e 5/5 |
| 8 | Offline after first load (warm) | C (cache-served) + e2e | PASS — full flow to a poem completed with network disabled (assets/corpus from SW caches; 0 failed requests) | CDP walk |
| 9 | Video decode/fetch failure | C/W | PASS — synthetic `error` event → poster demote, video element removed, Begin enters directly | CDP + matrix |
| 10 | Hafez selection → reveal | C/W/F | PASS — real corpus records render in §7.6 order; result heading focused; poem ID persisted | CDP walk + seeded results |
| 11 | Rumi selection → reveal | C | PASS (lapis keying verified in visual matrix baseline e2e; CDP walk exercised Rumi chooser) | e2e + CDP |
| 12 | Choose another poet (intention) | C | PASS — clears poet/poem state, chooser with both cards | CDP |
| 13 | Choose another poet (result) | C | PASS — same; then browser **Back restores the in-memory result** with focus on result heading | CDP: `afterBrowserBack` |
| 14 | Reveal another | C | PASS (baseline e2e + CDP repeated draws; no-repeat bag persists) | e2e/CDP |
| 15 | Browser Back/Forward | C | PASS — Back: result→ (via visible-back entry) …; Forward returns to chooser with focus on the previously chosen poet card; durable stages only | CDP `afterForward` |
| 16 | Refresh at each major scene | C | PASS — welcome/chooser/intention/result restore per §5.3 (seeded-restore matrix incl. direct result restore) | CDP reloads |
| 17 | Context pages ×5 | C | PASS — one h1 each, return link, production credits derived from verified release (2 editions, 3 translations), release facts (ID/date/checksum), no fixture note | CDP walk |
| 18 | Share / copy / download fallbacks | C/W/F | PASS — Chromium headless (no share, clipboard denied): honest "Sharing is unavailable right now" + verse retained; WebKit: `navigator.share` → "Verse shared."; Firefox (no `share`): clipboard fallback → "Verse text copied to your clipboard."; **Download verse card produced a real `.svg` download in all three engines** (F-SHARE-1 falsified — synchronous revoke works in C/W/F; residual real-Safari risk noted) | matrix-results.json |
| 19 | Unsupported/restricted API paths | C/W/F | PASS — capability probes: rVFC present in all 3 (incl. Firefox 132+ per research); Save-Data absent in W/F handled; headless-clipboard denial handled; unknown deep path replaced with `/` at release-ready | probes |
| 20 | Long-content records + orientation/viewport | C/W/F | PASS — worst-case `hafez-ghazal-043-clarke` (206-char parenthetical line) + 555-char-disclosure record wrap without horizontal overflow at all 10 viewports ×3 engines; 844×390 landscape scrolls normally; 320px: spine-bar padding 32px keeps text clear, all action buttons ≥44px | matrix-results.json + rect probes |

## Content edge cases (§5.10, programmatic over all 120 records)

- 60 Hafez + 60 Rumi exactly; every record 1–2 English + 1–2 Persian lines; longest EN line 206 chars (`hafez-ghazal-043-clarke`), longest FA line 61 chars; **0 records carry a reflection** (machine authority fabricates none — the §7.6 reflection block is therefore absent product-wide; frontend renders `null` correctly and skips the section; recorded as documented content-scope deviation, not a frontend defect); 107 records carry disclosures (max 555 chars — renders as "Source note" section, verified); 33 records contain ZWNJ (shaping verified rendered); 0 mixed-script poem lines; 0 audio records (audio sections never render in production).
- Bidi: work title parentheses stay in LTR flow with only the Persian title inside `<bdi lang="fa" dir="rtl">`; opening hemistich dd renders RTL; 3+ bdi per result.

## Rendered defects found (carried to Phase 7)

1. **F-TYPO-1 (Medium, CONFIRMED, all 3 engines):** the Persian heading `متن فارسی` (`#persian-heading`) computes `font-family: "DIVAN Cormorant Garamond", Georgia, serif` — `.poem-result h2` (0,1,1) beats `[lang='fa']` (0,1,0). The heading renders via a per-glyph system Arabic fallback (visible in WebKit capture), off the curated Persian stack; design §8.1 requires Persian text on Vazirmatn/Nastaliq. Repair must also set an adequate line-height (Cormorant's 1.1 would clip Nastaliq).
2. **F-CIN-2 (Low, CONFIRMED in Chromium a11y tree):** decorative CSS `::before` glyphs enter accessible names — Begin/"Reveal another" announce as "✦ Begin"/"✦ Reveal another"; FlowBackButton announces "← Choose another poet". Repair: CSS alternative-text syntax (`content: '✦' / ''`) or markup-level aria-hidden glyph.
3. **F-SW-1 (High, CONFIRMED in Chromium):** deleting the release cache while keeping the pointer cache (storage-pressure eviction model), then reloading ONLINE, yields a permanently broken app: navigation HTML loads but `assets/*.js`, `assets/*.css`, fonts return **504 from the SW** with no network fallback and no self-healing (staging only runs at SW install). Violates §16.4 "hashed assets: cache first". Repro: `caches.delete('divan-release-v2:<id>')` → reload → root shows raw noscript text, 3×504.
4. **F-CIN-1 (Medium, PARTIALLY CONFIRMED):** WebKit cold-start sometimes never presents the first video frame within the 4s gate (matrix run demoted to poster; later probe promoted at ~1s — flaky). Fallback engages correctly (never trapped; Begin enters ≤~4s worst case). Project skill divan-cinematic-threshold mandates a user-gesture prime; probe shows muted `play()`→`pause()` presents reliably in WebKit. Real-Safari/iOS behaviour unverifiable here (residual risk regardless of repair).

## Observations (not defects)

- O-1: production corpus has no reflections and no audio — reflection/audio sections absent by content decision; frontend correct.
- O-2: welcome corner-star motif strokes pass behind headline glyphs at phone widths — legible (thin 1px strokes, high text contrast); consistent with locked direction; prior audit accepted; no action.
- O-3: WebKit warns the preloaded Cormorant woff2 was "not used within a few seconds" on poster-route loads — spurious credential-mode heuristics; font is used by h1; no CLS observed. Info only.
- O-4: CDP screenshot capture times out on scenes with infinite ambient animations (tooling limitation; Playwright screenshots unaffected).
- O-5: `navigator.onLine` under CDP throttling stays true — offline evidence routed through Playwright's `context.setOffline` (e2e) instead.

## Performance (lab, emulated)

- Chromium trace (390×844, 4× CPU, Fast 4G): **CLS 0.00**; LCP entry ~100ms on localhost (unthrottled network path to loopback; not a field claim). Baseline cinematic report: LCP 1396ms / CLS 0.00 under same profile — consistent. INP not lab-measurable (research §1); interaction handlers are plain button activations; no long tasks observed in trace.
- No remote requests in any walk; all assets same-origin (verified in visual e2e + CDP network).
