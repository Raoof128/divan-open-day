# Machine alignment preflight — findings

**Date:** 2026-07-14
**Branch:** `feat/poetry-source-ingestion`
**Reviewer:** Claude Opus 4.8 (machine), preflight only — no records certified
**Outcome:** Assignment halted at preflight. Release-eligible corpus after honest review: **0**.

## Summary

An autonomous alignment-and-release assignment was scoped on the premise that a
reviewed corpus exists and is blocked by a human-reapproval gate. Preflight
falsified that premise. The gate is not what is blocking the corpus; there is no
valid corpus behind it.

## Finding 1 — all 8 human-accepted Rumi pairings must be excluded

`review-decisions.json` (73 entries, 8 `accept`, 65 `none`) accepts 8 Rumi
pairings. **All 8 pair Whinfield's English prose summary against Persian verse.**
Whinfield's abridgement prints, per story: a prose argument/summary, then verse
translation, then `NOTES:` and footnotes. Every accepted English block is the
prose argument, not the verse.

Evidence (English `rawText`, first words):

| EN seq | FA seq | English block begins | Kind |
|---|---|---|---|
| 225 | 761 | "King David purposed to build a temple at Jerusalem…" | prose summary |
| 113 | 121 | "Next follows an anecdote of Bilkis, Queen of Sheba…" | editorial commentary |
| 43 | 750 | "There was a certain merchant who kept a parrot in a cage…" | prose summary |
| 47 | 273 | "In the time of the Khalifa 'Omar there lived a harper…" | prose summary |
| 157 | 757 | "A PARTY of travelers lost their way in a wilderness…" | prose summary |
| 161 | 591 | "A certain villager paid a visit to the town…" | prose summary |
| 221 | 283 | "THE fourth book begins with an address to Husamu-'d-Din…" | editorial framing |
| 261 | 251 | "The doctrine of the Mu'tazilites, 1 mentioned…" | commentary + footnote marker |

This is the category the design and the assignment brief both mandate as
excluded: headings, notes, introductions, summaries and commentary must never be
published as translated poetry.

## Finding 2 — one accepted pairing is also a story mismatch

`rumi::STORY VII. Moses and the Shepherd.#113` was accepted against Persian
sequence 121. Persian seq 121 is `بقیه‌ی عمارت کردن سلیمان علیه‌السلام مسجد اقصی را`
— "O Solomon, build the Masjid al-Aqsa / the host of Bilqis has come to prayer".
That is Solomon and the Temple, not Moses and the Shepherd.

The reviewer's own note records the contradiction and accepts anyway: *"It
corresponds to Solomon building the temple and Bilqis coming to pray"* — written
against an English text headed *Moses and the Shepherd*.

Separately, `STORY II. The Building of the "Most Remote Temple"#225` was accepted
against Persian seq 761, which is the carob (`خروب`) episode that *ends* the
temple story, while seq 121 (the actual opening of the temple story) was attached
to the Moses entry. The two decisions are effectively transposed.

## Finding 3 — the decisions file carries no reviewer identity

`reviewer` is the empty string. The file's own header states it "is not an
approval record and cannot be compiled into the public site", and that accepting
a pairing there "has not thereby granted literary, cultural, or rights approval."
It cannot serve as the human review the assignment cites as authority.

## Finding 4 — no canonical records exist

`content-private/` contains only `README.md`. There are zero `AuthoringContentItem`
records. The instruction to "review every in-scope record one by one" has an
inventory of zero. What exists is a machine candidate index (99 Hafez, 2,913 Rumi)
built by, in its own words, "transliterated proper-noun / recurring-image
bilingual matching (weak ranking hint only)".

## Finding 5 — Hafez failed for a different, fixable reason

The 33 Bell blocks are genuine verse translations, not apparatus (verified:
c001 "THE bird of gardens sang unto the rose…"). The reviewer rejected 33/33
because the correct Qazvini-Ghani ghazal was not present among the generated
candidates. That is a candidate-generation failure, not a corpus failure.

## Why the requested policy change would not have helped

Removing the human-reapproval gate and making machine verdicts release-final
changes nothing about findings 1–5. With 0 valid pairings, the corpus compiles to
0 either way. Production minimums (≥24 Hafez, ≥16 Rumi) are not close. The gate
was not the blocker.

Note the inversion in the assignment's reasoning: it argues that because human
review is complete, the machine may be final. The evidence runs the other way —
the human pass produced 8 invalid acceptances, and machine checking caught them.
Neither check is redundant, and neither is sufficient alone.

## Recommended next step

Fix candidate generation before any further review:

1. Classify English blocks by kind (verse / prose summary / heading / notes /
   footnotes) at extraction, and make prose and apparatus ineligible as the
   English side of a pairing. Whinfield verse exists — 79 verse-like blocks were
   detected, e.g. the Prologue "HEARKEN to the reed-flute, how it complains".
2. Re-rank Bell against Qazvini-Ghani using Bell's own apparatus rather than
   keyword overlap, so the correct ghazal is reachable.
3. Re-issue the review packet over verse-only English blocks.

Until then the launch gates stay closed, correctly.
