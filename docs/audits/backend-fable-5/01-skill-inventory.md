# Backend audit — Phase 1 skill inventory

Discovery method: the environment's own skill roots and plugin registry, bounded (no unbounded home
crawl). Roots inspected:

```
/Users/raoof.r12/Desktop/Raouf/OpemDay/.claude/skills   → 8 project skills
/Users/raoof.r12/.claude/skills                          → 100 user skills
/Users/raoof.r12/.claude/plugins/cache/**/SKILL.md       → 2,395 plugin skills
/Users/raoof.r12/.claude/plugins/installed_plugins.json  → plugin registry
.agents/skills                                           → symlinked subset of user skills (not double-counted)
```

**Total discovered: 2,503** (8 project + 100 user + 2,395 plugin).

## Bounding the plugin count honestly

2,254 of the 2,395 plugin skills belong to one marketplace, `ai-research-skills`, replicated across
23 category plugins at 98 skills each (`tokenization`, `safety-alignment`, `rag`,
`mechanistic-interpretability`, `distributed-training`, …). These are ML-research skills —
model architecture, fine-tuning, inference serving, ML paper writing. None has a contract that
materially applies to a static-site release pipeline.

The goal states: *"Do not classify purely visual design, native mobile, billing, database or
unrelated framework skills merely to inflate the count."* Accordingly this marketplace is classified
as a **bounded group: 2,254 skills, backend-relevant NO**, rather than enumerated individually. The
same treatment applies to `huggingface-skills` (52), `ui-ux-pro-max` (13), and
`chrome-devtools-mcp` (28, frontend-only).

This is a deliberate, recorded classification decision, not an omission.

## Backend-relevant skills — read and applied

| Skill | Source | Relevance | Read in full | Applied | Phase | Concrete contribution |
| ----- | ------ | --------- | ------------ | ------- | ----- | --------------------- |
| `superpowers:test-driven-development` | plugin 6.1.1 | YES — Phase 8 mandates TDD; `AGENT.md` independently mandates it | **YES** | YES | 8 | Iron Law adopted: no repair without a test that was **watched to fail first**. Governs every repair in this audit. |
| `superpowers:verification-before-completion` | plugin 6.1.1 | YES — Phases 4/9 and the completion gates | **YES** | YES | 4, 9, 11 | "No completion claims without fresh verification evidence." Every gate in `04-baseline.md` carries a real exit code, not an assertion. |
| `superpowers:systematic-debugging` | plugin 6.1.1 | YES — root cause before fixes | **YES** | YES | 5–8 | Four-phase discipline applied to each defect: reproduce → pattern → single hypothesis → fix at cause. Forbids symptom fixes. |
| `superpowers:requesting-code-review` | plugin 6.1.1 | YES — Phase 10 | **YES** | YES | 10 | Reviewer subagents get crafted context, never session history — the model used for the adversarial re-audit dimensions. |
| `superpowers:receiving-code-review` | plugin 6.1.1 | YES — Phase 10 reconciliation | **YES** | YES | 5, 10 | "Verify before implementing." Directly applied: every subagent/research finding in this audit was re-verified by the lead against real code before acceptance. Two were downgraded on verification. |
| `superpowers:dispatching-parallel-agents` | plugin 6.1.1 | YES — independent read-only work | **YES** | YES | 2, 5, 10 | Governs the research + audit fan-out; no two agents share write state (all are read-only). |
| `superpowers:finishing-a-development-branch` | plugin 6.1.1 | YES — Phase 11 | **YES** | YES | 11 | PR-not-merge completion path. |
| `raouf-change-protocol` | user | YES — **mandatory**, `AGENT.md` §Change protocol | **YES** | YES | 0, 11 | Preflight reading of `AGENT.md` + `CHANGELOG.md` performed before any edit; dated `Raouf:` entries required in both at Phase 11. |
| `divan-release-gauntlet` | project | YES — release verification contract | **YES** | Partly | 9 | Entry conditions **not met** (no cinematic implementation, no asset generation, no manual browser inspection in this audit) and the skill says "Never invoke automatically during ordinary edits." Correctly **not run**. Its verdict vocabulary (`PASS` / `PASS WITH EXTERNAL LAUNCH GATES` / `BLOCKED`) and its "never convert missing evidence into a pass" rule are adopted. |
| `test-creator` | user | YES — Phase 8 regression tests | **YES** | YES | 8 | Contract adopted: never weaken privacy/audit/secret rules to make a test pass; match repo conventions (Vitest, not a new framework); negative test for every positive path. |
| `accidental-data-loss-prevention` | user | YES — destructive-command consent | **YES** | YES | 0–11 | Halt-and-ask before irreversible operations. Reinforces the goal's ban on `git add -A`/force-push/reset/clean. No destructive command was run. |
| `superpowers:using-git-worktrees` | plugin 6.1.1 | YES — Phase 0 isolation | **YES** | Considered, not used | 0 | A branch off `origin/main` satisfies the goal's isolation requirement; a worktree adds no isolation here because no concurrent writer exists. Recorded as a deliberate choice. |
| `cloudflare` / `cloudflare-one` | user + plugin | YES — Tunnel/origin isolation | Partial (retrieval-first contract) | YES | 2 | Both skills declare "retrieval-first: use current Cloudflare docs over pre-trained knowledge." Honoured — tunnel/ingress/Web-Analytics findings come from `developers.cloudflare.com` fetched at audit time, not memory. |
| `superpowers:using-superpowers` | plugin 6.1.1 | YES — skill-discipline meta-skill | **YES** | YES | all | Loaded at session start; requires invoking relevant skills before acting. |

