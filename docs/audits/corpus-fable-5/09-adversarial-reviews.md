# Corpus repair — Phase 10 adversarial re-audit

Four independent adversarial reviewers were run against the repaired corpus (HEAD `7beac5b`
at review time), each instructed to **falsify, not confirm**, each working from the locked
sources and the repo's own schema modules, none permitted to modify tracked files. Their
full method disclosures are summarised per reviewer below. Every finding was then resolved
personally by the lead (Fable 5) — fixed with source evidence, or refuted with source
evidence, or recorded as a residual — and the corpus was regenerated and re-gated after
each fix round. Nothing was dismissed.

Fix rounds produced by this audit:

- **Round 1** — commit `2204f17` (wrong-poem pairing + three missed OCR artefacts + one
  divergence disclosure).
- **Round 2** — commit `0a5b88f` (small-caps opening on Bell p77, credit-string alignment,
  Bell recovery guard).

## Reviewer A — Persian identity, spans, and bilingual alignment

Method: mechanical whole-corpus verification (no sampling) via a script importing the
production `classifyEnglishBlocks`, plus personal bilingual reading of all 23 re-derived
Rumi pairs and **all 24** Bell records.

| Check | Result |
| --- | --- |
| Rumi Persian verbatim identity (60/60, exact consecutive runs in Nicholson sections) | PASS |
| Rumi English verbatim windows (60/60; the only deviations are the three disclosed footnote strips on 0718/0751/0813) | PASS |
| Hafez first-couplet identity (60/60, incl. `opening_hemistich_fa` equality; no ambiguous ghazal matched) | PASS |
| 23 re-derived Rumi bilingual pairs read FA↔EN | PASS (one edition-variance disclosure candidate, below) |
| Bell stanza-level pairing, all 24 records read | **FAIL — 1 record** |

**Finding A1 (BLOCKER, fixed):** `hafez-ghazal-046-bell` published ghazal 46's Persian
against Bell poem VIII's English — but Bell VIII is her rendering of **ghazal 25**
(شکفته شد گل حمرا و گشت بلبل مست), proven from the poem's continuation: "Hail, Sufis!
lovers of wine" = صلای سرخوشی ای صوفیان باده پرست, and the "rock your repentance… goblet"
image = ghazal 25's اساس توبه… couplet. Bell translated no ghazal 46 at all, so the record
could not be re-windowed. *Resolution:* the selection was re-pointed
(`productionSelection.ts` p079 → ghazal 25, with an explanatory comment), the corpus
regenerated — `hafez-ghazal-046-bell.yaml` removed, `hafez-ghazal-025-bell.yaml` created
with the verbatim ghazal-25 opening couplet. The wrong-poem pairing predated this campaign;
it survived because no mechanical check ties Bell's English to a ghazal number — this is
exactly the class of defect only bilingual reading catches, and why all 24 were read.

**Finding A2 (disclosure, fixed):** `rumi-masnavi-0959` — Persian نخل امید ("palm of
hope") vs Whinfield's "palm-trees of the 'Truth.'" The reviewer verified the two preceding
line pairs match exactly, so the mapping is correct; the divergence is Whinfield's base-text
edition variance. *Resolution:* an explicit edition-variance disclosure was added to the
record (round 1).

## Reviewer B — English source recovery and OCR correctness

Method: mechanical compact-substring verification of all 72 Clarke lines and all Bell
openings against the locked transcripts and per-page tesseract texts, plus a corpus-wide
residual-corruption sweep (digits, jammed words, garbled dashes, unbalanced punctuation,
small-caps residue).

| Check | Result |
| --- | --- |
| Clarke hash binding (36/36 records, both volumes) | PASS |
| Restructured 038/089/091 lines verbatim, adjacent, unique in transcript | PASS |
| Bell recovered openings genuine (each exactly once in archive text; records match) | PASS on substance |
| "Every Clarke line in transcript or documented correction" | **Falsified as an exhaustive claim** (3 wrap-joins outside the documented list; one wrong) |
| Residual corruption sweep | **2 missed artefacts** |

**Finding B1 (fixed):** `hafez-ghazal-043-clarke` published `winedrinkers` — the
evidence-file wrap-join had dropped Clarke's printed hyphen. Nine mid-line `wine-drinkers`
occurrences in volume 1 plus the cited page's own tesseract text (`p-0183.txt`:
"(wine-drinkers) signifies") prove the hyphenated form. *Resolution:* corrected to
`wine-drinkers` with a scan-backed disclosure. Because the artefact was **not** in the
transcript (the transcript itself line-wraps correctly), this required a new
`verify: 'reading'` mode in the recovery spec — the build now asserts the *corrected*
reading exists in the transcript instead of the artefact.

