# Rumi production selection and archive

Date: 2026-07-16

Authority method: `source-bound-alignment-v1`
Legacy evidence report SHA-256:
`28bfd7316cd567be428bf61406c738bb133c79d24ac8e84f1e6ecd55ec1db432`

The legacy report contained 21 machine-verified Whinfield-to-Nicholson
alignments. Production requires exactly 16. Ranking prioritised correspondence
type (direct, then abridged, then composite), followed by independent vote and
anchor strength, and finally public suitability/disclosure burden.

## Selected for production

| Whinfield segment | Nicholson section | Relationship | Votes | Anchors |
| --- | ---: | --- | ---: | ---: |
| `rumi-whinfield-abridged-en-b0171-s2` | 29 | composite | 6 | 9 |
| `rumi-whinfield-abridged-en-b0019-s2` | 112 | abridged | 4 | 7 |
| `rumi-whinfield-abridged-en-b0171-s4` | 300 | composite | 5 | 6 |
| `rumi-whinfield-abridged-en-b0161-s2` | 306 | composite | 6 | 7 |
| `rumi-whinfield-abridged-en-b0101-s2` | 357 | abridged | 4 | 6 |
| `rumi-whinfield-abridged-en-b0023-s2` | 397 | abridged | 3 | 8 |
| `rumi-whinfield-abridged-en-b0169-s2` | 418 | abridged | 4 | 8 |
| `rumi-whinfield-abridged-en-b0043-s2` | 557 | direct | 5 | 6 |
| `rumi-whinfield-abridged-en-b0039-s2` | 633 | direct | 5 | 7 |
| `rumi-whinfield-abridged-en-b0137-s2` | 643 | abridged | 4 | 6 |
| `rumi-whinfield-abridged-en-b0145-s2` | 674 | composite | 5 | 11 |
| `rumi-whinfield-abridged-en-b0059-s2` | 724 | abridged | 3 | 8 |
| `rumi-whinfield-abridged-en-b0061-s2` | 812 | abridged | 4 | 7 |
| `rumi-whinfield-abridged-en-b0201-s2` | 946 | direct | 4 | 6 |
| `rumi-whinfield-abridged-en-b0205-s2` | 947 | abridged | 5 | 6 |
| `rumi-whinfield-abridged-en-b0055-s2` | 959 | direct | 4 | 9 |

Composite candidates were retained only where vote/anchor strength was high
enough to survive the disclosure penalty. Their public records carry the
legacy report's source limitation disclosure.

## Archived with evidence

These records retain `verdict: EXCLUDED` in
`src/lib/content/productionSelection.ts`; none has a canonical YAML file and a
production test proves all five source references are absent from the corpus.

| Whinfield segment | Nicholson section | Archive reason |
| --- | ---: | --- |
| `rumi-whinfield-abridged-en-b0089-s2` | 116 | Composite, reordered material across multiple sections creates excessive disclosure burden. |
| `rumi-whinfield-abridged-en-b0217-s2` | 347 | Three votes plus composite correspondence ranks below stronger continuous candidates. |
| `rumi-whinfield-abridged-en-b0225-s2` | 483 | Three votes plus composite correspondence ranks below stronger continuous candidates. |
| `rumi-whinfield-abridged-en-b0225-s8` | 622 | Two votes are the weakest source-identification signal in the verified set. |
| `rumi-whinfield-abridged-en-b0031-s1` | 668 | Composite correspondence and prose-summary boundary burden reduce public suitability. |

Archiving preserves the source report, vote counts, anchor counts, relationship,
rationale, and report hash without copying a full source book into Git or the
public release.
