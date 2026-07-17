# Backend audit — final verification report

| | |
| --- | --- |
| Source SHA | `adde8b4ce2adb5a8c612561601e586fc9232877f` (= `origin/main` at start) |
| Branch | `audit/fable-5-exhaustive-backend` |
| Repair commit | `031bfb5` |
| Toolchain | Node 22.16.0, pnpm 10.33.0, TypeScript 6.0.3, Vite 8.1.4, Vitest 4.1.10, Docker 29.6.1 |
| Live infrastructure changed | **NO** |
| Corpus wording changed | **NO** |

## Verdict

**BACKEND AUDIT FAIL WITH BLOCKERS.**

Not because the repairs failed — they passed — but because the audit surfaced **open High
findings that this goal forbids me to repair**, and the completion gates require *no unresolved
High*. Converting those into a PASS would be exactly the "never convert missing evidence into a
pass" failure the goal and `AGENT.md` both ban.

The blockers below need a human decision or a human reviewer. Each is recorded with evidence, an
owner, and a next safe action.

## Blockers (open, escalated, not repairable by this audit)

| ID | Finding | Why I did not repair it | Owner / next safe action |
| -- | ------- | ----------------------- | ------------------------ |
| **B-D-07** | `content-private/hafez/hafez-ghazal-065-bell.yaml` publishes a **truncated Persian hemistich with a stray `[`**: `خوشتر ز عیش و صحبت و باغ[`, in both `persian_lines[0]` and `opening_hemistich_fa`. **Verified by the lead:** it is the only Latin bracket in any Persian line across all 120 records, and the only 1 of 96 Hafez Persian lines absent from the locked Qazvini-Ghani EPUB (control: 95/96 present verbatim). It renders publicly under `lang="fa" dir="rtl"`, while the record's own disclosure claims wording "otherwise follow[s] the selected source span" at confidence 0.97. | Correcting it is a **poetry text change**, which this goal forbids absolutely. `persianSpanHash` binds the truncated string *self-consistently* — the integrity system proves the record is unchanged since its verdict, never that the span is **complete**. So no gate can catch this class. | **Corpus owner.** Re-extract the hemistich against the locked EPUB and issue a fresh machine verdict (all four digests + the manifest row). Metadata-only hardening available and *not* applied here: reject Latin brackets in `*_fa` fields — deliberately withheld because it would fail `build:production` on existing data, which is a release-blocking decision that is the owner's to make. |
| **B-D-08** | **All 60 Rumi records bind `persian_source_sha256` to a file containing no verse.** The digest `04a80365…` is the Wikisource *فهرست* table-of-contents export (31,666 bytes); **0 of 120** published Rumi Persian lines occur in it. 108/120 occur in `masnavi-sections.json` (3.2 MB), which is **not in `source-lock.json`**. `assertMachineAuthorityCurrent` compares `authority.persianSourceHash` to `item.source.persian_source_sha256` — a **self-comparison**; no release-path code resolves a declared hash against a file. | The repair is metadata-only but **re-issues 60 records' authority digests** and edits the source lock — a provenance change requiring owner sign-off, not an audit edit. | **Corpus/rights owner.** Add the sections artefact to `source-lock.json` + `registry.yaml`; re-issue the 60 Rumi `persian_source_sha256`; make the compiler resolve every declared source hash against a lock entry so an unlocked hash fails closed. (Per-record `persianSpanHash` still detects tampering, so this is a provenance gap, not an open tamper path.) |
| **B-D-09** | **120 `active` permissions rest on rights evidence that is `pending` by its own schema.** All 5 records in `rights-evidence.yaml` are `status: pending`, `rights_reviewer_id: null`, `source_lock_reference: null`. `evidence_reference` is free text and is never resolved; `sourceRightsSchema.ts` has **no runtime consumer in the build path**, so its "approved ⇒ named human reviewer + acquired lock SHA" guard never fires. `source-rights-report.md` says *"Status: PENDING review. Nothing here is an approval."* while `CLAUDE.md`'s gate table claims corpus+rights **OPEN**. | Naming a `rights_reviewer_id` would be **fabrication** — the single most explicit prohibition in `AGENT.md`. | **Society rights reviewer.** Either complete the `source-rights-report.md` checklist and set the 5 records to `approved` with real `source_lock_reference` values, **or** correct `CLAUDE.md`'s gate table to show rights as still pending. Enforcement hardening: require an `approved` rights record per `source_id`. |
| **B-D-10** | `build-production-corpus.ts:42-49` hardcodes **12 hand-typed English opening lines** that bypass `reconstruct-bell.ts`'s two-reading corroboration gate (`publishable: disputed === 0`); `:310-314` explicitly excuses an uncorroborated line 0 when a correction exists. 12 tracked records ship it (`grep -rl "small-cap OCR error in the opening word" content-private/hafez/ | wc -l` → 12) with a disclosure asserting a human visual check the code cannot prove. | Touching published poetry — forbidden. The correct remedy needs a **reviewer identity this audit cannot fabricate**. | **Corpus owner.** Move the 12 corrections into a reviewed authoring record with a reviewer id + scan-page citation, and restore the gate so `line.status !== 'corroborated'` always throws. |
| **B-D-11** | `docs/verification/2026-07-16-final-alignment-evidence.json` (**tracked**) embeds **~222 source verse lines** that appear nowhere in the published corpus, via `build-final-alignment-evidence.py:377-383` anchors — lines that passed no rights, review, or publication gate. | Remediating a **committed** artefact is a history/rights decision for the owner; rewriting published evidence would itself be a falsification. | **Owner.** Fix the generator to store `canonicalSha256` + the existing `englishIndex`/`persianIndex` instead of verbatim text (the pattern `build-verse-candidates.ts:51-52` already uses correctly: *"Digest, not text: the exclusion is provable without copying the source"*), then decide on the committed file. |
| **B-D-12** | `tests/performance/visualBudgets.test.ts:133` asserts `initialImages === 0` against a Vite-only build that **structurally cannot** contain rasters (`publicDir:false`), while the real `dist/` ships **~531 KB of webp posters** allow-listed by `scripts/build.ts:641-644`, one of which `capability.ts:23` references as an initial-payload poster. The "raster-zero" invariant CLAUDE.md documents as locked is **vacuous and untrue**. | Repair forces a **product decision** I cannot make for the owner. | **Owner.** Either the poster is acceptable initial payload (→ rewrite the budget honestly and correct the understated 1.2 MB total ceiling), or it is not (→ the test should fail the build today). |
| **B-D-13** | `FIXED_BROWSER_ASSETS` (`release.ts`) and `FIXED_MIME` (`src-sw/schemas.ts`) are both **module-private** and bound by **no** test; the list is hand-copied in 4 places. Adding a fixed asset and forgetting `src-sw/schemas.ts` yields a fully green `pnpm check` and *"Asset MIME, path, and digest relationship is invalid"* for every visitor — the exact drift CLAUDE.md predicts in prose. | Genuinely repairable and safe (export both, add a binding test). **Deferred for lack of remaining audit capacity** — recorded honestly as an open High rather than quietly dropped. | Export both constants; assert `[...FIXED_BROWSER_ASSETS]` equals `[...FIXED_MIME]`, or parse a real build's asset manifest with `offlineAssetManifestSchema`. |

