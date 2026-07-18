# Backend audit — Phase 7 consolidated defect ledger

Source SHA `adde8b4ce2adb5a8c612561601e586fc9232877f` · branch `audit/fable-5-exhaustive-backend`.

**This ledger exists before any implementation file was edited.** Every finding below was
**re-verified by the lead against real repository code or by execution**; findings that did not
survive that check are recorded in `02-primary-source-research.md` as downgraded, not silently dropped.

Severity: Blocker · Critical · High · Medium · Low · Informational.

---

## B-D-01 — `no-transform` absent on the content-addressed asset class · **HIGH** · repaired

| | |
| --- | --- |
| Paths | `ops/Caddyfile:41`; `tests/security/opsConfig.test.ts`; `ops/scripts/verify.sh` |
| Boundary | Static origin ↔ intermediary ↔ service-worker integrity |
| Authority | RFC 9111 §5.2.2.6 (`no-transform` = intermediary **MUST NOT** transform); RFC 8246 (`immutable` constrains *revalidation*, **not** transformation) |

**Impact.** `@immutable` matches `^/content/[a-f0-9]{64}\.json` — the corpus named by its own SHA-256 —
plus `/assets/*`, `/images/*`, `/audio/*`, `/fonts/*`. It is the **only** cache class without
`no-transform`, and it is precisely the class the service worker verifies by digest. An intermediary
that rewrites those bytes (Cloudflare Polish/Mirage on `avif|webp|png` is a zone dashboard toggle, no
repo change, no CI signal) breaks the SW's SHA-256 check and fails release staging for every client.

**This failure mode has already happened once on this origin** — `docs/verification/2026-07-17-release-v1-0-6-outage-fix.md`
records edge injection breaching the HTML byte ceiling and taking every controlled client offline.
The v1.0.6 fix hardened `@documents` and `@noCacheFiles` and stopped there.

**Evidence.** Lead read `ops/Caddyfile` in full. Line 41 serves
`public, max-age=31536000, immutable` — no `no-transform`. Tests assert it only for `@documents`
(`opsConfig.test.ts:247`) and `@noCacheFiles` (`:250`); `verify.sh` pins it only for
document/release/worker (`:236,240,295`). **No test or verifier covers `@immutable`**, so a
regression is invisible to `pnpm check`.

**Expected invariant.** Every response class whose bytes the service worker verifies must forbid
intermediary transformation. The Caddyfile's own comment states the principle: *"The release is
content-addressed: proxy-injected bytes are never correct."*

**Repair.** Add `no-transform` to the `@immutable` `Cache-Control` (directives are independent per
RFC 9111; RFC 8246 revalidation semantics unaffected). Bind it with a test mirroring `:247/:250`.
**Header-only: no corpus, rights, provenance, asset bytes, or release hash change.**

---

## B-D-02 — Report generator fabricates its own verification results · **HIGH** · repaired

| | |
| --- | --- |
| Paths | `scripts/poetry/build-final-corpus-report.ts:150-155, 215, 230-243` → `docs/verification/2026-07-16-final-120-corpus-report.{json,md}` (**tracked**) |
| Boundary | Evidence integrity |
| Authority | `AGENT.md` §Engineering contract: *"Never fabricate poetry, translation, provenance, licences, approvals, **reviews**, credits, or production configuration."* `AGENT.md` §Change protocol: *"Record exact commands and honest limitations."* Deployment runbook: *"Never claim an operator gate from script output."* |

**Impact.** The generator **types** verification outcomes as literals and writes them into a tracked
evidence document. It never runs the commands it reports on:

```ts
productionBuild: 'PASS',
privacyLeakVerification: 'PASS',
sourceLocks: { verifiedArtifacts: 9, result: 'PASS' },
verification: [
  { command: 'pnpm poetry:verify-sources', result: 'PASS' },
  { command: 'pnpm test', result: 'PASS (694 tests)' },
  …13 entries…
]
```

**Lead verification (executed).** The committed artefact carries them verbatim:
```
sourceLocks      : {'verifiedArtifacts': 9, 'result': 'PASS'}
verification[0:3]: [{'command': 'pnpm poetry:build-production', 'result': 'PASS'}, …]
git ls-files → docs/verification/2026-07-16-final-120-corpus-report.json   (tracked)
```

