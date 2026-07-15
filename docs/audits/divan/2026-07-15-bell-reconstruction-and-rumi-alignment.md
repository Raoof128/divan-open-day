# Bell reconstruction and Rumi machine alignment

**Date:** 2026-07-15
**Branch:** `feat/poetry-source-ingestion`
**Outcome:** Bell's English is recoverable and largely recovered; 15 Rumi
pairings are machine-verified against adversarial review. Below thresholds. The
gates stay closed.

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

## 2. Rumi machine alignment: 15 verified of 47 examined

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
| **Verified (≥2 refuters, zero refutations)** | **15** |
| Genuinely refuted | 5 |
| **Unverified — refuters never returned (session limit)** | **27** |

**The aligners proposed 47 of 47 with zero exclusions.** That number is not
credible on its own — the previous human pass accepted 8 of 8 and every one was
wrong. Adversarial review cut it to 15.

The 27 are **untested, not disproven**. The run hit
`You've hit your session limit` after 10.3M subagent tokens. The gate is
fail-closed (verification requires ≥2 refuters to actually return), so they
correctly did not pass — but they carry no evidence either way and should be
re-run.

### What the skeptics caught

| Section | Refutation |
|---|---|
| 466 | Boundary false — English covers hemistichs 78–103 (~21%); 10 bayts run on untranslated |
| 480 | Anchors real but cover ~11% of the section; **names seq 548 as the better match** |
| 667 | Section identity holds; "abridged" understated **2×** — Persian has 3 couplets, Whinfield 11, so **8 are unsupported** |
| 669 | All six anchors verify verbatim; refuted on **scope**, not identity |
| **757** | **Anchors #1/#2 cite text from `s0` (prose_summary), not `s2` (verse)** |

757 is the packet-v1 defect resurfacing. The classifier bars prose from
*pairing*, but the aligner still read the whole block and reached into the prose
summary for evidence. Three-vote adversarial review caught it. This is the
argument for keeping independent verification rather than trusting a confident
single pass.

## Exact remaining gap

- Rumi: **15 of 16** verified — one short, with 27 untested candidates in
  reserve.
- Hafez: **0 of 24**. Persian solved (486 ghazals); English now 94.8%
  corroborated with 5 poems fully clean and 33 within two lines of clean.
- Total: **15 of 40**.

Verified pairings are **machine alignment evidence, not canonical records**. No
authoring item exists yet, so `build:production` still fails closed at
`loadContent.ts:433` — correctly, and untouched.

## Honest limitations

- **A verified pairing is not a record.** It asserts that this English renders
  that Persian. It does not select excerpt boundaries, write a reflection, or
  establish rights.
- **The 27 unverified are a gap in evidence, not a finding.** Re-run them.
- **Corroboration is not proof.** Two OCR engines agreeing on a word is strong,
  but they read the same scan. The page image remains the arbiter for the 70
  disputed lines.
- **The reviewer-union gate is not built.** Every authoring item still
  structurally requires named humans in five roles. That change is scoped but
  deliberately not made while the corpus is below threshold: removing protection
  before there is anything to compile costs the protection and buys nothing.
