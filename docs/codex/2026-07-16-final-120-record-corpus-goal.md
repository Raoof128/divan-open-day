# DIVAN Codex GPT-5.6 Sol Final 120-Record Corpus Goal

This file supersedes every earlier 24/16, 40-record, Claude, Fable, human-review, machine-unblock, and corpus-expansion prompt for the DIVAN bilingual poetry corpus.

This is the final content target for this stage:

- 60 unique Hafez bilingual records
- 60 unique Rumi bilingual records
- 120 total production records

Do not expand the target again during this task. Do not redesign the frontend. Do not add a new translator or source edition unless repository evidence proves one of the already-registered sources is unusable and the owner explicitly authorises a separate follow-up stage.

## Run

Open `Raoof128/divan-open-day` on branch `feat/poetry-source-ingestion`.

Use the GPT-5.6 Sol model already selected in Codex. Run `/status`, then `/goal`, and paste everything from `BEGIN CODEX GOAL` to `END CODEX GOAL`.

# BEGIN CODEX GOAL

You are the sole implementation and release agent for the DIVAN bilingual poetry corpus expansion. Work directly in the current repository. Inspect, edit, test, commit, and push. Do not spawn subagents or parallel writers. Do not stop after producing a plan, audit, candidate list, or partial count.

## Final outcome

Make the production corpus contain exactly:

```text
Hafez: 60
Rumi: 60
Total: 120
```

Every production record must be a defensible, source-bound English/Persian alignment. The number target never overrides the evidence standard.

Preserve every valid existing record. Revalidate it under the final machine-authority contract. Add only the number of new unique records needed to reach 60 for each poet.

The previous working baseline was:

```text
Hafez machine-verified: 10
Rumi machine-verified: 21
```

Treat those numbers as historical context, not unquestionable truth. First derive the current valid unique counts from repository evidence. If the branch has moved, calculate:

```text
new_hafez_required = 60 - current_valid_unique_hafez
new_rumi_required  = 60 - current_valid_unique_rumi
```

Never silently discard, duplicate, or reset valid work.

## Stage boundary

This task completes the bilingual content stage. It does not include:

- cinematic frontend implementation;
- animation or visual redesign;
- deployment architecture changes;
- analytics;
- user accounts;
- all poems by either poet;
- new AI-authored translations;
- ingestion of John Payne or any sixth source edition;
- general repository refactoring unrelated to corpus completion.

Use the five source editions already registered in the repository.

## Authoritative source strategy

Use these exact registered source IDs.

### Hafez Persian authority

```text
hafez-qazvini-ghani-fa-wikisource
```

This is the canonical Persian identity source for production Hafez records.

### Hafez English sources

Use both existing public-domain English editions:

```text
hafez-bell-1897-en
hafez-clarke-1891-en
```

Source priority:

1. Preserve and revalidate strong existing Bell records.
2. Use Bell where its English selection maps cleanly to one canonical Persian ghazal.
3. Use Clarke's complete literal translation to reach broad, unique coverage.
4. When Bell and Clarke represent the same Persian ghazal, count that ghazal once. Select the stronger public-facing English record and preserve the alternate translation outside production as optional evidence.
5. Do not count a Bell composite assembled from multiple ghazals as a production ghazal. Archive or exclude it unless it can be proven to represent one canonical ghazal.
6. Do not add Payne in this stage. Clarke is already registered as the complete Hafez English source.

### Rumi Persian authority

```text
rumi-nicholson-fa-wikisource
```

### Rumi English source

```text
rumi-whinfield-abridged-en
```

Whinfield is explicitly abridged. Abridgement is acceptable only when the selected English passage remains traceable to exact Persian span evidence and all meaningful omissions or reordering are disclosed.

## Non-negotiable truthfulness rules

1. Never invent Persian or English verse.
2. Never create a fresh AI translation and present it as Bell, Clarke, or Whinfield.
3. Never silently modernise, paraphrase, repair, or beautify source wording.
4. Never fabricate source IDs, ghazal numbers, book numbers, story headings, pages, sections, lines, couplets, hashes, or provenance.
5. Never pass a match using only generic thematic similarity.
6. Never count the same canonical Hafez ghazal twice.
7. Never reuse an English excerpt or Persian source span across multiple production records.
8. Never split one coherent source passage into artificial micro-records merely to reach 60.
9. Never allow an unresolved candidate to block processing of other candidates.
10. Exclude weak candidates individually and continue.
11. Never fabricate human approval.
12. Preserve unrelated untracked files.
13. Do not use `git add -A`, force-push, reset, clean, or rewrite history.
14. Do not weaken privacy, attribution, provenance, or public-bundle leak checks.
15. Do not call the stage complete with fewer than 60 valid unique records for either poet.

