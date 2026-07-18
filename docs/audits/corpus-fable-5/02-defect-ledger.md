# Corpus repair — Phase 2 frozen defect ledger (pre-repair baseline)

Frozen **before any corpus edit**, per the goal's Phase 1 contract. Sources: the automated
120-record scan (`01-record-inventory.json`), the backend audit's corpus findings
(`docs/audits/backend-fable-5/07-consolidated-defect-ledger.md` @ `2ef8b72`, all re-verified
against this tree), and direct reads of the generator inputs. Severity: Blocker / Critical /
High / Medium / Low.

Repair tiers refer to the goal's translation-authority model:
T1 = faithful recovery from the registered historical source; T2 = replacement from a
registered historical translation; T3 = labelled project translation (only if T1/T2 fail);
T4 = exclusion + replacement.

## D-01 · Anchor probes published as verse — 16 Rumi records · **CRITICAL** · T1

`makeRumiItems` publishes `anchors[0..1]` from `rumi-alignment-candidates.json` verbatim.
Anchors are retrieval probes, not spans: they include translator headings, half-hemistich
fragments, Arabic-quotation fragments, and `...`-elided compressions.

Records (= the 16 with no `:lines-N-M` window): 0029, 0112, 0300, 0306, 0357, 0397, 0418,
0557, 0633, 0643, 0674, 0724, 0812, 0946, 0947, 0959.

Worst instances, verified against the published YAML lines:
- **0643**: `persian_lines[0]` = `شکایت گفتن پیرمردی به طبیب` — the Nicholson section
  **title**; `english_lines[0]` = "The Old Man and the Physician" — a heading. Its own
  disclosure admits this.
- **0946**: `persian_lines[0]` = `ان مع العسر یسرا` — a Qur'anic quotation fragment used as
  the section motto; `english_lines[1]` contains an internal `/` splice.
- **0306**: `persian_lines[1]` = `سگ کهف` — a two-word keyword fragment.
- **0633**: `fa[0]` = `کای امیرالممنین` (half-hemistich, and the extraction spells
  المؤمنین as الممنین — verify against source); **0724**: `fa[1]` = `کیستی ای معتمد`
  (half-hemistich); **0300**: `fa[0]` = `الرضا بالکفر کفر` (Arabic maxim fragment).
- **0397, 0418, 0557, 0674, 0947, 0357**: literal `...` elision marks and/or lines that do
  not exist verbatim in the Nicholson section.

**Repair**: re-derive each of the 16 as a continuous Whinfield span (≥2 English lines) mapped
1:1 to consecutive Nicholson hemistichs, the exact shape the 44 evidence records already use;
new `:lines-N-M` windows; fresh authority. T4 replacement from unused Whinfield material if a
segment cannot support a defensible continuous span.

## D-02 · Truncated Persian hemistich with stray bracket — hafez-ghazal-065-bell · **HIGH** · T1

`fa[0]` and `opening_hemistich_fa` = `خوشتر ز عیش و صحبت و باغ[`. The extraction
(`hafez-ghazals-fa.jsonl` ghazal 65) is truncated at a footnote bracket; the source document
name itself transliterates the full hemistich (`…bagh_w_bhar_chyst`). Repair: recover
`…و باغ و بهار چیست` from the locked Qazvini-Ghani EPUB (byte-verify hash first), fix the
extraction defect class, regenerate.

## D-03 · Bell scan line-wrap published as truncation — hafez-ghazal-163-bell · **HIGH** · T1

`en[1]` = "Nor merry the Spring without the sweet laughter of" — the scan wraps the line;
the continuation "wine ;" is the next reconstruction line. Repair: join the wrap from the
Bell source (T1), regenerate.

## D-04 · Clarke OCR corruption published as translation — 5 records · **HIGH** · T1

