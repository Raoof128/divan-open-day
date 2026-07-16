# DIVAN Claude Opus 4.8 Exhaustive Frontend Skill and File Audit Goal

This is the final exhaustive frontend audit and repair goal for the current public DIVAN Release 1 application.

The current production baseline already includes:

- exactly 60 Hafez records;
- exactly 60 Rumi records;
- 120 total production records;
- the cinematic scroll-scrub entrance;
- visible return-to-poet-selection navigation;
- offline-first release coherence;
- a live public Cloudflare hostname;
- hardened static production delivery.

This task does not reopen the poetry corpus, deployment architecture, or product concept. It audits the frontend as production software, file by file and rendered state by rendered state.

## Run

Open `Raoof128/divan-open-day` with **Claude Opus 4.8** selected.

Start from the latest `main`, not a stale local branch.

# BEGIN CLAUDE GOAL

You are the sole lead frontend auditor and repair engineer for the current production DIVAN application.

Work from the latest remote `main` in `Raoof128/divan-open-day`. The public application is currently served at:

```text
https://divan.raoufabedini.dev
```

Your job is to discover every frontend-relevant skill available in this Claude environment, read every one completely, apply every applicable frontend skill, inventory the entire frontend surface, audit every frontend file one by one, test the rendered application across its complete state space, repair verified defects through tests, and produce an evidence-backed pull request.

Do not stop at a plan, skill list, sample review, partial directory, broad summary, or automated test pass. Complete the full audit and repair loop.

## Non-negotiable operating rules

1. The primary Opus agent must personally read every applicable frontend skill and every frontend file. Do not delegate the primary skill discovery or file-by-file audit to subagents.
2. Do not edit implementation files until the complete baseline file inventory and first-pass defect ledger exist.
3. Do not redesign the product by taste. Preserve the existing Persian illuminated-manuscript visual language, interaction concept, information architecture, cultural distinction, and content order unless objective evidence proves a defect.
4. Do not alter poetry text, translations, source mappings, provenance, rights records, production selection, corpus count, or content authority.
5. Do not alter Droplet, Cloudflare, DNS, tunnel, Docker, registry, firewall, deployment, or public-access configuration in this task.
6. Do not deploy, merge, tag, or modify the live public site. Produce a reviewed branch and pull request only.
7. Do not access, print, source, copy, or modify `.env` or any credential file. Frontend auditing does not require secrets.
8. Do not weaken tests, privacy, security headers, offline release coherence, reduced motion, source attribution, release integrity, or fail-closed behaviour.
9. Do not use `git add -A`, force-push, reset, clean, history rewriting, or broad destructive commands.
10. Preserve unrelated untracked and ignored files.
11. Use test-driven repair. For each behaviour change, first capture a meaningful failing regression test or reproducible rendered failure, then make the smallest corrective change, then rerun the focused and full verification.
12. Never claim physical-device, VoiceOver, TalkBack, Safari hardware, Android hardware, print, or field evidence unless it was actually performed. Emulation and Playwright engines must be labelled accurately.
13. A passing build is not proof of a correct frontend. Rendered interaction evidence is mandatory.
14. A visually attractive screenshot is not proof of accessibility, semantics, state correctness, performance, or offline behaviour.
15. Do not report a skill as "run" merely because its name appeared. Record whether it was discovered, read, applicable, invoked/applied, and what evidence it produced.

## Phase 0 - Repository and instruction preflight

Before changing anything, run and record:

```bash
pwd
git rev-parse --show-toplevel
git remote -v
git fetch --all --prune
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git log --oneline --decorate -30
find .. \( -name AGENTS.md -o -name AGENTS.override.md -o -name AGENT.md \) -print 2>/dev/null | sort
```

Read every applicable instruction file completely, including the root `AGENT.md`.

Read completely before auditing:

