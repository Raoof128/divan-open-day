# DIVAN poetry source — rights evidence report

**Status: PENDING review. Nothing here is an approval.** This report records what
the archival hosts state about each source edition and the public credit that
would be required _if_ the Persian Society's documented rights review approves it.
The machine-checkable companion is `../rights-evidence.yaml` (validated by
`src/lib/content/sourceRightsSchema.ts`); every record is `pending` with no
reviewer, and a record cannot become `approved` without a named human rights
reviewer and an acquired source-lock SHA-256.

No wording here should be read as "copyright safe everywhere". Final Australian
launch approval remains subject to the Society's documented rights review.

## 1. Hafez — Persian text

- **Edition:** Divan of Hafez, Qazvini–Ghani edition (Persian Wikisource transcription).
- **Source id:** `hafez-qazvini-ghani-fa-wikisource`
- **Observed status:** Persian Wikisource identifies the underlying work as public
  domain in Iran and the United States; the transcription is served under CC BY-SA.
- **Evidence:** https://fa.wikisource.org/wiki/دیوان_حافظ
- **Required public credit (prospective):** Persian text: Divan of Hafez,
  Qazvini–Ghani edition, transcription from Persian Wikisource (CC BY-SA —
  attribution and share-alike apply to the extracted transcription).

## 2. Hafez — English translation

- **Edition:** Gertrude Lowthian Bell, _Poems from the Divan of Hafiz_, London,
  William Heinemann, 1897. **A selection, not a complete translation.**
- **Source id:** `hafez-bell-1897-en`
- **Observed status:** Internet Archive records the 1897 item as `NOT_IN_COPYRIGHT`.
- **Evidence:** https://archive.org/details/poemsfromdivanof00hafiiala
- **Required public credit (prospective):** English translation: Gertrude Lowthian
  Bell, _Poems from the Divan of Hafiz_, 1897 (a selection).

## 3. Rumi — Persian text

- **Edition:** Masnavi-e Ma'navi, Nicholson Persian edition (Persian Wikisource
  transcription).
- **Source id:** `rumi-nicholson-fa-wikisource`
- **Observed status:** Persian Wikisource provides the Nicholson-edition
  transcription and identifies the underlying work as public domain; transcription
  served under CC BY-SA.
- **Evidence:** https://fa.wikisource.org/wiki/مثنوی_معنوی
- **Required public credit (prospective):** Persian text: Masnavi, Nicholson
  edition, transcription from Persian Wikisource (CC BY-SA).

## 4. Rumi — English translation

- **Edition:** E. H. Whinfield, _Masnavi I Ma'navi_ — **abridged** English
  translation (English Wikisource transcription; Sacred Texts is a human
  cross-reading source only).
- **Source id:** `rumi-whinfield-abridged-en`
- **Observed status:** English Wikisource marks both the original and the
  Whinfield translation public domain worldwide; the translation is explicitly
  abridged.
- **Evidence:** https://en.wikisource.org/wiki/Masnavi_I_Ma%27navi
- **Required public credit (prospective):** English translation: E. H. Whinfield,
  _Masnavi I Ma'navi_ (an abridged translation).

## Share-alike obligation

The two Persian sources are Wikisource **CC BY-SA** transcriptions. If extracted
transcription text is used publicly, the public Credits surface must carry the
attribution and share-alike notice. This is a launch-gate item for the Society's
rights reviewer, not something this pipeline may self-certify.

## Reviewer checklist (human, before any `approved`)

1. Confirm the observed status against the cited evidence URL.
2. Confirm the acquired artifact's SHA-256 matches `source-lock.json` and record it
   as `source_lock_reference`.
3. Confirm the required public credit wording with the Society.
4. Name the accountable `rights_reviewer_id` and set `status: approved` **only**
   in `rights-evidence.yaml` — never here in prose.
