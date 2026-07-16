# Visible navigation and cinematic Begin verification

Date: 2026-07-16 (Australia/Sydney)

## Verdict and scope

PR #5 passes the requested local review. It adds a visible `Choose another poet`
control to the intention and result screens, routes `Begin` through the existing
scroll-scrub corridor, and preserves direct entry for poster-only/failure paths.

The branch was merged normally with `origin/main` at
`9bdb860bdb452f7befab59021881a443856e1eff`, so it carries the separate final
60-Hafez / 60-Rumi baseline without rebasing, rewriting, or editing that work.
The diff from current `main` contains only cinematic/navigation components,
focused CSS, their tests, and this verification record. Poetry, corpus records,
source evidence, translations, release compilation, service-worker behaviour,
deployment, and production-selection logic are unchanged by PR #5.

Verified implementation SHA:
`a079e722f0d3ecdb643c8204d7c3272e14ad4616`.

## Implementation review

- `Begin` is captured by `CinematicThreshold`, which requests
  `scrollIntoView({ behavior: 'smooth', block: 'end' })`; natural and automatic
  scroll events use the same seek coalescer and `video.currentTime` path.
- Arrival requests the terminal `duration - 0.05` frame, waits for `seeked`, and
  crosses two animation-frame boundaries before advancing. A bounded one-second
  fallback prevents a terminal seek from trapping entry.
- The four-second first-frame timer now remains armed until a requested frame is
  actually presented. `loadeddata` alone can no longer disable the timeout.
- Reduced motion, Save-Data, offline, video error, first-frame timeout,
  non-scrollable layout, and a rejected `scrollIntoView` enter directly.
- Manual scrolling and the existing `Skip entrance` control remain active.
- Both visible back controls clear `divan.selectedPoet` and
  `divan.currentPoemId`, push a validated release-bound `choose_poet` history
  state, and use the existing `popstate` handler. Back can restore the in-memory
  result during the same visit, while Forward returns to the chooser; no poem ID
  is added to URL or browser history.

## Exact automated commands and results

Node 22.16.0 and pnpm 10.33.0 were used.

| Command                 | Result                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `pnpm format:check`     | Initial FAIL on the two PR files reported by CI; PASS after formatting only those files |
| `pnpm lint`             | PASS, zero warnings/errors                                                              |
| `pnpm typecheck`        | PASS                                                                                    |
| `pnpm test:components`  | PASS, 80/80 tests in 11 files                                                           |
| `pnpm test:a11y`        | PASS, 24/24 tests in 2 files                                                            |
| `pnpm test:e2e`         | PASS, 5/5 Chromium tests                                                                |
| `pnpm build:production` | PASS, production release `pr-5-visible-navigation`, 120 items                           |
| `pnpm verify:dist`      | PASS, 120 items; archival/private bundle leak check passed                              |
| `pnpm verify:privacy`   | PASS, no cookies, trackers, fingerprinting, geolocation, or disallowed storage          |

The production command used these explicit non-secret values before invoking the
exact `pnpm build:production` command:

```bash
export DIVAN_PUBLIC_ORIGIN=https://approved-origin.example
export DIVAN_RELEASE_ID=pr-5-visible-navigation
export DIVAN_MIN_HAFEZ_COUNT=60
export DIVAN_MIN_RUMI_COUNT=60
export DIVAN_BRANDING_MODE=society_only
export SOURCE_DATE_EPOCH=1784167200
pnpm build:production
```

Focused TDD evidence also passed 11/11 tests after first reproducing three
failures: a stalled `requestVideoFrameCallback`, premature terminal-frame
unmount, and a throwing programmatic-scroll API.

## Phone-sized browser walk

Chromium was exercised at 390 by 844 CSS pixels against the built production
release.

- Welcome → Begin produced 27 progressive scroll samples. `scrollY` advanced
  from 0 to 1,369 while `video.currentTime` advanced from 0 to 7.95 seconds;
  the threshold stayed `playing` until the terminal frame, then the poet cards
  appeared. Begin did not skip the corridor.
- A manual 600-pixel wheel scroll kept the welcome scene active and scrubbed the
  video to 3.111 seconds. `Skip entrance` then reached poet selection.
- Rumi → `Choose another poet` returned both cards. Hafez → reveal produced a
  real poem result, whose `Choose another poet` control also returned both cards.
- Browser Back restored the Hafez result; browser Forward restored both poet
  cards.
- Selecting Reduced removed the video and Begin entered directly.
- Dispatching a real video `error` event produced poster state with no video;
  Begin entered directly.
- Save-Data and offline capability sessions each produced poster state with no
  video and entered directly.
- The first-frame timeout and non-scrollable/rejected-scroll routes are pinned
  by passing component regressions and cannot wait indefinitely.

## Limitations

- The manual viewport evidence is Chromium emulation on macOS, not a physical
  iOS/Android phone or the separate cross-browser/assistive-technology launch
  matrix.
- Save-Data and offline were injected as browser capability values; the existing
  Playwright offline lifecycle test separately passed its real network-outage
  flow.
- GitHub's prior Quality gate also called `pnpm audit --prod`; npm has retired
  both configured audit endpoints and returned HTTP 410. That external condition
  is unrelated to PR #5 and no security/test gate was weakened to hide it.
- A commit cannot contain its own SHA. This record therefore names the exact
  verified implementation commit; the final documentation commit is reported in
  the PR and handoff after it is created.