**Stated fairly:** the recorded values were *probably true when written* — the `CHANGELOG.md` entry
for 2026-07-16 independently records `pnpm test` at 694/694. The defect is **the mechanism, not
(necessarily) the values**: re-running this generator after a regression emits an identical `PASS`.
A reader of `docs/verification/` cannot distinguish a measured PASS from a typed one — which is
exactly the property the repo's evidence discipline exists to guarantee.

Three fields *are* genuinely computed (`publicIdsMatchManifest`, `inventedReflections`, the 120-count
refusal at `:105-111`), which makes the surrounding literals more misleading, not less.

**Repair.** Replace every un-measured literal with an explicit `NOT_MEASURED_BY_THIS_SCRIPT`
sentinel, so the generator can never again assert an outcome it did not observe. Regression-tested.
**The historical artefact is left untouched** — rewriting past evidence is out of scope and would
itself be a falsification.

---

## B-D-03 — `.gitignore` gap exposes 494 Persian matlas to accidental commit · **HIGH** · repaired

| | |
| --- | --- |
| Paths | `.gitignore:40` |
| Boundary | Rights / private-source leak control |
| Authority | `AGENT.md`: *"Keep `.env`, permission evidence, tunnel credentials, private authoring records, source maps … out of public output and logs."* `.gitignore:38-39` states the intent: *"Candidate reports carry verse excerpts — keep them out of Git."* |

**Impact.** The rule is shape-specific:
```
sources-private/poetry/reports/*-candidates.json
```
Three report files in the working tree do not match that glob and are **not ignored**:

```
*** NOT IGNORED *** sources-private/poetry/reports/hafez-align-tasks.json
*** NOT IGNORED *** sources-private/poetry/reports/hafez-clarke-align-proposals-UNVERIFIED.json
*** NOT IGNORED *** sources-private/poetry/reports/hafez-ghazal-matlas.json
```

`hafez-ghazal-matlas.json` self-describes as:
> `"note": "Qazvini-Ghani ghazal matla\` reference. Complete: no prefilter, no exclusion.", "count": 494`

**494 complete Persian opening hemistichs — an unreviewed whole-edition derivative — is one
`git add -A` from public history.** This audit is forbidden from using `git add -A`, but the ignore
rule is the durable control that protects every *future* session; the neighbouring `bell-ocr`/`clarke-ocr`
rules exist for exactly this class.

**Repair.** Widen to `sources-private/poetry/reports/*` with explicit `!` re-includes for the two
reviewed text-free reports that are meant to be tracked (`candidates-summary.json`,
`source-rights-report.md`) — mirroring the negation pattern `content-private/` already uses
successfully. **The three files are preserved on disk and untouched**; only their ignore status changes.

---

## B-D-04 — `/healthz` public denial defeated by letter case · **MEDIUM** · repaired

| | |
| --- | --- |
| Paths | `ops/Caddyfile:31`; `ops/cloudflared/config.yml.example:6`; `ops/scripts/verify.sh:152` |
| Boundary | Public origin surface |
| Authority | Design authority `:1506` — *"Cloudflare Tunnel ingress or an edge rule **must return 404** for public requests to `/healthz`."* `:2156` — *"block public `/healthz` at Tunnel ingress or edge."* |

**Impact / evidence — both halves proven by execution, not inference:**

```
# disposable local Caddy container reproducing ops/Caddyfile:31-35
/healthz  -> 200 ok      /HEALTHZ -> 200 ok      /HealthZ -> 200 ok      /healthz2 -> 404
# Go regexp probe of the exact cloudflared pattern ^/healthz$
/healthz -> matches=true      /HEALTHZ -> matches=false      /HealthZ -> matches=false
```

Caddy's `path` matcher is case-**insensitive**; cloudflared's ingress `path` is a Go regexp, which is
case-**sensitive**. So `/HEALTHZ` misses the tunnel deny rule, falls through to the hostname rule,
reaches the origin, and Caddy answers `ok` 200.

`ops/scripts/verify.sh:152` probes only lowercase, so **the verifier produces false evidence** for a
contract that `AGENT.md:88`, `CHANGELOG.md:51` and `docs/rollback-runbook.md:42` all record as proven.

