---
name: divan-asset-pipeline-higgsfield
description: Operate DIVAN's Higgsfield image and video pipeline, including current-model discovery, cohesive prompts, generation, rendered-frame handoff, FFmpeg delivery encodes, manifests, provenance, and local-only source assets.
---

# DIVAN Higgsfield Asset Pipeline

## Prerequisites

- Official Higgsfield skills installed.
- Higgsfield CLI installed and authenticated by the user through the interactive login flow.
- Scroll World skill installed as a seam and scrub reference.
- `ffmpeg` and `ffprobe` available.

## Discovery before generation

1. Run the unfiltered model list.
2. Inspect the exact selected model schema.
3. Verify start-image, end-image, aspect ratio, duration, resolution, and sound parameters.
4. Use only parameters accepted by the live schema.
5. Record model/job type and generation parameters in the asset manifest.

Do not trust old command examples over the live CLI schema.

## Preferred roles

- Stills and key art: GPT Image 2 unless live discovery and project evidence support a better approved option.
- Camera motion: Seedance 2.0 when the current schema supports the required frame controls.
- Fallback: another frame-locking model only after schema verification.

## Required asset set

- released mobile and desktop initial posters;
- released mobile and desktop cinematic derivatives;
- private or evidence-only reading-alcove source stills and extracted final handoff frames;
- candle body or approved live-render reference when shipped;
- butterfly reference art when shipped;
- integrity manifest with released roles, paths, bytes, and SHA-256;
- verification/provenance report with dimensions, durations, provider/model/job, prompt version, selection, and source licence or attribution.

## Prompt rules

- Reuse the approved style preamble byte-for-byte.
- No text, letters, numbers, logos, pseudo-Persian, watermark, or signage.
- Keep focal objects in each format's safe centre.
- Preserve consistent perspective, palette, materials, light direction, and emotional tone.
- Never publish an asset solely because generation completed. Inspect it first.

## Frame handoff

- Extract actual rendered boundary frames with FFmpeg.
- Use the actual final rendered frame as the live-scene reconstruction reference.
- When chaining clips, feed the neighbouring rendered frame, not the original still.
- Compare composition and exposure before accepting a seam.

## Delivery rules

- Keep raw masters outside public output.
- Generate mobile and desktop derivatives.
- Strip audio unless explicitly approved and user-controlled.
- Use native resolution, H.264 compatibility, fast start, and a seek-friendly GOP determined by measured device behaviour.
- Include poster fallbacks.
- Verify public builds contain only intended derivatives.

Read `references/prompts.md` for the locked prompt foundation.