## Machine authority replaces the human literature bottleneck

A fresh, source-bound machine-alignment attestation is sufficient literature-release authority for this project.

Do not request, require, await, simulate, or invent:

- a literature teacher;
- a named human reviewer;
- a contributor identity solely for release eligibility;
- a review packet;
- a signature;
- human reapproval after a machine correction;
- a `NEEDS_HUMAN_REAPPROVAL` state.

Existing genuine human metadata may remain as optional historical provenance. It must not be required when a valid machine authority exists.

Do not remove evidence-based rights or attribution checks. Where the old rights schema requires a named human solely as a gate, replace that dependency with immutable source evidence, acquired source hashes, the registered rights statement, and required attribution. Do not invent legal conclusions beyond the source registry evidence.

Allowed active literature states:

```text
MACHINE_VERIFIED
MACHINE_VERIFIED_WITH_DISCLOSURE
EXCLUDED
```

Retire human-waiting states from active production eligibility.

## Preflight and instruction discovery

From the Git root, run and inspect:

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git log --oneline -25
find .. \( -name AGENTS.md -o -name AGENTS.override.md \) -print 2>/dev/null | sort
```

Read every applicable `AGENTS.md` and `AGENTS.override.md` before editing. Codex instruction files closer to the working directory may override root guidance. Update repository-owned instructions only when they contradict this final goal by restoring the human-only literature deadlock or the superseded 24/16 target.

Discover the real package manager and scripts. Do not assume commands:

```bash
find . -maxdepth 4 -name package.json -print
node -e 'const p=require("./package.json"); console.log(JSON.stringify({packageManager:p.packageManager,scripts:p.scripts||{}},null,2))' 2>/dev/null || true
```

Inspect the registered source inventory, source locks, acquired artifacts, extraction outputs, canonical records, mapping records, authority files, compiler, production configuration, tests, and verification documentation.

Locate all superseded count and human-gate logic:

```bash
grep -RniE \
  '24|16|40|human|reviewer|teacher|contributor|approval|attestation|review.packet|reapproval|MACHINE_VERIFIED|build:production|canonical|machine_alignment' \
  src scripts tests content docs sources-private package.json AGENTS.md 2>/dev/null || true
```

Do not replace numbers blindly. Classify every hit before editing.

## Baseline inventory

Before data mutation, produce a machine-readable pre-expansion inventory containing, for every existing candidate and verified record:

- stable record ID;
- poet;
- production/archive/excluded status;
- canonical Persian identity;
- English source ID;
- English location and span;
- Persian source ID;
- Persian location and span;
- source hashes;
- span hashes;
- mapping hash;
- current authority kind and freshness;
- duplicate-group ID, if any;
- production eligibility;
- reason for any failure.

Do not include entire source books in the inventory.

Calculate and report:

```text
valid unique Hafez count
valid unique Rumi count
stale authority count
duplicate Hafez ghazal count
overlapping Rumi span count
excluded count
remaining count required per poet
```

Preserve literary text for valid existing records. Correct only proven reference, boundary, mapping, extraction, or metadata defects.

## Authority model

Update schemas, types, loaders, compiler, CLI, tests, fixtures, and documentation to support a discriminated authority model equivalent to:

```ts
type ReviewAuthority =
  | {
      kind: "human";
      contributorIds: string[];
      attestationHash: string;
    }
  | {
      kind: "machine_alignment";
      modelLabel: string;
      methodVersion: string;
      englishSourceId: string;
      persianSourceId: string;
      englishSourceHash: string;
      persianSourceHash: string;
      englishSpanHash: string;
      persianSpanHash: string;
      mappingHash: string;
      canonicalIdentityHash: string;
      verdict:
        | "MACHINE_VERIFIED"
        | "MACHINE_VERIFIED_WITH_DISCLOSURE";
      confidence: number;
      disclosures: string[];
      verifiedAt: string;
      rationale: string;
    };
