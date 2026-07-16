# Bell reconstruction and Rumi machine alignment

**Date:** 2026-07-15
**Branch:** `feat/poetry-source-ingestion`
**Outcome:** Bell's English is recoverable and largely recovered; 21 Rumi
pairings are machine-verified against adversarial review. Rumi is over its
threshold of 16; Hafez is not started. The gates stay closed.

**Amended 2026-07-16.** This document first reported 15 verified with 27
candidates untested. The refuter votes for those 27 had in fact completed before
the session limit and were recoverable from the agent transcripts; §2 is
rewritten against the full vote set. The count rises to 21 — and one of the
original 15 (**seq 717**) is retracted. See §2.1.

## 1. Bell's English is recoverable — via local OCR, not model transcription

The staged Bell text is Internet Archive OCR and is not publishable:
`requiresVisualVerification` true on 33/33 blocks, `correctedDraftLines` empty on
all 33, running heads inside poem bodies, and corruption in the verse itself —
the archive reads `easb` where the page says `east`.

Transcribing the scan through the model was tried on 2026-07-14 and is blocked:
9 of 14 readers returned `400 Output blocked by content filtering policy`,
yielding one complete poem from fourteen agents. Bulk verbatim reproduction of
scanned book pages trips the output filter regardless of the work being public
domain.

**The fix is to never route the text through the model at all.** Pages are
rendered locally and OCR'd locally; the text lands in files. The model sees only
short disputed spans.

```
pdftoppm -r 400 -f 60 -l 125 -png source.pdf pages/p
tesseract pages/p-NNN.png text/p-NNN --psm 6 -l eng
```

`ocrmypdf` is not installed and was not needed; `tesseract 5.5.2`, `pdftoppm` and
`gs` are present. No network, no new dependency, no model output — and therefore
no filter.

The result, on the line that named the problem:

| reading | text |
|---|---|
| archive OCR (ABBYY) | `North  winds  and  easb  waft  them  where  they  are  bound,` |
| fresh local OCR (Tesseract, 400dpi) | `North winds and east waft them where they are bound,` |

Two OCR engines, independently, on the same scan. Where they agree on the words,
the line is corroborated. Where they disagree, it is flagged — never resolved by
guessing.

| Measure | Count |
|---|---|
| Poems detected | 40 |
| Lines | 1,340 |
| **Corroborated by two independent readings** | **1,270 (94.8%)** |
| Disputed | 70 |
| Poems fully corroborated (publishable) | 5 |
| Poems with ≤2 disputed lines | 33 |

### Three defects found — all three mine, not the OCR's

1. **Prose published as poetry.** Splitting on Roman numerals alone swept Bell's
   prose introduction in as "poem I" — 155 lines of essay (`"sings Hafiz"`,
   `"The catalogue might be continued"`). This is the same defect class that
   invalidated the eight Whinfield acceptances: commentary presented as verse.
   Fixed structurally, by the running head printed on every page
   (`INTRODUCTION` vs `POEMS FROM THE`). The verse begins at scan page **71**,
   not 67 as the stale block metadata claimed.
2. **The comparison was the bug.** Comparing with punctuation kept made
   `rise  !` and `rise!` a conflict, flagging 396 lines. The archive prints
   Bell's small-caps opening word as `ARISE` and spaces its punctuation; neither
   is a disagreement about the page. Comparing words only: **396 → 70**.
3. **A page number split a poem in half.** Scan page 115 carries printed page
   number 111; the heading shape allowed digits. Headings are Roman, page
   numbers are Arabic.

### Damaged numerals: boundary separated from identity

The OCR mangles the numerals themselves — `Il` (II), `Ul` (III), `XXVILI`
(XXVII). Requiring a valid numeral **missed the heading**, and the poem below it
merged into its predecessor: that is how II and III ended up inside poem I.

Detection and identification are therefore separate. The boundary is found by
shape; the numeral is kept **verbatim and flagged** when it fails validation.
It is never repaired from sequence — if one heading were missed, renumbering
would silently shift every later poem's reference.

This costs nothing. **Bell's numeral is not a citation of Hafez**; it is her
poem's position in her own book. The Persian reference comes from the ghazal
number via alignment, and the English side is cited by scan page, which reads
reliably.

Pinned by `tests/content/bellReconstruction.test.ts` (14 tests).

## 2. Rumi machine alignment: 21 verified of 47 examined

Method: section-title candidate ranking → bilingual aligner → **three-lens
adversarial refutation** (generic-anchors / materially-different / a-better-
section-exists). A pairing is verified only when ≥2 refuters returned and **none**
refuted. Anchors are capped at 200 characters — citations, never passages.