**Finding B2 (fixed):** `hafez-ghazal-086-clarke` — jammed `theKhilvatis` (transcript
artefact; scan `p-0219.txt` prints `the Khilvatis`). The only jammed-word instance in the
corpus; compact comparison is structurally blind to this class. *Resolution:* corrected
with scan-backed disclosure.

**Finding B3 (fixed):** `hafez-ghazal-337-clarke` — `Land,-` is a transcript garbling of
the printed radif rule `Land,—` (scan `p-0081.txt`), same class as the already-documented
034 correction. *Resolution:* corrected with scan-backed disclosure.

**Finding B4 (predicate note, recorded):** two Bell openings match the archive only under
whitespace-*removal*, not whitespace-*collapse* (Victorian spaced punctuation `hope —`,
`hail !`). The wording is genuine; the verification predicate in `03-source-verification.md`
is the compact (whitespace-free) comparison, which covers this. Recorded as a precision
note, no text change.

**Finding B5 (residual, recorded):** the generator transcript-verifies only records with a
recovery entry; the other 29 Clarke records' lines are trusted from the tracked evidence
file at build time. This reviewer's sweep verified all of them externally against the
transcripts (65 verbatim + documented corrections + 2 correct wrap-joins), so the corpus is
sound today; the structural gap is recorded below as a residual risk.

**Round-2 follow-up (fixed):** re-examining Bell openings during resolution of Finding D1
exposed `hafez-ghazal-268-bell`'s opening `A FLOWER-TINTED cheek` — a small-caps *phrase*
the original single-word normalizer missed. The scan (p77) confirms the small-cap
typography. *Resolution:* added to the opening corrections
(`A flower-tinted cheek, the flowery close`), disclosed on the record, confidence carried
at 0.97.

## Reviewer C — Digests, uniqueness, provenance, reproducibility, determinism

Method: independent recomputation script (imports the repo's digest functions but
re-implements all comparison/uniqueness/order logic), shell byte-comparisons, two clean
builds, one clean regeneration.

| Check | Result |
| --- | --- |
| All four authority digests recompute exactly, 120/120; selection manifest bijective, digests equal, canonical order | PASS |
| Uniqueness: 60 distinct Hafez identities; 122 distinct Rumi Persian lines with zero cross-record reuse; 60 distinct English-span identities; 60 distinct mapping hashes | PASS |
| Provenance: exactly two (verifiedAt, methodVersion) populations — 83 v3 + 37 v2; all 37 v2 byte-identical to `adde8b4`, and (converse) exactly those 37 of adde8b4's files are unchanged | PASS |
| Two-build byte reproducibility (`release.json` + self-addressed content JSON identical; 120/60/60) | PASS |
| Generator determinism (`poetry:build-production` over a clean tree → `git status` empty) | PASS |

**Verdict: all five claims survive falsification — 0 deviating records.**

**Observation C1 (latent, recorded):** the generator sorts the selection manifest with
`localeCompare(…, 'en')` while the validator compares code-units. Coincident for the
current ASCII IDs (verified empirically); a future non-ASCII ID could diverge. Recorded as
a residual risk, not repaired here.

## Reviewer D — Rights truthfulness, fail-closed behaviour, public-bundle leakage

Method: rights cross-checks against `source-lock.json`; live mutation probes against the
real imported schema modules (in-memory only); an independent leak scan of a fresh
production build (forbidden-string sweep, public field-set diff against `publicSchema.ts`,
dist↔content-private parity).

