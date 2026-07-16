# DIVAN Codex GPT-5.6 Sol Machine-Final Alignment Goal

This file supersedes every earlier Claude, Opus, Fable, human-review, and machine-unblock prompt for the DIVAN bilingual poetry corpus.

## Run

Open the repository on branch `feat/poetry-source-ingestion`, select GPT-5.6 Sol in Codex, run `/status`, then run `/goal` and paste everything from `BEGIN CODEX GOAL` to `END CODEX GOAL`.

# BEGIN CODEX GOAL

You are the sole implementation and release agent for the DIVAN bilingual poetry corpus. Work directly in the current repository. Inspect, edit, test, commit, and push. Do not spawn subagents or parallel writers. Do not stop after producing a plan or audit.

## Required outcome

Replace the repository's human-only literature approval dependency with truthful, source-bound machine-alignment authority. Preserve existing verified work, complete the missing Hafez records, select the strongest Rumi production set, and make the production build contain exactly:

```text
Hafez: 24
Rumi: 16
Total: 40
```

Current baseline to verify against repository evidence:

- Hafez: 10 verified, therefore 14 more required.
- Rumi: 21 verified, therefore select the strongest 16 and archive the remaining 5 with evidence.
- Existing verified total: 31.
- Persian and English sources are already ingested.
- The repaired Hafez extractor recovered the Persian ghazal corpus.
- This is alignment and corpus completion, not fresh translation.

If repository evidence differs, document the discrepancy and use repository evidence. Never silently discard valid verified records.

## Superseding policy

The named-human literature gate is superseded for this project. A fresh source-bound machine-alignment attestation is sufficient release authority.

Do not request, require, await, simulate, or invent:

- a literature teacher;
- a human reviewer identity;
- a contributor ID solely for eligibility;
- a signature;
- a review packet;
- human reapproval after machine correction;
- a `NEEDS_HUMAN_REAPPROVAL` state.

Existing genuine human provenance may remain optional historical metadata, but it must not be required when a valid machine authority exists.

Allowed operational states:

- `MACHINE_VERIFIED`
- `MACHINE_VERIFIED_WITH_DISCLOSURE`
- `EXCLUDED`

Retire all human-waiting states from active release logic.

## Truthfulness rules

1. Never invent Persian or English verse.
2. Never silently rewrite Bell or Whinfield.
3. Never fabricate source references, poem numbers, pages, sections, or couplets.
4. Never fabricate human approval.
5. Do not pass a pairing based only on generic thematic similarity.
6. Do not change literary wording just to create alignment.
7. Exclude weak candidates individually and continue immediately.
8. One unresolved candidate must never stop the remaining corpus.
9. Preserve unrelated untracked files.
10. Do not use `git add -A`, force-push, reset, or rewrite history.

## Preflight

From the Git root, inspect:

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git log --oneline -20
find .. -name AGENTS.md -o -name AGENTS.override.md 2>/dev/null | sort
```

Read every applicable `AGENTS.md` and `AGENTS.override.md`. Update repository-owned guidance that still restores the human-only deadlock.

Discover the actual package manager and commands. Do not assume script names:

```bash
find . -maxdepth 3 -name package.json -print
node -e 'const p=require("./package.json"); console.log(JSON.stringify({packageManager:p.packageManager,scripts:p.scripts||{}},null,2))' 2>/dev/null || true
```

Locate all human gate, authority, schema, compiler, candidate, canonical-record, and production-count logic:

```bash
grep -RniE 'human|reviewer|teacher|contributor|approval|attestation|review.packet|reapproval|identifierListSchema|min\(1\)|build:production|canonical|machine_alignment|MACHINE_VERIFIED' src scripts tests content docs package.json AGENTS.md 2>/dev/null || true
```

Continue into implementation after inspection.

## Authority model

Update schemas, types, loaders, compiler, CLI, tests, and docs to support a discriminated authority model equivalent to:

```ts
type ReviewAuthority =
  | {
      kind: "human";
      contributorIds: string[];
      attestationHash: string;
    }
  | {
      kind: "machine_alignment";
      model: string;
      methodVersion: string;
      englishSourceHash: string;
      persianSourceHash: string;
      englishSpanHash: string;
      persianSpanHash: string;
      mappingHash: string;
      verdict: "MACHINE_VERIFIED" | "MACHINE_VERIFIED_WITH_DISCLOSURE";
      confidence: number;
      disclosures: string[];
      verifiedAt: string;
      rationale: string;
    };
