# Poetry source ingestion runbook

How the DIVAN source-provenance layer works and how a human operator drives it.
This layer **acquires and stages archival sources and proposes candidate
mappings**; it never publishes poetry. The public corpus stays fail-closed until
the Society's reviewers approve real content through the existing
authoring/registry/compiler pipeline (`content-private/`, `src/lib/content/`).

## Pipeline overview

```
registry.yaml ──▶ poetry:fetch ──▶ raw/ + source-lock.json ──▶ poetry:verify-sources
                                          │
                                          ├─ poetry:extract       (EPUB → extracted/*.jsonl)
                                          └─ poetry:extract-bell   (Bell OCR → candidates)
                                                     │
                                          poetry:build-candidates  (machine hints, NOT publishable)
                                                     │
                                   ┌───────── HUMAN REVIEW (Society) ─────────┐
                                   │  Persian source · translation · cultural │
                                   │  · rights · OCR-vs-scan verification      │
                                   └───────────────────────────────────────────┘
                                                     │
                       content-private/ authoring records ──▶ existing compiler ──▶ dist/
```

## Commands

| Command                        | What it does                                                                   | Network               |
| ------------------------------ | ------------------------------------------------------------------------------ | --------------------- |
| `pnpm poetry:verify-sources`   | Re-hash acquired files against `source-lock.json`                              | none                  |
| `pnpm poetry:fetch`            | Download the four editions into git-ignored `raw/`, write `source-lock.json`   | **yes (owner-gated)** |
| `pnpm poetry:extract`          | Deterministic EPUB → `extracted/*.jsonl` (raw + search text separated)         | none                  |
| `pnpm poetry:fetch-masnavi`    | Persian Masnavi verse from Wikisource ProofreadPage sections → `rumi-fa.jsonl` | **yes (owner-gated)** |
| `pnpm poetry:extract-bell`     | Parse Bell OCR into candidate sections (raw kept, no auto-correction)          | none                  |
| `pnpm poetry:build-candidates` | Machine candidate index (`machineGeneratedCandidate`, `publishable:false`)     | none                  |
| `pnpm verify:dist`             | Existing dist check **+ archival-leak gate** (`inspect-public-bundle`)         | none                  |

All scripts are safe no-ops before a fetch: they print "not acquired yet".

### Why the Persian Masnavi needs a separate step

The `مثنوی معنوی` root page on Persian Wikisource is only a **section index**, so
its EPUB export contains section _titles_, not couplets (the verse lives in ~1000
ProofreadPage subpages, each wrapping hemistichs in `<span class="beyt">`).
`poetry:extract` therefore skips it, and `poetry:fetch-masnavi` fetches the real
verse per section (rate-limited, ordered by scan page) and owns `rumi-fa.jsonl`.
The Bell 1897 English is a _selection_ and the Whinfield English is _abridged_, so
their coverage is intentionally partial. Source-bound machine authority pairs
selected excerpts and publishes limitations as disclosures.

## Safety properties (enforced by tests)

- **Acquisition** (`tests/content/sourceLock.test.ts`): only allowlisted HTTPS
  hosts (`archive.org`, `ws-export.wmcloud.org`, `fa/en.wikisource.org`); every
  redirect hop revalidated; HTTP rejected; oversize responses abort and clean up;
  HTML-in-place-of-EPUB rejected; hash-locked files not re-downloaded; a hash
  mismatch fails loudly. No poem text or secret is logged.
- **Registry** (`tests/content/sourceRegistry.test.ts`): strict schema, HTTPS +
  allowlisted URLs only, all four fixed source ids required, no duplicates.
- **Rights evidence** (`tests/content/poetryRights.test.ts`): the legacy
  source-rights register remains pending external legal/governance review. Corpus
  permissions are separately bound to acquired source-lock hashes and recorded
  public-domain/CC BY-SA evidence; no reviewer identity is fabricated merely to
  make a machine-authority item compile.
- **Extraction** (`tests/content/extraction.test.ts`): stdlib-only, deterministic
  (byte-identical replay), spine + heading order preserved, script/style excluded,
  Persian raw text preserved incl. ZWNJ, search text normalised separately, and
  EPUB XML declaring a `DOCTYPE`/`ENTITY` is refused (XXE / billion-laughs guard).
- **Bell OCR** (`tests/content/bellOcr.test.ts`): raw OCR kept verbatim,
  `correctedDraftLines` always empty, every candidate `requiresVisualVerification`,
  front-matter and notes apparatus excluded, suspicious lines flagged not edited.
- **Candidates** (`tests/content/candidateIndex.test.ts`): every record
  `machineGeneratedCandidate:true`, `publishable:false`, `requiresHumanReview:true`,
  `confidence:'candidate'` (never `verified`); the **production compiler refuses
  candidate records** as authoring input.
- **Leak gate** (`tests/content/publicBundleLeak.test.ts`): `dist/` may contain no
  `.epub/.pdf/.djvu/.jsonl`, no lock/registry/reviewer files, no `*-candidates.json`,
  and nothing referencing a `sources-private/`/`content-private/` path.

## What must NOT be committed

`sources-private/poetry/raw/**` and `sources-private/poetry/extracted/**` are
git-ignored (large, archival). Manifests, hashes, reports, the registry and the
rights evidence **are** committed. Never commit full books to ordinary Git.

## Live fetch (owner-gated)

Downloads are **not** run automatically. On an explicit go:

```bash
pnpm poetry:fetch            # pulls the four editions into raw/, writes source-lock.json
pnpm poetry:verify-sources   # re-hash check
find sources-private/poetry/raw -type f -print0 | xargs -0 file   # confirm EPUB/PDF/text types
pnpm poetry:extract && pnpm poetry:extract-bell
pnpm poetry:fetch-masnavi   # Persian Masnavi verse (resumable; re-run to finish all sections)
pnpm poetry:build-candidates
```

`poetry:fetch-masnavi` is **resumable**: each section is checkpointed under
`raw/.../.section-cache/`, so re-running skips completed work and only the
rate-limited remainder is retried. `--assemble-only` rebuilds `rumi-fa.jsonl` from
the cache without any network.

Then run `pnpm poetry:build-production`. Only the fixed selections in
`productionSelection.ts` become canonical records; the compiler requires exactly
24 Hafez, 16 Rumi, and 40 total, and revalidates every embedded authority hash.

## Launch gates still closed

The corpus, CC BY-SA attribution, source hashes, and Bell OCR disclosures now
compile and verify locally. Independent legal/governance decisions, manual
accessibility, deployment/rollback evidence, and physical QR gates remain external
launch responsibilities and are never fabricated here.
