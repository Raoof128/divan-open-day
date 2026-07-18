# Corpus repair — Phase 0 preflight

Goal: DIVAN Claude Fable 5 Full Corpus and Translation Repair.
Date: 2026-07-17. Lead: Claude Fable 5 (`claude-fable-5`).

## Repository state

| | |
| --- | --- |
| Repository | `Raoof128/divan-open-day` (`https://github.com/Raoof128/divan-open-day.git`) |
| Working tree | `/Users/raoof.r12/Desktop/Raouf/OpemDay` |
| Starting point | `origin/main` @ `adde8b4ce2adb5a8c612561601e586fc9232877f` (v1.0.6 line) |
| Repair branch | `repair/fable-5-full-corpus`, created from `origin/main` |
| Untracked items preserved | `New_Frontend/`, `docs/audits/frontend-opus-4-8/`, `scripts/poetry/build-hafez-align-tasks.ts`, 3 private report JSONs under `sources-private/poetry/reports/` (never staged) |

The goal document lives on `origin/docs/fable-5-full-corpus-repair-goal`; work does **not**
happen on that branch. The prior backend audit (PR #17, branch
`audit/fable-5-exhaustive-backend`) is **not** merged into `main`; its corpus defect ledger
was read from that branch before switching and is incorporated into Phase 1 here.

## Authorities read (complete)

- `AGENT.md`, `CHANGELOG.md`, `CLAUDE.md`, `content-private/README.md` (read fully in this
  campaign or carried verbatim from the backend audit of the same tree `adde8b4`).
- The full corpus validation pipeline, personally, line by line, this session:
  `src/lib/content/{authoringSchema,reviewAuthority,registrySchemas,sourceRightsSchema,canonical,canonicalIdentity,compileItem,compileCorpus,productionManifest,productionSelection}.ts`
  and `scripts/poetry/build-production-corpus.ts` (754 lines).
- Backend audit ledger `docs/audits/backend-fable-5/07-consolidated-defect-ledger.md`
  (read from `audit/fable-5-exhaustive-backend` @ `2ef8b72` before branch switch) — its
  22 corpus content/provenance defect classes seed Phase 1.
- Defective-record spot reads: `content-private/hafez/hafez-ghazal-065-bell.yaml`,
  `content-private/rumi/rumi-masnavi-0643-whinfield.yaml`.
- Source registries: `sources-private/poetry/{source-lock.json,rights-evidence.yaml}`
  (both **tracked** in git), plus structure probes of
  `extracted/{hafez-ghazals-fa,rumi-fa,rumi-whinfield-en}.jsonl` and
  `bell-ocr/bell-poems.json` (both git-ignored, local only).

## How the corpus is actually produced (load-bearing for every repair)

All 120 `content-private/{hafez,rumi}/*.yaml` records are **generated** by
`pnpm poetry:build-production` (`scripts/poetry/build-production-corpus.ts`) from four inputs:

1. `sources-private/poetry/bell-ocr/bell-poems.json` — OCR-reconstructed Bell poems
   (24 Bell records via `HAFEZ_PRODUCTION_SELECTION`).
2. `sources-private/poetry/extracted/hafez-ghazals-fa.jsonl` — 494 Qazvini-Ghani ghazals
   (Persian hemistichs; the published Bell Persian line is `hemistichs[0]`).
3. `sources-private/poetry/reports/rumi-alignment-candidates.json` — 21 verified alignments;
   **16 selected records publish `anchors[0..1]` verbatim as verse** (root cause of the
   heading/fragment defect class).
4. `docs/verification/2026-07-16-final-alignment-evidence.json` (**tracked**) — 36 Clarke
   Hafez + 44 Rumi continuous spans.

Therefore every text repair lands in those inputs and/or the generator, records are
regenerated, and `authorityFor()` recomputes all span/mapping/identity digests. Hand-editing
individual YAMLs would be silently reverted by the next regeneration and is not used.

## Gates that constrain repairs (verified in code)

- `authoringSchema`: 1–6 lines each side, ≤500 chars, no markup/bidi controls, every English
  line mapped exactly once; Hafez requires `opening_hemistich_fa`.
- `productionManifest.validateProductionSelectionManifest`: exactly 120 records (60/60),
  canonical poet/ID order, **Rumi records need ≥2 English AND ≥2 Persian lines**, Hafez
  canonical-identity dedupe, Rumi English-span/mapping/Persian-line (normalized) dedupe,
  authority digests re-verified against live recomputation at validation time.
- `reviewAuthority.assertMachineAuthorityCurrent`: any change to text, mapping, reference or
  source hash invalidates the stored authority — stale authorities cannot compile.
- `compileCorpus`: fixture-sentinel rejection, exact 60/60/120, per-item permission joins
  (active, worldwide, effective, exact attribution + rights-owner match).
- `sourceRightsSchema`: `approved` requires a named human reviewer AND a source-lock SHA-256;
  `pending` does not block production. "ai"/"claude" are structurally invalid reviewer ids.

## Facts established that repairs will use

- Clarke transcripts are **already locked**: `raw/hafez-clarke-1891-en/volume-1.txt`
  (`ff0642a5…`) and `volume-2.txt` (`ac0ea92c…`); Bell has `source.txt` (`e736637a…`).
  Clarke records' own disclosure says text was normalised "from the locked Internet Archive
  transcript" while `english_source_sha256` binds the **PDF** — the provenance repair can
  bind the artifact actually read without any new source acquisition.
- `bell-poems.json` reproduces the exact Bell defect mechanisms:
  `bellNumber: "Ul"` (p073), p121 **and** p122 both `XLII`, scan line-wrap splits
  (`…the sweet laughter of` / `wine ;` on p097), undisclosed drop-caps
  (`THE rose…` p079, `THE margin…` p119) with `corroborated` status.
- `hafez-ghazals-fa.jsonl` ghazal 65 `hemistichs[0]` = `خوشتر ز عیش و صحبت و باغ[` —
  the truncation is in the **extraction**, to be re-verified against the locked EPUB
  (`a968d2f8…`) in Phase 2.
- `rumi-fa.jsonl` carries full Nicholson section text (verse lines, headings separate in
  `headingPath`), enabling verse recovery for the anchor-published records.

## Boundaries in force

No deploy, no merge, no live-site or infrastructure mutation, no `.env` access, no
`git add -A`/force-push, unrelated untracked files preserved, no fabricated verse or
attribution (goal §Truth boundary), evidence uses identifiers/hashes/short excerpts only.