1. `2026-07-12-divan-open-day-agent-ready-design-v2-audited.md`
2. `README.md`
3. `CHANGELOG.md`
4. `package.json`
5. `vite.config.*`
6. `playwright.config.*`
7. `tsconfig*.json`
8. `eslint.config.*`
9. current frontend and release verification reports under `docs/verification/`
10. prior UI/UX audit evidence under `docs/audits/divan/`
11. cinematic design, provenance, timing, and verification documentation
12. visible-navigation and cinematic-Begin verification documentation
13. current accessibility, privacy, offline, and content-style documentation relevant to rendered UI

Create an isolated branch or worktree from the latest `origin/main`, using a name such as:

```text
audit/opus-4-8-exhaustive-frontend
```

Do not audit or repair from the documentation branch containing this goal.

## Phase 1 - Discover and read every frontend-relevant Claude skill

The exact installed skill count is unknown. Discover it rather than assuming it.

### 1.1 Skill discovery

Use the environment's official skill listing command, registry, tool, or UI first. Also inspect documented local skill roots available to this Claude installation, including project-local, user-local, plugin-provided, and workspace-provided skills.

Search only legitimate skill locations. Do not recursively crawl the entire home directory without bounds.

Likely locations may include, when present:

```text
.claude/skills/
.claude/plugins/
~/.claude/skills/
~/.claude/plugins/
.agents/skills/
~/.agents/skills/
```

Also inspect any skill or plugin registry exposed directly by Claude Code.

Find skill definition files such as `SKILL.md`, plugin skill manifests, or the environment's equivalent.

### 1.2 Frontend relevance classification

Classify as frontend-relevant every installed skill whose description or workflow materially applies to one or more of:

- frontend architecture;
- React;
- Vite;
- TypeScript used by the browser application;
- component design;
- visual design;
- UI/UX review;
- browser testing or debugging;
- Playwright;
- responsive layout;
- mobile web;
- CSS;
- design systems or tokens;
- accessibility;
- keyboard and focus behaviour;
- screen-reader semantics;
- internationalisation;
- Persian RTL and bidi rendering;
- animation and motion;
- reduced motion;
- video and media presentation;
- performance and Core Web Vitals;
- image, font, and asset optimisation;
- PWA or service-worker user experience;
- offline frontend behaviour;
- browser storage and history;
- frontend privacy;
- frontend security and safe rendering;
- SEO, metadata, manifests, icons, and share presentation;
- React performance or best practices;
- frontend refactoring;
- rendered visual regression;
- frontend testing strategy.

Do not classify an unrelated database, backend, billing, iOS, Android-native, infrastructure-only, or server-only skill as frontend merely to inflate the count.

### 1.3 Mandatory skill inventory

Create:

```text
docs/audits/frontend-opus-4-8/01-skill-inventory.md
```

For every discovered skill, record:

- exact skill name;
- source/plugin;
- skill file path or registry identifier;
- version or commit when available;
- complete description;
- frontend relevance: yes/no;
- reason for classification;
- whether the full skill instructions were readable;
- whether it was applied;
- exact audit phase where it was applied;
- evidence/output generated;
- conflicts or ordering constraints with other skills.

Read every frontend-relevant skill file completely before beginning the file audit.

If two skill instructions conflict, follow this precedence:

1. current user goal;
2. repository instruction files;
3. release-1 design authority;
4. nearest applicable skill instruction;
5. general skill guidance.

Record every conflict and its resolution. Do not silently ignore a skill requirement.

### 1.4 Apply all applicable frontend skills

Invoke or follow every frontend-relevant skill that applies to this repository.

Some skills are executable workflows; others are review rubrics or guidelines. Apply them according to their real contract. Do not invent a slash command for a skill that is meant to be read and followed.

At minimum, the combined skill application must cover:

- React implementation quality and performance;
- rendered browser testing and debugging;
- visual and interaction design review;
- responsive/mobile review;
- accessibility review;
- CSS/layout review;
- animation/reduced-motion review;
- performance and asset review;
- frontend security/privacy review;
- PWA/offline review;
- code structure and refactoring review.

