/**
 * Source-aware alignment between Whinfield's English verse sections and
 * Nicholson's Persian Masnavi sections.
 *
 * The previous matcher scored bilingual token overlap across whole BODIES. That
 * is close to noise: Persian and English share no tokens, so it fell back to a
 * handful of transliterated proper nouns scattered over thousands of lines, and
 * the correct Persian passage was not even in the top 40 for 33 of 33 reviewed
 * Rumi entries (2026-07-14 preflight audit).
 *
 * This matcher uses the structure both editions actually share: their SECTION
 * TITLES. Nicholson's Persian sections are titled ("پادشاه و کنیزک"), and
 * Whinfield titles his verse sections with a translation of that same heading
 * ("STORY I. The Prince and the Handmaid."). Matching title against title, over
 * a lexicon of established equivalents, is a far narrower and far more honest
 * signal than matching body against body.
 *
 * Two rules keep it from drifting back into keyword soup:
 *
 *  - Titles are matched on WORD BOUNDARIES, not substrings. Persian short words
 *    ("نی", reed) occur inside longer unrelated words, and substring matching
 *    ranked noise above "نی‌نامه" — the Song of the Reed itself.
 *  - Generic devotional vocabulary is excluded from the lexicon entirely. Two
 *    passages sharing "love" or "heart" is what the old scorer already produced,
 *    and it is not evidence.
 *
 * Output is a ranked HINT for review. Nothing here approves anything.
 */

/**
 * English → Persian equivalents restricted to terms that IDENTIFY a passage:
 * named figures, distinctive actors, rare objects. Deliberately excludes
 * generic imagery (love, heart, soul, wine, rose, garden, king-as-metaphor),
 * which recurs across the whole Masnavi and identifies nothing.
 */
export const SECTION_TITLE_LEXICON: Readonly<
  Record<string, readonly string[]>
> = {
  // Named figures
  moses: ['موسی'],
  solomon: ['سلیمان'],
  bilqis: ['بلقیس'],
  sheba: ['بلقیس'],
  pharaoh: ['فرعون'],
  joseph: ['یوسف'],
  jacob: ['یعقوب'],
  jesus: ['عیسی'],
  abraham: ['ابراهیم'],
  noah: ['نوح'],
  adam: ['آدم'],
  omar: ['عمر'],
  ali: ['علی'],
  muhammad: ['محمد', 'مصطفی'],
  mustafa: ['مصطفی'],
  layli: ['لیلی'],
  layla: ['لیلی'],
  majnun: ['مجنون'],
  khizr: ['خضر'],
  luqman: ['لقمان'],
  jonah: ['یونس'],
  hoopoe: ['هدهد'],

  // Distinctive actors
  shepherd: ['شبان'],
  handmaid: ['کنیزک'],
  parrot: ['طوطی'],
  oilman: ['بقال'],
  grocer: ['بقال'],
  merchant: ['بازرگان'],
  harper: ['چنگی'],
  villager: ['روستایی'],
  townsman: ['شهری'],
  arab: ['اعرابی'],
  vazir: ['وزیر'],
  vizier: ['وزیر'],
  jewish: ['جهود'],
  goldsmith: ['زرگر'],
  physician: ['حکیم'],
  watchman: ['عسس'],
  ascetic: ['زاهد'],
  sufi: ['صوفی'],
  thief: ['دزد'],
  slave: ['غلام'],

  // Rare / identifying objects and creatures
  reed: ['نی', 'نی‌نامه'],
  elephant: ['پیل', 'فیل'],
  hare: ['خرگوش'],
  dog: ['سگ'],
  wolf: ['گرگ'],
  fox: ['روباه'],
  mouse: ['موش'],
  frog: ['چغز'],
  camel: ['اشتر', 'شتر'],
  cow: ['گاو'],
  snake: ['مار'],
  falcon: ['باز'],
  temple: ['مسجد'],
  jerusalem: ['اقصی'],
  chickpea: ['نخود'],
  carob: ['خروب'],
  treasure: ['گنج'],
  mosque: ['مسجد'],
};

