# Corpus repair — Phase 2 byte/page source verification

Every artifact hash-verified against `source-lock.json` before use (all six match:
Bell pdf `99d9a385…` / txt `e736637a…`, Clarke v1 pdf `8656a50a…` / v1 txt `ff0642a5…`,
v2 pdf `f754625a…` / v2 txt `ac0ea92c…`, QG epub `a968d2f8…`, Nicholson epub `04a80365…`,
Whinfield epub `d629e8ab…`). Line references below are into those exact artifacts.
Evidence style: locations + short excerpts only.

## Bell (hafez-bell-1897-en)

- **D-08 / p073 numeral**: archive text line 2242 renders the header before "WIND from the
  east" as `in`; tesseract read `Ul`; the reconstruction's own sequence is p071=`I` (certain),
  p072=`Il` (=II), p077=`VI` (certain) — pages 73–76 hold III, IV, V. Both OCR forms are
  misreads of **III**. → `Bell poem III`.
- **D-08 / p122 numeral**: archive text line 4446 prints `XLIII` immediately before "WHERE
  are the tidings of union"; sequence p120=`XLI`, p121=`XLII`. The reconstruction's
  `XLII (certain)` for p122 was wrong. → `Bell poem XLIII` (record 336); record 169 keeps
  XLII; the duplicate citation dissolves.
- **D-03 / p097 wrap**: archive text 3308–3309: `Nor merry the Spring without the sweet
  laughter of` ⏎ `wine ;` — one verse line wrapped by the printed page. → joined line.
- **D-09 / drop-caps**: archive text 2504 `THE rose has flushed red…` (p079) and 4328
  `THE margin of a stream…` (p119) — small-caps openings, same class the 12 disclosed
  corrections already normalise. Also `WIND` (2244), `WHERE` (4448), `THE rose is not fair`
  (3305) corroborating the class.
- **D-13 / all 12 hand-typed opening corrections**: each wording located verbatim in the
  archive text (single occurrence each; probe list in the audit transcript). The corrections
  are real recoveries, now carried with citations in the generator's recovery table.
- **Binding**: `bell-poems.json` `generatedFrom: "tesseract-400dpi + archive-ocr consensus"`
  — the scan PDF is the visual authority and the locked archive text the second reading;
  Bell records keep the PDF binding with the chain recorded.

## Qazvini-Ghani EPUB (ghazal 65, D-02)

Document `OPS/c69_…_khwshtr_z__ysh_w_shbt_w_bagh_w_bhar_chyst.xhtml`:
`<title>` = `خوشتر ز عیش و صحبت و باغ و بهار چیست`; body tag-stripped text =
`خوشتر ز عیش و صحبت و باغ و بهار چیست` with a `<sup class="mw-ref">` footnote reference
after `باغ` whose bracket glyphs are nested `<span>`s. `extract-hafez-ghazals.py` closes a
hemistich at the **first nested `</span>`**, yielding `…باغ[`. Mechanism reproduced;
extractor repair required (suppress `sup.mw-ref` content; track span depth).

## Clarke transcripts + scans (D-04, D-11)

Each error exists verbatim in the locked archive transcript; the tesseract 400dpi per-page
reading (independent) and, where rendered, the page image prove the correction:

| Record | Transcript (archive) | Tesseract page | Visual |
| --- | --- | --- | --- |
| 350 (v2 p60) | `Iii the morning` (v2 txt:2311) | `In the morning` (p-0060) | p60 rendered: degraded type; "In" is the print intent, Persian `سحر…گفتم` agrees |
| 489 (v2 p255) | `O them, in whose face` (v2 txt:11359) | `O thou, in whose face` (p-0255) | p255 rendered and read: **"O thou"** plainly |
| 034 (v1 p125) | `(0 true Beloved!)…dwelling of—-` (v1 txt:10073) | `(O true Beloved!)…dwelling of-——` | digit 0 → letter O |
| 130 (v1 p294) | `(0 wind thou sawest)` (v1 txt:19613) | `(O wind thou sawest)` (p-0294) | digit 0 → letter O |
| 091 (v1 p242) | two verse lines at v1 txt:17171–17175, second wraps to `I hold— thee.` | same, complete | published record jammed both into one line and dropped `I hold— thee.` |

