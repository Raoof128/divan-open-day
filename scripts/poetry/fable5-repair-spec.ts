/**
 * Corpus-repair specification for the Fable 5 full-corpus campaign
 * (docs/audits/corpus-fable-5/). Every entry here is backed by the byte/page
 * verification in 03-source-verification.md; the generator refuses to apply
 * any entry it cannot re-verify against the locked sources at build time.
 *
 * Rumi selections are expressed as index windows into deterministic
 * derivations of the locked sources (the classified Whinfield segments and the
 * Nicholson section text), never as verse text, so this tracked file adds no
 * source material to the repository.
 */

export const V3_METHOD_VERSION = 'source-bound-alignment-v3-fable5-repair';
export const V3_MODEL = 'claude-fable-5';
export const V3_VERIFIED_AT = '2026-07-17';

export interface RumiWindowSpec {
  readonly persianSequence: number;
  readonly segmentId: string;
  /** 0-based inclusive line indices into the classified segment. */
  readonly englishStart: number;
  readonly englishEnd: number;
  /** 0-based index of the first matching hemistich in the section text. */
  readonly persianStart: number;
  /** Strip this exact trailing footnote marker from the given English line. */
  readonly stripFootnoteMarker?: {
    readonly lineOffset: number;
    readonly marker: string;
  };
  /** Additional public disclosures specific to this record. */
  readonly extraDisclosures?: readonly string[];
  readonly note: string;
}

/**
 * The 16 records that previously published retrieval anchors (headings,
 * half-hemistichs, Arabic-quotation fragments, `...`-elided probes) as verse.
 * Each is re-derived as a continuous English excerpt mapped 1:1 to consecutive
 * Nicholson hemistichs.
 */
export const RUMI_REDERIVED_WINDOWS: readonly RumiWindowSpec[] = [
  {
    persianSequence: 29,
    segmentId: 'rumi-whinfield-abridged-en-b0171-s2',
    englishStart: 1,
    englishEnd: 2,
    persianStart: 20,
    note: 'Sense-eye/palm couplet; replaces two non-consecutive anchor fragments.',
  },
  {
    persianSequence: 112,
    segmentId: 'rumi-whinfield-abridged-en-b0019-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 14,
    note: 'True-lover/heart-sickness couplet at the segment opening.',
  },
  {
    persianSequence: 300,
    segmentId: 'rumi-whinfield-abridged-en-b0171-s4',
    englishStart: 12,
    englishEnd: 13,
    persianStart: 12,
    note: 'Ordinance/ordained couplet; replaces an Arabic-maxim fragment.',
  },
  {
    persianSequence: 306,
    segmentId: 'rumi-whinfield-abridged-en-b0161-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 0,
    note: "House-of-'Isa couplet; replaces the two-word سگ کهف fragment.",
  },
  {
    persianSequence: 357,
    segmentId: 'rumi-whinfield-abridged-en-b0101-s2',
    englishStart: 6,
    englishEnd: 7,
    persianStart: 266,
    note: 'Eye-light/heart-light couplet located deep in the long section.',
  },
  {
    persianSequence: 397,
    segmentId: 'rumi-whinfield-abridged-en-b0023-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 112,
    note: 'Ladders of earth/heaven couplet; replaces elided compression.',
  },
  {
    persianSequence: 418,
    segmentId: 'rumi-whinfield-abridged-en-b0169-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 154,
    note: 'Lust-is-that-snake couplet; replaces a heading compression with literal ellipses.',
  },
  {
    persianSequence: 557,
    segmentId: 'rumi-whinfield-abridged-en-b0043-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 0,
    note: 'Man-of-heart/poison couplet at the segment opening.',
  },
  {
    persianSequence: 633,
    segmentId: 'rumi-whinfield-abridged-en-b0039-s2',
    englishStart: 0,
    englishEnd: 2,
    persianStart: 0,
    note: "Ambassador's three-line question; quotation marks balance across the span.",
  },
  {
    persianSequence: 643,
    segmentId: 'rumi-whinfield-abridged-en-b0137-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 42,
    note: "Fools-laud-the-mosque couplet; drops the translator's summary heading previously shipped as verse.",
  },
  {
    persianSequence: 674,
    segmentId: 'rumi-whinfield-abridged-en-b0145-s2',
    englishStart: 2,
    englishEnd: 3,
    persianStart: 12,
    note: 'Camel/mouse relativity couplet; avoids a mid-quotation window.',
  },
  {
    persianSequence: 724,
    segmentId: 'rumi-whinfield-abridged-en-b0059-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 0,
    note: 'Knock-at-the-door couplet, complete lines; replaces half-hemistich fragments.',
  },
  {
    persianSequence: 812,
    segmentId: 'rumi-whinfield-abridged-en-b0061-s2',
    englishStart: 1,
    englishEnd: 2,
    persianStart: 16,
    note: "Mirror couplet; avoids the transcription typo 'tho' in the following line.",
  },
  {
    persianSequence: 946,
    segmentId: 'rumi-whinfield-abridged-en-b0201-s2',
    englishStart: 0,
    englishEnd: 1,
    persianStart: 0,
    note: "Warning/acquiescence couplet; replaces a Qur'anic-motto fragment.",
  },
  {
    persianSequence: 947,
    segmentId: 'rumi-whinfield-abridged-en-b0205-s2',
    englishStart: 2,
    englishEnd: 3,
    persianStart: 2,
    note: 'Freewill-as-salt couplet; avoids a mid-quotation window.',
  },
  {
    persianSequence: 959,
    segmentId: 'rumi-whinfield-abridged-en-b0055-s2',
    englishStart: 2,
    englishEnd: 3,
    persianStart: 2,
    extraDisclosures: [
      "Whinfield renders the closing image as “the palm-trees of the 'Truth'” where the Nicholson transcription reads نخل امید (“the palm of hope”); the divergence reflects the translator's underlying edition, not an alteration by this project.",
    ],
    note: 'Lion-valour counsel couplet; avoids a mid-quotation window.',
  },
];