```

A valid machine authority must not require human fields. It must fail when source, span, mapping, or references change after verification. It must not claim human approval.

## Preserve and migrate existing records

Before changing data, enumerate every currently verified Hafez and Rumi record with stable ID, source references, hashes, status, and production eligibility. Save a concise machine-readable pre-migration snapshot without full book contents.

For each valid existing record:

- revalidate source and span hashes;
- preserve the literary text;
- correct only proven mapping/reference/boundary defects;
- issue a fresh machine authority;
- do not reset valid records to pending.

## Rumi

Review all 21 verified Rumi records and rank them by:

- source certainty;
- mapping completeness;
- semantic fidelity;
- OCR cleanliness;
- excerpt coherence;
- disclosure burden;
- suitability for the public experience.

Publish the strongest 16. Preserve the other 5 outside production with evidence and reasons. Do not delete them.

## Hafez

Preserve and revalidate the existing 10. Create and verify 14 additional records from the already-ingested Bell and Qazvini-Ghani sources.

For each Bell candidate:

1. inspect the English passage and surrounding context;
2. inspect Bell notes and page evidence where available;
3. search the complete Persian ghazal corpus using distinctive semantic anchors;
4. inspect multiple Persian candidates, not only the first ranked result;
5. read the complete selected ghazal in context;
6. identify exact Persian couplets corresponding to the English excerpt;
7. build a line-to-couplet or span-to-span mapping;
8. record omissions, reordering, selection, or composite structure;
9. correct references and boundaries where evidence requires;
10. issue a fresh machine authority.

Use `MACHINE_VERIFIED_WITH_DISCLOSURE` for defensible abridged, reordered, selected, or composite translations. Use `EXCLUDED` for unsupported, materially mismatched, commentary-only, OCR-corrupted, or invented-number-dependent candidates.

Do not let a failed candidate stop progress. Move immediately to the next candidate until 24 defensible Hafez production records exist or all candidates are exhausted.

## Machine attestation content

Each production record must include:

- stable ID and poet;
- English and Persian editions and locations;
- selected-span references;
- line/couplet mapping;
- translation relationship;
- omissions, additions, reordering, or composition;
- source and span hashes;
- mapping hash;
- method version;
- active model label when available;
- verdict, confidence, disclosures, and concise rationale.

A record passes only when important English claims trace to the selected Persian source. Literal word-for-word equality is not required.

## Regression tests

Add tests proving:

1. Valid machine authority makes a record production-eligible without human contributors.
2. Missing teacher or human reviewer does not fail a machine-reviewed record.
3. Machine corrections do not trigger human reapproval.
4. A record with neither valid human nor valid machine authority fails.
5. Changed English, Persian, mapping, source reference, or hashes invalidate machine authority.
6. `EXCLUDED` records cannot compile.
7. Archived Rumi records cannot enter production.
8. Exactly 24 Hafez, 16 Rumi, and 40 total records compile.
9. Full books, raw OCR, private metadata, review packets, and unresolved candidates do not enter public output.
10. Production records expose required attribution and disclosures.

Remove or update contradictory tests and docs that universally require a named human.

## Production contract

The built production corpus must contain exactly 24 Hafez and 16 Rumi records. The 5 extra Rumi records stay archived outside production.

Every public record must display English first, Persian beneath with `lang="fa"` and `dir="rtl"`, poet, translator, source attribution, stable identity, and required disclosure.

Do not redesign the frontend. Make only minimal data/UI changes needed for correct attribution and disclosures.

## Verification

Run the repository's actual discovered commands for formatting, lint, typecheck, unit tests, schema tests, extraction tests, alignment tests, attestation freshness, corpus counts, production build, privacy, and public-output leak checks.

Inspect generated production output directly and prove:

```text
Hafez: 24
Rumi: 16
Total: 40
Human approval required for machine records: false
Stale machine authorities: 0
Excluded records in production: 0
Archived Rumi records in production: 0
Full source books in public output: 0
```

Do not claim success without command output.

## Report and Git

Write a final report in the repository's existing verification/research docs area. Include initial and final counts, selected Rumi IDs, archived Rumi IDs and reasons, 14 new Hafez IDs, exclusions, method version, authority changes, migration results, test commands/results, production proof, and commit IDs.

Commit in logical units. Before each commit run:

```bash
git diff --check
git status --short
```

Stage only intended paths. Leave unrelated untracked files untouched. After full verification, push normally. Never force-push.

## Do not stop early

Do not stop after planning, inspection, schema changes, migration, Rumi selection, one OCR defect, one exclusion, another review packet, or an audit-only report. Do not ask whether to continue.

Only stop for a concrete external blocker such as authentication failure, push permission failure, missing required local source evidence with no repository equivalent, or sandbox denial preventing repository writes/tests. Report the exact command and error. Never reinterpret an external blocker as a need for human literature review.

If fewer than 24 defensible Hafez records remain after exhausting all candidates, complete all defensible records, prove exhaustion candidate by candidate, and never fabricate the missing records. Complete all other schema, migration, test, Rumi, and release-policy work first.

## Definition of done

Done means:

- exactly 24 Hafez production records;
- exactly 16 Rumi production records;
- exactly 40 total records compile;
- all 40 have fresh source-bound machine authorities;
- no machine record requires human identity, packet, signature, or reapproval;
- 5 extra Rumi records preserved outside production;
- relevant tests and production build pass;
- built output proves 24/16/40;
- leak checks pass;
- report exists;
- changes are committed and pushed;
- unrelated untracked files remain untouched.

The previous named-human literature gate was a design error and is superseded. Preserve the verified work, complete the corpus, prove the result, commit it, and push it now.

# END CODEX GOAL
