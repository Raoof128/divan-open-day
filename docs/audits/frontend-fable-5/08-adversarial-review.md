# Fable 5 frontend audit — Phase 9 adversarial re-audit

Date: 2026-07-17 (Australia/Sydney). Four independent read-only reviewers, non-overlapping lenses, each instructed to REFUTE their assigned repair commit; the lead (Fable 5) personally evaluated every challenge and independently re-derived the load-bearing arguments (specificity arithmetic, activeCache() completeness invariant, play/pause race topology, blob lifecycle bounds) before accepting any verdict.

## Reviewer verdicts

| Lens | Commit under attack | Verdict | Attacks | Confirmed problems |
| --- | --- | --- | --- | --- |
| SW release coherence & offline correctness | `3930a47` | ACCEPT WITH NOTES | 6 | 0 |
| React/state + media semantics (cinematic prime) | `973b876` | ACCEPT | 5 | 0 |
| CSS cascade / typography / a11y | `ac9d164` | ACCEPT WITH NOTES | 5 | 0 |
| Privacy / resource lifecycle (share) | `1e01609` | ACCEPT | 5 | 0 |

All 21 attacks REFUTED. Key refutations (lead-verified):

- **No cross-release mixing:** `activeCache()` only ever returns a complete verified release; the fallback fires solely on a null/incomplete cache (where the navigation shell also comes from the live origin — coherent) or an exact-key miss on content-addressed paths (network returns identical-hash bytes or 404, never plausible-but-wrong bytes). No cache writes anywhere in the new branches — no poisoning surface.
- **The adjusted query-variant test is stronger, not weaker:** it now poisons the exact cache key and proves the response bytes come from the network — pinning the no-fuzzy-match invariant positively instead of via a fabricated 504.
- **Prime cannot leave the clip playing during scrub:** `playing` state is reachable only through `presented()`, which pauses first; the pause-while-play-pending AbortError is absorbed by the existing `.catch`; failure branches unmount the element. Gesture-gated muted play is explicitly sanctioned by the project cinematic skill and is outside the design's autoplay ban (which targets recitation audio).
- **fa-heading rule is property-disjoint from both colour-keying rules** (exact specificities: new rule (0,2,1) == lapis rule (0,2,1), later in source, but declares no colour); the only `[lang='fa']` h2 in the app is `#persian-heading`.
- **Deferred revoke respects §15.2:** URLs are bounded (click-rate × 1s), revoked exactly once, and the browser reclaims all Blob URLs at document unload regardless; no fake-timer bleed into other suites (all callers inject or mock).

## Accepted follow-ups (applied in `dff4075`)

1. `redirect: 'error'` on the asset network fallback — parity with every other release network path (SW reviewer note 2). Pinned in the fallback regression test.
2. No-colour guard comment on `.poem-result [lang='fa'] h2` — protects the equal-specificity Rumi lapis keying from future edits (styles reviewer note 1).

## Rejected/recorded-only notes (lead reasoning)

- *Fixed-path `manifest.webmanifest`/`offline.html` could theoretically serve cross-release on a query-variant request while an older complete cache is active* — requires a query-string the app never generates and browsers never add, on non-executable resources; restricting the fallback would reintroduce the 504 dead-end for the eviction case it exists to fix. Recorded as residual note R-1.
- *Sub-frame muted forward-play between prime and `presented()` pause* — invisible (poster overlays, aria-hidden), first scroll overwrites `currentTime`. Cosmetic.
- *Repeated Begin during the prime window re-announces "Preparing the entrance."* — polite-region verbosity on a rapid double-press; benign.
- *Un-cancellable revoke timer* — no cancellation requirement exists; browser reclaims on unload.
- *Literal `←` glyphs do not mirror under a future RTL UI* — pre-existing and out of scope (all three sites are LTR contexts in this release); noted for any future Persian-interface release (design §34).

## Outcome

Zero unresolved Blocker/Critical/High findings. All repairs stand with two micro-hardenings applied and re-verified (87/87 across offline+accessibility+performance suites post-closure; lint/typecheck clean).
