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
| `webapp-testing` | `~/.claude/skills/webapp-testing` | **yes** | classified, **not yet read** | Playwright interaction/screenshot toolkit — Phase 6 |
| `chrome-devtools-mcp:chrome-devtools` | plugin `chrome-devtools-mcp@1.6.0` | **yes** | classified, **not yet read** | primary rendered-evidence runtime — Phase 6 |
| `chrome-devtools-mcp:a11y-debugging` | same plugin | **yes** | classified, **not yet read** | Phase 4.4 / 6 |
| `chrome-devtools-mcp:debug-optimize-lcp` | same plugin | **yes** | classified, **not yet read** | Phase 4.7 |
| `chrome-devtools-mcp:memory-leak-debugging` | same plugin | **yes** | classified, **not yet read** | Phase 4.7 — memory across repeated draws |
| `chrome-devtools-mcp:chrome-devtools-cli` | same plugin | **yes** | classified, **not yet read** | Phase 6 fallback |
| `chrome-devtools-mcp:troubleshooting` | same plugin | **yes** | classified, **not yet read** | contingency only |
| `cloudflare:web-perf` | plugin `cloudflare@1.0.0` | **yes** | classified, **not yet read** | Core Web Vitals — Phase 4.7. **Audit-only**: goal rule 5 forbids touching Cloudflare config |
| `scroll-world` | plugin `scroll-world@0.2.0` | **yes** | classified, **not yet read** | scroll-scrub cinematic — see conflict C2 |
| `test-creator` | `~/.claude/skills/test-creator` | **yes** | classified, **not yet read** | Phase 8 regression tests |
| `verify` / `code-review` / `simplify` / `run` | harness | **yes** | classified | Phase 8/9 |
| `superpowers:systematic-debugging` | plugin `superpowers@6.1.1` | process | **APPLIED** | Forced empirical verification of the reducer lead → downgraded it from High to Low |
| `superpowers:test-driven-development` | same | process | pending | Phase 8 — mandated by goal rule 11 anyway |
| `superpowers:verification-before-completion` | same | process | **APPLIED** | Caught the false `pnpm install` success (see below) |
| `superpowers:using-git-worktrees` | same | process | **APPLIED** | Phase 0 isolation |
| `raouf-change-protocol` | `~/.claude/skills/raouf-change-protocol` | **yes (mandatory)** | classified | Phase 10 — `AGENT.md` + `CHANGELOG.md` entries |

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
| Frontend-relevant skills READ IN FULL | 9 |
| Frontend-relevant skills APPLIED so far | 9 |
| Frontend-relevant skills classified but NOT yet read | 12 |
| Unreadable skills | 0 |

**This inventory is incomplete.** 12 classified frontend skills remain unread, all of them
Phase 6 (rendered browser) and Phase 8 (repair) tooling. The audit cannot be reported as
PASS until they are read or explicitly and honestly excluded.