```

Adapt names to repository conventions rather than forcing this exact syntax.

A valid machine authority:

- requires no human fields;
- binds the English and Persian editions;
- binds selected spans;
- binds the line/couplet mapping;
- binds canonical poem or passage identity;
- becomes stale when any bound source, span, mapping, identity, or reference changes;
- never claims human approval;
- records the active model label exposed by the Codex session when available;
- records a method version;
- records disclosures and a concise evidence-based rationale.

Confidence is supporting metadata, not a substitute for source evidence. Do not use an arbitrary numeric score to rescue an unsupported match.

## Canonical uniqueness contract

### Hafez

Each production Hafez record must map to exactly one canonical ghazal identity in the Qazvini-Ghani source.

The production compiler must reject:

- duplicate canonical ghazal identities;
- one record mapped to multiple ghazals;
- two translations of the same ghazal counted as two production records;
- unknown or unstable canonical identities;
- a source location that no longer resolves to the attested span.

Alternate Bell/Clarke translations may be preserved outside production, linked to the same canonical identity.

### Rumi

Each production Rumi record must have a unique, non-overlapping canonical Persian span identity in the Nicholson source.

The production compiler must reject:

- overlapping Persian source spans between production records;
- reused English lines;
- duplicate mapping identities;
- artificial fragmentation without a coherent standalone English/Persian excerpt;
- untraceable story or book references.

Adjacent non-overlapping passages are allowed only when each is independently coherent and not manufactured to inflate the count.

## Alignment method for every record

For each candidate:

1. Resolve and hash the exact English source artifact.
2. Resolve and hash the exact Persian source artifact.
3. Inspect the English passage with surrounding context.
4. Inspect headings, notes, page/story/ghazal evidence, and extraction boundaries.
5. Search the Persian corpus using distinctive names, actions, images, rare terms, narrative events, rhyme/refrain evidence, and semantic anchors.
6. Inspect multiple Persian candidates, not only the first retrieval result.
7. Read the complete canonical Persian ghazal or sufficient surrounding Masnavi context.
8. Identify exact Persian couplets or spans supporting the English passage.
9. Build an explicit line-to-couplet or span-to-span mapping.
10. Classify the translation relationship.
11. Record omissions, additions, condensation, reordering, interpolation, OCR uncertainty, or selection.
12. Verify canonical uniqueness against all existing production records.
13. Hash sources, spans, mapping, and canonical identity.
14. Issue a fresh machine authority or mark the candidate `EXCLUDED`.
15. Continue immediately to the next candidate.

Allowed relationship examples:

```text
direct
literal
selected
abridged
condensed
reordered
```

Do not accept `composite` for production Hafez records. For Rumi, a non-contiguous abridged mapping may pass only when every mapped span belongs to one coherent source episode and the relationship is fully disclosed.

## Hafez expansion to 60

Preserve and revalidate every valid existing Hafez record.

Build the remaining set from Bell and Clarke against Qazvini-Ghani.

Selection order:

1. strong existing Bell mappings;
2. unused Bell selections that resolve to one ghazal;
3. unused Clarke ghazals with clean OCR and stable canonical identity;
4. additional Clarke records selected for literary coherence and diversity.

Do not simply take the first 60 by source order. Build a larger eligible pool when possible, then select the strongest 60 by:

- source certainty;
- canonical identity certainty;
- mapping coverage;
- semantic fidelity;
- OCR cleanliness;
- excerpt coherence;
- low disclosure burden;
- diversity of imagery and themes;
- suitability for a short public reading;
- absence of duplication.

For each Hafez production record:

- one unique Qazvini-Ghani ghazal;
- one selected English source, Bell or Clarke;
- exact English and Persian locations;
- exact mapping;
- required translation attribution;
- required Wikisource transcription attribution;
- fresh authority;
- no reused ghazal.

Keep valid non-selected alternates in an archive. Do not delete evidence.

## Rumi expansion to 60

Preserve and revalidate every valid existing Rumi record.

Review the full Whinfield candidate pool against Nicholson Persian source evidence. Add the required number of unique, coherent, non-overlapping records.

Build more than 60 eligible candidates when the source pool permits, then select the strongest 60 by:

- source certainty;
- book/story identity certainty;
- mapping completeness;
- semantic fidelity;
- OCR/extraction cleanliness;
- standalone excerpt coherence;
- disclosure burden;
- public suitability;
- thematic variety;
- non-overlap with selected records.

Whinfield is abridged. Use `MACHINE_VERIFIED_WITH_DISCLOSURE` when omission, condensation, or reordering is material but still defensible.

Do not turn adjacent sentences from one short Whinfield passage into multiple records merely to meet the target.

Preserve valid non-selected Rumi records outside production with reasons. Do not delete them.

## Exclusion rules

Use `EXCLUDED` for any candidate with one or more of these defects:

- unsupported thematic-only match;
- wrong canonical ghazal or Masnavi episode;
- material English content with no selected Persian support;
- commentary or translator note mistaken for verse;
- OCR corruption that changes meaning and cannot be resolved from available scan evidence;
- fabricated or unresolved numbering;
- composite Hafez passage spanning multiple ghazals;
- duplicate canonical identity;
- reused English or Persian production span;
- unstable source hash;
- unresolved attribution;
- invented or silently rewritten wording.

An exclusion is local. Record the reason and continue.

## Source acquisition and extraction

Prefer the repository's existing acquired artifacts and immutable source locks.

Verify all source locks before alignment.

If a registered required artifact is missing:

1. run the repository's existing source-fetch command when network access permits;
2. verify redirect, host allowlist, type, size, and SHA-256 behaviour;
3. run the existing deterministic extractors;
4. do not replace the source with an unregistered mirror merely for convenience.

Only stop for a concrete external blocker after exhausting repository-native acquisition and cached evidence. Report the exact missing source ID, command, and error.

Do not ingest Payne or another source in this stage.

## Rights, attribution, and public-output contract

Preserve the source registry's evidence and required attribution.

Every production record must expose, in the repository's established public schema:

- poet;
- translator;
- English edition;
- Persian edition;
- stable record identity;
- canonical poem or passage reference;
- English first;
- Persian beneath with `lang="fa"` and `dir="rtl"`;
- required public-domain or transcription attribution;
- material abridgement/reordering disclosure.

Do not publish:

- full source books;
- raw OCR;
- source locks;
- private reports;
- reviewer packets;
- machine chain-of-thought;
- hidden candidate notes;
- private filesystem paths;
- unresolved or excluded candidates.

Keep concise public rationale/disclosure separate from private machine working notes.

## Required regression tests

Add or update tests proving all of the following.

### Authority

1. A valid machine authority makes a record production-eligible without human contributors.
2. Missing teacher or human reviewer does not fail a machine-reviewed record.
3. Machine corrections do not trigger human reapproval.
4. A record with neither valid human nor valid machine authority fails.
5. Changed English source, Persian source, source reference, selected span, mapping, canonical identity, or bound hash invalidates machine authority.
6. `EXCLUDED` records cannot compile.

### Hafez uniqueness

7. Two production records with the same canonical ghazal fail.
8. Bell and Clarke versions of one ghazal cannot both count toward 60.
9. A Hafez composite spanning multiple ghazals fails production eligibility.
10. Exactly 60 unique Hafez canonical identities compile.

### Rumi uniqueness

11. Overlapping Persian production spans fail.
12. Reused English lines fail.
13. Artificial duplicate mapping identities fail.
14. Exactly 60 unique, non-overlapping Rumi records compile.

### Counts and leakage

15. Exactly 60 Hafez, 60 Rumi, and 120 total records compile.
16. The superseded 24/16/40 production contract no longer controls release.
17. Archived alternates and non-selected valid records cannot enter production accidentally.
18. Full books, raw OCR, private metadata, source locks, and machine working files do not enter public output.
19. Required attribution and disclosures are present.
20. A count-only fixture with weak or duplicate records fails even when it totals 120.

Remove or update contradictory tests and docs that universally require a named human or the old count. Do not weaken unrelated safety tests.

## Production selection manifest

Create or update one deterministic production-selection manifest containing exactly 120 stable record IDs:

```text
60 Hafez
60 Rumi
```

The manifest must:

- be schema validated;
- reject duplicate IDs;
- reject duplicate Hafez canonical identities;
- reject overlapping Rumi spans;
- reject stale authorities;
- reject excluded or archived records;
- be deterministically ordered according to the repository's canonical ordering rules;
- bind or be covered by the production verification evidence.

Do not rely on directory enumeration order or an implicit first-120 rule.

## Verification

Run the actual discovered repository commands for:

- formatting;
- lint;
- type checking;
- unit tests;
- schema tests;
- source-lock verification;
- extraction tests;
- alignment tests;
- authority freshness;
- canonical uniqueness;
- production-selection validation;
- exact corpus counts;
- production build;
- QR/public experience checks;
- privacy verification;
- public-bundle leak inspection;
- dependency audit where already required.

Inspect built output directly. Do not prove only the source configuration.

Final evidence must show:

```text
Hafez production records: 60
Unique Hafez canonical ghazals: 60
Duplicate Hafez canonical ghazals: 0

