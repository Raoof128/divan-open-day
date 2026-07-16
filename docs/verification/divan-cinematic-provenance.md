# DIVAN Cinematic Assets — Provenance Record

Generated 2026-07-16 (Australia/Sydney) by the cinematic task. Raw masters and full API
responses are retained locally under git-ignored `docs/evidence/runtime/cinematic-masters/`
(regenerable evidence; never shipped). Hashes of released derivatives live in
`docs/verification/divan-cinematic-assets.json`.

## Stills — OpenAI Images API

- Model: `gpt-image-2` (`POST https://api.openai.com/v1/images/generations`), 2026-07-16.
- Account: Raouf's OpenAI account (token supplied privately via git-ignored `.env`; never logged
  or committed).
- Jobs: 2 drafts (`quality: low`, 1088×1936) for composition validation, then 4 finals
  (`quality: high`): garden 1088×1936 and 1936×1088, alcove 1088×1936 and 1936×1088.
- Prompts: full text recorded below (§ Prompt lineage); shared style preamble from the
  project asset-pipeline skill, byte-for-byte, plus shot lines from the design lock.
- Human/lead selection: all four finals inspected frame-by-frame against the shot contract
  (arch composition, quiet lower zone, plain lapis book cover, brass candle to the right,
  light from the right, single golden butterfly, no text/glyphs) and approved 2026-07-16.

## Motion — Gemini API

- Model: `gemini-omni-flash-preview`
  (`POST https://generativelanguage.googleapis.com/v1beta/interactions`), 2026-07-16.
- Account: Raouf's Gemini API account (token via the same git-ignored `.env`).
- Inputs per clip: the two approved finals for that aspect ratio (garden as opening frame,
  alcove as settling target) plus the motion prompt (§ Prompt lineage).
- Interactions (ids recorded in the evidence JSONs):
  - 9:16 → 720×1280, 8.0 s, 24 fps (usage: 4,268 input tokens, 47,435 output tokens).
  - 16:9 → 1280×720, 7.0 s, 24 fps.
- Masters carried an AAC audio track; audio is stripped from all released derivatives.

## Released derivatives (ffmpeg 8, libx264 / cwebp)

| Role              | File                                 | Treatment                                                    |
| ----------------- | ------------------------------------ | ------------------------------------------------------------ |
| poster-mobile     | `public/images/divan-poster-mobile.webp`  | first decoded frame of the 9:16 master, webp q82        |
| poster-desktop    | `public/images/divan-poster-desktop.webp` | first decoded frame of the 16:9 master, webp q82         |
| backdrop-mobile   | `public/images/divan-alcove-mobile.webp`  | **actual final rendered frame** of the 9:16 master, webp q82 |
| backdrop-desktop  | `public/images/divan-alcove-desktop.webp` | **actual final rendered frame** of the 16:9 master, webp q82 |
| cinematic-mobile  | `public/video/divan-cinematic-mobile.mp4`  | `-an -c:v libx264 -profile high -pix_fmt yuv420p -crf 22 -preset slow -g 24 -keyint_min 24 -sc_threshold 0 -movflags +faststart` |
| cinematic-desktop | `public/video/divan-cinematic-desktop.mp4` | same at `-crf 21`                                        |

## Handoff verification (measured)

The BookStage backdrop is the extracted final rendered frame itself, so the video-to-live
transition compares like with like. SSIM between each released clip's final decoded frame and
its released backdrop webp (ffmpeg ssim filter, 2026-07-16):

- mobile: All 0.9662 (Y 0.9564) — codec noise only, no composition difference.
- desktop: All 0.9832 (Y 0.9811) — codec noise only, no composition difference.

Poster seam: posters are the clips' first decoded frames, so the poster-to-video transition
is exact by construction.

## Rights and terms (factual, no overclaim)

- Stills: generated under OpenAI's Terms of Use / Service Terms as of 2026-07-16; OpenAI's
  terms assign the output to the user to the extent permitted by law. Not registered,
  not claimed as exclusive or universally rights-cleared.
- Video: generated under Google's Gemini API Additional Terms as of 2026-07-16. Same
  non-overclaim applies.