**Explicitly NOT claimed.** The end-to-end path was **not** tested against the live site — forbidden
by this goal. Both halves are proven locally; the composition is an inference from them. Data impact
is minimal (a static `"ok"`, no visitor data, no corpus). Severity is Medium because a design-authority
**must** is bypassed and the verifier cannot see it — not because the leak is large.

**Repair.** Make the origin matcher case-exact with `path_regexp health ^/healthz$` (Caddy's documented
route to case-sensitive matching), so `/HEALTHZ` falls to the final `handle` → 404 + `no-store`. The
container healthcheck is unaffected (`ops/healthcheck/main.go:19` requests lowercase). Regression-tested.

---

## B-D-05 — `runOpsCheck` can report PASS having executed zero tests · **MEDIUM** · repaired

| | |
| --- | --- |
| Paths | `scripts/ops/runOpsCheck.ts:15-20`; the 4 `scripts/ops/verify-*.ts` callers |
| Boundary | Release-gate integrity (false-positive verification) |
| Authority | Goal lens 5.13 *"false-positive verification scripts"*; `AGENT.md`: *"run fresh verification before recording completion."* |

**Impact / evidence (executed by the lead):**
```
$ pnpm exec vitest run tests/security/opsConfig.test.ts -t 'this-group-does-not-exist-xyz'
 Test Files  1 skipped (1)
      Tests  49 skipped (49)
EXIT: 0
```
`runOpsCheck` propagates that 0 via `process.exit(result.status ?? 1)`. The group names are hardcoded
strings matched against `describe` titles, and **nothing binds them**: `grep -rn runOpsCheck tests/`
returns nothing. Rename a `describe` and `pnpm verify:headers` prints success having verified nothing.

**Bounded honestly.** `pnpm test` runs the whole file, so CI coverage is not lost by a rename, and
`check.sh` does not call `verify:*` at all. The real blast radius is **an operator running
`pnpm verify:container` during a release and reading a green PASS from zero executed tests** — the
exact moment that output is trusted. Confirmed to be the only script of this shape
(`grep -rn "'-t'\|--testNamePattern" scripts/ ops/ package.json` → one hit).

**Repair.** Make `runOpsCheck` assert that tests actually ran (JSON reporter; fail when
`numTotalTests === 0` or all skipped). Regression-tested.

---

## Reported, deliberately NOT repaired in this audit (with reasons)

