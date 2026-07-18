# Corpus repair — Phase 1 record inventory (baseline, pre-repair)

Machine-readable companion: `01-record-inventory.json` (all 120 records: identities, source
references, exact published lines, mappings, authority digests, automated defect flags).
Generated 2026-07-17 from branch `repair/fable-5-full-corpus` @ `adde8b4` by a scanner that
imports the repository's own `authoringSchema` / `canonicalIdentity` / `machineAuthorityDigests`
modules, so every digest was recomputed with the real algorithm.

## Baseline structural state (verified, not re-litigated later)

| Check | Result |
| --- | --- |
| Total records | 120 (60 Hafez, 60 Rumi) |
| All records parse `authoringContentItemSchema` | PASS |
| All 120 authority digest quadruples recompute exactly | PASS (`digestsAllMatch: true`) |
| Authority kind | `machine_alignment` on all 120 |
| Verdicts | `MACHINE_VERIFIED` / `MACHINE_VERIFIED_WITH_DISCLOSURE` only |

## Record families (how each was produced)

| Family | Count | Generator path | Text source |
| --- | --- | --- | --- |
| Bell Hafez | 24 | `makeHafezItems` | `bell-poems.json` OCR reconstruction lines[0..1] + `hafez-ghazals-fa.jsonl` hemistich[0] |
| Clarke Hafez | 36 | `makeClarkeHafezItems` | `2026-07-16-final-alignment-evidence.json` `newHafez` (continuous spans from the locked Clarke transcripts) |
| Rumi (anchor-published) | 16 | `makeRumiItems` | `rumi-alignment-candidates.json` `anchors[0..1]` verbatim |
| Rumi (evidence spans) | 44 | `makeEvidenceRumiItems` | `2026-07-16-final-alignment-evidence.json` `newRumi` (continuous spans) |

## Automated flag counts (120 records scanned)

```
bracket-in-verse            1   (hafez-ghazal-065-bell)
truncated-english-tail      1   (hafez-ghazal-163-bell)
drop-cap                    2   (hafez-ghazal-046-bell, -288-bell)
ocr-iii                     1   (hafez-ghazal-350-clarke)
ocr-o-them                  1   (hafez-ghazal-489-clarke)
persian-heading-as-verse    2   (rumi-masnavi-0643, -0946)
persian-line-not-in-section 3   (rumi-masnavi-0397, -0418, -0674)
short-persian-fragment      1   (rumi-masnavi-0306)
elision-mark                6   (rumi 0357, 0397, 0418, 0557, 0674, 0947)
trailing-digit              3   (rumi 0718, 0751, 0813)
unbalanced-quotes           3   (rumi 0408, 0699, 0759)
joined-couplet-line         7   (rumi anchor-family)
no-line-window             16   (exactly the 16 anchor-published Rumi records)
single-hemistich-mapping   24   (exactly the 24 Bell records)
confidence-clamped-floor   41   (0.8 literal)
confidence-float-noise     46   (raw float artefacts)
```

The `no-line-window` set and the anchor-published family coincide exactly, and the
`single-hemistich-mapping` set and the Bell family coincide exactly — the defects are
family-level generator behaviours, not per-record accidents. This is why the repair operates
on the generator and its evidence inputs, then regenerates, rather than editing YAMLs.

Findings not detectable by the automated scan are carried in `02-defect-ledger.md`
(wrong Bell numerals, duplicate Bell citation, crossed 0836 mapping, PDF-vs-transcript
binding, rights coupling, half-hemistich fragments in 0633/0724, Arabic-quote fragments in
0300/0946, the 091-clarke double-line truncation).