If a skill requires an interactive design-approval gate, treat the existing release-1 design as the approved design. Do not use that as permission for a redesign. Limit the skill to audit and evidence-backed repair.

## Phase 2 - Freeze the complete frontend file inventory

Before reviewing individual files, create a deterministic inventory from tracked files.

Start with repository-native discovery, then classify each path. Include all files that directly create, style, configure, test, package, or document the browser experience.

The inventory must include, where present:

- `index.html`;
- all tracked files under `src/app/`;
- all tracked files under `src/components/`;
- all tracked files under `src/scenes/`;
- all tracked files under `src/pages/`;
- all browser-facing contracts under `src/contracts/`;
- frontend libraries under `src/lib/` including accessibility, animation, draw, storage, share, media, history, and runtime helpers;
- all tracked CSS and style files under `src/styles/` and elsewhere;
- browser entry files;
- browser-facing assets and asset metadata;
- public icons, images, video, fonts, posters, manifests, and offline documents;
- `src-sw/` and frontend service-worker client code where it affects user experience;
- Vite, TypeScript, ESLint, PostCSS or related frontend configuration;
- component, accessibility, offline, share, performance, and e2e tests;
- visual snapshots or screenshot baselines, if tracked;
- relevant UI and accessibility documentation.

Do not classify private poetry source books, alignment machinery, deployment scripts, or server infrastructure as frontend files. When a non-frontend file defines a contract consumed by the frontend, list it separately as a boundary dependency rather than omitting it.

Create both:

```text
docs/audits/frontend-opus-4-8/02-frontend-file-inventory.json
docs/audits/frontend-opus-4-8/02-frontend-file-inventory.md
```

Each tracked frontend file must receive one stable inventory row containing:

- path;
- category;
- language/type;
- size and line count;
- primary responsibility;
- direct imports/dependants where practical;
- rendered surface or user flow affected;
- associated tests;
- audit status initially `PENDING`.

The final audit cannot pass while any inventoried file remains `PENDING`, `SKIPPED`, or silently unclassified.

## Phase 3 - Establish a clean baseline before repairs

Install and run using the repository's pinned toolchain. Do not upgrade dependencies during baseline discovery.

Record exact versions:

```bash
node --version
pnpm --version
pnpm exec vite --version
pnpm exec tsc --version
pnpm exec vitest --version
pnpm exec playwright --version
```

Run the full existing baseline, including the repository's canonical check command and focused frontend suites. Discover scripts from `package.json`; do not blindly assume names if they changed.