| ID | Finding | Severity | Why not repaired here |
| -- | ------- | -------- | --------------------- |
| B-D-06 | `scripts/build.ts:437-440` sorts `readdir` with `localeCompare`, coupling `assetManifestSha256` to an ICU collation table rather than to source (reproducible-builds: *"depending only on the source code"*). Tested: ordering is currently **identical** across `LC_ALL` values and the pinned Alpine builder reports the same ICU 77.1, so **reproducibility is intact today**. | Low (latent) | The one-line codepoint-comparator fix **changes `assetManifestSha256`** — a release-affecting change that must be sequenced with a release that expects a hash change. Rule 17 also forbids it jumping ahead of the High findings. Remedy recorded verbatim in `02-primary-source-research.md`. |
| B-D-07 | 12 hand-typed English opening lines in `build-production-corpus.ts:42-49` bypass `reconstruct-bell.ts`'s two-reading corroboration gate; 12 tracked records carry the disclosure. | High (content) | **Touching this means touching published poetry**, which this goal forbids absolutely ("Never perform literary reinterpretation in this audit"; "Do not alter poetry wording… unless a proven integrity defect requires a narrowly scoped metadata correction"). The correct remedy — moving the corrections into a reviewed authoring record with a reviewer id and scan-page citation — **requires a human reviewer this audit cannot fabricate**. Escalated, not repaired. |
| B-D-08 | `docs/verification/2026-07-16-final-alignment-evidence.json` (tracked) embeds ~222 source verse lines not present in the published corpus, via `build-final-alignment-evidence.py:377-383` anchors. | High (rights) | The generator fix is clear (store `canonicalSha256` + the existing indices instead of verbatim text — the pattern `build-verse-candidates.ts:51-52` already uses correctly). But **remediating the committed artefact is a history/rights decision for the owner**, not an audit edit, and rewriting it would alter published evidence. Escalated with the exact remedy. |
| B-D-09 | `tests/performance/visualBudgets.test.ts:133` asserts `initialImages === 0` against a Vite-only build that **cannot** contain rasters (`publicDir:false`), while the real `dist/` ships ~531 KB of webp posters allow-listed by `scripts/build.ts:641-644`. The documented "raster-zero" invariant is vacuous. | High (false gate) | Repairing it forces a **product decision** the audit cannot make for the owner: either the poster is acceptable initial payload (→ rewrite the budget honestly) or it is not (→ the test should fail the build today). Escalated with both options. |
| B-D-10 | `FIXED_BROWSER_ASSETS` (`src/lib/content/release.ts`) and `FIXED_MIME` (`src-sw/schemas.ts`) are both module-private and bound by **no** test; the list is hand-copied in 4 places. CLAUDE.md predicts this exact drift in prose. | High | Genuine and worth fixing, but the minimal correct repair exports two constants and adds a binding test — safe. **Deferred only for lack of remaining audit capacity**, and recorded as an open High. See "Honest limitations" in the final report. |
| B-D-11 | `.dockerignore` omits `sources-private/`, `.claude/`, `CLAUDE.md`; `ops/Dockerfile:14` is `COPY . .`. A convenience `docker build .` (rather than the runbook's `git archive` flow) pulls raw source books and `CLAUDE.md` (origin SSH host, deploy root) into the **build layer**. Final image is `scratch` + `COPY /app/dist`, so **nothing leaks into the published image**. | Medium | Defence-in-depth on a path the documented runbook already routes around. Recorded with the exact one-line remedy. |
| B-D-12 | CI pins `google/osv-scanner-action` to a full commit SHA but `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` to **mutable tags**. | Medium | Mechanical and correct to do; recorded. Everything else in `ci.yml` is exemplary — `permissions: contents: read` at workflow level and narrowed per job, `pull_request` (not `pull_request_target`), no `${{ github.event.* }}` in any `run:`, `fail-on-vuln: true` + `needs: osv-scan` so a scanner failure **cannot** be swallowed. |
| B-D-13 | `vitest.config.ts:25-34` declares coverage thresholds (85/90/90/90) that **never execute** — `pnpm test` is `vitest run` with no `--coverage`, and no gate passes the flag. `check.sh:114-117` prints a "Docker evidence skipped" notice with **no `else`**, so Docker evidence is never produced even when a daemon is running. | Medium | Dead config that reads as a gate. Recorded; both need an owner decision (wire up vs delete). |
| B-D-14 | Zod 4 refinement short-circuit: `unrecognized_keys` and inner `invalid_type` are **non-continuable**, so `.strict().superRefine(...)` cross-field rules (e.g. `addDuplicateIdIssues`, `registrySchemas.ts:348-357` ×5) are **silently skipped** when an earlier issue exists. | Low (latent) | **Not an integrity hole**: skipping only occurs when the parse already fails, so no bad corpus can pass. It costs diagnostics (whack-a-mole across CI cycles) and becomes a real hole only if `.optional()`/`.catch()`/`.or()` is ever added upstream, which could swallow the fatal issue while the refinement stays skipped. Remedy (`{ when: () => true }`) recorded. |
| B-D-15 | `tests/security/publicReadiness.test.ts:30-34` **enforces** a README asserting *"not deployed"* and *"productionEligible: false"*. The site is live at `v1.0.6` serving `productionEligible: true` with 120 items. | Medium (accuracy) | Owner decision. Withholding deployment detail from a public repo is defensible; *"not deployed"* is a positive false claim, not an omission, and invariant #1 bans fabricated production config. Escalated, not unilaterally changed. |
| B-D-16 | `inspect-public-bundle.ts:59-68` drops symlinks (`readdir` withFileTypes uses `lstat`; a symlink is neither `isFile()` nor `isDirectory()`), and `:107-109` silently skips content-scanning any file >5 MB. | Medium | Real gaps in a defence-in-depth scanner; `verify-dist.ts`'s exact-file-set check is a compensating control. Recorded with remedies. |
| B-D-17 | `fetch-masnavi-sections.ts:106-117` does not revalidate the host allowlist after redirects (default `redirect:'follow'`), unlike `fetch-sources.ts:172-182` which re-checks every hop. No response size cap or content-type check either. | Medium | Real asymmetry. Scoped: this script is owner-gated, network-only, off the release path, and the allowlist policy itself is correct (registrable-domain suffix match, not substring). Recorded with the remedy (reuse `resolveToResponse`). |
| B-D-18 | `ocr-clarke.sh:50-62` converts a failed render/OCR into success (`\|\| return 0`, `\|\| true`), and a resume check keyed on a non-atomically-written `.hocr` treats a truncated page as complete **forever**. | Medium | Off the release path (OCR staging), owner-run, git-ignored output. Recorded with the remedy (temp + `mv` after exit 0; record failed pages; exit non-zero). |
| B-D-19 | Both Python extractors call `epub.read(entry)` with no decompression ratio/size bound (zip-bomb). | Medium | Guarded upstream: `downloadArtifact` caps size, verifies EPUB magic bytes, and refuses any hash departing from the source-lock — exploitation needs a hostile upstream **and** operator acceptance of a new lock hash. XXE/billion-laughs **is** correctly closed (DOCTYPE/ENTITY rejection over the whole document). Recorded. |
| B-D-20 | Ops: `lib.sh:253-266` clears `HUP INT TERM` before running the ~10s fail-closed teardown, so a second Ctrl-C aborts the stop; `deploy.sh:46-49`/`rollback.sh:43-44` write the state-file **pair** non-atomically (a crash between them discards the rollback target). | Low | Both fail in the safe direction and are narrow (deliberate double-signal; crash in a 2-line window). `read_immutable_state_file` re-validates mode/ownership/digest on read, so a torn file fails closed. Recorded with remedies. |
| B-D-21 | No `shellcheck` in any gate; the ops scripts (which run as root against the live origin) are the highest-risk code in the repo and are linted by nothing. `shellcheck` is **not installed** on this machine (recorded honestly, not skipped silently); `bash -n` passes on all 7 scripts. | Low | Recorded as a gate gap with the exact remedy. |

## Round 2 — the complete file-by-file read (all 392 files)

The first pass audited the high-trust core and delegated breadth. On instruction, a second pass read
**every one of the 392 inventoried files completely**, divided across five readers, with the lead
personally reading `src-sw/releaseManager.ts`, `scripts/build.ts` and `scripts/verify-dist.ts`.
It found two repairable defects the first pass missed, and a large body of corpus-content defects.

### B-D-22 — the precached PWA icon is unreachable offline · **MEDIUM** · repaired

`src-sw/releaseManager.ts:205-213`. `/icons/` (plural) does **not** prefix-match `/icon.svg`, so the
manifest icon fell through to the network-only arm at `:230`. Both schemas independently force
`requiredOffline` on it (`release.ts:37` + `:126-135`; `schemas.ts:268` + `:310-320`), so it is
fetched, digest-verified, **charged against the 8 MB ceiling**, written to the cache — and then never
read from it. `#candidateComplete` even requires it present, so the cost is load-bearing while the
benefit is unreachable. An installed PWA loses its icon offline while still paying for it.

**RED reproduced the real symptom** (`TypeError: offline` — the request reached the network).
Repaired by naming the path in the cache-first arm. Verified red→green by reverting the fix.

### B-D-23 — a usage error passed as a closed launch gate · **HIGH** · repaired

`scripts/check.sh` `gate_closed` treated **any** non-zero exit as a healthy closed gate.
`verify-qr.ts` exits 1 on **two** different paths — the intended
`Digital QR pack: PASS` + `Physical scan matrix: BLOCKED`, and `Digital QR pack: FAIL — Usage: …`.
`package.json:46` wired `verify:qr` with **no `--pack`**, so the script died at argv validation and
`check.sh` printed `✓ verify:qr is fail-closed (as intended)`.

Executed proof:
```
$ pnpm -s verify:qr
Digital QR pack: FAIL — Usage: verify-qr.ts --pack <directory>
>>> exit: 1                      # → gate_closed reports "as intended"
```
Not one line of the manifest / checksum / vector / PDF verification ran, and no pack exists at all
(`docs/qr` absent). **The gate would have reported identically had the script been deleted.** Every
release document describing this gate as "correctly blocked on the approved short URL and physical
scan matrix" was describing a state that never occurred.

**This one convicts my own Phase 4 baseline**, which recorded `verify:qr → exit 1` as "fail-closed by
design" — inferred from the exit code, which is exactly the error the gate itself was making.
`04-baseline.md` is corrected.

Repaired: `gate_closed` now takes an expected reason, captures output, and requires **both** a
non-zero exit **and** the verifier's own marker; `verify:qr` is passed `--pack docs/qr`. Verified in
both directions — the real verifier still reports the gate closed (now for a *true* reason: the pack
does not exist), and a deleted verifier now **fails** with "closed for the wrong reason".

### Corpus content defects — 22 classes across the 120 records · **ESCALATED, not repaired**

Every one of the 120 records was read individually. The findings below are **content and provenance
defects that this goal forbids me to touch** ("Do not alter poetry wording, translations, literary
mappings… Never perform literary reinterpretation"). They are recorded with exact file and field for
the corpus owner. Full detail in the round-2 evidence.

| Class | Severity | Evidence |
| ----- | -------- | -------- |
| Truncated Persian with a stray `[` | High | `hafez-ghazal-065-bell` — `خوشتر ز عیش و صحبت و باغ[`; only `[`/`]` in the corpus (lead-verified) |
| Truncated English lines | High | `hafez-ghazal-163-bell` ends `…the sweet laughter of`; `hafez-ghazal-091-clarke`; `rumi-masnavi-0699` opens a quote it never closes |
| OCR corruption published as translation | High | `hafez-ghazal-350-clarke` `Iii the morning`; `034-clarke` / `130-clarke` digit `0` for `O`; `489-clarke` `O them` for `O thou` |
| Section **headings** published as verse | High | `rumi-masnavi-0418` (known) **and `rumi-masnavi-0643`** — whose own disclosure admits the opening line is "the translator's own summary heading rather than translated verse", and ships it as `persian_lines[0]` anyway |
| Keyword fragments published as verse | High | `rumi-masnavi-0306` `سگ کهف`; `0300` an Arabic hadith fragment; `0633`, `0724`, `0029` |
| Footnote digits inside verse | High | `rumi-masnavi-0718` `…by the force of his weaving. 4`; `0751`, `0813`, `0408` |
| Literal `...` elision marks in published lines | High | 10 lines across 6 Rumi records, 0 Hafez |
| **Provenance binds the wrong artefact** | High | All 36 Clarke records bind `english_source_sha256` to the **PDF** while their disclosure says the text was normalised "from the locked … **transcript**". The transcripts are in `source-lock.json` under different hashes and are bound by **no** record. Same shape for 24 Bell records. Digests recompute fine — they certify an artefact the pipeline never read. |
| Rights chain not coupled | High | 120 `active` permissions cite `rights-evidence.yaml`, whose 5 records are all `status: pending`, `rights_reviewer_id: null`, `source_lock_reference: null` — **although the source-lock SHA-256s exist**. `evidence_reference` is free text and is never resolved. No disclosure claims a human check, so the honesty holds; the coupling does not. |
| Same Bell poem cited for two ghazals | Medium | `hafez-ghazal-169-bell` and `-336-bell` both cite `Bell poem XLII` |
| Corrupt citation numeral | Medium | `hafez-ghazal-090-bell` — `Bell poem Ul`; not a Roman numeral, the only one of 23 |
| Registry gap | Medium | `editions.yaml` holds only the 2 Persian editions; the 3 English editions referenced by `english_source_id` have **no** entry |
| Undisclosed drop-cap; verdict inconsistent | Medium | `hafez-ghazal-046-bell`, `-288-bell` ship `THE rose has flushed red` with `MACHINE_VERIFIED`, `confidence 0.99`, `disclosures: []` — while 12 sibling records disclose and normalise this exact class |
| Confidence is a template literal, not a score | Medium | `0.8` is an exact literal in **41** records; 7 serialise raw float noise (`0.9349999999999999`); `verifiedAt` is the identical literal `2026-07-16` in all 120 |
| Crossed mapping (human judgement) | High | `rumi-masnavi-0836` — فرعون/موسی sit in `persian_lines[1]` while "Pharaoh…Moses" maps to `[0]`. **Observation only; no proposal made.** |

**Structural checks that PASS** and should not be re-litigated: 60/60/120 exact; selection ↔ disk 1:1;
all four authority digests recompute exactly for all 120; 0 duplicate identities; 0 Rumi span
overlaps; 0 fixture sentinels; 0 bidi controls; private-field stripping clean; mapping indices all
resolve; `source-lock.json` hex clean; determinism proven (reversed input → byte-identical output).

**The single highest-yield metadata-only gate available** (suggested, not applied): require
`english_source_reference` to carry a `:lines-N-M` window. **All 16 Rumi records lacking one carry a
defect, and no windowed record does.**

## Lead's personal full reads — findings and cleared code

The lead read these in full, line by line, in addition to the core read during Phase 5. Recorded so
the audit's own claim about who read what is checkable.

| File | Lines | Verdict |
| ---- | ----- | ------- |
| `src-sw/releaseManager.ts` | 906 | **NO NEW DEFECT.** The v1.0.6 rescue at `#networkNavigation` (733-748) is correctly scoped. `#serialized` (897-904) genuinely serialises staging/activation, closing the multi-tab race. The pointer write (395) is a real single-`put` commit boundary, with cleanup explicitly demoted to non-fatal maintenance (403-441) so a committed activation can never be reported as failed. The 8 MB ceiling is checked **inside** the asset loop (316) as well as after (322). `#fetchBytes` correctly treats a compressed `content-length` as wire metadata (610-623) rather than comparing it to decoded bytes. Noted, not a defect: the `readyRecordSchema.parse` calls in `#audioResponse` (834, 839) are unguarded, unlike every other parse — but they are unreachable with a corrupt record because `activeCache()` gates them via `#readReady`, which returns `null` on a parse failure. |
| `scripts/build.ts` | 1177 | **NO NEW DEFECT beyond B-D-06.** Independently implements nearly every hardening the Node research names: `open(lock,'wx',0o600)` atomic exclusive create with dev/ino identity re-verification before unlink (356-423); `lstat` not `stat` throughout; `realpath` containment checked **both** before and after resolve in `readProductionAsset` (733/741); every staged write uses `flag:'wx'` so nothing is silently overwritten (654/659/890/892); `mkdtemp` is rooted **inside `projectRoot`** (624, 1000), not `os.tmpdir()` — which is exactly the `EXDEV` cross-filesystem `rename` trap the research flagged, avoided; `resolveSafeOutputDirectory` (290-328) forbids `/`, cwd, `$HOME`, and the project root itself and requires `distDir === projectRoot/dist`; activation restores the previous dist on failure and demotes backup cleanup to a warning (960-979) so a successful activation is never reported as a failure. `parseSourceDateEpoch` (147-166) **requires** the variable and validates integer/range/UTC. |
| `scripts/verify-dist.ts` | 728 | **NO NEW DEFECT.** `walkDistribution` **explicitly rejects symlinks** (167-171) and any non-file entry (176-178) — this is the compensating control for B-D-16's symlink gap in `inspect-public-bundle.ts`. `readCanonicalJson` re-derives the canonical form and rejects any byte difference (143), a genuine tamper check. The exact-file-set assertion (681-693) reports both unexpected **and** missing. Magic bytes verified for woff2/png/webp/avif/mp4/mp3/ogg; text assets decoded with `{fatal:true}`. Binary assets are not content-scanned for private values, which is sound: they are SHA-256-bound to the registry, so injected content cannot survive the hash. |

**Scope correction to B-D-06 from these reads:** the `localeCompare` sort appears in *both*
`scripts/build.ts:438` and `scripts/verify-dist.ts:162`. Only the **build.ts** instance reaches
output — its order flows into the asset array → the asset manifest → `canonicalSha256(assetManifest)`
→ `assetManifestSha256`. In `verify-dist.ts` the resulting order only feeds set membership
(`expectedFiles.has` / `files.includes`), so it is **harmless there**. The finding stands, now
precisely scoped to one line.

## Rejected — no evidence

Speculative items raised during research and rejected by the lead after reading real code:
modulo bias in verse selection (rejection sampling is correct), `Math.random` in selection (zero
occurrences), shell/command injection (no `exec`/`shell:true` anywhere), `maxBuffer` truncation
(`stdio:'inherit'`, nothing buffered), argument injection via leading-dash filenames (no positional
untrusted filename reaches argv), prototype pollution via YAML (`eemeli/yaml` defines an own property;
`.strict()` rejects it regardless), Node 22.16.0 CVE exposure (every applicable CVE requires
`--permission` or a network server). Full reasoning in `02-primary-source-research.md`.

---

## Round 3 — everything technically repairable, closed

On instruction ("fix all things you can for now"), every remaining finding that
does **not** require a human decision was repaired. The corpus, rights, poetry and
public-statement items stay escalated for the owner and are untouched.

### Closed in round 3

| ID | Severity | Repair | Proof |
| -- | -------- | ------ | ----- |
| B-D-13 / C-4 | High | `FIXED_BROWSER_ASSETS` and `FIXED_MIME` both exported and bound by a test comparing the **real maps**. Was: 4 hand-copied tables, both authorities module-private, **no test imported either**. | **Mutation-verified** — dropping `icon.svg` from the worker mirror alone now fails the test. Plus 13 unsafe-audio-path parity cases with a control assertion so no case can pass vacuously. |
| B-D-24 | High | `verify-privacy` refused to claim a `dist` pass with no `dist`. Was: `walk()` returns `[]` for a missing dir → scanned zero files → printed *"passed … in source or dist"*. Scope widened to `public/` and the root `index.html` (the app shell sat outside every `SOURCE_DIR`) and to `.svg`. `walk()` now `lstat`s, so a symlink cycle no longer stack-overflows and a broken link no longer throws ENOENT uncaught at module scope. | Executed both ways: passes with `dist`, fails honestly without it. |
| B-D-25 (was M7) | Medium | `verifyLock` rejects an emptied lock. Was: *"Source-lock verification passed: 0 artefacts intact"*, exit 0. Lock paths now containment-checked — a traversal entry was previously only flagged for a *hash mismatch*. | RED on both; real lock still verifies its 9 artefacts. |
| B-D-16 | Medium | `inspect-public-bundle` reports symlinks and over-ceiling text assets. Was: `readdir` withFileTypes uses lstat semantics, so a symlink answered false to **both** `isFile()` and `isDirectory()` and was dropped in silence; a >5 MB text asset turned "too big to check" into "passes". | RED on both; real `verify:dist` still passes. |
| B-D-12 | Medium | All 5 CI actions SHA-pinned (**the v4 majors already in use — pinning, not a version bump**); `persist-credentials: false`; `security-events: write` + `actions: read` dropped (their only consumer is gated on `upload-sarif: true` and always skipped); `cancel-in-progress` no longer applies to `main`. | Real SHAs resolved from the API; test asserts every `uses:` matches `@[0-9a-f]{40}`. |
| B-D-26 | Medium | `pnpm minimumReleaseAge: 1440`. Default is 0 — a compromised release of any of 429 locked packages was installable the instant it was published. | `pnpm install --frozen-lockfile` verified still reproducible. |

### Downgraded on verification — recorded so it is not re-litigated

**The reported `isSafeAudioPath` "real drift" is not real.** Group E read the source
correctly — `src-sw/schemas.ts` rejects `segment.startsWith('.')` and
`publicSchema.ts` does not — and concluded `audio/.hidden.mp3` would compile and
then fail SW staging. **Executed against both real schemas, they agree:**

```
audio/test-only-hafez-01-ea5a2658.mp3   build=true   worker=true   agree   (control)
audio/.test-only-hafez-01-ea5a2658.mp3  build=false  worker=false  agree
audio/.sub/test-only-hafez-01-ea5a2658.mp3  build=false worker=false agree
```

The compiler's digest-bearing filename pattern rejects the dot-prefixed name
before the segment rule is ever reached. The divergence exists in the source and
is **unreachable**. It is now pinned by parity tests regardless of which rule does
the rejecting — so if the digest pattern ever loosens, the parity test fails
rather than the field. **My first draft of that test passed for the wrong reason**
(both paths were rejected by an unrelated rule); the control assertion was added
specifically to prevent that.

### Still open — all require a human, none are mine to make

Unchanged and escalated: the 22 corpus content/provenance classes (truncated
Persian, headings-as-verse, OCR corruption, footnote digits, PDF-vs-transcript
binding), the rights coupling, the 12 hand-typed English lines, the ~222 verse
lines in tracked evidence, the vacuous raster budget (needs a product decision),
and the public-statement accuracy of `README.md` / `SECURITY.md` /
`asset-register.md` / `phase-0` (needs an owner decision on what to publish).