/** Persian letters plus ZWNJ, which is word-internal in Persian. */
const PERSIAN_TOKEN_SPLIT = /[^؀-ۿ‌]+/u;
const ENGLISH_TOKEN_SPLIT = /[^a-z]+/u;

/**
 * Whinfield's English editions are printed per book (`c1..c6` in the EPUB), so
 * the book is known exactly for every English segment. Nicholson's Persian
 * sections carry no book marker and the source provides no concordance, so the
 * Persian book is NOT derived — inventing one would be fabricating provenance.
 * Book is therefore recorded as English-side evidence only, never as a filter.
 */
export function englishBookFromDocumentPath(
  documentPath: string,
): number | null {
  const match = /c(\d)_/u.exec(documentPath);
  const book = match?.[1];
  if (book === undefined) {
    return null;
  }
  const value = Number.parseInt(book, 10);
  return value >= 1 && value <= 6 ? value : null;
}

function persianTokens(title: string): Set<string> {
  return new Set(
    title
      .split(PERSIAN_TOKEN_SPLIT)
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );
}

function englishTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(ENGLISH_TOKEN_SPLIT)
      .filter((token) => token.length > 1),
  );
}

export interface TitleAnchor {
  readonly english: string;
  readonly persian: string;
}

export interface TitleMatch {
  readonly score: number;
  readonly anchors: readonly TitleAnchor[];
}

/**
 * Scores one English title against one Persian title: the number of DISTINCT
 * identifying terms present on both sides, matched on word boundaries.
 */
export function scoreTitles(
  englishTitle: string,
  persianTitle: string,
): TitleMatch {
  const english = englishTokens(englishTitle);
  const persian = persianTokens(persianTitle);
  const anchors: TitleAnchor[] = [];

  for (const [term, equivalents] of Object.entries(SECTION_TITLE_LEXICON)) {
    if (!english.has(term)) {
      continue;
    }
    const hit = equivalents.find((equivalent) => persian.has(equivalent));
    if (hit !== undefined) {
      anchors.push({ english: term, persian: hit });
    }
  }

  return { score: anchors.length, anchors };
}

export interface PersianSection {
  readonly sequence: number;
  readonly title: string;
  readonly rawTextSha256: string;
}

export interface EnglishVerseUnit {
  readonly segmentId: string;
  /** The verse-section title where present, else the story heading. */
  readonly title: string;
  readonly storyHeading: string;
  readonly book: number | null;
}

export interface RankedCandidate {
  readonly persianSequence: number;
  readonly persianTitle: string;
  readonly persianSha256: string;
  readonly score: number;
  readonly anchors: readonly TitleAnchor[];
}

export interface AlignedVerseUnit {
  readonly segmentId: string;
  readonly englishTitle: string;
  readonly storyHeading: string;
  readonly englishBook: number | null;
  readonly candidates: readonly RankedCandidate[];
  /** True when no Persian section shares a single identifying term. */
  readonly noSignal: boolean;
}

/**
 * Ranks Persian sections for one English verse unit. Deterministic: ties break
 * on the shorter Persian title (a title matching on fewer words is the more
 * specific claim), then on sequence.
 */
export function alignVerseUnit(
  unit: EnglishVerseUnit,
  sections: readonly PersianSection[],
  topN = 5,
): AlignedVerseUnit {
  const scored = sections
    .map((section) => ({
      section,
      match: scoreTitles(unit.title, section.title),
    }))
    .filter(({ match }) => match.score > 0)
    .sort(
      (a, b) =>
        b.match.score - a.match.score ||
        a.section.title.length - b.section.title.length ||
        a.section.sequence - b.section.sequence,
    )
    .slice(0, topN);

  return {
    segmentId: unit.segmentId,
    englishTitle: unit.title,
    storyHeading: unit.storyHeading,
    englishBook: unit.book,
    noSignal: scored.length === 0,
    candidates: scored.map(({ section, match }) => ({
      persianSequence: section.sequence,
      persianTitle: section.title,
      persianSha256: section.rawTextSha256,
      score: match.score,
      anchors: match.anchors,
    })),
  };
}