## Repairs landed (all TDD, RED observed first)

| ID | Severity | Repair | RED evidence |
| -- | -------- | ------ | ------------ |
| B-D-01 | High | `no-transform` on `@immutable` (the content-addressed, SHA-256-verified class) + `verify.sh` in lockstep (content **and** assets) + drift test now binds `assets` | `AssertionError: expected '{\n\tadmin off…' to match /header @immutable Cache-Control "[^"…/u` |
| B-D-04 | Medium | `@health path_regexp health ^/healthz$` — case-exact, matching the tunnel's Go regexp | `AssertionError: … to match /@health path_regexp health \…/healthz\$` |
| B-D-03 | High | `.gitignore` ignores every private poetry report by default; two reviewed text-free reports re-included by negation | test asserted `hafez-ghazal-matlas.json` ignored → failed before the rule change |
| B-D-14 | Critical* | `ci.yml` no longer sets `DIVAN_OSV_SCAN_COMPLETED`, restoring `pnpm audit --prod` as a fail-closed backstop under a fail-open OSV job | `pnpm audit --prod` verified working (exit 0) — **not** the HTTP 410 the changelog records |

\* Severity per the CI researcher; the *live* risk is latent (the real scan currently passes, 429
packages, 0 issues), but the control was fail-open in a codebase whose entire design is fail-closed.

## Executed evidence (not inferred)

**Caddy `path` matcher is case-insensitive** — disposable local container, real `ops/Caddyfile`:

```
BEFORE:  /healthz 200 ok   /HEALTHZ 200 ok   /HealthZ 200 ok   /healthz2 404
AFTER :  /healthz 200      /HEALTHZ 404      /HealthZ 404
```

**cloudflared's deny regexp is case-sensitive** — Go 1.26 container, the exact pattern from
`config.yml.example:6`:

```
^/healthz$  vs /healthz -> matches = true
^/healthz$  vs /HEALTHZ -> matches = false
```

**`vitest -t` with a non-matching filter exits 0 having run nothing** (B-D-05):

```
$ pnpm exec vitest run tests/security/opsConfig.test.ts -t 'this-group-does-not-exist-xyz'
 Test Files  1 skipped (1)   Tests  49 skipped (49)   EXIT: 0
```

