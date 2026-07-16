# Visible navigation and cinematic Begin verification

Date: 2026-07-16 (Australia/Sydney)

## Scope

This branch repairs two frontend flow defects without changing poetry, corpus selection, source evidence, release compilation, service-worker behaviour, deployment, or the 60 Hafez / 60 Rumi expansion work.

## Root causes

1. The welcome `Begin` button called the app's `BEGIN` transition directly. That unmounted the cinematic threshold before scroll could scrub the entrance clip.
2. Browser Back/Forward state existed, but the intention and result interfaces exposed no visible in-app control for returning to the Hafez/Rumi selection cards.

## Changes

- `Begin` is now owned by `CinematicThreshold` through `data-cinematic-begin`.
- On a full-motion, online, scrollable route, Begin requests a smooth traversal to the end of the 260vh corridor. Existing scroll events continue to drive frame seeking and arrival.
- If motion is reduced, Save-Data/offline disables video, video decoding fails, the first-frame timeout expires, or the corridor cannot scroll, Begin enters directly rather than trapping the visitor.
- Added a reusable `Choose another poet` control to both the intention and result screens.
- The control clears stale selected-poet/current-poem session values and sends a validated `choose_poet` PopStateEvent through the existing app history handler. It does not depend on a hard-coded browser-history depth.
- Added night-surface and paper-surface styles, including forced-colours support.

## Regression coverage

- `tests/components/cinematicBegin.test.tsx`
  - full-motion Begin requests `{ behavior: 'smooth', block: 'end' }` and does not arrive immediately;
  - reduced-motion Begin enters directly.
- `tests/components/cinematicThreshold.test.tsx`
  - existing poster, frame-gate, skip, failure, timeout and natural-scroll contracts remain covered;
  - the video-error fallback now proves Begin remains usable.
- `tests/components/poetSelectionNavigation.test.tsx`
  - intention and result controls emit deterministic chooser state and clear stale session values;
  - a full App walk proves Welcome → Rumi → intention → Choose another poet returns both Hafez and Rumi cards.

## Verification performed here

- Compared branch against `main`: only cinematic/navigation components, their focused CSS, tests and this report changed.
- TypeScript `transpileModule` syntax check passed for the new cinematic controller, navigation helper and reusable back component under ES2022/ESNext/react-jsx settings.
- GitHub reports no configured commit-status checks for the branch.

## Verification limitation

This ChatGPT execution environment cannot resolve GitHub from its shell, so it could not clone the repository or execute `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, Playwright, or the production build. No claim is made that those commands ran. Before merge, run the repository's normal fresh verification from a real checkout.

## Merge acceptance

From Node 22.16.x and pnpm 10.33.0, require at minimum:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:components
pnpm test:a11y
pnpm test:e2e
pnpm build:production
pnpm verify:dist
pnpm verify:privacy
```

Then manually verify on a phone-sized viewport:

1. Begin visibly auto-scrolls through the cinematic rather than teleporting to poet selection.
2. Manual scrolling still scrubs the same animation.
3. Skip entrance still works immediately.
4. Reduced motion enters without animation.
5. Selecting Rumi or Hafez exposes `Choose another poet` on the intention card.
6. The same control is visible on the poem result and returns to both poet cards.
