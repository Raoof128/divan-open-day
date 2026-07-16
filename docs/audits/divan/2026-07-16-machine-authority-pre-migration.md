# Machine-authority pre-migration snapshot

Date: 2026-07-16

Branch: `feat/poetry-source-ingestion`
Pre-migration HEAD: `6df9775`

This snapshot freezes the repository evidence that existed before canonical
machine-authority records were created. It deliberately distinguishes verified
identifications from production content: the source reports contained 10
verified Hafez mappings and 21 verified Rumi alignments, but `content-private/`
contained no canonical poem records. Therefore all 31 entries had
`productionEligible: false` at this boundary.

## Evidence snapshots

| Evidence | SHA-256 |
| --- | --- |
| Hafez Clarke alignment report | `4bc7369c99e9d590b8d6bb4fd70cdfd22cc41053cf8feffe36a4f133dc73def4` |
| Rumi alignment report | `28bfd7316cd567be428bf61406c738bb133c79d24ac8e84f1e6ecd55ec1db432` |
| Reconstructed Bell poems | `c5b554b6fa498888496e416f01db4e6dd1090cfe936439dca6c765165ce8cbdc` |
| Extracted Qazvini-Ghani ghazals | `f55c2b23552959fb7ec06249df5fbe6b01f595a93727e09fc6adb65f72f5196e` |
| Whinfield English extraction | `135c029d475e6dfd2d1497c6edb13c443f4aba84ca8e574277f9f1783f13a2d5` |
| Nicholson Persian sections | `0d0c00ccd2fe1fa4c55ef81eafd0219395610500f920d5a65170c403a7fccfa9` |

The source-book snapshots behind those extracts are Whinfield EPUB
`d629e8abbd40ff5cfe5ec24dc4fa3733a4400714695aaf9bf59a4c9d01e9d38d`
and Nicholson EPUB
`04a80365a6c4938fc8208fa501ead01a6eede8883f68c7cf588a9ca33f0814d7`.

## Hafez baseline: 10 verified identifications

The legacy report maps Clarke volume/page tasks to Qazvini-Ghani ghazals:

| Clarke task | Ghazal |
| --- | ---: |
| `volume-1/p294` | 256 |
| `volume-1/p179` | 111 |
| `volume-1/p282` | 245 |
| `volume-1/p4` | 7 |
| `volume-1/p85` | 94 |
| `volume-1/p299` | 258 |
| `volume-1/p417` | 367 |
| `volume-1/p112` | 98 |
| `volume-1/p309` | 263 |
| `volume-1/p8` | 3 |

These are preserved as identification evidence. They are not represented as
pre-existing canonical records and are not silently relabelled as human review.

## Rumi baseline: 21 verified alignments

| Whinfield segment | Nicholson sequence | Votes | Relationship | Anchors |
| --- | ---: | ---: | --- | ---: |
| `rumi-whinfield-abridged-en-b0171-s2` | 29 | 6 | composite | 9 |
| `rumi-whinfield-abridged-en-b0019-s2` | 112 | 4 | abridged | 7 |
| `rumi-whinfield-abridged-en-b0089-s2` | 116 | 4 | composite | 8 |
| `rumi-whinfield-abridged-en-b0171-s4` | 300 | 5 | composite | 6 |
| `rumi-whinfield-abridged-en-b0161-s2` | 306 | 6 | composite | 7 |
| `rumi-whinfield-abridged-en-b0217-s2` | 347 | 3 | composite | 7 |
| `rumi-whinfield-abridged-en-b0101-s2` | 357 | 4 | abridged | 6 |
| `rumi-whinfield-abridged-en-b0023-s2` | 397 | 3 | abridged | 8 |
| `rumi-whinfield-abridged-en-b0169-s2` | 418 | 4 | abridged | 8 |
| `rumi-whinfield-abridged-en-b0225-s2` | 483 | 3 | composite | 7 |
| `rumi-whinfield-abridged-en-b0043-s2` | 557 | 5 | direct | 6 |
| `rumi-whinfield-abridged-en-b0225-s8` | 622 | 2 | abridged | 8 |
| `rumi-whinfield-abridged-en-b0039-s2` | 633 | 5 | direct | 7 |
| `rumi-whinfield-abridged-en-b0137-s2` | 643 | 4 | abridged | 6 |
| `rumi-whinfield-abridged-en-b0031-s1` | 668 | 4 | composite | 6 |
| `rumi-whinfield-abridged-en-b0145-s2` | 674 | 5 | composite | 11 |
| `rumi-whinfield-abridged-en-b0059-s2` | 724 | 3 | abridged | 8 |
| `rumi-whinfield-abridged-en-b0061-s2` | 812 | 4 | abridged | 7 |
| `rumi-whinfield-abridged-en-b0201-s2` | 946 | 4 | direct | 6 |
| `rumi-whinfield-abridged-en-b0205-s2` | 947 | 5 | abridged | 6 |
| `rumi-whinfield-abridged-en-b0055-s2` | 959 | 4 | direct | 9 |

The migration must select exactly 16 for production, preserve the other five as
archived evidence, and never expose any full source book or private rationale in
the public release bundle.
