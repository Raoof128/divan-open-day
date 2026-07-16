---
name: divan-cinematic-threshold
description: Design, implement, or audit DIVAN's lightweight two-scene QR entrance using generated media, poster-first loading, scroll or guided scrubbing, a seamless final-frame handoff, and a live interactive book scene.
---

# DIVAN Cinematic Threshold

## Product decision

Use a short threshold only:

1. Twilight Persian garden and illuminated arch.
2. Candlelit reading alcove with a closed Divan.
3. Seamless handoff into the live interactive book.

The main poem experience remains live React, HTML, CSS, and accessible controls. Do not convert the full website into a Scroll World.

## Interaction contract

- The useful first screen renders without waiting for video.
- The poster appears immediately.
- Media loads after intent, proximity, or idle opportunity.
- A visible Skip entrance control works from the first frame.
- Scroll may scrub media, but visitors must never become trapped in a long scroll corridor.
- The cinematic sequence is short enough to feel like a threshold, not a trailer.
- On media failure, continue directly into the live book without an error wall.

## Handoff contract

The final cinematic image and first live book state must agree on:

- camera position and focal length;
- book position, scale, and perspective;
- candle location and light direction;
- table and background geometry;
- palette and exposure;
- butterfly presence or absence.

Use the actual final rendered frame as the primary handoff reference. Compare it against a captured live-book frame. A small crossfade may hide codec noise, but it must not conceal a composition jump.

## Mobile-first rules

- Generate dedicated 9:16 and 16:9 masters.
- Keep the focal object in the mobile-safe centre.
- Use a lighter mobile encode and poster.
- Coalesce seeks rather than queueing `currentTime` writes.
- Keep the poster visible until the video paints a real frame.
- Prime muted inline video only after user interaction where the browser requires it.
- Ignore address-bar-only resize noise on mobile.

## Reduced motion and reduced data

- Under `prefers-reduced-motion: reduce`, do not load scrubbed video automatically.
- Use a short poster-to-live-scene dissolve with no camera motion.
- Respect `Save-Data` or a project-level low-data preference by defaulting to the poster path.
- No information may exist only inside the cinematic movement.

## Verification

Test forward and reverse scrubbing, slow scroll, fast flick, resize, background/foreground, failed media, offline revisit, reduced motion, and keyboard access.

Read `references/shot-contract.md` before generating or integrating media.
