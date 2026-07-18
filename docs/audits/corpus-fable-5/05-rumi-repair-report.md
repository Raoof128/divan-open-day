# Corpus repair — Phase 4 Rumi report

Final state: **60 unique, non-overlapping Rumi records** (16 re-derived + 44
evidence-based, of which 7 repaired and 37 byte-identical to their pre-campaign state).

## The 16 anchor-published records (D-01) — re-derived

Root cause: `makeRumiItems` published `anchors[0..1]` — retrieval probes — verbatim as
verse. That shipped a section title as verse (0643), a Qur'anic motto fragment (0946),
keyword fragments (`سگ کهف` 0306, `کای امیرالممنین` 0633, `کیستی ای معتمد` 0724, Arabic
maxims 0300), and `...`-elided compressions (0357, 0397, 0418, 0557, 0674, 0947).

Each record is now a **continuous Whinfield excerpt mapped 1:1 to consecutive Nicholson
hemistichs**, both sides verbatim slices of the locked source derivations, with an explicit
`:lines-N-M` window — the exact shape the 44 evidence records already used. Windows are in
`fable5-repair-spec.ts` (indices only); the derivation evidence with the selected texts is
in `03-source-verification.md`. The 0643 heading and every fragment are gone from published
verse. 633 is a three-line record (the ambassador's question, quote-balanced across the
span); the rest are couplets.

Selection-manifest constraints (≥2 lines each side, no Persian-line overlap, no reused
English span, unique mapping identities) all hold; `pnpm poetry:build-production` and the
compile gate enforce them.

## The 7 repaired evidence records

| Record | Repair |
| --- | --- |
| 0408 | Window shifted to lines 8–9: removes the footnote digit `9` and the unclosed quotation in one faithful move |
| 0699 | Window shifted to lines 22–23: complete sentences, no dangling quote |
| 0718 | Trailing footnote marker ` 4` stripped, disclosed; span otherwise verbatim |
| 0751 | Trailing footnote marker ` 4` stripped, disclosed |
| 0759 | Window shifted to lines 4–5, outside the quotation |
| 0813 | Extended to three lines completing the wolf/Joseph question; marker ` 5` stripped |
| 0836 | Persian corrected one hemistich forward (`او چو فرعون و تنش موسی او` / `او به بیرون می‌دود که کو عدو`) — the published pair was off by one against the English (D-06) |

Every strip asserts the marker's presence before removing it; every window is bounds-checked
against its source; the generator fails closed otherwise.

## The 37 untouched records

Byte-identical output, v2 authority metadata preserved verbatim — no false freshness was
stamped on work this campaign did not redo.
