# Review conflict record — machine review vs. packet v1 acceptances

**Date:** 2026-07-14
**Policy:** dual review (structural extraction gate → machine alignment gate →
human approval gate → release compilation gate). Machine review may invalidate an
earlier human acceptance on category or passage evidence. It may not approve
anything.

This file records conflicts openly. The historical decisions file
(`review-decisions.json`, packet v1, outside this repository) is **not rewritten**.
It stays as evidence of what was decided and why.

## Status of packet v1

Packet v1 is **superseded and must not be compiled**. It carries no reviewer
identity (`reviewer` is the empty string) and its own header states it "is not an
approval record and cannot be compiled into the public site". All 8 acceptances
are invalidated below. No acceptance status carries forward to packet v2.

## Invalidated acceptances (8 of 8)

Every accepted pairing had an English side that is Whinfield's prose story
argument or editorial framing, not verse translation. Under the classification
gate added in `scripts/poetry/classify-english-blocks.ts`, every one of these
blocks classifies as `prose_summary` and is ineligible for pairing.

| EN block | FA seq accepted | Machine verdict | Basis |
|---|---|---|---|
| 225 | 761 | `english_not_verse` | Prose argument ("King David purposed to build a temple…") |
| 113 | 121 | `english_not_verse` + `wrong_passage` | Editorial framing ("Next follows an anecdote of Bilkis…"); see below |
| 43 | 750 | `english_not_verse` | Prose argument ("There was a certain merchant who kept a parrot…") |
| 47 | 273 | `english_not_verse` | Prose argument ("In the time of the Khalifa 'Omar there lived a harper…") |
| 157 | 757 | `english_not_verse` | Prose argument ("A PARTY of travelers lost their way…") |
| 161 | 591 | `english_not_verse` | Prose argument ("A certain villager paid a visit to the town…") |
| 221 | 283 | `english_not_verse` | Editorial framing ("THE fourth book begins with an address to Husamu-'d-Din…") |
| 261 | 251 | `english_not_verse` | Commentary with footnote marker ("The doctrine of the Mu'tazilites, 1 mentioned…") |

None is release-eligible. None may reach a public manifest, draw, cache, share
card, or search index.

## The Moses / Solomon transposition, independently confirmed

Packet v1 accepted English *Moses and the Shepherd* (block 113) against Persian
sequence 121, which is `بقیه‌ی عمارت کردن سلیمان علیه‌السلام مسجد اقصی را` —
Solomon building the Masjid al-Aqsa, with the host of Bilqis at prayer. The
reviewer's own note recorded the contradiction and accepted regardless.

The new section-title matcher reaches the same verdict from the titles alone,
without reference to the audit: *Moses and the Shepherd* shares **no** identifying
term with sequence 121, and ranks `انکار کردن موسی بر مناجات شبان` (sequence 65,
Moses objecting to the shepherd's prayer) first. Sequence 121 does not appear in
its candidate list at all.

Both facts are pinned by `tests/content/alignVerseSections.test.ts`.

## What this conflict demonstrates

The human pass produced eight invalid acceptances; machine checking caught them.
Machine ranking, in turn, produces confident-looking noise that only a reader can
catch — `عمر` is both the name Omar and the common noun "life", and *The Arab and
his Wife* ranks the Arab-and-**dog** story on the shared term `اعرابی` alone.

The two gates fail in different directions. That is the argument for keeping both,
and it is why machine verdicts feed the review packet rather than the compiler.
