# DIVAN Machine-Authority Production Verification

- **Date:** 2026-07-16 (Australia/Sydney)
- **Branch:** `feat/poetry-source-ingestion`
- **Runtime:** Node 22.16.0, pnpm 10.33.0, Playwright 1.57 (Chromium)
- **Scope:** source-bound machine authority, deterministic production corpus,
  public-bundle safety, and local release verification

## Verdict

The local production package is **production-eligible**. It contains exactly 24
Hafez and 16 Rumi items, all derived from hash-locked sources and carrying an
embedded machine-authority record. Five additional Rumi candidates are excluded
from the production selection and retained only in the audit record.

This is not a claim that the public event is launch-ready. The final short URL,
physical QR scan matrix, live container evidence, deployment evidence, and manual
event approvals remain external launch gates.

## Corpus evidence

| Property                                  | Verified result                |
| ----------------------------------------- | ------------------------------ |
| Release                                   | `machine-authority-2026-07-16` |
| Build profile                             | `production`                   |
| Production eligible                       | `true`                         |
| Hafez                                     | 24                             |
| Rumi                                      | 16                             |
| Total                                     | 40                             |
| `MACHINE_VERIFIED`                        | 13                             |
| `MACHINE_VERIFIED_WITH_DISCLOSURE`        | 27                             |
| Items with a public disclosure            | 27                             |
| Invented reflections                      | 0; all 40 are `null`           |
| Public archival/staging/reviewer leakage  | none detected                  |
| Human approval required for machine items | false                          |
| Stale machine authorities                 | 0                              |
| `EXCLUDED` records in production          | 0                              |
| Archived Rumi records in production       | 0                              |
| Full source books in public output        | 0                              |

The active authority method is `source-bound-alignment-v1`, issued under model
label `gpt-5.5-codex`. Every production record was revalidated during the build;
there are no inherited authority timestamps or unbound source references.

The Hafez selection uses Bell's public-domain English text and the locked
Qazvini-Ghani Persian source. The Rumi selection uses the locked Nicholson
Persian and Whinfield public-domain English sources. Source SHA-256 values and
the pre-migration evidence boundary are recorded in
`docs/audits/divan/2026-07-16-machine-authority-pre-migration.md`.

## Initial-to-final migration

The repository baseline was 10 verified Hafez **identifications**, 21 verified
Rumi **alignments**, and zero canonical records. The final corpus contains 24
newly canonical Hafez records and 16 newly canonical Rumi records.

The requested “14 new Hafez IDs” cannot be stated truthfully as a subset of the
final corpus. The ten baseline Hafez results bind Clarke pages to
Qazvini-Ghani ghazals 256, 111, 245, 7, 94, 258, 367, 98, 263, and 3. The final
records bind Bell spans to a different set of Qazvini-Ghani ghazals, with no
overlapping ghazal number. The ten Clarke identifications remain preserved in
the hashed pre-migration audit, but none was silently relabelled as a Bell
canonical record. Consequently, all 24 IDs below are new canonical records:

| Hafez production IDs    | Hafez production IDs    |
| ----------------------- | ----------------------- |
| `hafez-ghazal-001-bell` | `hafez-ghazal-002-bell` |
| `hafez-ghazal-008-bell` | `hafez-ghazal-011-bell` |
| `hafez-ghazal-046-bell` | `hafez-ghazal-065-bell` |
| `hafez-ghazal-079-bell` | `hafez-ghazal-090-bell` |
| `hafez-ghazal-101-bell` | `hafez-ghazal-103-bell` |
| `hafez-ghazal-134-bell` | `hafez-ghazal-145-bell` |
| `hafez-ghazal-163-bell` | `hafez-ghazal-164-bell` |
| `hafez-ghazal-166-bell` | `hafez-ghazal-169-bell` |
| `hafez-ghazal-184-bell` | `hafez-ghazal-233-bell` |
| `hafez-ghazal-254-bell` | `hafez-ghazal-255-bell` |
| `hafez-ghazal-268-bell` | `hafez-ghazal-279-bell` |
| `hafez-ghazal-288-bell` | `hafez-ghazal-336-bell` |

The selected Rumi production IDs are:

| Rumi production IDs           | Rumi production IDs           |
| ----------------------------- | ----------------------------- |
| `rumi-masnavi-0029-whinfield` | `rumi-masnavi-0112-whinfield` |
| `rumi-masnavi-0300-whinfield` | `rumi-masnavi-0306-whinfield` |
| `rumi-masnavi-0357-whinfield` | `rumi-masnavi-0397-whinfield` |
| `rumi-masnavi-0418-whinfield` | `rumi-masnavi-0557-whinfield` |
| `rumi-masnavi-0633-whinfield` | `rumi-masnavi-0643-whinfield` |
| `rumi-masnavi-0674-whinfield` | `rumi-masnavi-0724-whinfield` |
| `rumi-masnavi-0812-whinfield` | `rumi-masnavi-0946-whinfield` |
| `rumi-masnavi-0947-whinfield` | `rumi-masnavi-0959-whinfield` |

The five archived alignments are preserved as `EXCLUDED` selection evidence,
not canonical YAML and not public output:

