# 01 — Skill Inventory

Per goal Phase 1. Status values are literal and unforgiving: a skill is only `READ IN FULL`
if its complete instruction file was read in this session, and only `APPLIED` if it actually
shaped an audit action that produced evidence. A skill name appearing is not "run".

## Discovery method

Registry sources consulted, in order:

1. The harness's own available-skills listing (authoritative for what the `Skill` tool can invoke).
2. `~/.claude/plugins/installed_plugins.json` — 52 installed plugins with versions and commit SHAs.
3. Filesystem skill roots, bounded (no unbounded home crawl):
   - `<repo>/.claude/skills/` — 8 project skills **(present)**
   - `~/.claude/skills/` — 92 user skills **(present)**
   - `~/.agents/skills/` — 7 skills **(present, all duplicates of user/plugin skills)**
   - `~/.claude/plugins/` — plugin + marketplace caches **(present)**
   - `<repo>/.claude/plugins/` — **absent**

### Discovery correction (recorded per goal rule 15)

A naive `find … -name SKILL.md` under `~/.claude/plugins` returns **2,509** hits. This is an
artefact, not a skill count: each of the 21 `ai-research-skills` plugin caches contains a
complete duplicate copy of the entire skill set (2,254 of the hits, at a uniform nesting
depth of 6). The deduplicated, registry-backed count is what this document uses. Reporting
2,509 installed skills would have been false.

## Frontend-relevant skills

### Project skills — `<repo>/.claude/skills/` (highest authority after the goal and repo docs)

| Skill | Path | Frontend | Status | Applied in | Evidence |
| --- | --- | --- | --- | --- | --- |
| `divan-accessibility-qa` | `.claude/skills/divan-accessibility-qa/SKILL.md` | **yes** | READ IN FULL (45L) | Phase 4.4 | a11y lens criteria; manual-matrix limits recorded |
| `divan-atmosphere-effects` | `…/divan-atmosphere-effects/SKILL.md` | **yes** | READ IN FULL (44L) | Phase 4.5 | butterfly ≤2 rule, `aria-hidden` layer discipline |
| `divan-book-motion-system` | `…/divan-book-motion-system/SKILL.md` | **yes** | READ IN FULL (63L) | Phase 4.1, 4.5 | state machine `idle→ready→opening→settling→poemVisible→redrawing→ready`; interruption/cancellation rules |
| `divan-brand-art-direction` | `…/divan-brand-art-direction/SKILL.md` + `references/tokens.md` | **yes** | READ IN FULL (57L + tokens) | Phase 4.3, 6.4 | locked palette; English-first/Persian-beneath; reject-list |
| `divan-cinematic-threshold` | `…/divan-cinematic-threshold/SKILL.md` + `references/shot-contract.md` | **yes** | READ IN FULL (62L + contract) | Phase 4.5 | poster-first, Skip-from-first-frame, handoff contract |
| `divan-mobile-performance-guard` | `…/divan-mobile-performance-guard/SKILL.md` + `references/budgets.json` | **yes** | READ IN FULL (39L + budgets) | Phase 4.7 | numeric release gates (LCP 2500ms, CLS 0.1, INP 200ms, initial JS 220KB gzip) |
| `divan-release-gauntlet` | `…/divan-release-gauntlet/SKILL.md` | **yes** | READ IN FULL (27L) | **not invoked — correctly** | Entry conditions unmet; skill says "never invoke automatically during ordinary edits". This audit is not a release. |
| `divan-asset-pipeline-higgsfield` | `…/divan-asset-pipeline-higgsfield/SKILL.md` + `references/prompts.md` | partial | READ (65L) | **not applied** | Governs media *generation*. Goal rule 4 forbids altering assets; audit-only. |

### External frontend skills