Expected current commands include:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:components
pnpm test:a11y
pnpm test:offline
pnpm test:share
pnpm test:performance
pnpm test:e2e
pnpm build:production
pnpm verify:dist
pnpm verify:privacy
bash scripts/check.sh --ci
```

Use explicit production build inputs already documented by the repository. Never read secrets for a frontend audit.

Record baseline failures without repairing them yet.

Create:

```text
docs/audits/frontend-opus-4-8/03-baseline.md
```

Include command, timestamp, duration, exit code, relevant output summary, and whether the failure predates this audit.

## Phase 4 - Audit every frontend file one by one

This is the primary audit. Read every inventoried frontend file completely, in deterministic path order. Do not sample.

For each file, add a row to:

```text
docs/audits/frontend-opus-4-8/04-file-by-file-ledger.md
```

Each row must record:

- file path;
- full file read: yes/no;
- purpose and responsibilities;
- skill lenses applied;
- correctness findings;
- UX findings;
- accessibility findings;
- responsive findings;
- performance findings;
- privacy/security findings;
- maintainability findings;
- test coverage findings;
- cross-file dependencies checked;
- severity of each defect;
- evidence references;
- proposed repair or explicit `NO DEFECT`;
- final audit status.

`NO DEFECT` is valid only after the file was fully read and its rendered consequences were checked where applicable.

### 4.1 React and state correctness lens

Check every React file for:

- invalid or impossible state transitions;
- stale closures;
- incorrect effect dependencies;
- leaked timers, listeners, media queries, animation frames, object URLs, or subscriptions;
- state updates after unmount;
- Strict Mode double-effect safety;
- unnecessary effects that should be derived state;
- render-phase side effects;
- unstable callback/object creation that causes meaningful rerenders;
- excessive component responsibility;
- prop drilling that creates real risk;
- broken controlled/uncontrolled behaviour;
- unsafe DOM assumptions;
- history and storage races;
- incorrect focus timing;
- release replacement or restore races;
- event propagation defects;
- keyboard activation parity;
- browser API exception handling;
- error-boundary and fail-safe behaviour;
- React 19 compatibility;
- memoisation only where measured or justified.

Do not perform fashionable refactors without a measured benefit.

### 4.2 TypeScript and contract lens

Check:

- strictness holes;
- unsafe assertions;
- impossible unions;
- unchecked nullable browser APIs;
- duplicated or drifting contracts;
- public-release data validation boundaries;
- exhaustive reducer/state handling;
- accidental `any`;
- unsafe event typing;
- path and asset contract mismatch;
- compile-time assumptions that need runtime validation.

### 4.3 CSS and layout lens

Read every style file completely and check:

- 320 CSS-pixel reflow;
- safe-area handling;
- small-height phones;
- portrait and landscape;
- browser zoom to 200 percent;
- text scaling;
- clipping and overflow;
- stacking contexts and z-index;
- scroll locking and scroll traps;
- fixed/sticky controls obscured by browser chrome;
- touch-target size and spacing;
- logical properties for RTL/LTR;
- Persian glyph clipping;
- line-height and Nastaliq clearance;
- focus-ring visibility;
- contrast in every visual state;
- hover, active, focus, disabled, error, loading, offline, and reduced-motion states;
- coarse pointer behaviour;
- forced-colours/high-contrast resilience where practical;
- print-unrelated rules leaking into the app;
- unused or conflicting selectors;
- animation properties causing layout or paint churn;
- CSS containment and compositing only where beneficial.

### 4.4 Accessibility lens

Verify code and rendered behaviour for:

- one meaningful active `h1`;
- heading order;
- landmarks;
- accessible names;
- semantic buttons and links;
- keyboard-only completion;
- focus order;
- focus restoration after transitions;
- focus not hidden or obscured;
- Escape and skip behaviours;
- no keyboard trap;
- no inaccessible pointer-only action;
- live-region timing and duplication;
- correct `lang` and `dir`;
- safe bidi isolation;
- Persian and English reading order;
- decorative media excluded from the accessibility tree;
- video not required for completion;
- reduced motion as a complete route;
- status and error announcement;
- accessible audio controls when present;
- target size;
- zoom and reflow;
- colour contrast;
- no colour-only meaning;
- no time pressure;
- no flashing;
- share/download fallback accessibility.

Automated axe success is necessary but not sufficient.

### 4.5 Animation, cinematic, and media lens

Audit the full cinematic path and book animation for:

- Begin automatic traversal;
- natural manual scroll-scrub;
- Skip entrance;
- exact terminal-frame paint before handoff;
- first-frame timeout;
- loaded-data and seek timing;
- decode failure;
- video error;
- offline route;
- Save-Data route;
- reduced-motion route;
- non-scrollable and unsupported API routes;
- orientation change during cinematic traversal;
- resize during seek;
- rapid repeated Begin/Skip/Back inputs;
- background/foreground tab changes;
- visibility changes;
- iOS autoplay restrictions even though autoplay must not be required;
- animation cancellation and cleanup;
- motion sickness risk;
- no content trap if media never loads;
- poster/final-frame handoff visual continuity;
- media dimensions, aspect ratios, decoding, preload, and transfer cost.

Do not replace the cinematic merely because a simpler implementation exists.

### 4.6 Internationalisation and Persian typography lens

Check:

- English-first public order;
- Persian live text directly below;
- `lang="fa" dir="rtl"` structural markup;
- punctuation and parentheses in mixed-direction content;
- `<bdi>` or equivalent isolation for mixed identifiers;
- numerals and source references;
- Nastaliq font load/swap behaviour;
- fallback font metrics;
- line wrapping and clipping for all 120 records, not only fixtures;
- long English and Persian lines;
- diacritics, ZWNJ, and Unicode preservation;
- text selection and copying;
- share-card Persian shaping;
- no CSS letter spacing that harms Persian text.

### 4.7 Performance lens

Measure, do not guess:

- LCP;
- CLS;
- interaction feedback latency;
- long tasks;
- JavaScript/CSS transfer sizes;
- font transfer and display behaviour;
- image/video transfer;
- cache behaviour;
- runtime memory growth across repeated draws;
- excessive rerenders;
- animation main-thread cost;
- layout and paint hotspots;
- first visit versus warm cache;
- mobile throttling;
- offline startup;
- route/page code that blocks first meaningful paint.

Use browser traces, performance APIs, React profiling where useful, and repository budgets. Do not invent field INP from laboratory data.

### 4.8 Privacy and frontend security lens

Check rendered/frontend behaviour for:

- no analytics or trackers;
- no cookies;
- no visitor identifier;
- no poem ID in URL;
- no remote fonts/scripts/assets;
- no third-party runtime requests;
- no raw HTML injection;
- safe SVG handling;
- safe external links;
- no referrer leakage;
- browser storage limited to documented public IDs and motion preference;
- no private source or review data in public bundles;
- no source maps;
- correct CSP compatibility;
- no frontend dependence on public health/admin paths;
- safe Web Share and Blob URL lifecycle;
- no accidental clipboard or download of private data.

### 4.9 Offline and PWA lens

Check:

- first-load installation;
- warm offline reload;
- offline navigation;
- active release coherence;
- staged release update;
- failed update retention;
- previous-release retention;
- cache cleanup;
- service-worker activation messaging;
- release mismatch handling;
- asset/media fallback;
- no mixed release shell/corpus;
- manifest and icon correctness;
- update available flow;
- repeated tabs;
- stale tab after deployment;
- private browsing/storage failure;
- storage quota or cache API failure.

## Phase 5 - Cross-file architecture and flow audit

After every file has an individual ledger row, perform cross-file audits that cannot be proven from one file.

Create:

```text
docs/audits/frontend-opus-4-8/05-cross-file-audit.md
```

Trace at minimum:

1. boot -> release load -> welcome;
2. welcome -> Begin -> cinematic traversal -> poet chooser;
3. welcome -> Skip -> poet chooser;
4. Hafez chooser -> intention -> reveal -> result;
5. Rumi chooser -> intention -> reveal -> result;
6. result -> reveal another;
7. intention/result -> Choose another poet;
8. browser Back and Forward through every supported state;
9. refresh/restore at welcome, chooser, intention, and result;
10. reduced motion from first load and after preference change;
11. Save-Data, offline, video failure, first-frame timeout, and unsupported API fallbacks;
12. share, save, copy, and failure fallbacks;
13. About, Credits, Privacy, Accessibility, and Offline pages;
14. unknown/deep path behaviour;
15. service-worker update and failed-update retention;
16. full 120-record content rendering extremes;
17. keyboard-only complete Hafez and Rumi flows;
18. focus and live-region behaviour across every state transition.

For each flow, record source files, state transitions, storage writes, history writes, focus targets, rendered evidence, tests, and defects.

## Phase 6 - Rendered browser and visual audit

Use the best browser skill/runtime available in the installed Claude environment. Follow the discovered browser/frontend-testing skill exactly.

If a dedicated Browser skill is available, use it first. If unavailable, use the repository's Playwright workflow and record that limitation.

Audit both:

1. a clean local production build/preview from the audited source;
2. the current public site for read-only comparison.

Do not mutate production.

### 6.1 Browser engines

Use Playwright Chromium, WebKit, and Firefox where supported. Do not describe WebKit emulation as a physical iPhone or Safari hardware test.

### 6.2 Viewport matrix

At minimum test:

```text
320 x 568
360 x 640
360 x 800
375 x 667
390 x 844
412 x 915
768 x 1024
1024 x 768
1280 x 800
1440 x 900
```

Include portrait and landscape, coarse pointer where practical, 200 percent zoom, reduced motion, Save-Data simulation where supported, dark/light OS preference even if the app intentionally uses one art direction, and browser text scaling where practical.

### 6.3 Required evidence per major scene

For welcome, cinematic, poet chooser, Hafez intention, Rumi intention, reveal, Hafez result, Rumi result, each context page, offline state, and representative failures, collect:

- URL and title;
- DOM/accessibility snapshot;
- console warnings/errors;
- network request summary;
- screenshot;
- active element/focus proof;
- relevant storage/history state;
- interaction proof;
- axe result;
- visual defect notes.

Place temporary screenshots and traces outside committed source unless a repository instruction explicitly requires committed audit evidence. Commit only curated, non-sensitive evidence needed for the audit report.

### 6.4 Visual comparison rules

Compare local audited source with current production and with the locked design authority. Record differences as:

- defect;
- intentional current design;
- production/source drift;
- unproven preference.

Do not "fix" an unproven preference.

## Phase 7 - Consolidated defect ledger before implementation

Only after Phases 1 through 6 are complete, create:

```text
docs/audits/frontend-opus-4-8/06-consolidated-defect-ledger.md
```

Every finding must contain:

- stable finding ID;
- severity: Blocker, Critical, High, Medium, Low, Informational;
- affected users and conditions;
- exact file and line evidence;
- reproduction steps;
- rendered/DOM/console/network evidence;
- violated design requirement, skill rule, accessibility criterion, or project contract;
- root cause;
- proposed minimal repair;
- regression-test plan;
- risk of repair;
- status.

Deduplicate findings discovered through multiple skills. Preserve all contributing evidence and skill lenses.

Severity must reflect user impact and release risk, not aesthetic preference.

Before editing, run a contradiction review of the ledger. Remove false positives, prove each remaining finding, and identify any proposed fix that would violate another project invariant.

## Phase 8 - Test-driven repair

Repair verified findings in severity order.

Required repair policy:

1. Blocker, Critical, and High findings must be fixed unless an external dependency makes repair impossible.
2. Fix Medium findings when the repair is focused, testable, and does not destabilise the released design.
3. Fix Low findings only when the change is clearly safe and not cosmetic churn.
4. Do not perform a broad redesign, framework migration, state-library migration, CSS rewrite, component-library adoption, or dependency upgrade merely because a skill recommends a general best practice.
5. Do not change content or infrastructure to solve a frontend defect.
6. Add a failing regression test before each behavioural repair.
7. For visual defects, capture before evidence, implement the smallest fix, then capture after evidence at the same viewport and state.
8. Keep commits focused and reviewable.
9. Re-run the affected skill workflow after each relevant repair cluster.
10. Update the file ledger and defect ledger immediately when each fix is verified.

If no verified implementation defect exists, do not manufacture edits. A valid outcome may be an evidence-only audit PR, but only after every file and flow has been fully audited.

## Phase 9 - Adversarial re-audit

After repairs, personally repeat the complete affected file and rendered-flow review.

Then, if the environment supports subagents, use fresh read-only reviewers only at this stage for adversarial checking. They may inspect but must not write.

Suggested independent lenses:

- React/state/effects;
- accessibility/RTL;
- responsive/CSS/visual;
- performance/media;
- offline/privacy/security.

The primary Opus agent must validate every adversarial finding against code and evidence. Do not accept reviewer output uncritically.

No Blocker, Critical, or High finding may remain unresolved before the PR is described as frontend-audit PASS.

## Phase 10 - Final verification

Run fresh from the final working tree:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:components
pnpm test:a11y
pnpm test:offline
pnpm test:share
pnpm test:security
pnpm test:performance
pnpm test:e2e
pnpm build:production
pnpm verify:dist
pnpm verify:privacy
bash scripts/check.sh --ci
```