| Archived Whinfield segment            | Nicholson section | Reason                                                                                    |
| ------------------------------------- | ----------------: | ----------------------------------------------------------------------------------------- |
| `rumi-whinfield-abridged-en-b0089-s2` |               116 | Composite reordered material across several sections creates excessive disclosure burden. |
| `rumi-whinfield-abridged-en-b0217-s2` |               347 | Three votes and composite correspondence rank below stronger continuous candidates.       |
| `rumi-whinfield-abridged-en-b0225-s2` |               483 | Three votes and composite correspondence rank below stronger continuous candidates.       |
| `rumi-whinfield-abridged-en-b0225-s8` |               622 | Two votes are the weakest identification signal in the verified set.                      |
| `rumi-whinfield-abridged-en-b0031-s1` |               668 | Composite correspondence and prose-summary boundaries reduce public suitability.          |

No Hafez production item has an `EXCLUDED` verdict. Unselected private Bell
candidates remain candidate evidence rather than being promoted to authority
records.

## Git delivery

| Commit    | Scope                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `dd3d5da` | source-bound authority, compiler/runtime/public contracts, deterministic generator, and regression tests |
| `482bb09` | exact 40-item canonical corpus, source/permission registries, and production-corpus test                 |

The final documentation commit contains this report, the pre-migration snapshot,
the Rumi selection/archive audit, and the repository change logs. Its full hash
is recorded in the final delivery response because a commit cannot contain its
own hash.

## Verification log

| Command                                                          | Exit | Evidence                                                                      |
| ---------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------- |
| `pnpm poetry:build-production`                                   |    0 | generated 24 Hafez + 16 Rumi; archived 5 Rumi separately                      |
| `pnpm poetry:verify-sources`                                     |    0 | all 9 locked source artifacts intact                                          |
| `pnpm typecheck`                                                 |    0 | strict TypeScript, no errors                                                  |
| scoped `eslint` excluding protected untracked inputs             |    0 | repository-owned implementation has zero errors/warnings                      |
| scoped `prettier --check`                                        |    0 | all changed and relevant project files formatted                              |
| `pnpm test`                                                      |    0 | 53 files, 625 tests passed                                                    |
| `pnpm test:offline`                                              |    0 | 5 files, 53 tests passed                                                      |
| `pnpm test:e2e`                                                  |    0 | 5 Playwright tests passed                                                     |
| production `pnpm build:production`                               |    0 | production release built with 40 items                                        |
| `pnpm verify:dist`                                               |    0 | integrity checks and public-bundle leak scan passed                           |
| `pnpm verify:privacy`                                            |    0 | no tracking, fingerprinting, geolocation, or unsafe storage                   |
| `pnpm verify:container`                                          |    0 | docker-free image-contract tests passed; live evidence pending                |
| `pnpm verify:headers`                                            |    0 | static header/CSP/cache tests passed; live evidence pending                   |
| `pnpm verify:origin-isolation`                                   |    0 | static isolation tests passed; live evidence pending                          |
| `pnpm verify:rollback`                                           |    0 | static rollback controls passed; live rehearsal pending                       |
| `osv-scanner scan source --lockfile pnpm-lock.yaml --no-resolve` |    0 | 429 packages scanned; no issues found                                         |
| `pnpm audit --prod`                                              |    1 | npm audit endpoints returned HTTP 410; replaced by OSV scan above             |
| `pnpm verify:qr`                                                 |    1 | intentionally fail-closed pending approved short URL and physical scan matrix |

The production build used:

```text
DIVAN_PUBLIC_ORIGIN=https://divan.example.test
DIVAN_RELEASE_ID=machine-authority-2026-07-16
DIVAN_MIN_HAFEZ_COUNT=24
DIVAN_MIN_RUMI_COUNT=16
DIVAN_BRANDING_MODE=society_only
DIVAN_UNIVERSITY_APPROVAL_ID=
SOURCE_DATE_EPOCH=1784160000
```

## Full-worktree lint boundary

`pnpm lint` also traverses user-owned, untracked inputs. It reports ten project
service parse errors beneath `New_Frontend/` and one pre-existing unnecessary
type assertion in the untracked
`scripts/poetry/build-hafez-align-tasks.ts`. Those paths were preserved and were
not modified or staged. The same lint command passes after excluding only those
protected inputs:

```text
pnpm exec eslint . --max-warnings 0 \
  --ignore-pattern New_Frontend \
  --ignore-pattern scripts/poetry/build-hafez-align-tasks.ts
```

## Machine-authority safety properties

- Production eligibility does not depend on a teacher, named reviewer, or
  contributor identity.
- Allowed machine verdicts are exactly `MACHINE_VERIFIED`,
  `MACHINE_VERIFIED_WITH_DISCLOSURE`, and `EXCLUDED`.
- Source bytes, source spans, reference spans, and mapping are independently
  hashed. Any drift fails validation closed.
- Full private sources, extraction reports, candidate records, and authority
  rationale are excluded from the public bundle.
- English is presented first; Persian remains live text below it with
  `lang="fa"` and `dir="rtl"`.
- Uncertain normalization is disclosed publicly instead of being silently
  treated as certain.

## Open launch gates

- Approved production hostname and short URL.
- Generated QR artifacts and physical multi-device scan evidence.
- Live container digest, runtime hardening, headers, cache, tunnel-isolation,
  and rollback evidence.
- Manual accessibility and event-owner approvals required by the deployment
  process.

These gates do not invalidate the local corpus or machine-authority package, but
they prevent a claim that the public event deployment itself is complete.