/**
 * Corrections to the 44 evidence-derived Rumi records. A window entry replaces
 * the record's span with the given segment window (re-derived from source); a
 * footnote strip removes a proven Whinfield footnote marker in place.
 */
export const RUMI_EVIDENCE_WINDOW_FIXES: readonly RumiWindowSpec[] = [
  {
    persianSequence: 408,
    segmentId: 'rumi-whinfield-abridged-en-b0335-s11',
    englishStart: 8,
    englishEnd: 9,
    persianStart: 82,
    note: 'Shifted two lines forward: removes both the footnote digit 9 and the unclosed quotation.',
  },
  {
    persianSequence: 699,
    segmentId: 'rumi-whinfield-abridged-en-b0209-s2',
    englishStart: 22,
    englishEnd: 23,
    persianStart: 22,
    note: 'Shifted one line back: complete sentences, no dangling quotation.',
  },
  {
    persianSequence: 759,
    segmentId: 'rumi-whinfield-abridged-en-b0193-s2',
    englishStart: 4,
    englishEnd: 5,
    persianStart: 4,
    note: 'Shifted outside the quotation; exact couplet correspondence retained.',
  },
  {
    persianSequence: 813,
    segmentId: 'rumi-whinfield-abridged-en-b0117-s2',
    englishStart: 50,
    englishEnd: 52,
    persianStart: 41,
    stripFootnoteMarker: { lineOffset: 1, marker: ' 5' },
    note: 'Extended to three lines to complete the wolf/Joseph question; strips the footnote marker 5.',
  },
  {
    persianSequence: 836,
    segmentId: 'rumi-whinfield-abridged-en-b0093-s2',
    englishStart: 104,
    englishEnd: 105,
    persianStart: 70,
    note: 'Persian corrected one hemistich forward: the published pair was off by one against the English.',
  },
];

export interface RumiFootnoteStrip {
  readonly persianSequence: number;
  /** Index into the record's published English lines. */
  readonly lineIndex: number;
  readonly marker: string;
}

export const RUMI_FOOTNOTE_STRIPS: readonly RumiFootnoteStrip[] = [
  { persianSequence: 718, lineIndex: 1, marker: ' 4' },
  { persianSequence: 751, lineIndex: 1, marker: ' 4' },
];

