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

## Rejected — no evidence

Speculative items raised during research and rejected by the lead after reading real code:
modulo bias in verse selection (rejection sampling is correct), `Math.random` in selection (zero
occurrences), shell/command injection (no `exec`/`shell:true` anywhere), `maxBuffer` truncation
(`stdio:'inherit'`, nothing buffered), argument injection via leading-dash filenames (no positional
untrusted filename reaches argv), prototype pollution via YAML (`eemeli/yaml` defines an own property;
`.strict()` rejects it regardless), Node 22.16.0 CVE exposure (every applicable CVE requires
`--permission` or a network server). Full reasoning in `02-primary-source-research.md`.