- No third-party source images, scans, or reference art were supplied to either model;
  inputs to the video model were the project's own generated stills.
- No real manuscript scans, no text, no calligraphy (verified visually per frame set).

## Prompt lineage

### Shared style preamble (stills, byte-for-byte from the project skill)

> Illuminated Persian miniature brought to life as a premium cinematic environment. Refined
> manuscript geometry, lapis twilight, restrained pomegranate accents, warm parchment, quiet
> manuscript gold, brass candlelight, elegant cypress forms, tactile paper and painted
> surfaces, layered depth, soft atmospheric perspective, museum-grade art direction,
> controlled visual density, culturally respectful ornament, no text, no letters, no numbers,
> no logos, no watermark, no pseudo-calligraphy.

### Garden shot line

> A tranquil Persian garden at twilight viewed through an illuminated geometric arch. Cypress
> silhouettes, restrained pomegranate branches, subtle tile detail, soft distant lantern
> warmth, a clear visual path drawing inward, central safe composition for mobile, empty
> reading-safe zones, calm and inviting rather than fantasy spectacle. Palette anchored to
> deep lapis night #0b1026 and #174a7e, manuscript gold #d4a64a, parchment #f2e6cf,
> pomegranate #a6192e, cypress green #204f40. The lower quarter of the frame stays quiet and
> uncluttered. No people, no portraits, no modern signage, no readable writing, no invented
> script, no floating objects, no butterflies swarm (at most one small golden butterfly), no
> fire hazards, no magical explosions, no neon colour, no generic Arabian palace imagery, no
> Ottoman motifs presented as Persian.

### Alcove shot line

> An intimate candlelit Persian reading alcove. A closed book with a plain deep-lapis leather
> cover rests exactly at the centre of a refined low wooden table, seen straight on from the
> front at a gentle downward angle. A single brass candleholder with one calm flame stands to
> the right of the book, casting warm light from the right. Warm parchment tones on the table
> surface, restrained geometric tile detail behind fading into deep lapis darkness, and one
> subtle golden butterfly near but not on the book. The middle of the frame directly over and
> above the book stays soft, dim and free of detail so live text can render there. The book
> cover is completely plain with no lettering, no emblem and no ornament in its centre.
> Palette anchored to deep lapis night #0b1026 and #174a7e, manuscript gold #d4a64a,
> parchment #f2e6cf, brass #d4a64a, charcoal ink #2e302e. Composition reproducible as a live
> web scene: flat front-facing table, book centred, single warm key light from the right. No
> people, no portraits, no modern signage, no readable writing, no invented script, no
> floating objects, no swarm of butterflies, no fire hazards, no magical explosions, no neon
> colour, no generic Arabian palace imagery, no Ottoman motifs presented as Persian.

### Motion prompt (video, both aspect ratios)

> Animate a single continuous slow cinematic camera move with no cuts, seven to eight seconds
> long. The first image is the exact opening frame: a twilight Persian garden seen through an
> illuminated geometric arch. Glide steadily forward along the empty central corridor,
> through the arch, with subtle parallax and a stable horizon, calm forward velocity, no
> camera shake. As the camera passes the arch the scene transitions gently into the
> candlelit reading alcove shown in the second image. During the final second the camera
> settles completely to rest on the exact composition of the second image: the closed
> deep-lapis book centred on the table, brass candleholder with one calm flame to the right
> of the book, warm light from the right, one small golden butterfly resting on the table
> left of the book, quiet dark lapis niche above the book. The last frame must match the
> second image's composition as closely as possible and be completely still, with no motion
> blur. Keep the illuminated Persian miniature painting style, palette and materials of both
> images throughout. No text, no letters, no logos, no watermark, no people, no new objects,
> no audio.

## Known observations (honest)

- The 9:16 clip shows a few additional small golden glints/butterflies mid-flight in the sky
  (baked media, distant and restrained). Judged within the "restrained butterfly detail"
  contract; recorded here for the reviewer. Live decorative butterflies remain capped at two.
- Omni Flash re-renders rather than pixel-copies its target frame, so the released backdrop
  is the extracted final frame (the contract's required approach), not the source alcove
  still. The source stills remain in evidence as generation inputs.
