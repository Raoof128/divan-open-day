# Corpus repair — final verdict

**Outcome A — CORPUS REPAIR PASS.**

The complete bilingual corpus stands at exactly **60 Hafez + 60 Rumi = 120** production
records, every one source-bound, verbatim-verified against the locked artifacts,
uniquely identified, carrying current machine authority, and passing the full quality
gate. The campaign is documented end-to-end in `00`–`09` of this directory; this file is
the summary of record.

## Final numbers

| Measure | Value |
| --- | --- |
| Corpus | 60 Hafez + 60 Rumi = 120 (validated by compiler, tests, and two independent reviewers) |
| Records repaired in place (v3 authority) | 83 (60 Hafez + 23 Rumi) |
| Records carried unchanged (v2 authority, byte-identical to `adde8b4`) | 37 Rumi |
| Records replaced (identity change) | 1 — `hafez-ghazal-046-bell` → `hafez-ghazal-025-bell` (wrong-poem pairing; Bell VIII is ghazal 25) |
| Records excluded | 0 new (the 5 pre-existing archived Rumi exclusions stand, with reasons) |
| Tier 3 project translations | **0** — every English line is the registered historical translator's, from the locked source |
| OCR/typography interventions (English) | 31 — 13 Bell opening recoveries, 2 Roman-numeral recoveries, 2 drop-cap normalizations, 1 wrap join, 10 Clarke record recoveries (incl. 3 restructured couplets), 3 Rumi footnote strips — each disclosed on its record and premise-asserted at build time |
| Persian recovery | ghazal 65's truncated hemistich (extractor footnote bug, 162/494 ghazals re-extracted; 1 published record affected) |
| Duplicate/overlap checks | 60 unique Hafez identities; zero Rumi Persian-line, English-span, or mapping reuse (reviewer-recomputed) |
| Stale authorities | 0 (all 120 digests recompute exactly; fail-closed staleness gate active) |
| Verdicts | 120 × `MACHINE_VERIFIED_WITH_DISCLOSURE` |

## Gate results (final state, commit `0a5b88f`)

- **Tests:** 63 files / 732 passing (incl. the new 13-test `corpusIntegrity` suite and the
  extractor regression test, both written RED-first); e2e 5/5.
- **Full gate:** `bash scripts/check.sh` green end-to-end; production build 120 items.
- **Reproducibility:** two clean builds byte-identical (`release.json` + self-addressed
  content JSON); independently reproduced by a reviewer.
- **Determinism:** regenerating the corpus over the committed tree yields zero diff.
- **Privacy/leakage:** `verify:privacy` and `verify:dist` pass, plus an independent
  adversarial leak scan (zero forbidden strings; public field set exactly the public
  schema; no authority/mapping/hash material in the bundle).
- **Rights:** all five rights records honest — `pending`, no reviewer claimed, each now
  coupled to its locked artifact hash. No uncertain rights were called approved; no
  attribution or licence requirement was removed. No human blocker needed removal —
  the machine-authority path was already production-sufficient.

## Adversarial re-audit

Four independent falsification-posture reviewers (spans/alignment; OCR recovery;
digests/uniqueness/reproducibility; rights/fail-closed/privacy) covered all nine goal
dimensions across two fix rounds. Thirteen findings/observations: 8 fixed, 1 refuted with
scan evidence, 4 recorded. Zero unresolved. Full detail: `09-adversarial-reviews.md`.

## Truth-boundary attestation

No Persian verse was invented; no English wording is attributed to Bell, Clarke, or
Whinfield that is not in their locked texts (every deviation is a disclosed OCR/typography
recovery verified against the scan or transcript, premise-asserted at build time); no
reference, hash, licence, approval, or reviewer identity was fabricated; no thematic-only
alignment was accepted (the one found was replaced); no Hafez identity is counted twice
and no Rumi span is reused; uncertainty is carried as on-record disclosures, not hidden.

## Residual risks (recorded, not concealed)

1. **Evidence-file trust for 29 Clarke records** — the generator transcript-verifies only
   records with a recovery entry; the rest are trusted from the tracked evidence file.
   All were externally verified against the transcripts this campaign, but the structural
   gap remains for future edits.
2. **`localeCompare` vs code-unit ordering** — latent generator/validator divergence if a
   non-ASCII record ID ever appears; coincident today.
3. **`poetry:inventory` overwrites a dated historical file** in `docs/verification/` —
   the lock test catches it (and did, this campaign), but the script remains a trap.
4. **Disclosure vocabulary** — public disclosures deliberately carry process phrasing
   ("recovered from the locked transcript…"); flagged for a conscious owner sign-off.
5. **Pre-existing, out of scope:** credential rotation from 2026-07-17 still outstanding;
   `offlineIntegration.test.tsx` flakes under full-suite load; the D-15 historical
   evidence file remains tracked as historical record.
6. **Whinfield "tho" transcription typo** (unpublished; selected window avoids it) noted
   for an upstream-source decision.

## Scope compliance

No deploy, no merge, no live-site mutation, no touch of neighbouring services, no
credentials printed, no closed launch gate claimed open. Cultural review, assistive-tech
evidence, QR deliverable, university branding, and provider-review gates remain closed and
untouched.