export interface ClarkeLineReplacement {
  readonly lineIndex: number;
  readonly from: string;
  readonly to: string;
  /**
   * What the generator verifies against the locked transcript (whitespace-free
   * comparison): 'artefact' asserts the corrupt `from` reading exists there
   * (the transcript itself is wrong and the scan proves the correction);
   * 'reading' asserts the corrected `to` reading exists there (the artefact
   * arose in the evidence normalisation, not the transcript).
   */
  readonly verify: 'artefact' | 'reading';
  readonly proof: string;
}

export interface ClarkeRecovery {
  readonly replacements?: readonly ClarkeLineReplacement[];
  /** Full restructure: complete replacement lines and mapping. */
  readonly restructuredLines?: readonly string[];
  readonly disclosure: string;
}

/**
 * OCR corruption in the locked Internet Archive transcript, corrected against
 * the scan (tesseract 400dpi second reading + rendered page images; see
 * 03-source-verification.md).
 */
export const CLARKE_LINE_RECOVERY: Readonly<Record<string, ClarkeRecovery>> = {
  'hafez-ghazal-038-clarke': {
    restructuredLines: [
      'Without the sun of Thy cheek, light for my day, hath remained not',
      'And of my life, save the blackest night, aught hath remained not.',
    ],
    disclosure:
      "The couplet's two verse lines were previously jammed into one truncated line ending '…save the'; both complete lines were recovered from the locked transcript (volume-1, scan page 224) and mapped line-for-line.",
  },
  'hafez-ghazal-089-clarke': {
    restructuredLines: [
      'O Lord! devise a means, whereby in safety my Beloved',
      'May come back, and release me from the claw of reproach.',
    ],
    disclosure:
      "The couplet's two verse lines were previously jammed into one truncated line ending '…from th'; both complete lines were recovered from the locked transcript (volume-1, scan page 243) and mapped line-for-line.",
  },
  'hafez-ghazal-034-clarke': {
    replacements: [
      {
        lineIndex: 0,
        from: '(0 true Beloved!)',
        to: '(O true Beloved!)',
        verify: 'artefact',
        proof:
          'volume-1 scan page 125 (printed 73) prints the letter O; the transcript carries the digit 0.',
      },
      {
        lineIndex: 0,
        from: 'dwelling of—- Thine',
        to: 'dwelling of— Thine',
        verify: 'artefact',
        proof:
          "The scan prints Clarke's long radif rule; the transcript garbles it as em-dash+hyphen. Normalised to the single em-dash convention used across the corpus.",
      },
    ],
    disclosure:
      'Two transcript OCR artefacts in the opening line (digit 0 for the vocative O, and a garbled radif dash) were corrected against the volume-1 scan, page 125.',
  },
  'hafez-ghazal-091-clarke': {
    restructuredLines: [
      'O (beloved) hidden from (my) sight! to God, I entrust, —— thee.',
      '(In pain of separation), thou consumedest my soul; yet with heart, friend I hold— thee.',
    ],
    disclosure:
      "The couplet's two verse lines were previously jammed into one truncated line that dropped the closing words 'I hold— thee.'; both complete lines were recovered from the locked transcript (volume-1, scan page 242) and mapped line-for-line.",
  },
  'hafez-ghazal-043-clarke': {
    replacements: [
      {
        lineIndex: 1,
        from: 'time of winedrinkers',
        to: 'time of wine-drinkers',
        verify: 'reading',
        proof:
          "The transcript wraps 'wine-'/'drinkers' across a line break and the evidence normalisation dropped the hyphen; Clarke's compound is printed hyphenated (nine mid-line occurrences in volume-1, and the same scan page's commentary prints '(wine-drinkers) signifies').",
      },
    ],
    disclosure:
      "A line-wrap join in the transcript normalisation had dropped the hyphen of Clarke's compound 'wine-drinkers'; restored against the transcript and the volume-1 scan, page 183.",
  },
  'hafez-ghazal-086-clarke': {
    replacements: [
      {
        lineIndex: 1,
        from: 'of theKhilvatis',
        to: 'of the Khilvatis',
        verify: 'artefact',
        proof:
          "The transcript jams 'theKhilvatis' (volume-1 line 15932); the scan (page 219, printed 167) prints 'of the Khilvatis'.",
      },
    ],
    disclosure:
      "A missing space jamming 'the Khilvatis' in the transcript was corrected against the volume-1 scan, page 219.",
  },
  'hafez-ghazal-130-clarke': {
    replacements: [
      {
        lineIndex: 1,
        from: '(0 wind thou sawest)',
        to: '(O wind thou sawest)',
        verify: 'artefact',
        proof:
          'volume-1 scan page 294: the letter O; transcript carries the digit 0.',
      },
    ],
    disclosure:
      'A transcript OCR artefact (digit 0 for the vocative O) was corrected against the volume-1 scan, page 294.',
  },
  'hafez-ghazal-337-clarke': {
    replacements: [
      {
        lineIndex: 0,
        from: 'Land,- why',
        to: 'Land,— why',
        verify: 'artefact',
        proof:
          "The scan (volume-2 page 81, printed 657) prints Clarke's long radif rule after 'Land,'; the transcript garbles it to a bare hyphen. Normalised to the single em-dash convention used across the corpus.",
      },
    ],
    disclosure:
      "A garbled radif dash in the transcript ('Land,-') was normalised against the volume-2 scan, page 81.",
  },
  'hafez-ghazal-350-clarke': {
    replacements: [
      {
        lineIndex: 0,
        from: 'Iii the morning',
        to: 'In the morning',
        verify: 'artefact',
        proof:
          'volume-2 scan page 60 (printed 636): degraded type read "Iii" by the archive OCR; the tesseract reading, the grammar, and the Persian سحر all give "In".',
      },
    ],
    disclosure:
      'A transcript OCR artefact ("Iii" for "In") in the opening word was corrected against the volume-2 scan, page 60.',
  },
  'hafez-ghazal-489-clarke': {
    replacements: [
      {
        lineIndex: 0,
        from: 'O them, in whose face',
        to: 'O thou, in whose face',
        verify: 'artefact',
        proof:
          'volume-2 scan page 255 (printed 831) plainly prints "O thou"; the Persian ای در رخ تو confirms the second-person address.',
      },
    ],
    disclosure:
      'A transcript OCR artefact ("O them" for "O thou") was corrected against the volume-2 scan, page 255.',
  },
};

