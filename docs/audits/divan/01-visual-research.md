# DIVAN — Visual Research & Direction Audit

**Author:** visual-research-director
**Date:** 2026-07-13
**Status:** Research only. No code, assets, or layouts from external sources are copied — patterns and principles only.
**Scope:** Current (2025–2026) practice in museum/cultural digital storytelling, bilingual RTL+Latin editorial UI, ceremonial reveal interactions, Persian/Arabic web typography, accessible motion, and share-card typography — measured against DIVAN's shipped baseline screenshots (`docs/audits/divan/screenshots/baseline/`) and the binding design authority (`2026-07-12-divan-open-day-agent-ready-design-v2-audited.md`, esp. §6–§9).

This audit stays **inside** the approved art direction ("an illuminated Persian manuscript opened in a night garden," §6.1). It does not propose a redesign; it proposes where the build under-delivers against its own brief and against external best practice.

---

## 1. Sources consulted

Access date for all sources: **2026-07-13**.

| #   | Source                                                                                                                                                                                                                                                           | Useful principle                                                                                                                                                                                                                                                                           | Adoption decision                                     | Rationale for DIVAN                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | [W3C — Inline markup and bidirectional text in HTML](https://www.w3.org/International/articles/inline-bidi-markup/)                                                                                                                                              | Tightly wrap _every_ opposite-direction phrase (Latin refs/numbers inside Persian) in `dir`/`<bdi>`; use first-strong isolation (`dir="auto"`/`bdi`) when direction is unknown; numbers after RTL phrases spill without isolation.                                                         | **Adopt (objective).**                                | The baseline result card already mixes Latin edition references and numerals inside the RTL Persian region; placeholder text shows spillover. Directly enforces design §8.2/§8.3.                                |
| S2  | [W3C — Arabic & Persian Layout Requirements (ALReq)](https://www.w3.org/International/alreq/)                                                                                                                                                                    | Persian/Arabic has distinct line-breaking, justification, and vertical-metric needs; do not treat it as Latin with a swapped direction.                                                                                                                                                    | **Adopt (objective).**                                | Grounds the Persian couplet setting and the "no full justification on short lines" rule (§8.3).                                                                                                                  |
| S3  | [Voxire — Arabic RTL Typography for Web Design (2026 guide)](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/)                                                                                                                                     | Body line-height 1.7–1.85 (vs 1.5 Latin); headings 1.3–1.4; `letter-spacing: 0` on connected script (tracking fractures ligatures); Arabic sits ~1–2px smaller than matched Latin; 16px min on mobile to avoid iOS zoom.                                                                   | **Adopt numbers (objective).**                        | Concrete metrics to verify DIVAN's Persian body/heading CSS against. Vazirmatn is already the chosen face (§8.1).                                                                                                |
| S4  | [W3C — Arabic Script Gap Analysis (alreq-gap)](https://www.w3.org/TR/alreq-gap/)                                                                                                                                                                                 | Browsers cannot yet reliably fall back to a _nastaliq_ generic; wrong substitution is a readability + cultural error.                                                                                                                                                                      | **Adopt (objective).**                                | Confirms design §8.1's rule: self-host Nastaliq for _short display only_, keep a real Persian system fallback, never let long verse fall to nastaliq.                                                            |
| S5  | [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) + [Pope Tech — Accessible animation (Dec 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) | Reduce/replace non-essential motion; provide pause/stop for anything >5s; never convey essential info through motion alone; test with `matchMedia`.                                                                                                                                        | **Adopt / confirm (objective).**                      | DIVAN's reveal is ≤2.4s with a Skip control (<300ms) and a three-way Motion setting — already best-practice; this validates it and sets the bar not to regress.                                                  |
| S6  | [prg.sh — Why Your AI Keeps Building the Same Purple Gradient Website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website) + [925 Studios — AI Slop Web Design Guide](https://www.925studios.co/blog/ai-slop-web-design-guide) | "AI slop" tells: Inter/Roboto/Arial, purple-indigo on white, three-icon-box grids, rounded corners on everything + 0.1-opacity shadows, scattered un-orchestrated micro-interactions, no hierarchy beyond size. Escape via explicit constraints, distinctive display type, negation lists. | **Adopt as checklist (objective + subjective).**      | Becomes the anti-pattern rubric in §3. DIVAN largely escapes, but a few borderline signals need guarding.                                                                                                        |
| S7  | [Aga Khan Museum — Digitized Manuscript portal press release (2024)](https://aga-khan-museum-assets.s3.amazonaws.com/uploads/2024/07/Digitization-Project-Press-Release_Aga-Khan-Museum.pdf) + [collections portal](https://agakhanmuseum.org/collections/)      | A leading Islamic-art institution presents Rumi/Shahnameh manuscripts with **bilingual interpretive layers** and interactive readers — poetry treated as reflection and scholarship, not spectacle.                                                                                        | **Adopt as reference standard (subjective).**         | The credible peer for DIVAN's register: restraint, provenance, bilingual parity, layered depth.                                                                                                                  |
| S8  | [Formula D — Interactive exhibition design](https://formula-d.com/how-interactive-exhibition-design-engages-genz/) + [Kim, _Curator: The Museum Journal_ (2025)](https://onlinelibrary.wiley.com/doi/10.1111/cura.12677)                                         | Multi-tiered content (concise → analytic → storytelling); let the visitor choose depth; emotional resonance must not cost historical accuracy.                                                                                                                                             | **Adopt selectively (subjective).**                   | Supports optional progressive depth (About / Credits / "learn about the poet") without cluttering the core reveal.                                                                                               |
| S9  | [Krumzi — Open Graph image sizes 2025](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide) + [Digital Ink — OG image best practices](https://www.digital.ink/blog/open-graph-image/)                                    | 1200×630; one focal point; bold high-contrast type; readable _after_ messaging-app compression; no thin lines/fine detail; PNG for text-bearing graphics.                                                                                                                                  | **Adopt (objective).**                                | Directly shapes the "Download verse card" deliverable (`lib/share/`) — a locally generated, offline share image.                                                                                                 |
| S10 | [SchoolDanaa — What is Fāl-e Hafez](https://school.danaa.app/what-is-fale-hafez-and-its-meaning/) + [SURFIRAN — Legacy of Hafez](https://surfiran.com/mag/why-hafez-is-so-important-to-iranians/)                                                                | Fāl-e Hafez is bibliomancy / **reflection**, not fortune-telling; practiced at Yalda & Nowruz; approached with respect. Reputable EN translators: Dick Davis, Shahriar Shahriari.                                                                                                          | **Adopt as tone guardrail (objective + subjective).** | Validates DIVAN's "A reflection, not a prediction" framing and the "not medical/legal/financial/religious advice" disclaimer — keep this discipline; it is a genuine differentiator from novelty "fortune" apps. |

---

## 2. Pattern findings by theme

### 2.1 Bilingual RTL + Latin editorial interfaces

- **Isolate, don't just direct.** The load-bearing move for DIVAN is not the page-level `dir`; it is per-run isolation of the _foreign_ fragments — Latin edition references, accession numbers, and Western numerals sitting inside the Persian block — with `<bdi>` or `dir="auto"` (S1). Un-isolated, a Latin phrase followed by a number reorders visibly. The baseline placeholder text already exhibits this: on `mobile-390--result-hafez.png` the "Opening hemistich" value and the ASCII Persian lines wander to inconsistent horizontal positions inside the RTL container.
- **Persian is not "Latin, mirrored."** ALReq (S2) and the 2026 field guidance (S3) converge: connected script needs more leading, zero letter-spacing, and its own justification logic. Full justification of short hemistichs is explicitly wrong (echoed by design §8.3).
- **Bilingual _parity_ is the credible register.** The Aga Khan portal (S7) treats Persian and English as co-equal interpretive layers, not original-plus-caption. DIVAN's result screen orders English → Persian (design §7.6) which is defensible for an Anglophone Open Day audience, but the Welcome screen currently subordinates the Persian to a small caption.

### 2.2 Museum / cultural-institution digital storytelling

- **Layered depth, visitor-chosen.** Current museum practice (S8) offers the same object at multiple depths and lets the visitor opt in. DIVAN already has the right scaffolding (About / Credits / "Learn about the poet") — the pattern to preserve is _core reveal stays uncluttered; depth is one deliberate step away._
- **Provenance is the trust signal.** Institutions foreground source edition, translator, and rights. DIVAN's provenance block (poet / work / edition / hemistich / source / translation classification / credit) is exactly this discipline and is a strength — it reads as scholarship, not decoration.
- **Emotional resonance without accuracy cost.** The academic consensus (S8) is that affect is welcome only when it does not distort the record — which maps onto DIVAN's separation of _verse_ (fidelity) from _reflection_ (clearly labelled interpretation).

### 2.3 Ceremonial reveal / moment-of-pause

- **Motion as meaning, not reward.** Design §9.1 already names the vocabulary (opening, breath, ink, paper, light, unfolding) and forbids competition/gambling/urgency semantics. External accessibility practice (S5) reinforces: keep it short, skippable, and never the sole information channel. DIVAN's ≤2.4s reveal with a <300ms Skip control is ahead of most cultural sites.
- **The pause is content.** The Intention screen ("Take a quiet moment," single non-repeatable activation, no long-press, no sensors) is a genuine moment-of-pause pattern and aligns with how Fāl-e Hafez is actually practised (S10) — intention held before the book is opened.

### 2.4 Persian / Arabic web typography

- **Nastaliq for ornament, naskh/Vazirmatn for reading.** Browsers can't be told to fall back to nastaliq (S4), so nastaliq must be self-hosted and confined to short display; verse bodies must use Vazirmatn with a real Persian system fallback (design §8.1). The baseline honours this: display labels (`فال حافظ`, `لحظه‌ای با مولانا`) read as nastaliq-style ornament, while headings like `متن فارسی` are a legible naskh weight.
- **Metrics to verify:** Persian body ≥1.7 line-height, headings 1.3–1.4, `letter-spacing:0`, ~1–2px optical size-up relative to matched Latin, 16px mobile minimum (S3).

### 2.5 Accessible motion

- No animation in DIVAN exceeds 5s, so the pause/stop-for-long-motion rule (S5) is satisfied structurally; the operative requirements are `prefers-reduced-motion` honouring (three ways, per §9.3), transform/opacity-only animation (§9.2), and the in-app Motion setting. These are already specified — the audit's job is to ensure implementation doesn't regress them.

### 2.6 Share-card typography

- A locally generated 1200×630 card with **one focal point, bold high-contrast type, and no hairline detail** survives WhatsApp/Telegram recompression (S9). Gold-on-parchment hairlines and thin geometry — beautiful on screen — are exactly what compression destroys, so the share card needs a heavier, higher-contrast treatment than the on-screen result card.

---

## 3. Anti-pattern checklist — verdict for DIVAN's baseline

Rubric from S6 (AI-slop tells) plus design §6.1's own "must not become" list. Verdicts read the shipped screenshots.

| Anti-pattern                                 | Verdict                             | Evidence / note                                                                                                                                                                                                                                            |
| -------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purple-blue "AI" gradient                    | **PASS**                            | Palette is ink-navy → lapis → gold → pomegranate (§6.3). The Rumi card's blue is lapis/turquoise, culturally anchored, not generic indigo. No purple anywhere.                                                                                             |
| Glassmorphism / frosted blur                 | **BORDERLINE — guard**              | Poet cards on `choose-poet` carry soft radial glows (warm for Hafez, cool for Rumi). Currently restrained and color-anchored (reads as pomegranate warmth / lamp light per §6.2). Watch that these never grow into generic frosted-glass blur.             |
| Fake calligraphy / squiggle-as-script        | **PASS**                            | Decorative marks are original geometric SVG (cypress, eight-point star, corner frames, §6.5); Persian is live font text, never an image (§8.1/§7.6). No faux calligraphy standing in for real script.                                                      |
| Faux mysticism / oracle framing              | **PASS (strength)**                 | "A reflection, not a prediction"; Intention disclaimer explicitly denies prediction and medical/legal/financial/religious advice. Matches the authentic Fāl-e Hafez ethos (S10). A real differentiator.                                                    |
| Slot-machine reveal                          | **PASS by spec — verify in motion** | §7.5 forbids flash, rapid zoom, simulated falling, continuous rotation; targets 1.6s ink/paper/unfold. Stills can't confirm; the running reveal should be spot-checked against this.                                                                       |
| Inter / generic type everywhere              | **PARTIAL — acceptable**            | Inter carries the interface layer (design-approved), but identity display is Cormorant Garamond + Vazirmatn/Nastaliq. The distinctive faces do the hero work, so Inter reads as neutral chrome, not slop. Keep display type owning the ceremonial moments. |
| Three-icon-box feature grid                  | **PASS**                            | No feature-grid anywhere in the flow.                                                                                                                                                                                                                      |
| Rounded corners on everything + 0.1 shadow   | **BORDERLINE — guard**              | The parchment result card and poet cards use rounded corners + soft shadow. Justified by the "card / leaf of paper" metaphor, but the manuscript geometry elsewhere is rectilinear; keep radii intentional and consistent, not defaulted.                  |
| Carpet/scan behind text; orientalist fantasy | **PASS**                            | No raster texture behind text; geometry is line-based and low-contrast. Meets §6.4.                                                                                                                                                                        |
| No hierarchy beyond size                     | **PASS**                            | Clear typographic hierarchy: serif display vs sans body, red reserved for actions/seals, gold as ornament only (§6.3).                                                                                                                                     |

**Net:** DIVAN is not an AI-slop site. It escapes the palette, typography, and layout tells decisively, and its tone discipline (reflection-not-fortune) is a genuine asset. The only live risks are (a) letting the poet-card glows drift toward generic blur, and (b) default-feeling corner radii/shadows on the cards.

---

## 4. Prioritized recommendations

Each item is tagged **[Objective-usability]** (measurable correctness / accessibility) or **[Subjective-inspiration]** (identity / craft), and mapped to the screen or component it affects. Priority is P1 (do first) → P3 (polish).

### P1

**R1 — Isolate Latin & numerals inside every Persian region. [Objective-usability]**
_Screen/component:_ RESULT — `PoemResult`, `SourceCredit`, provenance block; anywhere Latin/Arabic-numeral references sit in an RTL context.
Wrap Latin edition references, accession numbers, hemistich keys, and Western numerals in `<bdi>` (or `dir="auto"`) so they don't reorder against the surrounding Persian (S1). The `mobile-390--result-hafez.png` placeholder already shows the spillover this prevents. Enforces design §8.2/§8.3. Test in Safari, Chromium, Firefox.

**R2 — Differentiate the Hafez and Rumi result cards. [Subjective-inspiration]**
_Screen/component:_ RESULT — `PoemResult`, `IlluminatedFrame`, corner ornament, spine gradient.
The build's biggest gap against its own thesis: `desktop-1440--result-hafez.png` and `desktop-1440--result-rumi.png` are visually identical except the word "Hafez"/"Rumi". Design §6.2 asks for distinct scene language — Hafez (pomegranate, cypress, warm gold, deep indigo) vs Rumi (reed, circular geometry, lapis, turquoise, lamp light). Key the result card's corner motif, spine-gradient hues, and a single accent to the chosen poet, reusing the motifs already proven on the `choose-poet` cards. Keep it _subtle_ — a recognizable accent, not a reskin — so the parchment reading surface and contrast are untouched.

**R3 — Verify Persian type metrics against ALReq/2026 numbers. [Objective-usability]**
_Screen/component:_ `styles/visual.css`, Persian blocks in `PoemResult` and headings.
Confirm Persian body line-height ≥1.7–1.85, Persian headings 1.3–1.4, `letter-spacing:0` on all Persian (tracking fractures Vazirmatn's connected forms), optical size ~1–2px up vs matched Latin, ≥16px on mobile (S3). Confirm nastaliq is confined to short display with a real Persian system fallback and never receives long verse (S4, §8.1).

### P2

**R4 — Design the Persian verse as a deliberate couplet setting. [Subjective-inspiration]**
_Screen/component:_ RESULT — Persian block in `PoemResult`.
Real Persian poetry is two balanced hemistichs. The baseline placeholder shows wide, ragged inter-word gaps (an artifact of ASCII-in-RTL, but a warning). For real corpus, set the two hemistichs as a centred couplet with generous leading and **no full justification** on short lines (S2, §8.3) — so the verse reads as poetry, not a justified paragraph.

**R5 — Author the "Download verse card" for compression survival. [Objective-usability]**
_Screen/component:_ `lib/share/`, RESULT "Download verse card" action.
Target ~1200×630, one focal point, bold high-contrast type for both scripts, source/credit line, and **no gold hairlines or thin geometry** that recompression will destroy; render as PNG for crisp text (S9). Must stay fully local/offline (no social SDK, §7.6) and privacy-preserving. This is also the artifact most likely to travel beyond the stall, so provenance/credit must be legible on it.

**R6 — Reduce headline/ornament collision on WELCOME. [Objective-usability]**
_Screen/component:_ WELCOME — `DecorativeGeometry`, `ManuscriptPortal`, headline.
On `desktop-1440--welcome.png` the large eight-point star sits directly behind "waiting for you," with vertices crossing the letterforms. Gold-on-dark keeps it low-contrast, but nudge the star's scale/position (or drop its opacity behind the text) so no vertex crosses a glyph stem — protects display legibility without losing the motif.

### P3

**R7 — Lift Persian toward parity on WELCOME. [Subjective-inspiration]**
_Screen/component:_ WELCOME — bilingual headline pairing.
`بیتی در انتظار توست` currently reads as a small subordinate caption. For a Persian-poetry experience, give the pairing more balance — a touch more size/weight and vertical rhythm on the Persian — so it reads as a co-equal voice (the Aga Khan bilingual-parity register, S7), not a translation footnote. Stay within the manuscript restraint; this is a nudge, not a hierarchy inversion.

**R8 — Keep poet-card glows disciplined; keep card radii/shadows intentional. [Objective-usability]**
_Screen/component:_ CHOOSE POET — poet cards; RESULT/poet cards — radius & shadow tokens.
Guard the two BORDERLINE anti-patterns from §3: cap the radial glow radius/opacity so it stays "lamp light / pomegranate warmth" and never becomes generic frosted blur; and ensure card corner-radius and shadow are defined once as intentional tokens (§6.3's "defined once, consumed semantically"), not defaulted per component. Also fix the minor redundant copy on the Hafez card ("Hafez — A tradition-inspired reading from Hafez.").

**R9 — Preserve, don't add, the reveal's motion restraint. [Objective-usability]**
_Screen/component:_ REVEAL — motion system, Motion control.
The ≤2.4s, transform/opacity-only, skippable reveal with a three-way Motion setting already beats external practice (S5). Recommendation is _conservative_: verify in-motion that no flash/zoom/continuous-rotation crept in, and consider anchoring the floating top-right Motion `select` more quietly into the frame so it doesn't read as detached UI chrome on the ceremonial WELCOME/INTENTION screens — without weakening it as a real, reachable control.

**R10 — Offer optional depth without cluttering the reveal. [Subjective-inspiration]**
_Screen/component:_ RESULT ↔ ABOUT/CREDITS; "Learn about the poet".
Follow the museum multi-tier pattern (S8): keep the result uncluttered, with one deliberate step to deeper context (tradition of Fāl-e Hafez / Rumi reflection mode, translator notes). The scaffolding exists (§7.7/§7.8) — the recommendation is to make the path from a verse to its context feel like an invitation, not a nav afterthought.

---

## 5. Objective vs subjective — quick separation

- **Objective-usability (ship regardless of taste):** R1 (bidi isolation), R3 (Persian metrics), R5 (share-card legibility/compression), R6 (headline legibility), R8 (glow/radius discipline), R9 (motion-restraint verification).
- **Subjective-inspiration (art-directed judgement, stay within §6):** R2 (poet-keyed result), R4 (couplet setting), R7 (Persian parity on Welcome), R10 (layered depth).

All ten stay inside the approved "illuminated manuscript in a night garden" brief. None require new remote assets, fonts, or dependencies, and none conflict with DIVAN's privacy/offline invariants.