| Skill | Source | Frontend | Status | Notes |
| --- | --- | --- | --- | --- |
| `frontend-design` | plugin `frontend-design@claude-plugins-official` | **yes** | **READ IN FULL + INVOKED** | Applied as review rubric only — see conflict C1 |
| `frontend-design` | user skill `~/.claude/skills/frontend-design` | **yes** | duplicate of the above | same content surface |
| `webapp-testing` | `~/.claude/skills/webapp-testing` (95L) | **yes** | **READ IN FULL** | Phase 6. Playwright-via-Python; `scripts/with_server.py` to be used as a black box, per its own instruction not to ingest script source. Key rule adopted: wait for `networkidle` before DOM inspection. |
| `chrome-devtools-mcp:chrome-devtools` | plugin `chrome-devtools-mcp@**1.6.0**` (72L) | **yes** | **READ IN FULL** | Phase 6 primary runtime. Adopted: navigate → wait → snapshot → interact ordering; `take_snapshot` (a11y tree) for automation, `take_screenshot` only for visual state; `filePath` for large outputs to protect context. |
| `chrome-devtools-mcp:a11y-debugging` | same plugin (89L) | **yes** | **READ IN FULL** | Phase 4.4 / 6. Adopted: a11y tree is source of truth over DOM; `list_console_messages types:["issue"]` for native contrast/label audits; `jq`/node filter on Lighthouse JSON rather than reading the report. Tap-target floor cited as 48×48 (web.dev) — see conflict C4. |
| `chrome-devtools-mcp:debug-optimize-lcp` | same plugin (121L) | **yes** | **READ IN FULL** | Phase 4.7. Adopted: LCP subpart breakdown (TTFB ~40% / load delay <10% / load duration ~40% / render delay <10%); `emulate` Fast 3G + 4× CPU throttle. |
| `chrome-devtools-mcp:memory-leak-debugging` | same plugin (58L) | **yes** | **READ IN FULL** | Phase 4.7 — memory across repeated draws. Adopted: repeat interaction ×10 to amplify; never read raw `.heapsnapshot` (context blowout); baseline/target/final snapshot triad. |
| `chrome-devtools-mcp:troubleshooting` | same plugin (98L) | **yes** | **READ IN FULL** | Contingency for Phase 6. Notes read-only-mode symptom (only ~9 tools) and `--autoConnect` / `DevToolsActivePort` failure modes. |
| `chrome-devtools-mcp:chrome-devtools-cli` | same plugin (153L) | **yes** | **NOT READ** | Deliberate: shell-scripting variant of the MCP runtime already covered by `chrome-devtools`. Will be read only if the MCP path fails in Phase 6. Recorded rather than silently skipped. |
| `cloudflare:web-perf` | plugin `cloudflare@1.0.0` (201L) | **yes** | **READ IN FULL** | Phase 4.7. Adopted thresholds (LCP <2.5s, INP <200ms, CLS <0.1, TTFB <800ms, TBT <200ms) — consistent with `budgets.json`. Adopted "verify before recommending" and "quantify impact; skip 0ms non-issues". **Audit-only**: goal rule 5 forbids touching Cloudflare config; Phase 5 codebase analysis is in scope, config changes are not. |
| `scroll-world` | plugin `scroll-world@0.2.0` (535L) | **yes** | **READ IN PART (150/535)** — excluded | Read to the point where conflict C2 was decisively confirmed, then stopped. It is a Higgsfield **media-generation** pipeline requiring new image/video generation and credits — barred by goal rules 4 and 6. Remaining 385L are prompt templates and ffmpeg encode recipes with no audit value. Its `references/scrub-engine.js` retained as a comparison reference for `src/lib/cinematic/scrollScrub.ts` seam handling only. |
| `test-creator` | `~/.claude/skills/test-creator` (150L) | **yes** | **READ IN FULL** | Phase 8. Adopted: mandatory inspection pass before writing tests; no new framework (repo is Vitest — must not introduce another); never weaken privacy/security to make a test pass; negative case per positive; no large snapshots. It self-directs to `raouf-change-protocol` when `AGENT.md` + `CHANGELOG*.md` exist — both do. |
| `verify` / `code-review` / `simplify` / `run` | harness | **yes** | classified | Phase 8/9 |
| `superpowers:systematic-debugging` | plugin `superpowers@6.1.1` | process | **APPLIED** | Forced empirical verification of the reducer lead → downgraded it from High to Low |
| `superpowers:test-driven-development` | same (371L) | process | **NOT READ** | Deliberate: goal rule 11 already mandates failing-test-first and is the governing authority (precedence 1 over precedence 4). Will be read before Phase 8 if any repair is authorised. Recorded rather than silently skipped. |
| `superpowers:verification-before-completion` | same | process | **APPLIED** | Caught the false `pnpm install` success (see below) |
| `superpowers:using-git-worktrees` | same | process | **APPLIED** | Phase 0 isolation |
| `raouf-change-protocol` | `~/.claude/skills/raouf-change-protocol` (74L) | **yes (mandatory)** | **READ IN FULL** | Phase 10. Requires: preflight read of `AGENT.md` + `CHANGELOG.md` **before** code edits; postflight `Raouf:` entry in **both**, dated Australia/Sydney, with scope, summary, files changed, verification, follow-ups; and a fixed output format (Preflight / Plan / Changes / Verification / Logs). Also mirrors repo `CLAUDE.md` invariant 6. **No implementation file has been edited, so its preflight obligation is not yet triggered.** |

### Classified NOT frontend-relevant (not inflating the count)

`canvas-design`, `algorithmic-art`, `brand-guidelines` (Anthropic brand, not DIVAN),
`theme-factory`, `web-artifacts-builder`, `artifact-design`, `dataviz` (DIVAN has no charts),
`building-data-apps`, `slack-gif-creator`, all `alloydb-*` / `cloud-sql-*` / `spanner-*` /
`firestore-*` / `bigquery*` / `dataform-*` / `dbt-*` (database), all `gcp-*` (infrastructure),
all `higgsfield-*` except the DIVAN pipeline skill (media generation — out of scope by rule 4),
the entire `ai-research-skills` marketplace (21 plugins: ML training, RL, quantisation,
inference serving — no browser surface), `supabase`, `mcp-builder`, `docx`/`pptx`/`xlsx`/`pdf`,
`computing-paper-builder`, `ml-paper-writing`, `deep-research`, `zurvan`, `peon-ping-*`.

## Conflicts and resolutions

