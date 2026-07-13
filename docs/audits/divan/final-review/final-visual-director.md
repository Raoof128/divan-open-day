# DIVAN — Final Visual-Director Review (post-remediation)

**Date:** 2026-07-14 · **Reviewer:** final-visual-director (fresh eyes, adversarial)
**Build under review:** branch `feat/ui-ux-gauntlet-r1`, fixture preview at `127.0.0.1:4173`
**Method:** before/after screenshot pairs (`screenshots/baseline/` vs `screenshots/final/`),
plus a live Playwright walk at 390 and 1440 including the reveal in full motion and the
"Return to the stall" disclosure in its expanded state.
**Design authority:** §6.1 creative direction / negative list, §6.2 scene language,
§6.3–6.5 colour/texture/geometry, §7.2 welcome, §7.3 choose-poet, §7.5 reveal, §7.6 result.

This review judges **what is**, not what the ledger promised. Ledger IDs (L-xx) are referenced
only to locate the intended fix; each was re-verified independently below.

---

## Verdict by reviewed dimension

| Dimension                                    | Verdict              | Note                                                                                                                 |
| -------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Composition / one focal point per screen     | **Pass**             | Welcome, choose-poet, intention, reveal, result each carry a single clear focus.                                     |
| Visual hierarchy                             | **Pass (one issue)** | Primary "Reveal another" leads decisively; one secondary action is mis-weighted — FV-01.                             |
| Emotional pacing                             | **Pass**             | Reveal is a dignified manuscript-opening, contemplative rather than a slot-machine (§6.1).                           |
| Manuscript art direction                     | **Pass**             | Red-and-gold cover rotates in shallow perspective to a gold calligraphic ornament; original SVG geometry throughout. |
| Typography (incl. bilingual balance)         | **Pass (one Low)**   | Serif body/headings read cleanly; Persian welcome line still subordinate — FV-05.                                    |
| Colour / surface / ornament consistency      | **Pass**             | Result-card hues now echo the choose-poet portals per poet; parchment reading surface constant.                      |
| Radius / shadow / depth logic                | **Pass**             | Consistent card radius, restrained elevation; spine gradient reads as gilded edge, not decoration-for-its-own-sake.  |
| Interaction states (hover / pressed / focus) | **Pass**             | Two-tone focus ring visible on dark and light; primary shows pressed depth; disclosure exposes `aria-expanded`.      |
| Result actions — new hierarchy               | **Pass (issues)**    | "Reveal another" leads; stall disclosure is intentional; "Learn about the poet" is under-designed — FV-01/FV-02.     |
| Poet distinction on results                  | **Pass (Low)**       | Now clearly visible and tasteful (hue only, not a reskin); corner ornament geometry is shared — FV-04.               |
| Welcome star fix                             | **Pass (Low)**       | Opacity dropped so no vertex crosses the headline stems; motif still sits directly behind H1 — FV-03.                |
| §6.1 generic-AI-design residue               | **Pass**             | No carpet-behind-text, neon, slot-machine, or generic "Middle-Eastern" decoration. Specific, intentional.            |

---

## Remediation re-verification (ledger fix-now items)

- **L-01 spine-bar clip — RESOLVED.** At 320 and 390 the first glyph of every line ("Your verse",
  the TEST-ONLY body lines, "A reflection", "Source and translation") now clears the spine bar.
  Baseline `mobile-390--result-hafez.png` clipped the leading glyph on nearly every line; final
  `mobile-320/390--result-hafez.png` are clean.
- **L-02 result actions / dead end — RESOLVED.** "Return to the stall" is a real disclosure button
  (`aria-expanded`, `aria-controls="stall-invitation"`) that opens a static, generic invitation
  ("Come and say hello at the Persian Society stall…") — no fabricated stall number, no location.
  "Learn about the poet" (`<a href="/about">`) is present. See FV-01 for its weight.
- **L-03 About link contrast — RESOLVED.** Bottom context links render deep-red `#76232F` underlined
  on paper (was pale gold ~1.56:1). "How offline works" link added (L-07 reconciliation).
- **L-04 poet-distinct results — RESOLVED.** Hafez: pomegranate→gold→cypress spine, pomegranate
  headings, warm corner ornament. Rumi: lapis→turquoise→gold spine, lapis headings, cool ornament.
  Reading surface and body contrast untouched. Subtle, not reskin-y. Residual: FV-04.
- **L-05 focus during reveal — RESOLVED.** `activeElement` is the `H1` "Your verse" after the
  choreography (was `<body>`).
- **L-06 mirrored provenance parens — RESOLVED.** "SYNTHETIC SOURCE LABEL (TEST … SOURCE LABEL)"
  now renders with parentheses in correct LTR order (baseline mirrored them).
- **L-08 welcome star over headline — RESOLVED (Low residual).** Geometry opacity behind the H1 is
  reduced so no vertex crosses a letterform. See FV-03.
- **L-14 Hafez card copy — RESOLVED.** "Hafez — A tradition-inspired reading."
- **L-15 Persian welcome parity — NOT CLEARLY DELIVERED (Low).** See FV-05.

---

## Issues found

### FV-01 — "Learn about the poet" reads as a footer afterthought, not a peer invitation

- **Severity:** Medium
- **Evidence:** `final/desktop-1440--result-hafez.png`, `final/mobile-320--result-hafez.png`, live DOM
  (`<a href="/about">`, deep-red underlined, 16px, x≈353 bottom-left, isolated below a divider).
- **Design ref:** §7.6 Actions — "Learn about the poet" is listed as a secondary action peer to
  "Save this verse" / "Return to the stall".