**D-11 confirmed**: every Clarke record's disclosure says the text came from "the locked
Internet Archive transcript" while `english_source_sha256` binds the PDF. The transcripts
are separately locked (`volume-1.txt` `ff0642a5…`, `volume-2.txt` `ac0ea92c…`) → rebind.

## Whinfield / Nicholson (D-01, D-05, D-06, D-07)

Method: `classifyEnglishBlocks` (the repo's own deterministic classifier) segments the
Whinfield extraction; Nicholson section text from `rumi-fa.jsonl`. For each record a
continuous English window (0-based segment line indices, the same convention the 44
evidence records use — verified against 0759's stored `lines-6-7`) was matched 1:1 to
consecutive Nicholson hemistichs, each side located **verbatim** in its source. Selected
spans (segment · E-window · Nicholson hemistich start):

| Seq | Segment | E-window | FA start | Note |
| --- | --- | --- | --- | --- |
| 29 | b0171-s2 | 1–2 | 20 | replaces palm/sea anchor fragments |
| 112 | b0019-s2 | 0–1 | 14 | "true lover…sickness of heart" couplet |
| 300 | b0171-s4 | 12–13 | 12 | replaces Arabic-maxim fragment; ordinance/ordained couplet |
| 306 | b0161-s2 | 0–1 | 0 | replaces `سگ کهف` fragment; house-of-'Isa couplet |
| 357 | b0101-s2 | 6–7 | 266 | eye-light/heart-light couplet, deep in the long section |
| 397 | b0023-s2 | 0–1 | 112 | ladders of earth/heaven couplet |
| 418 | b0169-s2 | 0–1 | 154 | replaces elided heading-compression; "Lust is that snake" |
| 557 | b0043-s2 | 0–1 | 0 | man-of-heart/poison couplet |
| 633 | b0039-s2 | 0–2 | 0 | 3-line ambassador question; quotes balance across the span |
| 643 | b0137-s2 | 0–1 | 42 | the true mosque couplet; **heading dropped** |
| 674 | b0145-s2 | 2–3 | 12 | camel/mouse couplet; avoids mid-quote window |
| 724 | b0059-s2 | 0–1 | 0 | knock-at-the-door couplet, complete lines |
| 812 | b0061-s2 | 1–2 | 16 | mirror couplet; avoids Wikisource typo "tho" at E[3] |
| 946 | b0201-s2 | 0–1 | 0 | replaces Qur'anic-motto fragment; warning couplet |
| 947 | b0205-s2 | 2–3 | 2 | freewill/salt couplet; avoids mid-quote window |
| 959 | b0055-s2 | 2–3 | 2 | lion-valour couplet; avoids mid-quote window |

Evidence-record corrections (44-family):

- **0408**: window → 8–9 (`چشم من ره برد شب شه را شناخت…` F82–83): removes both the
  footnote digit `9` and the unclosed quotation in one faithful shift.
- **0699**: window → 22–23 (F22–23): complete sentences, no dangling quote.
- **0718**: strip trailing footnote marker ` 4` (segment shows markers 3–15 as footnote
  apparatus); span otherwise verbatim (F20–21 confirmed).
- **0751**: strip trailing ` 4`; span F29–30 confirmed verbatim.
- **0759**: window → 4–5 (F4–5): outside the quotation; exact couplet.
- **0813**: window 50–52 (3 lines, F41–43): completes the wolf/Joseph question and
  strips ` 5`.
- **0836**: Persian corrected to F70–71 (`او چو فرعون و تنش موسی او` /
  `او به بیرون می‌دود که کو عدو`): the published F69–70 was off by one hemistich —
  E "He is like Pharaoh…" translates F70, and "He runs abroad crying…" translates F71.

All selected English lines and Persian hemistichs will be re-verified programmatically
(verbatim membership, fail-closed) by the evidence builder before any record is generated.
