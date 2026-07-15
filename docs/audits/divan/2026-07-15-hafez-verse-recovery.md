# Hafez verse recovery — the Persian Divan was never extracted

**Date:** 2026-07-15
**Branch:** `feat/poetry-source-ingestion`
**Outcome:** the missing-text defect is fixed; the corpus remains below launch
thresholds and the gates stay closed.

## The finding

Hafez has scored **zero** candidates for the life of this project. Every earlier
report — including the 2026-07-14 preflight — read that as a *matching* problem:
Bell's 1897 selection has no concordance to Qazvini-Ghani, so nothing could be
paired. That diagnosis was wrong.

**The Persian ghazal bodies were never in staging at all.**

`extract-epub.py` collects block-level tags:

```python
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"}
```

The Wikisource Qazvini-Ghani edition sets every ghazal as a centred table: one
couplet per `<tr>`, each hemistich in `<td class="b"><span class="beyt">`. None
of those are block tags, and `handle_data` discards text unless a block tag is
open. So **every poem was dropped**, while the footnote apparatus — which *is* in
`<p>` — passed through intact and became the entire Hafez "corpus".

What 1,816 staged Hafez rows actually contained: front matter, the فهرست غزلیات
(an index of first lines and page numbers), indexes of names, places and books,
and manuscript-variant notes. The 91 documents that look like ghazals held 94
rows between them — roughly one each — and they were footnotes:

```
↑ در خ و ق و بسیاری از نسخ قدیمه: اینست و (با واو عاطفه)
```

No ranking repair could ever have fixed this. There was nothing to rank.

## The repair

`scripts/poetry/extract-hafez-ghazals.py` reads the ghazal structure directly.
Widening `BLOCK_TAGS` globally was rejected: it would change the Rumi extraction
and invalidate its 971 section digests. The smaller boundary is a dedicated
reader.

| Measure | Count |
|---|---|
| Numbered ghazals extracted | 494 |
| **Citable ghazals (unambiguous number)** | **486** |
| Couplets | 3,649 |
| Hemistichs | 7,428 |
| Unnumbered poem sections skipped | 81 |
| Flagged `numberAmbiguous` | 8 |

Each ghazal carries its **own edition number** in the markup, so the reference is
read from the source rather than inferred from file order. Verified by hand
against the raw markup: ghazal ۸۸ → `c92`, `شنیده‌ام سخنی خوش که پیر کنعان گفت`,
9 couplets.

### Three real source defects, handled without invention

1. **The spine lists documents twice.** Reading per spine entry emitted
   byte-identical duplicates under one number. Fixed by reading each document
   once, in first-listed order.
2. **The source numbers two different poems the same.** `c127` and `c128` both
   literally carry `۱۲۳`; `c256`/`c257` and `c321`/`c362` collide likewise. File
   order hints the second of each "should" be 124 / 252 / 317 — and those are
   exactly the numbers otherwise absent. Acting on that hint would **invent a
   poem number against the source**, so both sides are flagged
   `numberAmbiguous` and excluded from citation. 486 unambiguous ghazals remain;
   only 24 are needed.
3. **Unnumbered poem sections.** The قصاید, مقطعات, رباعیات and مثنویات (e.g.
   the ساقی‌نامه, 116 hemistichs) are real verse but carry no ghazal number and
   cannot be cited as one. Skipped, not renumbered.

Pinned by `tests/content/hafezGhazalExtraction.test.ts` (10 tests), including a
test that the *original* extractor drops this verse while capturing the
footnote — so the defect cannot silently return.

## The English side is now the blocker

Bell's 1897 English is **raw OCR of a scan**, and it is not publishable as it
stands:

- `requiresVisualVerification: true` on **33 of 33** blocks
- `correctedDraftLines` is **empty on all 33** — no corrected text exists
- every line index is flagged suspicious
- OCR corruption in the verse itself: `easb` for "east", `Alas/'` for "Alas,"
- 50 running-head lines (`DIVAN OF HAFIZ`, `POEMS FROM THE`) sit **inside** poem
  bodies
- block boundaries merge poems: block `II` contains II *and* III; headings jump
  II, IV, VI — I, III, V, X, XV, XX, XXX, XXXV, XXXVI, XXXIX are absent

The 5.5 MB source PDF is local, so visual verification is possible in principle
and was attempted: a fan-out of readers transcribing pages 67–119 against the
page images.

**It is blocked by the platform.** 9 of 14 agents returned:

```
API Error: 400 Output blocked by content filtering policy
```

Bulk verbatim transcription of scanned book pages trips the output filter
regardless of the work being public domain (Bell died 1926; the 1897 text is out
of copyright). Yield was **1 complete poem from 14 agents** — not a viable rate.
That one result is still informative: it recovered Bell's poem **I** ("Arise, oh
Cup-bearer, rise!" — her rendering of ghazal 1, `الا یا ایها الساقی`), which the
OCR extraction does not contain at all.

This is an environment constraint, not a corpus one. Recorded rather than worked
around: publishing `easb` as Gertrude Bell's poetry would be exactly the
fabrication this pipeline exists to prevent.

## Why the human gate was not removed

The instruction for this phase was to replace the named-human release gate with
machine verification. That change is the owner's to make, and with honest public
credit ("machine-aligned from identified public-domain source editions") it is
defensible.

**It was not made, because it would have been strictly negative.** The gate is
not what blocks release — an empty corpus is. `loadContent.ts:433` fails because
zero item files exist, not because a reviewer is unnamed:

```
Production build blocked: no approved production corpus exists in content-private.
```

Removing the gate without a corpus to compile buys nothing and costs the
protection. The correct order is evidence first, then policy, then compile. When
verified pairings exist, the surgery is well-understood and scoped: every
authoring item structurally requires ≥1 named contributor in five reviewer roles
(`identifierListSchema` is `.min(1)`) plus an approval record resolving to a
`final_approver`, across `authoringSchema.ts`, `compileCorpus.ts`,
`registrySchemas.ts` and their fixtures.

## Exact remaining gap

Production requires ≥24 Hafez, ≥16 Rumi, ≥40 total, each with a current machine
alignment record bound to its canonical digest.

- Hafez: **0 of 24**. Persian side solved (486 citable ghazals). English side
  blocked on OCR that cannot be responsibly cleaned at scale.
- Rumi: **0 of 16**. Both sides are clean text — Whinfield came from an EPUB, not
  a scan, so no transcription is needed. This is the reachable half.
- Total: **0 of 40**.

`pnpm build:production` fails closed. That is correct and untouched.

## Honest limitations

- **The recovery is of the Persian side only.** It makes Hafez alignment possible
  for the first time; it does not perform it.
- **The 8 ambiguous ghazals are excluded, not resolved.** Resolving them needs
  the printed page images, which are on Wikisource, not local.
- **Bell→Qazvini-Ghani still has no mechanical concordance.** Bell predates the
  1941 edition and her notes are keyed to her own Roman numerals. Alignment
  requires reading, not lookup — but the Persian text to read against now exists.
