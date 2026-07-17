# Corpus repair — Phase 5 authority and provenance report

## Authority model applied

Every record whose text, mapping, reference, or source binding changed carries a **fresh
machine authority**:

| Field | Repaired records (83) | Untouched records (37 Rumi) |
| --- | --- | --- |
| `methodVersion` | `source-bound-alignment-v3-fable5-repair` | `source-bound-alignment-v2` (carried) |
| `model` | `claude-fable-5` | original v2 model (carried) |
| `verifiedAt` | `2026-07-17` | `2026-07-16` (carried) |
| `confidence` | rounded 2-dec (Clarke carried-and-rounded; Bell 0.99/0.97; re-derived Rumi 0.97) | carried bit-for-bit |
| Digest quadruple | recomputed by `machineAuthorityDigests` at generation | unchanged (recomputes identically) |

Breakdown of the 83: 24 Bell (structure + recoveries), 36 Clarke (binding + 8 with text
recoveries), 16 re-derived Rumi, 7 repaired evidence Rumi.

The v3 rationale of every carried-alignment record states explicitly which parts are carried
from v2 and which were re-verified in this campaign — no v2 verification work is
re-attributed, and no v3 stamp was put on records this campaign did not change.

## Verdict states

Only `MACHINE_VERIFIED` / `MACHINE_VERIFIED_WITH_DISCLOSURE` are in production (enforced by
schema + selection gate); `EXCLUDED` records (the 5 archived Rumi selections) remain outside
the poet directories, verified by `productionCorpus.test.ts`.

## Provenance chains

- **Clarke**: `english_source_sha256` = the locked transcript read by the pipeline
  (per-volume `.txt`); the PDF scan hashes remain in `source-lock.json` as acquisition and
  visual-verification evidence; rationale records the chain. Where wording was visually
  corrected from the scan, the record's disclosure names the artefact and page
  (goal Phase 2's two-hash correction-chain requirement: the immutable artefact hashes live
  in the lock, the corrected span hashes are the authority's own span digests).
- **Bell**: bound to the scan PDF — the reconstruction is a two-reading consensus
  (`tesseract-400dpi + archive-ocr`) for which the scan is the visual authority; the locked
  archive text (`e736637a…`) is the corroborating reading used for the Phase 2 proofs.
- **Persian (Hafez)**: bound to the locked Qazvini-Ghani Wikisource EPUB (`a968d2f8…`,
  1.1 MB), which contains the verse itself; the published couplets are verbatim slices of
  its deterministic extraction.
- **Persian (Rumi) — corrected claim**: the records' `persian_source_sha256`
  (`04a80365…`) locks the Wikisource Masnavi EPUB snapshot, which is a **section index
  with no verse** (the pipeline's own `fetch-masnavi-sections.ts` documents this). The
  verse comes from the deterministic per-section extraction
  `sources-private/poetry/extracted/rumi-fa.jsonl`, from which the published spans are
  verbatim consecutive slices. An earlier version of this report wrongly described both
  editions as verse-bound EPUBs; a post-campaign backend audit caught it. The build now
  hash-locks the extraction artifact too (`nicholsonExtraction: f3246de7…` asserted at
  generation time), so the verse artifact can no longer drift silently — but the
  extraction is still absent from `source-lock.json` and the record-level hash still
  names the index snapshot, recorded as an open provenance gap in `10-final-verdict.md`.
- Whole-corpus mechanical verification against those verse artifacts:
  `checked 60 hafez + 60 rumi — ALL SPANS VERBATIM-VERIFIED`.

## Staleness

`assertMachineAuthorityCurrent` re-verifies all four digests plus source ids/hashes at
compile and at selection validation; the committed corpus compiles under the production
profile (120/60/60, `productionEligible: true`), so **zero stale authorities exist**.
