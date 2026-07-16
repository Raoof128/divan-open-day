---
name: divan-book-motion-system
description: Build or audit DIVAN's premium layered book-opening animation, physical page behaviour, poem reveal timing, redraw transition, interruption handling, and reduced-motion equivalent.
---

# DIVAN Book Motion System

## Layer model

Use independent layers for:

- stage and perspective context;
- book base and spine;
- front cover;
- page block;
- two or three trailing leaves;
- dynamic contact and page shadows;
- illuminated border;
- live poem content.

Do not animate the entire book as one flat rectangle.

## State machine

`idle -> ready -> opening -> settling -> poemVisible -> redrawing -> ready`

Every transition must be interruptible without leaving stale classes, invisible controls, or overlapping timers.

## Motion character

- The cover leads with weighted acceleration and deceleration.
- The page block compresses subtly near the spine.
- Trailing leaves follow with small stagger, not a fan explosion.
- Shadows evolve with geometry.
- Illumination appears only as the physical motion settles.
- Poem text enters after layout is stable.
- Controls never move unexpectedly beneath the pointer.

## Implementation rules

- Animate transform and opacity where practical.
- Avoid layout reads and writes in the same animation frame.
- Keep text live and selectable.
- Use a single state owner for book and reveal transitions.
- Cancel outstanding animations when redrawing, navigating, hiding the tab, or unmounting.
- Prevent double activation and race conditions.
- Preserve focus through state changes and move focus only when it improves understanding.

## Reduced motion

Replace the page turn with a brief, low-distance or zero-distance dissolve. Keep the same information order and focus behaviour.

## Tests

Cover:

- legal transition order;
- repeated rapid activation;
- cancellation and unmount;
- reduced-motion branch;
- focus and live-region behaviour;
- stable English-first, Persian-second rendering;
- no animation on initial server/static render.
