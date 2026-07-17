# Fable 5 frontend audit — Phase 1 skill inventory

Date: 2026-07-17 (Australia/Sydney). Lead: Claude Fable 5.

## Discovery method

1. **Official registry:** the Claude Code harness skill listing for this session (authoritative; ~319 entries after `/reload-skills`), plus `~/.claude/plugins/installed_plugins.json` (57 installed plugins with versions/paths).
2. **Bounded roots inspected:** `.claude/skills/` (8 project skills), `.claude/plugins/` (empty), `~/.claude/skills/` (104), `~/.claude/plugins/` (cache + marketplaces), `.agents/skills/` (empty), `~/.agents/skills/` (18). Skill definitions found as `SKILL.md` + plugin manifests (`skill.json`, `installed_plugins.json`). No unbounded home-directory crawl was performed.

Counts: **~319 registry-visible skills** (including plugin-namespaced and harness built-ins). **24 classified frontend-relevant** (below). **24/24 frontend-relevant skills fully read.** **17 applicable to DIVAN and applied** (application phase noted per row); 7 frontend-relevant but not applicable, each with reason.

Precedence for conflicts: user goal → repo instruction files → Release 1 design authority → nearest skill contract → general guidance.

## A. Frontend-relevant skills (full rows)

| # | Skill | Source / path | Version | Relevant | Fully read | Applicable | Applied (phase) | Contract summary / contribution |
|---|---|---|---|---|---|---|---|---|
| 1 | `ui-ux-pro-max:ui-ux-pro-max` | plugin `ui-ux-pro-max@ui-ux-pro-max-skill`, `~/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.11.0/.claude/skills/ui-ux-pro-max` | 2.11.0 | YES | YES (SKILL.md + `references/quick-reference.md` all 10 categories + `references/pro-rules.md`) | YES | P5 review lenses; P6 rendered checks; P7 severity rationale | Priority-ordered UX rule DB (a11y contrast/focus/keyboard, 44px targets, CLS/lazy-load, z-index scale, 16px body, motion 150–400ms transform/opacity-only, reduced-motion, navigation back-behavior/focus-on-route-change). Validation search run per contract (`--domain ux "animation accessibility z-index loading"`); further domain searches used during file audit. Pre-delivery checklist scoped to native apps — applied analogously with quick-reference §1–§3 for web. |
| 2 | `frontend-design:frontend-design` | plugin `frontend-design@claude-plugins-official` | unknown (2026-07-17 cache) | YES | YES (via Skill invocation) | YES | P5 visual/typography/copy critique; P8 any UI repair styling | Design-lead lens: distinctive palette/type/layout, signature element, restraint ("remove one accessory"), quality floor (responsive, visible focus, reduced motion), interface copy rules (active voice, user-side naming, errors state cause+fix). Used in **review mode only** — goal forbids taste-based redesign, so findings from this lens require objective evidence before becoming defects. |
| 3 | `frontend-design` (standalone) | `~/.claude/skills/frontend-design/SKILL.md` | n/a | YES | YES | YES (same contract as #2) | merged with #2 | Duplicate of the plugin skill family; single application recorded. |
| 4 | `divan-brand-art-direction` | `.claude/skills/divan-brand-art-direction/SKILL.md` | repo @ e348048 | YES | YES | YES | P5 visual files; P6 rendered review | Locked direction (illuminated miniature, lapis/pomegranate/gold/parchment, English-first), reject-list (fake Persian letterforms, floating decoration over poem text, inconsistent radii/shadows), composition contract (mobile safe centre, text-safe region), typography rules (no letter-spacing distortion of Persian). |
| 5 | `divan-cinematic-threshold` | `.claude/skills/divan-cinematic-threshold/SKILL.md` | repo | YES | YES | YES | P5 `CinematicThreshold`/`scrollScrub`/`capability`; P6 flows 1–8 | Poster-first, Skip from first frame, no scroll trap, seek coalescing, poster until real frame paints, iOS priming after interaction, reduced-motion/Save-Data poster routes, failure → live book without error wall, resize noise ignored; verification list (forward/reverse scrub, flick, resize, bg/fg, failed media, offline, reduced motion, keyboard). |
| 6 | `divan-book-motion-system` | `.claude/skills/divan-book-motion-system/SKILL.md` | repo | YES | YES | YES | P5 `BookStage`/`RevealScene`/motion.css; P6 reveal flows | Layered book model, interruptible state machine (idle→ready→opening→settling→poemVisible→redrawing), transform/opacity only, cancel animations on redraw/navigate/hide/unmount, double-activation guards, focus preservation, reduced-motion dissolve, required test coverage list. |
| 7 | `divan-atmosphere-effects` | `.claude/skills/divan-atmosphere-effects/SKILL.md` | repo | YES | YES | YES | P5 `CandleScene`/`ButterflyField`/`PoetryMotes` | Max two butterflies, never over text/controls/focus, aria-hidden + pointer-transparent, below controls, pause when hidden, reduce on mobile/reduced-motion/low-power, no fabricated Persian glyphs as decoration. |
| 8 | `divan-accessibility-qa` | `.claude/skills/divan-accessibility-qa/SKILL.md` | repo | YES | YES | YES | P5 §5.4; P6 a11y flows; P7 severity | WCAG 2.2 AA + project rules: landmarks/heading order, skip link, keyboard-only completion incl. cinematic, no trap, single announcement, English-first, `lang/dir`, 320px reflow + 200% zoom, reduced-motion equivalents, decorative hiding, defect format (severity, repro, WCAG criterion, component, repair, evidence). |
| 9 | `divan-mobile-performance-guard` | `.claude/skills/divan-mobile-performance-guard/SKILL.md` | repo | YES | YES | YES | P5 §5.7; P6 perf measurements | Budgets as release gates (`references/budgets.json`), poster/app-shell first, lazy cinematic, dedicated mobile encodes, transform/opacity, no WebGL/continuous particles, SW manifest coherence, Blob URL revocation, measure don't infer. |
| 10 | `divan-asset-pipeline-higgsfield` | `.claude/skills/divan-asset-pipeline-higgsfield/SKILL.md` | repo | YES | YES | Partially (no generation in scope) | P5 media-delivery lens only | Generation pipeline out of scope (boundaries forbid asset regeneration); its delivery rules (raw masters private, mobile/desktop derivatives, audio stripped, faststart/GOP, poster fallbacks, only intended derivatives in public build) are applied as audit criteria. |
| 11 | `divan-release-gauntlet` | `.claude/skills/divan-release-gauntlet/SKILL.md` | repo | YES | YES | Conditional | P10 only if entry conditions met | Final cinematic release verification with armed gate scripts. Entry conditions (released media changes + manual inspection + report) — invoked only if repairs touch cinematic assets/behaviour; recorded either way. |
| 12 | `webapp-testing` | `~/.claude/skills/webapp-testing/SKILL.md` | n/a | YES | YES | YES | P6 rendered matrix (Playwright driving) | Playwright-based local webapp testing: `with_server.py` lifecycle helper, reconnaissance-then-action, networkidle before inspection, headless Chromium, console capture. |
| 13 | `web-perf` (+ duplicate `cloudflare:web-perf`) | `~/.claude/skills/web-perf/SKILL.md`; plugin copy | n/a | YES | YES | YES | P6/P10 perf traces | Chrome DevTools MCP CWV workflow: trace → `LCPBreakdown`/`CLSCulprits` insights → network analysis → a11y snapshot → codebase phase; thresholds LCP 2.5s / CLS 0.1 / INP 200ms / TBT 200ms; retrieval-first for current numbers. |
| 14 | `chrome-devtools-mcp:chrome-devtools` | plugin cache 1.6.0 | 1.6.0 | YES | YES | YES | P6 browser automation (Chromium/CDP) | Lifecycle, snapshot-uid interaction pattern, navigate→wait→snapshot→interact, filePath for large outputs. |
| 15 | `chrome-devtools-mcp:a11y-debugging` | plugin cache 1.6.0 | 1.6.0 | YES | YES | YES | P6 a11y flows | Accessibility-tree-first auditing, Lighthouse a11y baseline + jq extraction, console `issue` types, heading/landmark checks, Tab-driven focus verification, tap-target and contrast snippets. |
| 16 | `chrome-devtools-mcp:debug-optimize-lcp` | plugin cache 1.6.0 | 1.6.0 | YES | YES | YES | P6 LCP verification | LCP subpart budget model (TTFB ~40% / load delay <10% / load ~40% / render delay <10%), trace-driven insights, LCP-element identification snippet. |
| 17 | `chrome-devtools-mcp:memory-leak-debugging` | plugin cache 1.6.0 | 1.6.0 | YES | YES | Conditional | P6 repeated-draw memory check if leak suspected | Heap-snapshot workflow via MCP tools (baseline/target/final ×10 interactions), retainer analysis, detached-DOM/listener culprits. |
| 18 | `chrome-devtools-mcp:chrome-devtools-cli` | plugin cache 1.6.0 | 1.6.0 | YES | YES | Fallback | P6 fallback if MCP session unavailable | Same tools via shell CLI; snapshot-uid pattern from terminal. |
| 19 | `chrome-devtools-mcp:troubleshooting` | plugin cache 1.6.0 | 1.6.0 | YES | YES | Conditional | P6 if CDP connection fails | Connection triage (DevToolsActivePort, autoConnect, browserUrl). |
| 20 | `test-creator` | `~/.claude/skills/test-creator/SKILL.md` | n/a | YES | YES | YES | P5 §test-coverage lens; P8 regression tests | Inspection-first test writing; repo conventions are the contract (Vitest here — no new framework); behaviour-anchored, negative paths per positive, no snapshot spam, never weaken privacy/security gates to pass. |
| 21 | `ui-ux-pro-max:ui-styling` | plugin cache 2.11.0 | 2.11.0 | YES | YES (frontmatter + scope section; body is shadcn/Tailwind workflow) | NO — stack mismatch | — | Targets shadcn/ui + Tailwind; DIVAN uses hand-written CSS custom properties with a locked visual-budget test. Applying it would violate the locked visual system. |
| 22 | `scroll-world:scroll-world` (+ `~/.agents/skills/scroll-world`) | plugin cache 0.2.0 | 0.2.0 | YES | YES (all 535 lines) | NO for generation; YES as audit reference | P5 cross-check of `scrollScrub.ts`/`CinematicThreshold` | Generation pipeline out of scope, but its hard-won scrub engineering is used as cross-check criteria: seek coalescing, iOS never-played-muted-video blank-frame quirk (poster until paint + prime on first touch), `video.seekable` byte-range/blob pitfall, GOP-size seek cost, URL-bar height-only resize noise, safe-area/`viewport-fit=cover`, reverse-scrub velocity, reduced-motion poster fallback. |
| 23 | `dataviz` | harness skill | n/a | Borderline → NO applicable | YES (description; DIVAN renders zero charts) | NO | — | Chart/dashboard-specific; no chart exists in the DIVAN frontend. |
| 24 | `web-artifacts-builder` / `theme-factory` / `artifact-design` | harness/user skills | n/a | Borderline → NO applicable | YES (descriptions) | NO | — | claude.ai-artifact-specific tooling; DIVAN is a standalone Vite SPA. |

## B. Process/protocol skills applied (not frontend-domain, but governing how the audit works)

| Skill | Read | Applied |
|---|---|---|
| `raouf-change-protocol` | YES (full) | Every change: AGENT.md/CHANGELOG read pre-edit (done in P0); dated `Raouf:` entries post-change (P11). |
| `superpowers:using-superpowers` | YES (loaded at session start) | Skill-first discipline throughout. |
| `superpowers:test-driven-development` | YES (full 371 lines) | P8: failing regression before every behavioural fix; RED verified before GREEN. |
| `superpowers:systematic-debugging` | Listed; loaded on first real bug in P8 | Applied when diagnosing any defect root cause. |
| `superpowers:verification-before-completion` | Listed; loaded before final claims | P10/P11: evidence before assertions. |
| `superpowers:requesting-code-review` / `receiving-code-review` | Listed | P9 adversarial review handling. |
| Harness `verify`, `code-review`, `run`, `security-review` | Built-in | P6 (run/drive app), P9 (review), P10. |

## C. Not frontend-relevant (classified by family, with reason)

Every remaining registry skill was classified NO. Families and reasons:

- **Google Cloud data/DB (≈45):** `alloydb-*` (12), `cloud-sql-*` (20), `bigquery`, `bigquery-data-transfer-service`, `dataform-bigquery`, `dbt-bigquery`, `data-autocleaning`, `gcp-*` (7), `firestore-data`, `spanner-data`, `discovering-gcp-data-assets`, `federate-lakehouse-catalog`, `gcloud-auth-verification`, `gcs-security-assessment`, `building-data-apps`, `notebook-guidance`, `ml-best-practices`, `managing-python-dependencies` — database/pipeline/cloud tooling; DIVAN has no backend or data pipeline in audit scope.
- **Cloudflare/infra (≈12):** `cloudflare*` (all), `agents-sdk`, `durable-objects`, `workers-best-practices`, `wrangler`, `sandbox-sdk`, `turnstile-spin`, `cloudflare-email-service` — deployment/edge is explicitly out of audit scope (boundary 4).
- **AI/ML research plugin families (≈70):** `model-architecture:*`, `tokenization:*`, `fine-tuning:*`, `mechanistic-interpretability:*`, `data-processing:*`, `post-training:*`, `safety-alignment:*`, `distributed-training:*`, `infrastructure:*`, `optimization:*`, `evaluation:*`, `inference-serving:*`, `mlops:*`, `agents:*`, `rag:*`, `prompt-engineering:*`, `observability:*`, `multimodal:*`, `emerging-techniques:*`, `ml-paper-writing:*`, `ideation:*`, `agent-native-research-artifact:*`, `autoresearch`, `deep-research` — ML training/serving/research; no ML in the DIVAN browser bundle. (`huggingface-skills:transformers-js` is browser-side ML but DIVAN forbids runtime models; NOT APPLICABLE.)
- **Hugging Face (≈25):** `huggingface-skills:*` — model/dataset/Space tooling; not this frontend.
- **Media/asset generation (≈10):** `higgsfield-*` (5), `algorithmic-art`, `canvas-design`, `slack-gif-creator`, `ui-ux-pro-max:{design,design-system,banner-design,brand,slides}` — generate new brand/media assets; audit boundaries forbid redesign/regeneration. (`ui-ux-pro-max:design-system`'s token-architecture rubric overlaps #1's guidance and is subsumed by the repo's locked `tokens.css` system.)
- **Documents/office (4):** `docx`, `pptx`, `pdf`, `xlsx`.
- **Writing/comms (5):** `internal-comms`, `doc-coauthoring`, `computing-paper-builder`, `stop-slop`, `raouf-bedtime-story-protocol`.
- **Claude/plugin/dev-tooling (≈20):** `claude-api`, `mcp-builder`, `plugin-dev:*`, `hookify:*`, `skill-creator`, `skill-repair`, `find-skills`, `claude-md-management:*`, `claude-hud:*`, `commit-commands:*`, `feature-dev:*` (agents used only as generic subagents if needed), `statusline-setup`, `keybindings-help`, `update-config`, `fewer-permission-prompts`, `peon-ping-*`, `remember`, `loop`, `schedule`, `desktop-commander:*`, `exa:*`, `supabase:*`, `zurvan`, `simurgh-arise`, `accidental-data-loss-prevention` (general safety — honored implicitly), `brand-guidelines` (Anthropic brand, not DIVAN).
- **Mobile-native testing:** `maestro` MCP — drives Android/iOS simulators; no simulator guaranteed in this environment and Playwright/CDP cover the web surface; classified NOT APPLICABLE (recorded honestly rather than claimed as device evidence).

## D. Conflicts and resolutions

1. **`frontend-design` (make distinctive choices, take an aesthetic risk) vs goal boundary 1–2 (no taste-based redesign, preserve locked visual language).** Resolution: goal + design authority win; frontend-design applied only as a critique lens whose findings need objective evidence (contrast, clipping, hierarchy failure) to become defects.
2. **`ui-ux-pro-max` 48dp Material target guidance vs design authority §20 (44×44 CSS px project minimum).** Resolution: repo/design authority wins — 44px is the binding minimum; ui-ux-pro-max's 44pt Apple floor agrees.
3. **`ui-ux-pro-max` `pro-rules.md` native-app checklist vs web SPA.** Resolution: applied via its own scope notice — quick-reference (stack-agnostic) governs; native-only items (haptics, tab bars) skipped.
4. **`scroll-world` (build scroll worlds) vs `divan-cinematic-threshold` ("Do not convert the full website into a Scroll World").** Resolution: project skill wins; scroll-world used solely as engineering cross-check.
5. **`superpowers:brainstorming` (before creative work) vs audit goal (no conceptual reinvention).** Resolution: audit is not creative-greenfield work; the Release 1 design authority is the approved design (goal §1.4). Brainstorming not invoked for repairs that follow TDD on verified defects.
6. **`test-creator` "propose plan and wait" vs autonomous audit.** Resolution: goal's explicit instruction to complete the loop autonomously wins; plans are recorded in the ledger instead of awaiting confirmation.

## E. Coverage mapping (goal §1.4 mandatory areas → skills)

- React architecture/quality → frontend-design, ui-ux-pro-max (`--stack react`, `react-performance.csv`), superpowers TDD
- React runtime performance → ui-ux-pro-max react domain, web-perf, chrome-devtools
- Browser testing/debugging → webapp-testing, chrome-devtools(+cli, troubleshooting), memory-leak-debugging
- Visual/interaction design review → ui-ux-pro-max, frontend-design, divan-brand-art-direction
- Responsive/mobile → ui-ux-pro-max §5, divan-mobile-performance-guard, divan-cinematic-threshold mobile rules
- Accessibility → divan-accessibility-qa, a11y-debugging, ui-ux-pro-max §1
- CSS/typography/RTL/layout → ui-ux-pro-max §5–6, divan-brand-art-direction, design authority §8
- Animation/video/reduced motion → divan-book-motion-system, divan-cinematic-threshold, divan-atmosphere-effects, ui-ux-pro-max §7, scroll-world (reference)
- Frontend performance/assets → web-perf, debug-optimize-lcp, divan-mobile-performance-guard
- Browser security/privacy → repo verifiers (verify:privacy/dist) + design authority §22–23 + harness security-review
- PWA/offline/SW/history/storage → design authority §5/§16 + research pass (no dedicated installed skill; recorded as gap covered by Phase 2 research)
- Code structure/maintainability → harness code-review/simplify + test-creator conventions rule
- Test quality/coverage → test-creator, superpowers TDD
