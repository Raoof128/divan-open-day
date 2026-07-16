---
name: divan-atmosphere-effects
description: Implement or audit restrained candlelight, butterflies, manuscript motes, and poetic ambience without obscuring text, creating fake Persian, harming accessibility, or exceeding mobile budgets.
---

# DIVAN Atmosphere Effects

## Candle

Compose the effect from:

- a static or generated candle body;
- a lightweight CSS or SVG flame;
- a broad radial glow;
- restrained reflected warmth on nearby surfaces.

The flame must not flash, pulse aggressively, or trigger continuous expensive layout work. Pause or greatly simplify it when the page is hidden.

## Butterflies

- Maximum two visible.
- One golden butterfly may support the threshold and settle near the book.
- One lapis butterfly may appear once after reveal.
- Never cross or cover poem text, controls, attribution, or focus indicators.
- No swarm and no endless orbit.
- Prefer SVG, CSS, Web Animations API, or a small sprite over transparent looping video.

## Poetic motes

Use abstract ink curves, paper fibres, dust, and tiny gold specks. Never fabricate Persian words, random glyphs, or sacred/cultural text as decoration.

## Layer discipline

- Decorative elements are `aria-hidden="true"` and cannot receive focus.
- Effects remain below controls and outside the reading safe zone.
- Pointer events are disabled unless an effect is intentionally interactive.
- Effects must not change poem selection or application state.

## Adaptation

- Full restrained effect set only on capable devices.
- Reduce particle count and path complexity on mobile.
- Disable nonessential effects under reduced motion, reduced data, low-power heuristics, or poor measured frame rate.
- Static beauty is preferable to janky movement.