export interface BellNumeralRecovery {
  readonly numeral: string;
  readonly proof: string;
}

/** OCR-corrupt Bell poem numerals, recovered from the locked archive text and the poem sequence. */
export const BELL_NUMERAL_RECOVERY: Readonly<
  Record<string, BellNumeralRecovery>
> = {
  'hafez-bell-1897-p073': {
    numeral: 'III',
    proof:
      'Sequence I (p71), II (p72) … VI (p77) places pages 73–76 as III–V; both OCR readings ("Ul", "in") are misreads of III.',
  },
  'hafez-bell-1897-p122': {
    numeral: 'XLIII',
    proof:
      'The archive text prints XLIII immediately before "WHERE are the tidings of union"; sequence XLI (p120), XLII (p121) confirms.',
  },
};

/**
 * Small-cap drop-cap openings ("THE rose…") that the consensus reconstruction
 * carried verbatim without the normalisation and disclosure its 12 sibling
 * corrections received.
 */
export const BELL_DROPCAP_POEMS: readonly string[] = [
  'hafez-bell-1897-p079',
  'hafez-bell-1897-p119',
];

/**
 * The printed page wraps one verse line across two reconstruction lines; the
 * wrapped tail must be rejoined (archive text lines 3308–3309: "…the sweet
 * laughter of" ⏎ "wine ;").
 */
export const BELL_WRAP_JOINS: Readonly<
  Record<
    string,
    { readonly joinLines: readonly [number, number]; readonly proof: string }
  >
> = {
  'hafez-bell-1897-p097': {
    joinLines: [1, 2],
    proof:
      'The scan wraps the second verse line after "laughter of"; the continuation "wine ;" is the next reconstruction line.',
  },
};

export const BELL_STANZA_DISCLOSURE =
  "Bell's verse paragraph renders the ghazal's opening couplet freely; the English lines correspond to the couplet as a stanza, not hemistich by hemistich.";