## Discovered, classified NOT backend-relevant (reason recorded)

| Skill / group | Count | Why not applicable |
| ------------- | ----- | ------------------ |
| `ai-research-skills/*` (23 plugins) | 2,254 | ML research (training, fine-tuning, inference serving, interpretability). No contract touches a static release pipeline. |
| `huggingface-skills` | 52 | Model/dataset hub operations. No application. |
| `chrome-devtools-mcp` | 28 | Browser/frontend profiling — frontend scope, explicitly out of scope here. |
| `ui-ux-pro-max`, `frontend-design`, `canvas-design`, `theme-factory`, `algorithmic-art`, `brand-guidelines`, `web-artifacts-builder`, `slack-gif-creator` | 20 | Visual design. Explicitly excluded by the goal. |
| `alloydb-*`, `cloud-sql-*`, `bigquery*`, `spanner-data`, `firestore-data`, `supabase`, `dataform-*`, `dbt-*`, `gcp-*` | ~40 | **Database/warehouse skills. Applying these would violate the architecture truth** — DIVAN has no database and this audit must not add one. Excluded on principle, not convenience. |
| `durable-objects`, `agents-sdk`, `sandbox-sdk`, `workers-best-practices`, `wrangler`, `cloudflare-email-service`, `turnstile-spin` | ~7 | Cloudflare **Workers/compute** — DIVAN uses Cloudflare only as DNS + Tunnel. No Worker exists and none may be added. |
| `plugin-dev/*`, `skill-creator`, `skill-repair`, `writing-skills`, `hookify`, `mcp-builder`, `claude-md-improver`, `peon-ping-*`, `remember`, `zurvan`, `find-skills` | ~20 | Agent tooling / meta. Not a repository trust boundary. |
| `pdf`, `docx`, `xlsx`, `pptx` | 4 | Document generation. The QR/PDF pack uses `pdfkit` directly; these skills target user-authored documents. |
| `divan-accessibility-qa`, `divan-atmosphere-effects`, `divan-book-motion-system`, `divan-brand-art-direction`, `divan-cinematic-threshold`, `divan-asset-pipeline-higgsfield` | 6 | Project frontend/cinematic skills — frontend scope. |
| `divan-mobile-performance-guard` | 1 | **Boundary**: owns SW/caching/JS budgets. Consulted as a contract reference for the release-coherence lens; not applied as a workflow (no media/animation changed). |
| Remaining user skills (`deep-research`, `stop-slop`, `simurgh-arise`, `doc-coauthoring`, `internal-comms`, `web-perf`, `webapp-testing`, `notebook-guidance`, `ml-best-practices`, `managing-python-dependencies`, `raouf-bedtime-story-protocol`, …) | ~35 | Writing/research/frontend-testing aids with no backend trust-boundary contract. `stop-slop` and `deep-research` informed prose/research quality but are not backend controls; recorded here rather than claimed as applied controls. |

## Conflicts and resolutions

Precedence used throughout: **this goal → repository instruction files → Release 1 design authority
→ nearest applicable skill contract → general guidance.**

| # | Conflict | Resolution |
| - | -------- | ---------- |
| 1 | `raouf-change-protocol` says "If no changelog exists, create `CHANGELOG.md`" and mandates updating agent+changelog after **any** change. The goal forbids merging/tagging/deploying. | No conflict in practice: both files exist; entries are added at Phase 11 on the audit branch only. Protocol satisfied without touching main. |
| 2 | `divan-release-gauntlet` step 10 says "Ask before push"; the goal says "push the audit branch normally" and "Never force-push". | Goal wins (precedence 1). Normal push of the audit branch only; no tag, no merge, no deploy. The gauntlet itself is not invoked — its entry conditions are unmet. |
| 3 | `test-creator` says "propose a plan and wait for confirmation unless the user clearly said 'just go'". The goal says "Do not stop after a plan… Complete the full file-by-file audit and repair cycle." | Goal wins. The goal is an explicit standing instruction to proceed; the defect ledger (Phase 7) serves as the recorded plan before any edit. |
| 4 | `superpowers:test-driven-development` "Exceptions (ask your human partner): configuration files". Several likely repairs are config (Caddyfile, CI). | Goal §12 mandates test-driven repair with no config exception, and this repo already tests config as behaviour (`tests/security/opsConfig.test.ts`). Goal + repo convention win: **config repairs get failing tests first**. |
| 5 | Database skills (`alloydb-*`, `cloud-sql-*`, `supabase`) are installed and would "apply" to a backend audit by name. | Architecture truth wins: DIVAN intentionally has no database, and the goal forbids adding one "merely to make the architecture look more conventional." Classified NOT relevant. Listing them as applied would be exactly the "report a skill as applied merely because its name was listed" failure the goal bans. |
| 6 | `cloudflare` skills bias toward retrieval from Cloudflare docs; the goal forbids mutating Cloudflare. | No conflict — retrieval is read-only. Docs were fetched; **no Cloudflare API call, zone read, or mutation was performed.** |

## Honest limitations

- **Not every one of the 2,503 discovered skills was read in full.** Reading 2,254 ML-research skills
  would be waste, not rigour. Every skill was **classified**; every skill classified backend-relevant
  was **read in full**. Where a skill was read only partially (`cloudflare`, `cloudflare-one` — both
  are retrieval-first pointers rather than fixed procedures), that is stated in the table above
  rather than rounded up to "read".
- `divan-release-gauntlet` is recorded as **not run**, with its entry conditions quoted. Reporting it
  as applied would be a false claim.