Also rerun:

- all new regression tests;
- the complete browser matrix for changed surfaces;
- console/network/privacy inspection;
- local production offline flow;
- visual comparison against current production;
- full 120-record long-text and typography sampling, with deterministic coverage of extremes rather than random cherry-picking.

Record exact commands, versions, timestamps, durations, exit codes, counts, screenshots, traces, and honest limitations.

## Required final audit documents

Complete and commit:

```text
docs/audits/frontend-opus-4-8/01-skill-inventory.md
docs/audits/frontend-opus-4-8/02-frontend-file-inventory.json
docs/audits/frontend-opus-4-8/02-frontend-file-inventory.md
docs/audits/frontend-opus-4-8/03-baseline.md
docs/audits/frontend-opus-4-8/04-file-by-file-ledger.md
docs/audits/frontend-opus-4-8/05-cross-file-audit.md
docs/audits/frontend-opus-4-8/06-consolidated-defect-ledger.md
docs/audits/frontend-opus-4-8/07-repair-log.md
docs/audits/frontend-opus-4-8/08-final-verification-report.md
```

Update root `AGENT.md` and `CHANGELOG.md` with an honest dated `Raouf:` entry only after verification.

The final verification report must include:

- source baseline SHA;
- final branch SHA;
- public production SHA/release ID observed, when discoverable without secrets;
- total installed skills discovered;
- total frontend-relevant skills;
- total frontend-relevant skills fully read;
- total frontend-relevant skills applied;
- any unreadable or unavailable skill and exact reason;
- total frontend files inventoried;
- total frontend files fully audited;
- zero remaining `PENDING` or `SKIPPED` rows;
- findings by severity;
- fixes by severity;
- unresolved findings with blockers;
- baseline and final test counts;
- browser engines and viewport matrix;
- accessibility evidence and limitations;
- performance measurements;
- privacy/network evidence;
- offline/PWA evidence;
- production/source drift result;
- final verdict.

