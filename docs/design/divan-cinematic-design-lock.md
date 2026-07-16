# DIVAN Cinematic Enhancement — Design Lock (Phase 2)

Locked 2026-07-16. Changes to this document after Phase 3 asset generation require a recorded
ledger entry. Art direction authority: `.claude/skills/divan-brand-art-direction` and
`.claude/skills/divan-cinematic-threshold/references/shot-contract.md`.

## 1. Palette mapping — zero new colour tokens

The repository palette already encodes the illuminated-miniature direction. The pack's
directional tokens map onto existing `tokens.css` custom properties; no new colour token is
introduced (the visual-budget colour-once lock stays untouched):

| Pack intent      | Repository token                  |
| ---------------- | --------------------------------- |
| Lapis night      | `--ink-night` #0b1026             |
| Deep lapis       | `--ink-deep` #11182d / `--lapis`  |
| Manuscript gold  | `--gold` #d4a64a                  |
| Quiet gold       | `--gold-light` #e7c777 (accents)  |
| Pomegranate      | `--pomegranate` #a6192e           |
| Warm parchment   | `--parchment` #f2e6cf             |
| Aged parchment   | `--paper` #fff9ee (paper surface) |
| Charcoal ink     | `--charcoal` #2e302e              |
| Brass light      | `--gold` + opacity layering       |
| Cypress          | `--cypress` #204f40               |

Generation prompts reference these hex values so the stills agree with the live UI.

## 2. Shot board

### Beat A — garden threshold (poster)

- Twilight Persian garden seen through one illuminated geometric arch.
- Cypress silhouettes flanking; restrained pomegranate branches at the edges;
  distant warm lantern glow on the camera axis; one small golden butterfly mid-air.
- Central camera corridor kept calm and empty — this is the scroll path.
- **9:16**: arch fills the middle 70% of width; corridor occupies the centre;
  bottom 25% quiet (entry UI overlays here). **16:9**: arch centred, garden breathes
  laterally; bottom 20% quiet.
- No people, text, glyphs, logos, signage.

### Beat B — reading alcove (final frame / book stage backdrop)

- Intimate candlelit alcove. A **closed Divan centred on a low table**, brass candleholder
  to the book's right (light from the right), parchment tones, subtle geometric tile
  detail behind, soft falloff to lapis darkness.
- **Reading-safe zone**: the middle 60% (9:16) / centre 50% (16:9) directly over the book
  stays free of high-frequency detail — the live book, then the opened poem, renders here.
- The composition must be reconstructable as the live BookStage: flat front-facing table,
  book aligned to centre, single warm key light from the right.
- Same palette, materials, perspective grammar, and light direction as Beat A.

### Motion (threshold clip)

One continuous forward glide: slow zoom along the garden corridor toward the arch
(Beat A), a soft dissolve as the arch threshold is crossed, settling on the alcove
composition which comes fully to rest in the final second. Duration 7–8 s master.
**The final frame is byte-identical to the alcove still** (frame-lock by construction).

## 3. Asset roles, filenames, budgets

| Role              | Path (dist)                       | Source                        | Budget    | Offline |
| ----------------- | --------------------------------- | ----------------------------- | --------- | ------- |
| poster-mobile     | `images/divan-poster-mobile.webp` | garden 9:16 still             | ≤ 220 KiB | yes     |
| poster-desktop    | `images/divan-poster-desktop.webp`| garden 16:9 still             | ≤ 320 KiB | yes     |
| decorative        | `images/divan-alcove-mobile.webp` | alcove 9:16 still             | ≤ 600 KiB | yes     |
| decorative        | `images/divan-alcove-desktop.webp`| alcove 16:9 still             | (shared)  | yes     |
| cinematic-mobile  | `video/divan-cinematic-mobile.mp4`| ffmpeg glide, 9:16 ≈ 720×1560 | ≤ 3 MiB   | **no**  |
| cinematic-desktop | `video/divan-cinematic-desktop.mp4`| ffmpeg glide, 16:9 1280×720  | ≤ 6 MiB   | **no**  |

- Raw masters (PNG stills, generation records) stay outside `public/` under a git-ignored
  evidence path; only derivatives ship.
- Encodes: H.264 high, `yuv420p`, `+faststart`, no audio stream, GOP ≤ 30 (seek-friendly),
  CRF tuned to fit budget.
- Both video variants are never precached; the service worker passes `/video/` through to
  the network. Posters + alcove backdrops are precached — they are the offline guarantee.

## 4. Generation plan (10 credits total)

1. **Exploration**: `z_image` (0.15 cr/frame) to test composition/safe zones — up to 4 frames.
2. **Finals**: `gpt_image_2`, 1k, quality medium (2 cr each) — garden 9:16, garden 16:9,
   alcove 9:16, alcove 16:9. Spend ≈ 8.6 cr, reserve ≈ 1.4 cr.
3. Prompts: shared style preamble from
   `.claude/skills/divan-asset-pipeline-higgsfield/references/prompts.md` byte-for-byte,
   plus per-shot lines from §2 and hex anchors from §1. Negative constraints appended.
4. **Upgrade path (external gate — credits)**: `seedance_2_0` with
   `image_references=[garden still]`, `end_image=alcove still`, `generate_audio=false`,
   native 9:16 and 16:9 — replaces the ffmpeg glide without changing any contract,
   because the final frame remains the alcove still.

## 5. Component and state naming (repository-native)

| Pack name              | Repository implementation                                     |
| ---------------------- | ------------------------------------------------------------- |
| CinematicThreshold     | `src/components/CinematicThreshold.tsx` (inside WelcomeScene) |
| CinematicPoster        | poster `<img>` layer within CinematicThreshold                 |
| ScrollScrubController  | `src/lib/cinematic/scrollScrub.ts` (pure logic + hook)         |
| CinematicSkip          | "Skip entrance" button (semantic, first in DOM after skip link)|
| ThresholdHandoff       | crossfade contract in CinematicThreshold + BookStage backdrop  |
| BookStage/BookCover/…  | `src/components/BookStage.tsx` layered upgrade of RevealScene reveal object |
| CandleScene            | `src/components/CandleScene.tsx` (CSS/SVG)                     |
| ButterflyField         | `src/components/ButterflyField.tsx` (max 2, deterministic)     |
| PoetryMotes            | `src/components/PoetryMotes.tsx` (abstract only)               |
| MediaCapabilityProfile | `src/lib/cinematic/capability.ts`                              |
| MotionPreferences      | existing MotionControl + resolveEffectiveMotion (unchanged)    |

State: the app reducer stages remain authoritative
(`boot → welcome → choose_poet → intention → revealing → result`). The threshold owns a
local, testable state machine `posterReady → cinematicPlaying → arrived` with capability
inputs `motion: full|reduced`, `media: mobile|desktop|posterOnly`, `network: online|offline`,
`cinematic: available|unavailable|failed`, `dataSaving: normal|saveData`; every combination
reaches `arrived` (and therefore the poem). Book opening maps onto `revealing`
(`opening → settling`) and `result` (`poemVisible`).

## 6. Timing contract

- Threshold master 7–8 s; scroll-scrubbed, immediately skippable; timeout fallback 4 s
  to poster-dissolve if no first frame is presented.
- Book opening 1.6–2.2 s target, 2.4 s hard max, cover leads; poem enters after layout
  stability. Reduced motion: 120–180 ms crossfade to the open-book state.
- Butterfly entrance settles ≤ 6 s; no orbiting loops during reading.