- **350**: "Iii the morning" → "In the morning" (scan-provable).
- **034**: "(0 true Beloved!)" → "(O true Beloved!)"; also verify the `—-` dash.
- **130**: "(0 wind thou sawest)" → "(O wind thou sawest)".
- **489**: "O them" → "O thou" (scan-provable).
- **091**: `en[0]` jams two Clarke verse lines into one, ends truncated ("yet with heart,
  friend"), mapped `[0,1]`. Repair: recover both complete lines from the locked transcript,
  split, map 1:1.

## D-05 · Footnote digits inside verse — rumi 0408, 0718, 0751, 0813 · **HIGH** · T1

E.g. 0408 `en[0]`: `"'Yea, he was with you,' 9 this great king;` (Whinfield footnote 9);
0718/0751/0813 carry trailing digits. Repair: remove the footnote markers against the
Whinfield source with per-record disclosure; verify no wording change beyond the marker.

## D-06 · Crossed bilingual mapping — rumi-masnavi-0836 · **HIGH** · T1

`en[0]` "He is like Pharaoh, and his body is like Moses," maps to `fa[0]`
`خود حسود و دشمن او آن تنست` but translates `fa[1]` `او چو فرعون و تنش موسی او`.
`en[1]` "He runs abroad crying, 'where is my foe?'" corresponds to the *following* hemistich,
not published. Repair: re-window the Persian span to the hemistichs the English lines
actually translate, 1:1.

## D-07 · Unclosed quotations from mid-quote windows — rumi 0699, 0759, 0408 · **MEDIUM** · T1

Excerpt windows open quotes never closed inside the excerpt (0699 `en[1]`, 0759 `en[0]`,
0408 nested). Repair: prefer windows that balance; where the faithful window genuinely spans
a longer quotation, keep source punctuation and disclose.

## D-08 · Wrong / duplicate Bell citations — 3 records · **MEDIUM** · T1

- **090**: `page_reference` "Bell poem Ul" — OCR-corrupt numeral (`numeralCertain` false in
  the reconstruction); recover the true numeral from the scan header.
- **169 + 336**: both cite "Bell poem XLII" (pages 121 and 122). The reconstruction shows
  p122's header OCR'd as XLII; the true number (expected XLIII) must be recovered from the
  scan. The English spans are distinct — this is citation corruption, not span reuse.

## D-09 · Undisclosed drop-cap normalisation gap — hafez 046, 288 · **MEDIUM** · T1

`en[0]` ships "THE rose has flushed red…" / "THE margin of a stream…" (typographic drop-cap
small-caps) as `MACHINE_VERIFIED`, `disclosures: []`, while 12 sibling records normalise and
disclose this exact class. Repair: normalise with the same disclosure class.

## D-10 · Single-hemistich mapping misstatement — all 24 Bell records · **HIGH** · structural

Every Bell record publishes exactly one Persian hemistich with `alignment: line` and both
English lines mapped to index 0 — asserting line-level equivalence that is false for
`en[1]` (Bell's stanza renders the whole opening couplet, loosely). Repair: publish the full
opening couplet (both hemistichs, verified against the extraction/EPUB), switch to the
honest alignment/mapping shape, disclose Bell's free stanza rendering.

## D-11 · Provenance binds an artifact the pipeline did not read — 36 Clarke records · **HIGH** · metadata

`english_source_sha256` binds the Clarke **PDF** volume hashes while each record's own
disclosure states the text was normalised "from the locked Internet Archive transcript".
The transcripts are locked (`volume-1.txt` `ff0642a5…`, `volume-2.txt` `ac0ea92c…`) and
bound by no record. Repair: bind the transcript hash actually read; keep the PDF hash as
acquisition evidence in the lock; where wording was visually corrected against the scan,
record the correction chain (goal Phase 2). Bell binding to be settled by evidence:
`bell-poems.json` `generatedFrom` decides whether the PDF (scan OCR) is truthful for Bell.

## D-12 · Rights chain not coupled — registry-wide · **HIGH** · metadata

All 120 permissions cite `sources-private/poetry/rights-evidence.yaml` as free text; its 5
records are `status: pending` with `source_lock_reference: null` although every artifact's
SHA-256 exists in the tracked `source-lock.json`. No record claims a human review that did
not happen (honesty holds); the machine-verifiable coupling is absent. Repair: populate the
5 `source_lock_reference` values from the lock; bind permissions → rights records → lock
hashes with a CI test (both files are tracked). Human-only `approved` gate is left intact
for rights (the goal forbids calling uncertain rights approved); production does not gate on
it.

## D-13 · Hand-typed corrections bypass corroboration evidence — 12 Bell records · **MEDIUM** · evidence

`OCR_OPENING_CORRECTIONS` hard-codes 12 recovered opening lines with no per-line scan
citation. The corrections themselves are disclosed in the records; the evidence chain is
what's missing. Repair: restructure into a recovery table carrying scan-page citation and
verification method per line; verify each correction against the Bell source text in
Phase 2 (the goal's Tier 1 explicitly authorises this class).

## D-14 · Authority metadata quality — corpus-wide · **MEDIUM** · metadata

`verifiedAt` is the single literal `2026-07-16` in all 120; `confidence` is a clamped `0.8`
floor in 41 records and raw float noise (e.g. `0.9299999999999999`) in 46; model strings
name the generating assistant of that campaign. Repair: repaired records carry
`claude-fable-5` + `source-bound-alignment-v3-fable5-repair` + `2026-07-17` + rounded,
honestly-derived confidence; untouched records keep their genuine 2026-07-16 authority
(rewriting them would falsify history).

## D-15 · Tracked evidence file leaks non-published verse — build input · **MEDIUM** · privacy/rights

`docs/verification/2026-07-16-final-alignment-evidence.json` (tracked, a generator input)
embeds ~222 anchor verse lines beyond the published excerpts. Repair: the v3 corrected
evidence input lives under git-ignored `sources-private/poetry/reports/`; the tracked
successor evidence carries identifiers, windows and hashes only. The historical file is left
untouched (rewriting published history is a falsification; its content remains in git
history regardless).

## D-16 · Whinfield English-source references lack spans — 16 records · **MEDIUM** · metadata

Exactly the D-01 family: `english_source_reference` is a bare segment id. Every windowed
record (`:lines-N-M`) is defect-free on this axis; every windowless one is defective —
the highest-yield metadata gate available. Repair: emit windows for all Rumi records and
enforce by schema/test.

## Explicitly out of scope for this campaign

- The vacuous raster-budget test, README/SECURITY public-statement accuracy, Cloudflare
  zone analytics, credential rotation — backend/product items already escalated, not corpus.
- Rewriting any historical evidence document or git history.

## Order of work

D-02/D-03/D-04/D-05/D-06 (published-text corruption) and D-01 (fabrication-adjacent
structure) first; then D-10/D-11 (mapping + provenance); then D-08/D-09/D-13 (citations,
drop-caps, evidence chains); then D-12/D-14/D-15/D-16 (metadata, rights, freshness); tests
per class alongside each (goal Phase 7).
