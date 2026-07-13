# DIVAN — Final Security & Privacy Review

**Reviewer role:** final-security-privacy-reviewer (post-remediation, read-only)
**Branch:** `feat/ui-ux-gauntlet-r1` reviewed against `main`
**Date:** 2026-07-14
**Live fixture:** http://127.0.0.1:4173 (existing preview; not restarted)

## Verdict

**PASS — zero unresolved Blocker / Critical / High findings.**

Blockers: 0 · Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Informational: 2

The change set (7 commits, 24 files, +858/-64) is UI/UX/PWA hardening. It introduces
no network egress, no new storage keys, no cookies, no fingerprinting, no raw-HTML
rendering, and no launch-gate weakening. All hard invariants hold at rest and at runtime.

---

## 1. External-request inventory (runtime)

Full flow walked headless (Chromium 1.61.1) for **both poets** and **all five context
pages** (`/about`, `/privacy`, `/accessibility`, `/credits`, `/offline`), including the
Save-verse and Download-verse-card actions.

| Metric                                             | Result                     |
| -------------------------------------------------- | -------------------------- |
| Total requests observed                            | 72                         |
| Unique hosts                                       | `127.0.0.1:4173` only      |
| External hosts (non-loopback, non-`data:`/`blob:`) | **0**                      |
| `Set-Cookie` response headers                      | **0**                      |
| Requests fired during Save/Download actions        | **0** (per-poet delta = 0) |
| Console errors                                     | 0                          |

No CDN, font host, analytics, pixel, or beacon request occurred at any step.

## 2. Cookie & storage inventory (runtime)

- `document.cookie` was empty (`""`) at every snapshot; no `Set-Cookie` seen.
- `sessionStorage` keys observed across the flow: `divan.releaseId`,
  `divan.selectedPoet`, `divan.currentPoemId`, `divan.shuffle.hafez` — all within the
  permitted set (`divan.releaseId` / `selectedPoet` / `shuffle.*` / `currentPoemId`).
- `localStorage` remained empty (the sole permitted key `divan.motionPreference` is
  written only when the visitor toggles the motion control, which this walk did not
  trigger; no other key ever appears).
- Fingerprinting probes instrumented via `addInitScript` (canvas `toDataURL`/`toBlob`,
  `getContext('webgl')`, `measureText`, `navigator.getBattery`): **0 calls**.

## 3. Diff findings

No security or privacy defects found. Detail per changed surface:

- **`scripts/build.ts` — `injectFontPreloadLinks`:** Preload hrefs are built only from a
  hardcoded stem allow-list (`inter-latin-400-normal`, `cormorant-garamond-latin-500-normal`,
  `vazirmatn-arabic-400-normal`) matched against emitted asset names by the strict pattern
  `^assets/<stem>-[a-f0-9]{16}\.woff2$`. No attacker-influenced string reaches the link;
  all hrefs are root-relative local paths. `crossorigin` is correctly present (font fetches
  are always CORS-mode, so the preload must match). A `>1` match throws rather than emitting
  ambiguous preloads. No injection vector. Confirmed in `dist/index.html`: three local
  `<link rel="preload" as="font" type="font/woff2" crossorigin>` entries, no remote refs.

- **`src/lib/share/shareCard.ts` — SVG generation:** Every dynamic value (English line,
  Persian line, poet, reference, translation credit, society, URL) passes through
  `escapeXml`, which escapes `& < > " '` in correct order (`&` first). All land in
  `<text>` element content; the only attribute-position dynamic values (`accentColor`,
  `attributionColor`) are chosen by a closed ternary on `item.display.accent`, not text.
  This holds for the production path too: real Persian verse and credit strings flow
  through the same escaper. No unescaped interpolation, no breakout into markup/attributes.
  The SVG is consumed as a local `Blob` (`image/svg+xml`) with `createObjectURL` /
  `revokeObjectURL` — no network, and the URL is revoked in a `finally`.

- **`src/app/App.tsx` — `history.replaceState`:** Only ever called with the literal `'/'`
  (unknown deep paths normalise to the welcome scene). No open-redirect surface; wrapped in
  try/catch and treated as cosmetic. New `offline_ready` dispatch on offline reload carries
  a static string. New effect dependency (`dispatch`) is benign.

- **`src/scenes/RevealScene.tsx`:** New global `keydown` listener mirrors the visible Skip
  control (`event.key === 'Escape' → onSkip()`); handler carries no visitor data and is
  cleaned up on unmount. No PII, no persistence.

- **`src/components/PoemResult.tsx`:** New "Return to the stall" disclosure toggles local
  React state and reveals static copy; no location/identifier leakage. Audio element now
  gated behind `audioUnavailable` (no behavioural privacy change). The `/about` anchor is a
  same-origin relative path.

- **`index.html`:** `viewport-fit=cover` added; description reworded ("local" → "bilingual").
  Benign.

- **`public/offline.html` / `dist/offline.html`:** Still script-free, no inline styles, no
  remote references; added a same-origin `/credits` link and clarifying copy only.

- **`src/components/SourceCredit.tsx`, `src/pages/*`, `src/scenes/ChoosePoetScene.tsx`,
  CSS:** Copy/markup/style-only; `bdi lang/dir` retained for bidirectional Persian.

## 4. CSP compatibility (dist)

- `dist/index.html`: exactly one `<script>` — an external local `type="module" crossorigin
src="/assets/…js"`. No inline script content, no inline `style=` attributes.
- Preload links are all local (`/assets/…woff2`).
- `dist` JS scanned for `eval(` / `new Function(` — none found.
- Compatible with a strict `script-src 'self'` / `style-src 'self'` policy.

## 5. Verifier outputs

- `pnpm verify:privacy` → **PASS**: "no cookies, analytics/ad/social/tracker hosts,
  tag/pixel calls, fingerprinting, or geolocation in source or dist; storage is
  session/local-preference only."
- `pnpm verify:dist` → **PASS**: "Verified fixture release test-only-fixture-release
  (40 items)."
- `pnpm audit --prod` → **PASS**: "No known vulnerabilities found."

## 6. Launch gates (confirmed still fail-closed)

- `pnpm build:production` → exit 1: "Production build blocked: no approved production
  corpus exists in content-private." (Font-preload change does not touch the production gate.)
- `pnpm verify:qr` → exit 1: "QR verification BLOCKED: … pending Phase-7 deliverable …
  require the final approved short URL (launch gate §31.2). Not satisfied."
- No fabricated corpus, rights, approvals, University/Society branding, or config in the diff.

## 7. Logs, secrets, isolation

- Diff scan for `console.*` additions: **none**.
- Diff scan for `eoi` / `ballot` / `.env` / `secret` / `password` / `token` / `apikey`:
  **none** — EOI/ballot code remains untouched and isolated.
- No credentials, tunnel creds, or `content-private/` material entered the change set.

## Informational (non-blocking)

- **INFO-1:** In `dist/index.html` the three injected preload `<link>` lines have slightly
  inconsistent leading indentation (first line more indented than the following two). Purely
  cosmetic; no functional or security impact.
- **INFO-2:** `localStorage` (`divan.motionPreference`) was not exercised in this walk
  because the motion control was not toggled. Its write path is unchanged by this branch and
  remains the single permitted local key; noted only for inventory completeness.