Rumi production records: 60
Unique Rumi record identities: 60
Overlapping Rumi Persian spans: 0

Total production records: 120
Fresh machine authorities: 120
Stale machine authorities: 0
Human approval required for machine records: false
Excluded records in production: 0
Archived records in production: 0
Reused English production spans: 0
Full source books in public output: 0
Raw OCR/private metadata in public output: 0
Required attribution failures: 0
Production build: PASS
Privacy/leak verification: PASS
```

Do not claim success without command output and direct generated-output inspection.

## Quality report

Write a final machine-readable report and a concise human-readable verification report in the repository's existing verification or research documentation area.

Include:

- initial valid unique counts;
- final 60/60/120 counts;
- all selected stable IDs;
- Hafez canonical ghazal identities;
- English source split between Bell and Clarke;
- Rumi book/story/span identities;
- preserved existing IDs;
- newly added IDs;
- archived alternates;
- excluded candidates and reasons;
- duplicate-resolution decisions;
- source and mapping method version;
- authority migration summary;
- source-lock verification;
- every verification command and result;
- production-output proof;
- final commit IDs.

Do not include private chain-of-thought or entire source books.

## Git discipline

Commit in logical units, such as:

1. authority/count/schema migration;
2. source and extractor corrections;
3. Hafez expansion;
4. Rumi expansion;
5. selection manifest and compiler;
6. tests, reports, and release evidence.

Before every commit:

```bash
git diff --check
git status --short
```

Stage only intended paths. Preserve unrelated untracked files. Push normally after all required checks pass. Never force-push.

## Do not stop early

Do not stop after:

- planning;
- inventory;
- schema migration;
- removing the human gate;
- reaching the old 24/16 target;
- reaching 60 for only one poet;
- building a candidate list;
- finding one OCR defect;
- excluding one weak record;
- writing a review packet;
- producing an audit-only report;
- making tests pass against fixtures while production output is still short.

Do not ask whether to continue.

Only stop for a concrete external blocker such as:

- repository authentication failure;
- push permission failure;
- unavailable required registered source artifact with no repository cache and failed repository-native acquisition;
- sandbox denial preventing required writes or tests;
- source exhaustion that leaves fewer than 60 defensible unique records after every registered candidate has been processed.

For source exhaustion, complete every other implementation and verification task, produce candidate-by-candidate exhaustion evidence, and report the exact defensible count. Never fabricate the remainder and never call the stage complete.

## Definition of done

Done means all of the following are true:

- exactly 60 Hafez production records;
- exactly 60 unique Hafez canonical ghazals;
- exactly 60 Rumi production records;
- exactly 60 unique non-overlapping Rumi source identities;
- exactly 120 total production records;
- all 120 contain source-bound English/Persian mappings;
- all 120 have fresh machine authorities;
- no machine record requires a human identity, review packet, signature, or reapproval;
- Bell/Clarke duplicates do not count twice;
- weak, duplicate, overlapping, stale, archived, and excluded records do not compile;
- attribution and disclosures are complete;
- production selection is explicit and deterministic;
- relevant tests pass;
- production build passes;
- public-output privacy and leak checks pass;
- final reports exist;
- changes are committed and pushed;
- unrelated untracked files remain untouched.

This 60/60 corpus is sufficient for the current content stage. Stop scope expansion after proving and pushing the 120-record release. Preserve the remaining source material and eligible non-selected records for a future stage, but do not publish or process the entire literary corpus now.

# END CODEX GOAL
