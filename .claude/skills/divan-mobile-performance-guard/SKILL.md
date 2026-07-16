---
name: divan-mobile-performance-guard
description: Enforce DIVAN's mobile-first loading, rendering, media, caching, service-worker, and JavaScript budgets whenever adding images, video, fonts, effects, or animation logic.
---

# DIVAN Mobile Performance Guard

Load `references/budgets.json`. Treat the numeric ceilings as project release gates unless repository measurements prove a stricter existing budget.

## Rules

- First meaningful screen never waits for cinematic video.
- Poster and app shell arrive first.
- Cinematic assets lazy-load after intent, proximity, or idle opportunity.
- No initial audio and no runtime third-party media dependency.
- Use dedicated mobile encodes.
- Prefer transform and opacity.
- No WebGL in this release.
- No continuous high-frequency particle simulation.
- Bundle fonts locally or use system fonts.
- Keep service-worker manifests coherent and versioned.
- Do not precache full desktop and mobile cinematic masters together.
- Revoke Blob object URLs when clips are replaced or components unmount.

## Measurements

Measure on a throttled mobile profile and a real iPhone-class device where available:

- initial compressed transfer;
- LCP, CLS, and INP;
- cinematic asset size and decode behaviour;
- scroll-scrub smoothness;
- memory after repeated draws;
- offline poster and core poem path;
- failed-video fallback.

## Release evidence

Report actual bytes and observed metrics. Do not claim performance from code inspection alone.