Allowed final verdicts:

```text
FRONTEND AUDIT PASS
FRONTEND AUDIT PASS WITH DOCUMENTED EXTERNAL LIMITATIONS
FRONTEND AUDIT FAIL
```

Do not use PASS if any frontend file was not fully audited, any applicable frontend skill was silently skipped, any Blocker/Critical/High finding remains unresolved, or required verification failed.

## Git and pull request completion

Commit only relevant audit documents, regression tests, and verified frontend repairs.

Push the audit branch normally and open a pull request against current `main`.

The PR body must include:

- concise user-visible summary;
- complete scope boundary;
- skill inventory totals;
- file inventory totals;
- findings and fixes by severity;
- exact commands and results;
- rendered browser matrix;
- screenshots/evidence links;
- known limitations;
- confirmation that poetry, corpus, content authority, deployment, Cloudflare, Droplet, and credentials were untouched;
- explicit statement that the live site was not modified.

Do not merge or deploy the PR.

## Final response

Return a concise but complete report containing:

```text
Audit branch:
Pull request URL:
Baseline SHA:
Final SHA:
Skills discovered:
Frontend skills read/applied:
Frontend files inventoried/audited:
Blocker findings:
Critical findings:
High findings:
Medium findings:
Low findings:
Tests:
Browser engines/viewports:
Accessibility verdict:
Performance verdict:
Offline/PWA verdict:
Privacy/security verdict:
Production drift verdict:
Final audit verdict:
Live site modified: NO
```

Include the most important repaired defects and every unresolved limitation. Never compress missing evidence into "all good."

# END CLAUDE GOAL
