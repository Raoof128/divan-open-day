# Corpus repair — Phase 7-9 test and build evidence

All commands executed on branch `repair/fable-5-full-corpus`, Node 22.16.0, pnpm 10.33.0.
Every result below was measured in this campaign, not carried from prior evidence.

## Test-driven repair

- `tests/content/corpusIntegrity.test.ts` (new, 13 tests): written **first** and observed
  RED against the pre-repair corpus (**11 failed / 2 passed**), covering: truncation
  brackets, elision marks, trailing footnote digits, OCR patterns (`Iii`, `O them`,
  digit-0 vocative), drop-caps, unbalanced quotations, Rumi line windows, unique Bell
  citations with valid numerals, full Hafez couplets with complete mappings, lock-resolved
  provenance hashes, Clarke transcript binding, Persian EPUB binding, rights-lock coupling.
  GREEN 13/13 after regeneration.
- `tests/content/hafezGhazalExtraction.test.ts` + fixture: new footnote-reference case
  observed RED (fixture reproduced `…یازدهم[` exactly like production ghazal 65), GREEN
  after the extractor repair; 11/11.
- Existing gates kept at full strength; the only test edit besides additions was advancing
  `productionCorpus.test.ts` buildDate to 2026-07-17 (required for the new authorities;
  the assertions themselves are untouched).

## Verification runs (measured)

| Command | Result |
| --- | --- |
| `pnpm poetry:verify-sources` | PASS — 9 artifacts intact |
| `pnpm poetry:build-production` | PASS — 60 Hafez + 60 Rumi, 5 archived |
| `pnpm poetry:inventory` | PASS — 60/60, 0 authorities requiring renewal (note below) |
| `pnpm format:check` / `lint` / `typecheck` | PASS / PASS / PASS |
| `pnpm test` | PASS — 63 files, 732 tests |
| `bash scripts/check.sh` (full gate) | **✓ quality gate passed** (format, lint, typecheck, tests, fixture build, verify:dist, verify:privacy, prod-deps audit, production build 120 items, launch gates closed for true reasons) |
| `pnpm test:e2e` | PASS — 5/5 (Chromium) |
| `pnpm verify:dist` on the production dist | PASS — 120 items, leak check clean |
| `pnpm verify:privacy` | PASS |

One transient: `tests/components/offlineIntegration.test.tsx` failed once under full-suite
load during the first check.sh run and passed on re-run and in the final gate — recorded as
flaky, unrelated to the corpus (pre-existing component test).

## Reproducibility (measured)

Two clean `build:production` runs with identical inputs
(`DIVAN_RELEASE_ID=repro-check`, `SOURCE_DATE_EPOCH=1784269584`):
`dist/release.json` and the content JSON **byte-identical across runs**; the content file is
self-addressed (`a7afbd21…json` equals its own SHA-256). Independently repeated by the
Phase 10 reviewer.

## Public-bundle comparison against the live corpus (measured)

Fetched the live `divan-release-1-v1-0-6` content from the public origin and diffed
item-for-item against the new build: **same 120 ids** (no additions/removals/renames);
**54 items changed publicly** (text and/or disclosures; 13 flip `MACHINE_VERIFIED` →
`MACHINE_VERIFIED_WITH_DISCLOSURE` by gaining disclosures; exactly one public `source`
change — ghazal 65's recovered opening hemistich); **66 items byte-identical**. All other
repair effects (provenance rebinding, windows, confidence, rationale) are private-side by
design of the public compiler.

## Historical-evidence protection incident (disclosed)

Running `pnpm poetry:inventory` regenerated
`docs/verification/2026-07-16-pre-expansion-corpus-inventory.json` in place, overwriting a
locked historical document with current-state data; `corpusInventory.test.ts` caught it and
the file was restored from HEAD untouched. **Residual trap**: the inventory script writes to
a dated historical filename; recorded for the owner rather than repaired here (out of
corpus scope).

## Whole-corpus span verification (measured)

Independent script over all 120 records: every Rumi English line verbatim at its declared
segment window (modulo the three disclosed footnote strips), every Rumi Persian span a
consecutive verbatim run of its Nicholson section, every Hafez Persian couplet verbatim
equal to the extraction and to `opening_hemistich_fa` —
`checked 60 hafez + 60 rumi / ALL SPANS VERBATIM-VERIFIED`.