- **Observation:** The other secondary actions are pill buttons; this one is a bare underlined text
  link, alone, below a horizontal rule at the card's bottom-left. Visually it separates from the
  action cluster and reads as a footer/utility link rather than an invitation to explore the poet.
  The brief's own question — invitation or afterthought — resolves, today, to afterthought.
- **Proposed fix:** either promote it to the same outline-pill treatment and place it within the
  secondary group, or, if the intent is to separate "act on this verse" from "navigate away," make
  that separation legible (a labelled group or a clearly styled tertiary zone) rather than one loose
  link. Keep the accessible name and `/about` target stable.

### FV-02 — Result action cluster wraps 3 + 1 + link raggedly; grouping logic isn't legible

- **Severity:** Low
- **Evidence:** `final/desktop-1440--result-hafez.png` (Reveal another · Save · Download on row 1;
  Return to the stall alone on row 2; Learn about the poet as a link on row 3).
- **Design ref:** §7.6 Actions (primary vs secondary set).
- **Observation:** On desktop the four pills wrap 3-then-1, leaving "Return to the stall" stranded
  under the primary; there's no visual cue that Reveal is primary-of-a-group vs the rest. It works,
  but the rhythm is uneven.
- **Proposed fix:** intentional grouping — e.g. primary on its own line, the utility pills as a
  balanced secondary row — so the wrap is designed rather than incidental.

### FV-03 — Welcome star still sits directly behind the H1

- **Severity:** Low
- **Evidence:** `baseline/` vs `final/desktop-1440--welcome.png`.
- **Design ref:** §6.5 geometry / §7.2 composition; L-08 spirit ("no vertex crosses a glyph stem").
- **Observation:** Opacity is now low enough that the headline reads clean and the collision is
  gone — a clear improvement. But the star field is still centred behind "A verse is / waiting for
  you," so faint vertices track close to the glyphs. Acceptable as background texture; a small
  vertical/scale nudge would fully clear the letterforms.
- **Proposed fix:** offset or rescale the geometric field so no vertex falls under a glyph stem, per
  the original L-08 fix note. Optional polish.

### FV-04 — Poet distinction on results is hue-only; corner ornament geometry is shared

- **Severity:** Low
- **Evidence:** `final/desktop-1440--result-hafez.png` vs `final/desktop-1440--result-rumi.png`
  (identical top-right ornament shape, recoloured).
- **Design ref:** §6.2 scene language; L-04 suggested a per-poet corner motif.
- **Observation:** The hue system (spine + heading accent) already reads as culturally distinct and
  tasteful, and matches the strong choose-poet portals — this is genuinely sufficient. Noting only
  that the ornament shape itself is identical for both poets, where the choose-poet screen does
  differentiate motif (cypress/pomegranate vs star/constellation). A shared ornament is a defensible
  restraint, not a defect.
- **Proposed fix:** optional — key the corner motif to `data-visual-language` too (motifs already
  exist in `DecorativeGeometry`). Do not over-decorate.

### FV-05 — Persian welcome line remains a subordinate caption (bilingual parity, WELCOME)

- **Severity:** Low
- **Evidence:** `final/desktop-1440--welcome.png`, `final/mobile-390--welcome.png` — بیتی در انتظار توست
  is set small, tucked under the right end of the English H1.
- **Design ref:** §7.2 (English H1 leads) and the design's bilingual-balance intent; L-15.
- **Observation:** English-leads hierarchy is correct and should stay. But the Persian line still
  reads as a small caption rather than a co-equal bilingual voice; the L-15 "modest size/rhythm lift"
  is not visibly present. On the RESULT screen the bilingual balance is much better; WELCOME lags.
- **Proposed fix:** a modest size/leading lift for `.welcome-persian` toward parity while keeping the
  English H1 dominant. Subjective, within-brief polish.

---

## Notable strengths (fresh-eyes, for the record)

- The **reveal choreography** is the standout: a gilt-edged manuscript cover rotates open in shallow
  perspective to expose an original gold calligraphic ornament, with "Skip animation" present and
  reachable. It reads as opening a book, not a lottery — exactly the §6.1 intent, and the emotional
  register is right.
- **Choose-poet** is excellent art direction: warm cypress/pomegranate/gold for Hafez, cool
  star/constellation/turquoise for Rumi, each on its own tonal ground. The result-card hue accents
  now make the two flows feel like one system across screens.
- **Contrast and reading surface** on the parchment card are calm and legible; provenance table now
  renders mixed-direction identifiers correctly.

---

## Unresolved severity count

**Blocker: 0 · Critical: 0 · High: 0.**

All five findings are Medium (1) or Low (4) polish items. No blocking, critical, or high-severity
visual defect remains.

---

## Final statement

**Unresolved Blocker/Critical/High: 0.** The remediation pass holds up under adversarial fresh-eyes
review: every fix-now ledger defect I could verify visually (spine-bar clip, result dead-end, About
link contrast, poet-distinct results, reveal focus, mirrored provenance parens, welcome star) is
genuinely resolved, and the site now reads as one intentional "illuminated manuscript in a night
garden" system rather than a templated build — the reveal, the choose-poet portals, and the
poet-keyed result hues are the strongest evidence. The one thing I'd still push on is the result
action zone: "Learn about the poet" currently lands as a lone footer link (FV-01, Medium) and the
action cluster wraps unevenly (FV-02), so the secondary-action hierarchy is the last surface that
looks assembled rather than composed. The remaining items (welcome star placement, hue-only poet
ornament, Persian welcome parity) are optional polish. Nothing here blocks; the work is
launch-quality on the visual axis, subject to the still-closed launch gates that are out of this
review's scope.