| Check | Result |
| --- | --- |
| Rights records honest: all 5 `pending`, no reviewer claimed, locks resolve to correct artifacts, no fabricated approvals anywhere | PASS |
| Correct translator attribution 120/120; no undisclosed wording attributed to translators (all 242 Persian lines verbatim; English deviations = the disclosed corrections) | PASS (two punctuation exceptions → D1) |
| Fail-closed probes: Persian-char swap, reference tamper, EXCLUDED verdict, future-effective date, 119-item compile — every one rejected with the right error | PASS |
| Leak scan: zero forbidden strings; public field set exactly the public schema (no mapping/hash/authority fields); 120/120 dist↔source parity | PASS |

**Finding D1 (refuted with source evidence):** two allegedly undisclosed punctuation edits —
`hafez-ghazal-134-bell` "wind," (transcript: `wind.`) and `hafez-ghazal-268-bell` "earth,"
(transcript: `earth,,`). *Resolution:* the Bell **scans** were read directly (p87, p77):
the printed pages read `wind,` and `earth,` — the published readings are scan-correct and
it is the archive OCR text that is wrong in both places. The records' disclosures ("wording
and punctuation otherwise follow the selected source span") are therefore accurate against
the actual source of authority (the scan). No change needed; evidence recorded here.

**Finding D2 (fixed, round 2):** credit-text drift — Clarke records credited "The Divan of
Hafiz (1891)" where `rights-evidence.yaml` requires "The Divan-i-Hafiz, Calcutta, 1891…";
Bell credits dropped the required "not a complete translation" qualifier; Whinfield's
lacked "not a complete rendering". *Resolution:* all three `public_credit` strings aligned
to the recorded `required_public_credit` wording; touches all 120 records.

**Finding D3 (fixed, round 1 — same defects as A1/A2):** the reviewer independently
re-derived the 046/Bell-VIII wrong-poem pairing and the 0959 undisclosed divergence, and
correctly flagged that HEAD-at-review still carried them ("do not tag it"). Both fixes were
committed in `2204f17`.

**Finding D4 (guard gap, fixed, round 2):** `OCR_OPENING_CORRECTIONS` and
`BELL_NUMERAL_RECOVERY` applied without any premise assertion (unlike the Clarke pattern) —
the reviewer verified all 12 current entries are sound but the code would accept a drifted
table silently. *Resolution:* the build now hash-asserts the Bell archive text
(`raw/hafez-bell-1897-en/source.txt`, SHA-256 `e736637a…`) and asserts every corrected
opening exists in it before applying any correction; a mismatch aborts the build.

**Observation D5 (recorded for owner sign-off):** public `disclosures` deliberately carry
process vocabulary ("recovered from the locked transcript (volume-1, scan page 224)") —
by design the public honesty channel, but it is the one place internal workflow phrasing
surfaces publicly.

## Post-fix verification (after round 2, commit `0a5b88f`)

- Regeneration: 60 Hafez + 60 Rumi + 5 archived; the only record-level deltas vs the
  round-1 corpus are exactly the intended ones (046→025 replacement; 043/086/268/337/0959
  disclosures and hashes; credit strings on all 120).
- Whole-corpus span verifier: `checked 60 hafez + 60 rumi / ALL SPANS VERBATIM-VERIFIED`.
- `pnpm test`: 63 files, 732 tests, all passing (includes the 13-test corpusIntegrity
  suite, which now also guards the classes found here: jammed words are caught by the OCR
  pattern checks, and every hand recovery is premise-asserted at build time).
- `bash scripts/check.sh`: full quality gate green (format, lint, typecheck, tests, fixture
  build, verify:dist, verify:privacy, prod-deps audit, production build 120 items, launch
  gates fail-closed for true reasons).
- `final-record-report.json` regenerated; per-record diff vs the pre-audit report shows
  exactly the audited changes and nothing else (114 records byte-identical).

## Outcome

Two rounds, thirteen findings/observations: **8 fixed** (A1/D3 wrong-poem pairing, A2/0959
disclosure, B1 wine-drinkers, B2 Khilvatis, B3 radif rule, round-2 small-caps phrase, D2
credits, D4 guard), **1 refuted with scan evidence** (D1), **and the rest recorded** (B4
predicate note, B5 evidence-trust gap, C1 localeCompare, D5 disclosure vocabulary) as
residual risks in `10-final-verdict.md`. No finding was left unresolved.