Agents emit only short structured verdicts. **Zero content-filter blocks across
189 agents**, confirming the filter targets bulk verbatim reproduction, not
analysis.

| Outcome | Count |
|---|---|
| Examined | 47 |
| Proposed by aligners | 47 |
| **Verified (≥2 refuters, zero refutations)** | **21** |
| Genuinely refuted | 14 |
| **Insufficient evidence — only 1 refuter returned** | **6** |

**The aligners proposed 47 of 47 with zero exclusions.** That number is not
credible on its own — the previous human pass accepted 8 of 8 and every one was
wrong. Adversarial review cut it to 21, refusing 14 outright and declining to
rule on 6.

Verification strength varies and is recorded per pairing:

| Refuter votes | 6 | 5 | 4 | 3 | 2 |
|---|---|---|---|---|---|
| Verified pairings | 2 | 5 | 9 | 4 | 1 |

20 of the 21 carry ≥3 independent refutation attempts. The single 2-vote pass is
the weakest evidence in the set and is flagged as such in the record.

The 6 insufficient are **undecided, not disproven** — one refuter each. The gate
is fail-closed (≥2 must return), so they correctly did not pass.

### 2.1 The retraction: seq 717

**Seq 717 was among the original 15 and is now refuted.** It passed on 3 votes;
a 4th vote returned and refuted it. Nothing about the pairing changed — only the
number of skeptics who looked at it.

This is the clearest evidence in the run that the vote threshold is doing real
work rather than ceremony. A pairing that had cleared adversarial review at 3
votes did not survive 4. It also means the earlier "15 verified" figure was not
merely incomplete but **wrong in one direction that matters**: it published a
pairing that further review rejects. Weak-evidence passes should be read as
provisional, not as findings.

### 2.2 How the 27 were resolved without new agents

The 27 were reported untested because the run hit `You've hit your session limit`
after 10.3M subagent tokens. That framing was wrong: the refuters had returned;
their verdicts were sitting in the agent transcripts, unaggregated. Recovery was
a local join — map `agentId` → the `CLAIM:` line in each transcript, re-apply the
same gate — costing **zero new agents and zero tokens**.

No verdict was re-derived, softened, or re-run to a preferred answer. The gate
applied to the recovered votes is the identical one, which is why it retracted
seq 717 rather than confirming the earlier number.

### What the skeptics caught

| Section | Refutation |
|---|---|
| 466 | Boundary false — English covers hemistichs 78–103 (~21%); 10 bayts run on untranslated |
| 480 | Anchors real but cover ~11% of the section; **names seq 548 as the better match** |
| 667 | Section identity holds; "abridged" understated **2×** — Persian has 3 couplets, Whinfield 11, so **8 are unsupported** |
| 669 | All six anchors verify verbatim; refuted on **scope**, not identity |
| **757** | **Anchors #1/#2 cite text from `s0` (prose_summary), not `s2` (verse)** |
| **717** | **Passed at 3 votes; the 4th refuted it. Retracted — see §2.1** |

757 is the packet-v1 defect resurfacing. The classifier bars prose from
*pairing*, but the aligner still read the whole block and reached into the prose
summary for evidence. Three-vote adversarial review caught it. This is the
argument for keeping independent verification rather than trusting a confident
single pass.

## Exact remaining gap

- Rumi: **21 of 16** verified — over threshold, with 5 pairings of margin.
- Hafez: **0 of 24**. Persian solved (486 ghazals); English now 94.8%
  corroborated with 5 poems fully clean and 33 within two lines of clean.
- Total: **21 of 40**. Hafez alignment is the whole remaining gap.

Verified pairings are **machine alignment evidence, not canonical records**. No
authoring item exists yet, so `build:production` still fails closed at
`loadContent.ts:433` — correctly, and untouched.

## Honest limitations

- **A verified pairing is not a record.** It asserts that this English renders
  that Persian. It does not select excerpt boundaries, write a reflection, or
  establish rights.
- **A 2-vote pass is weak.** One verified pairing rests on two refuters, and seq
  717 shows exactly what that risks: 3 votes were not enough to hold. Treat
  low-vote passes as provisional until a canonical record is authored against
  them.
- **The 6 undecided are a gap in evidence, not a finding.** One refuter each.
- **Corroboration is not proof.** Two OCR engines agreeing on a word is strong,
  but they read the same scan. The page image remains the arbiter for the 70
  disputed lines.
- **The reviewer-union gate is not built.** Every authoring item still
  structurally requires named humans in five roles. That change is scoped but
  deliberately not made while the corpus is below threshold: removing protection
  before there is anything to compile costs the protection and buys nothing.
