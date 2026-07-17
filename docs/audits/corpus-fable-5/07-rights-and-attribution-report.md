# Corpus repair — Phase 6 rights and attribution report

## What changed

1. **Rights evidence coupled to acquisition** (`sources-private/poetry/rights-evidence.yaml`,
   tracked): all five records now carry `source_lock_reference` — the SHA-256 of an acquired,
   locked artifact of that edition (QG EPUB, Bell PDF, Clarke volume-1 PDF, Nicholson EPUB,
   Whinfield EPUB). This was pure factual coupling: the hashes existed in the tracked
   `source-lock.json` and were referenced by nothing.
2. **Status stays `pending` for all five.** The goal forbids calling uncertain rights
   approved; no human rights review has happened and none is claimed. The schema's rule that
   `approved` requires a named human reviewer is left fully intact — production does not
   gate on that state, so it blocks nothing while preventing fabricated approvals.
3. **Attribution verified per record**: Bell records credit Gertrude Lowthian Bell (1897,
   selection); Clarke records credit H. Wilberforce Clarke (1891); Rumi records credit
   E. H. Whinfield (abridged); Persian sides credit the Qazvini-Ghani / Nicholson Wikisource
   transcriptions (CC BY-SA). No new wording is attributed to any historical translator:
   every deviation from the locked transcript is an OCR/typography normalisation disclosed
   on the record itself, and no Tier 3 project translation was needed anywhere.
4. **CI coupling test** (`tests/content/corpusIntegrity.test.ts`): every record's English
   and Persian hashes must exist in the source lock, Clarke must bind a text artifact, and
   every rights record's `source_lock_reference` must resolve — all from tracked files, so
   the coupling cannot silently rot.

## Human-blocker removal assessment

The goal authorises removing human-only workflow states that exist solely as procedural
production blockers. Inventory of human dependencies found:

| Dependency | Blocks production? | Action |
| --- | --- | --- |
| `rights-evidence` `approved` requires human reviewer | No (pending doesn't gate) | Kept — prevents fabricated approvals |
| Human authority path in `authoringSchema` (review/reflection/approvals) | No (machine path is used) | Kept as legacy support |
| `NEEDS_HUMAN_REAPPROVAL` states | Not present in this codebase | n/a |

No schema requirement forced a fabricated human identity anywhere in the pipeline; the
machine-authority path was already sufficient, so nothing needed to be removed to reach
60/60/120. Tier 3 (project translation) authority was available but unused.

## Not claimed

No legal conclusion beyond the recorded host statements; no cultural or Society review;
no University branding change. The Whinfield "tho" transcription typo (unpublished — the
selected window avoids it) is noted for a future upstream-source decision.
