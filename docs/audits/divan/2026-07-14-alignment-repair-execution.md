# Alignment pipeline repair — execution report

**Date:** 2026-07-14
**Branch:** `feat/poetry-source-ingestion`
**Commits:** `c5d7d54`, `fc6078f`, `00530e7`
**Outcome:** **B — corrected pipeline implemented and executed; corpus remains
below launch thresholds. Gates stay closed.**

Supersedes nothing. The preflight audit
(`2026-07-14-machine-alignment-preflight.md`) is preserved as historical evidence,
and the conflict record (`2026-07-14-review-conflicts.md`) states which earlier
decisions were invalidated and why.

## Outcome in one line

The defect class is now structurally impossible, and Whinfield's real verse — 108
segments, 6,983 lines that the review packet never displayed — is reachable for
the first time. No pairing is approved, because approval requires a human and the
human gate was deliberately kept.

## Corpus results

| Measure | Count |
|---|---|
| Canonical records in `content-private/` | **0** |
| Release-eligible pairings | **0** |
| English segments classified | 643 |
| Pairable (`verse_translation`) | 108 |
| Excluded from pairing | 535 |
| Verse units ranking ≥1 candidate | 47 |
| Verse units with no title signal | 61 |
| Persian sections indexed | 971 |
| Packet v1 acceptances invalidated | 8 of 8 |

Exclusions by classification: 184 `heading`, 86 `editorial_apparatus`, 85
`prose_summary`, 81 `footnote`, 55 `uncertain`, 44 `commentary`.

## Exact remaining gap to launch

Production requires ≥24 Hafez, ≥16 Rumi, ≥40 total, each item carrying a current
human approval **and** a current machine alignment record bound to its digest.

- Hafez: **0 of 24** — shortfall 24.
- Rumi: **0 of 16** — shortfall 16.
- Total: **0 of 40** — shortfall 40.

`pnpm build:production` fails closed: *"Production build blocked: no approved
production corpus exists in content-private."* That is correct and was not
touched.

The gap is not arithmetic. It is that no pairing has been reviewed by a named
human since the pipeline was repaired, and packet v1's eight acceptances were all
invalid.

## What was executed

**Phase 1 — English block classification** (`c5d7d54`). Closed enum
(`verse_translation`, `prose_summary`, `commentary`, `heading`, `footnote`,
`editorial_apparatus`, `uncertain`); only `verse_translation` is pairable. Signals
are structural, never thematic. Thresholds measured, not guessed: across 8,004
lines the distribution is bimodal (verse p50 47, p90 56 characters; prose mean
571) with an empty band between ~70 and ~150. `NOTES:` handled positionally, so
footnote bodies short enough to look like verse remain apparatus. Section titles
peeled from verse runs by terminal punctuation (of 127 short lines following an
argument, 103 end in a full stop and are titles; verse landing there ends
mid-clause).

**Phases 2-3 — verse-only inventory and source-aware ranking** (`fc6078f`).
Classification runs before ranking, so prose cannot reach a pairing. Every
exclusion is recorded with reason and digest. Ranking replaced: section title
against section title (story heading ∪ verse-section title vs Nicholson section
title), word-boundary matched, generic devotional vocabulary excluded from the
lexicon.

**Phase 6 — dual review preserved.** The human gate was NOT removed. The
architecture stands: structural extraction → machine alignment → human approval →
release compilation.

**Phase 8 (partial) — regression tests** (`c5d7d54`, `00530e7`). All eight
defective English blocks pinned `prose_summary` and unpairable; `NOTES:` and
footnotes ineligible; reed-flute Prologue eligible; Moses/Shepherd cannot align to
the Solomon sequence; generic vocabulary cannot match; empty reviewer identity
cannot constitute approval.

## Evidence the repair works

Ground-truth pairs, top-ranked correctly from titles alone: Prologue→`نی‌نامه`(0);
Prince/Handmaid→`پادشاه و کنیزک`(1); Harper→`پیر چنگی`(466); Arab/Dog→(361);
Merchant/Parrot→`بازرگان`/`طوطی`.

The matcher independently reproduces the audit's Moses/Solomon verdict without
reference to it: sequence 121 is absent from *Moses and the Shepherd*'s candidate
list, and `انکار کردن موسی بر مناجات شبان` (65) ranks first.

## Verification

Node 22.16.0, pnpm 10.33.0. `pnpm test` 588/588 across 47 files (+19 net-new
today). `pnpm typecheck` 0. `pnpm lint` 0. `pnpm build:production` fails closed as
designed. Excerpt-bearing `rumi-verse-candidates.json` is git-ignored by existing
pattern; the tracked summary carries counts and caveats only.

## Not done, and why

- **Phases 4, 5, 7** — canonical records, per-record machine verdicts for all 108
  verse units, and packet v2 — are **not** done. Authoring 108 verdicts, each
  demanding ≥3 independent anchors read against both sources, is a substantial
  reading task; producing them quickly would manufacture exactly the
  confident-looking noise this repair exists to eliminate. The pipeline now feeds
  them; the reading has not been done.
- Even completed, they could not open the gates. Machine verdicts feed the packet,
  not the compiler.

## Honest limitations

- **Ranking is a hint, not identification.** Single-anchor (score 1) hits are
  demonstrably unreliable: `عمر` is both the name Omar and the common noun "life",
  and *The Arab and his Wife* ranks the Arab-and-**dog** story on `اعرابی` alone.
- **61 of 108 verse units have no title signal.** Abstract section titles ("Trust
  in God, as opposed to human exertions") name no figure. Title alignment cannot
  reach them; body-level reading can.
- **Hafez is untouched by the ranking repair.** Bell's 33 blocks are genuine verse
  and remain eligible, but Bell's apparatus gives no ghazal numbers — her notes are
  literary commentary keyed to her own Roman numerals, and she predates
  Qazvini-Ghani (1941) — so no mechanical concordance exists. Bell→Qazvini-Ghani
  needs matla/content matching or a scholarly concordance. Not invented.
- **Persian book boundaries are not derived.** Nicholson's sections carry no `دفتر`
  marker and the source offers no concordance. Book is English-side evidence only,
  never a filter.
- **Verse-interior section titles remain inside their run.** No prose anchor, no
  markup — a boundary imprecision within verse, not a category error.
- **Machine literary alignment is not scholarship.** It checks category and
  identity. It does not establish that a translation is faithful, and it is not a
  substitute for the human gate — which the preflight showed catches what machines
  miss, and which this run showed misses what machines catch.