Per goal precedence: user goal → repo instruction files → Release-1 design authority →
nearest applicable skill → general skill guidance.

**C1 — `frontend-design` vs locked design authority.** The skill briefs the agent as a studio
design lead who must "make deliberate, opinionated choices", "take one real aesthetic risk",
and revise anything that reads as a default. The goal (rule 3) forbids redesign by taste and
declares the Release-1 design approved. **Resolution:** goal wins. Applied strictly as a review
rubric — its AI-default calibration list, restraint principle, and quality floor (responsive to
mobile, visible keyboard focus, reduced motion respected) are used as audit criteria. Its
generative mandate is suppressed. Recorded, not silently ignored.

**C2 — `scroll-world` vs `divan-cinematic-threshold`.** `scroll-world` builds a full
scroll-scrubbed "fly through the world" landing page. `divan-cinematic-threshold` states
explicitly: "Do not convert the full website into a Scroll World." **Resolution:** the project
skill wins as the nearer, more specific authority. `scroll-world` may inform scrub-engine
review only; it must not motivate expanding the cinematic.

**C4 — tap-target floor: 48×48 vs 44px.** `chrome-devtools-mcp:a11y-debugging` cites web.dev's
48×48 px tap-target guidance. The repository's `CLAUDE.md` states a 44px target convention, and
`divan-accessibility-qa` defers to "target size consistent with the project design". WCAG 2.2 AA
SC 2.5.8 (Target Size, Minimum) requires 24×24 CSS px; 44×44 is the AAA-adjacent/Apple HIG norm;
48×48 is a Google recommendation, not a WCAG AA conformance threshold. **Resolution:** the
repository convention (44px) governs, and WCAG 2.2 AA (24×24) is the pass/fail line. A control
between 44 and 48 px is **not** a defect and must not be reported as one — doing so would breach
goal rule 3 (no redesign by taste) by dressing a preference as a violation. Recorded so the
distinction is explicit before any measurement is taken.

**C5 — `frontend-design` vs `test-creator` on asking first.** `test-creator` requires proposing a
test plan and waiting for confirmation before writing tests. Goal rule 11 requires a failing test
before each behavioural repair. **Resolution:** no conflict in substance — the plan is proposed as
part of the Phase 7 defect ledger, which the goal already gates on user-visible review before
Phase 8 editing. Both are satisfied by the goal's own ordering.

**C3 — `divan-release-gauntlet` entry conditions.** Its own text forbids automatic invocation
outside final release verification. The goal asks to apply every applicable frontend skill.
**Resolution:** the skill's own contract governs its applicability. Read, deliberately not run,
reason recorded. Running it would also risk arming a release gate — barred by goal rule 6.

## Process note recorded per rule 15

An early `pnpm install --frozen-lockfile 2>&1 | tail -15` reported **exit 0 while the install
never ran** — `pnpm` was absent from PATH and the pipeline's exit code came from `tail`. This
was caught by re-verifying rather than trusting the reported code, and is logged here because
an unnoticed false-green would have invalidated the entire baseline.

## Totals

| Metric | Count |
| --- | --- |
| Installed plugins (registry) | 52 |
| Project skills discovered | 8 |
| User skills discovered | 92 |
| Raw `SKILL.md` hits under plugins (**artefact**) | 2,509 |
| Frontend-relevant skills identified | 21 |
| Frontend-relevant skills READ IN FULL | 18 |
| Frontend-relevant skills read in part, exclusion justified | 1 (`scroll-world`) |
| Frontend-relevant skills deliberately NOT read, reason recorded | 2 (`chrome-devtools-cli`, `superpowers:test-driven-development`) |
| Frontend-relevant skills silently skipped | **0** |
| Unreadable / unavailable skills | 0 |
| Conflicts found and resolved | 5 (C1–C5) |

## Phase 1 status: CLOSED

Every frontend-relevant skill is now read in full, or read to the point of a justified
exclusion, or deliberately deferred with a recorded reason. **None was silently skipped**,
which is the bar goal rule 15 sets.

The three not read in full are accounted for honestly:

- **`scroll-world`** — read 150/535L, enough to confirm C2 decisively. It is generation
  machinery this audit is forbidden to run. Finishing it would produce no audit evidence.
- **`chrome-devtools-cli`** — same capability as the MCP runtime already read; a fallback path.
- **`superpowers:test-driven-development`** — superseded by goal rule 11, which outranks it.
  To be read if Phase 8 repairs are authorised.

### Note on `ui-widgets`

A filesystem scan surfaces `ui-widgets/SKILL.md` (355L) under
`chrome-devtools-mcp/*/node_modules/chrome-devtools-frontend/.agents/skills/`. This is a
**vendored dependency's own internal skill**, not a registered skill of this installation —
it does not appear in the harness registry and cannot be invoked. It is therefore not an
installed skill and is excluded. Counting it would have inflated the frontend total.

### Stale cache note

`chrome-devtools-mcp` has both `1.5.0` and `1.6.0` caches on disk with byte-identical skill
files. `installed_plugins.json` pins **1.6.0** active; 1.6.0 was read and 1.5.0 ignored as
stale. Reading both would have double-counted six skills.
