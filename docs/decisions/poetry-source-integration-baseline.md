# Poetry source integration — baseline decision record

**Date:** 2026-07-14 (Australia/Sydney)
**Branch:** `feat/poetry-source-ingestion` (off `main` @ `6a102f5`)
**Toolchain:** Node 22.16.0, pnpm 10.33.0, Python 3.12.2; `tsx`, `zod`, `yaml` already present.

This record freezes the baseline for the DIVAN poetry-source ingestion work and
records the **scope reconciliation** decided with the repository owner before any
implementation, per the executing-plans review step and the Raouf change protocol.

---

## 1. What the ingestion plan assumed vs. what the repo actually contains

The ingestion plan's "Final repository map" (its section 5) is an explicit
_suggestion_ ("no assumption is made from the suggested structure alone" — plan
Task 1). Inspection shows the repo **already contains a stricter version of most of
the plan's proposed content layer**, locked by tests and the release-integrity
coupling:

| Plan proposed to create                                        | Already present (authoritative)                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Task 7 `mappingSchema.ts` (`BilingualMappingRecord`)           | `src/lib/content/authoringSchema.ts` — `authoringContentItemSchema`: poet↔mode pairing, 2–6 equal-length FA/EN lines, translation classification, reflection 45–90 words `reflection_not_prediction`, full reviewer matrix (source editor + Persian literary + English editor + cultural + rights), "cannot be approved only by its translator", Hafez opening-hemistich requirement, raw HTML/Markdown/bidi-control rejection |
| Task 4 `editions.yaml`/`reviewers.yaml`/`rights-register.yaml` | `src/lib/content/registrySchemas.ts` — editions, contributors, permissions (ISO-3166 territories + expiry), approvals bound to the authoring **SHA-256**                                                                                                                                                                                                                                                                       |
| Task 10 `compile.ts` / `publicSchema.ts`                       | `src/lib/content/compileCorpus.ts` + `compileItem.ts` + `publicSchema.ts` — already fail-closed; enforces **≥24 Hafez / ≥16 Rumi / ≥40 total** in production (compileCorpus.ts:365–379)                                                                                                                                                                                                                                        |
| Task 11 provenance UI                                          | `src/components/PoemResult.tsx` + `SourceCredit.tsx` + `src/pages/CreditsPage.tsx` (hardened in the 2026-07-14 UI audit)                                                                                                                                                                                                                                                                                                       |
| Task 13 offline release coherence                              | `src-sw/` hand-written SW + `release.ts` + `verify-dist.ts` exact-file-set gate                                                                                                                                                                                                                                                                                                                                                |
| Task 9/14 human-review gate                                    | `content-private/README.md` already documents the exact human-evidence gate; production stays fail-closed                                                                                                                                                                                                                                                                                                                      |

**Scenes/pages differ too:** the interactive result lives in `src/scenes/RevealScene.tsx`
(not `ResultScene.tsx`); Rumi's mode is `moment_of_reflection` (not `rumi_reflection`);
Hafez's is `open_the_divan`. Poets are `hafez` / `rumi`.

Building the plan's parallel `compile.ts` / `mappingSchema.ts` / `publicSchema.ts`
would **duplicate and collide** with this locked system and break the invariant
tests. That is a hard-invariant violation and is rejected.

## 2. Adapted scope (decided with the owner)

**Decision — "Adapt":** build only the genuinely net-new _source-provenance layer_
and wire it to feed the **existing** authoring/registry/compiler/UI pipeline.

**Decision — "Tooling + fixtures now":** TDD acquisition/extraction against local
fixtures and mocked hosts (no live network in tests). Wire the real registry URLs;
the live `pnpm poetry:fetch` runs only on the owner's explicit go.

Net-new work to build (plan task numbers retained for traceability):

- **Task 2** — immutable source registry + strict Zod schema (`sourceRegistrySchema.ts`),
  `sources-private/poetry/registry.yaml`, `.gitignore` for `raw/**`.
- **Task 3** — host-allowlisted streaming downloader + SHA-256 `source-lock.json`
  (`scripts/poetry/fetch-sources.ts`, `verify-source-lock.ts`).
- **Task 4** — source **rights evidence report** (observed statements, no fabricated
  approvals); extend `docs/rights-register-public.md`.
- **Task 5** — deterministic stdlib EPUB extraction into immutable staging
  (`scripts/poetry/extract-epub.py`), raw vs. search text separated.
- **Task 6** — Bell Hafez OCR candidate parsing (`extract-hafez-bell.ts`),
  `correctedDraftLines` empty until human, `requiresVisualVerification: true`.
- **Task 8** — non-publishable machine candidate-mapping index; the existing
  compiler must refuse candidates as authoring content.
- **Task 12** — archival-leak bundle gate (`.epub/.pdf/.djvu.txt`, lock files,
  reviewer data) extending the existing `verify:dist`.

**Absorbed / skipped as already-present:** Task 7 (schema exists), Task 10
(compiler exists), Task 11 (UI exists), Task 13 (offline coherence exists), the
registry portions of Task 4 (registries exist). Any adjustment to those touches the
existing files, not new parallel ones.

## 3. Unavoidable end state — still fail-closed

Plan Tasks 9 and 14 require **real human** Persian-source, translation, cultural and
rights review, and Bell OCR-vs-scan verification. Per this repo's hard invariants and
the plan itself ("No task … authorises Claude to act as the final literary reviewer,
rights officer or translator"), these are **not** performed here and are **never**
fabricated. Therefore:

- The public corpus **stays empty**; `build:production` stays **fail-closed**.
- This work delivers the _acquisition/extraction/candidate machine_ plus verified
  provenance evidence — a foundation the Society's reviewers act on, not a launch.

## 4. Frozen baseline facts

- Repository commit: `6a102f5` (branch base).
- Current source paths: content pipeline under `src/lib/content/`; scripts under
  `scripts/` (no `scripts/poetry/` yet); `content-private/` holds only `README.md`;
  no `sources-private/` yet.
- Content schema: `authoringContentItemSchema` (schema_version 2) + `registryBundleSchema`.
- Minimum production corpus: ≥24 Hafez, ≥16 Rumi, ≥40 total (compileCorpus.ts).
- Public manifest: content-addressed release produced by `scripts/build.ts` into
  `dist/`, verified by `scripts/verify-dist.ts` (exact file set).
- Service worker: `src-sw/` precaches the fixed browser assets + release; never
  caches `content-private/` or (to be added) `sources-private/`.
- Existing Hafez/Rumi items: **0 real**; one synthetic fixture corpus at
  `tests/fixtures/content/corpus.ts` (`TEST ONLY` sentinels, production-rejected).
- Known fixtures that must not reach production: `tests/fixtures/content/**`.

## 5. Baseline quality gate

The pre-existing suite is green as of the 2026-07-14 audit (vitest 499/499, lint 0,
typecheck 0). This work is added test-first; each new suite starts RED before its
implementation, and `pnpm check` must remain green with launch gates fail-closed.