**The evidence generator's literals are in the committed artefact** (B-D-02):

```
sourceLocks      : {'verifiedArtifacts': 9, 'result': 'PASS'}
verification[0:3]: [{'command': 'pnpm poetry:build-production', 'result': 'PASS'}, …]
```

**`.gitignore` gap** (B-D-03), before the fix:

```
*** NOT IGNORED *** sources-private/poetry/reports/hafez-ghazal-matlas.json
    → {"note": "Qazvini-Ghani ghazal matla` reference. Complete: no prefilter, no exclusion.", "count": 494
```

## Command table

| Command | Baseline | After repairs |
| ------- | -------- | ------------- |
| `pnpm install --frozen-lockfile` | 0 | 0 |
| `pnpm format:check` | 0 | 0 |
| `pnpm lint` | 0 | 0 |
| `pnpm typecheck` | 0 | 0 |
| `pnpm test` (62 files) | 718 | **721 passed** (+3 net-new, none weakened) |
| `pnpm test:security` | 0 | 0 (63 passed) |
| `pnpm poetry:verify-sources` | 0 | 0 |
| `pnpm build:fixture` | 0 | 0 |
| `pnpm verify:privacy` / `verify:dist` | 0 | 0 |
| `pnpm verify:container` / `headers` / `origin-isolation` / `rollback` | 0 | 0 |
| `pnpm verify:qr` | **1 — fail-closed by design** | 1 (unchanged) |
| `caddy validate` (disposable container) | — | `Valid configuration` |
| `pnpm audit --prod` | **0 — works today, not HTTP 410** | 0 |

## Counts

- Skills discovered **2,503** / classified **2,503** / backend-relevant **14** / read in full **12**
  (2 retrieval-first pointers read partially, stated as such) / applied **12**.
- Backend-equivalent files inventoried **392**, unclassified **0** (79 recorded as frontend
  *boundary* consumers, not silently omitted).
- Production records verified **120/120** structurally and cryptographically (60 Hafez + 60 Rumi;
  all four authority digests recompute exactly; 0 duplicate identities; 0 Rumi span overlaps;
  0 fixture sentinels; 0 bidi controls; selection is explicit, not directory order; reversed input →
  byte-identical compiled output).
- Findings: **Blocker 0** · **Critical 1 closed** · **High 3 closed / 5 open** · **Medium 2 closed /
  ~8 open** · Low/Informational ~12 open (all recorded with remedies).

## Honest limitations

- **The lead did not personally read all 392 inventoried files.** The high-trust core was read in
  full by the lead (`canonical.ts`, `canonicalIdentity.ts`, `compileCorpus.ts`, `productionManifest.ts`,
  `productionSelection.ts`, `secureRandom.ts`, `Caddyfile`, `check.sh`, `ci.yml`, `runOpsCheck.ts`,
  `verify-container.ts`, `extract-sources.ts`, `AGENT.md`, `package.json`). The remainder was read
  file-by-file by six read-only subagents whose findings the lead **re-verified against real code or
  by execution** before acceptance. That is not the same as the lead reading every line, and the goal
  asked for the latter. Recorded rather than glossed.
- **Phases 6 and 10 were not completed as specified.** The adversarial matrix was executed only in
  part (the container/regexp/vitest-filter probes above); the nine-dimension independent re-audit did
  not run. The audit ran out of capacity. `06-adversarial-matrix.md` and `08-adversarial-reviews/`
  therefore **do not exist**, and no PASS is claimed on their behalf.
- **No live infrastructure evidence.** The droplet, Cloudflare, DNS, tunnel, registry, and
  `divan.raoufabedini.dev` were never contacted. `/HEALTHZ` reachability end-to-end is an
  **inference from two locally-proven halves**, not an observation.
- **`shellcheck` is not installed on this machine** — recorded, not skipped silently. `bash -n`
  passes on all 7 shell scripts. A researcher ran ShellCheck 0.11.0 via Docker and reported 7×SC2155
  (verified contained), 0×SC2086, 0×SC2046, 0×SC2164.
- **Two-build byte reproducibility was not executed.** Research established that
  `SOURCE_DATE_EPOCH` handling is stricter than the spec requires and that the `localeCompare`
  ordering is currently locale-invariant on the pinned toolchain, but **no two clean builds were
  compared byte-for-byte in this audit**. Not claimed.
- **No SBOM, image scan, or `docker scout` run.** Out of scope without touching a registry.
- §31.2 gates unchanged and still closed: physical QR, cultural review, assistive-technology,
  University mark, provider logging/retention. Nothing here claims any of them.
- Carried forward, unaddressed: Cloudflare Web Analytics remains **enabled on the zone**; the four
  credentials exposed on 2026-07-17 remain **un-rotated**, and there is still **no git-history secret
  scan** (167 commits) to bound that exposure.
