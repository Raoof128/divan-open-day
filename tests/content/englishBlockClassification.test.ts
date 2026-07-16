import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  classifyEnglishBlocks,
  pairableSegments,
  PAIRABLE_CLASSIFICATION,
  type EnglishSourceBlock,
} from '../../scripts/poetry/classify-english-blocks';

/**
 * Regression suite for the defect recorded in
 * docs/audits/divan/2026-07-14-machine-alignment-preflight.md: Whinfield's prose
 * story arguments were paired with Persian verse and accepted as translations.
 *
 * The sources are private and git-ignored, so the structural fixtures below are
 * transcribed shapes, not source copies. The live-extraction test is skipped
 * when the private staging is absent.
 */

const EXTRACTED = resolve(
  process.cwd(),
  'sources-private/poetry/extracted/rumi-whinfield-en.jsonl',
);

function block(
  sequence: number,
  story: string,
  rawText: string,
): EnglishSourceBlock {
  return {
    sourceId: 'rumi-whinfield-abridged-en',
    sequence,
    headingPath: [story],
    rawText,
  };
}

const PROSE_ARGUMENT =
  'A prince, while engaged on a hunting excursion, espied a fair maiden, and by promises of gold induced her to accompany him. After a time she fell sick, and the prince had her tended by divers physicians. As, however, they all omitted to say, "God willing, we will cure her," their treatment was of no avail, and the maiden grew worse, and the prince was in great distress about her, and prayed long and earnestly.';

const VERSE =
  'A true lover is proved such by his pain of heart;\nNo sickness is there like sickness of heart.\nThe lover’s ailment is different from all ailments;\nLove is the astrolabe of God’s mysteries.\nA lover may hanker after this love or that love,\nBut at the last he is drawn to the KING of love.';

describe('English block classification', () => {
  it('classifies a story argument as prose_summary, never as verse', () => {
    const segments = classifyEnglishBlocks([
      block(19, 'STORY I. The Prince and the Handmaid.', PROSE_ARGUMENT),
    ]);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.classification).toBe('prose_summary');
    expect(pairableSegments(segments)).toHaveLength(0);
  });

  it('splits a story body into argument, section title, and verse', () => {
    const segments = classifyEnglishBlocks([
      block(
        19,
        'STORY I. The Prince and the Handmaid.',
        `${PROSE_ARGUMENT}\nDescription of Love.\n${VERSE}`,
      ),
    ]);

    expect(segments.map((segment) => segment.classification)).toEqual([
      'prose_summary',
      'heading',
      'verse_translation',
    ]);
    // The verse carries its section title: the cross-language matching signal.
    expect(segments[2]?.subheading).toBe('Description of Love.');
    expect(segments[2]?.text).not.toContain('A prince, while engaged');
  });

  it('keeps the reed-flute Prologue eligible as verse', () => {
    const prologue = [
      'HEARKEN to the reed-flute, how it complains,',
      'Lamenting its banishment from its home:',
      '"Ever since they tore me from my osier bed,',
      'My plaintive notes have moved men and women to tears.',
      'I burst my breast, striving to give vent to sighs,',
      'And to express the pangs of my yearning for my home.',
    ].join('\n');

    const segments = classifyEnglishBlocks([block(15, 'PROLOGUE.', prologue)]);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.classification).toBe(PAIRABLE_CLASSIFICATION);
    expect(pairableSegments(segments)).toHaveLength(1);
  });

  it('treats everything after the NOTES marker as apparatus, however verse-shaped', () => {
    // Footnote bodies are short enough to pass a naive line-length test for
    // verse. Position, not shape, is what settles them.
    const segments = classifyEnglishBlocks([
      block(16, 'PROLOGUE.', 'NOTES:'),
      block(
        17,
        'PROLOGUE.',
        '1. Compare the story of Zopyrus, Herodotus, iii. 155.\n2. Koran xviii. 23.\n3. A tradition.\n4. A saying of the Prophet.',
      ),
    ]);

    expect(segments.map((segment) => segment.classification)).toEqual([
      'editorial_apparatus',
      'footnote',
    ]);
    expect(pairableSegments(segments)).toHaveLength(0);
  });

  it('classifies a bare story heading as a heading', () => {
    const segments = classifyEnglishBlocks([
      block(
        18,
        'STORY I. The Prince and the Handmaid.',
        'STORY I. The Prince and the Handmaid.',
      ),
    ]);

    expect(segments[0]?.classification).toBe('heading');
    expect(pairableSegments(segments)).toHaveLength(0);
  });

  it('rejects the eight English blocks the defective packet accepted', () => {
    // Verbatim openings of the eight accepted English sides, from the audit.
    // Every one is an argument or editorial framing. None may ever be pairable.
    const accepted: ReadonlyArray<readonly [number, string]> = [
      [
        225,
        'King David purposed to build a temple at Jerusalem, but was forbidden to do so by a divine voice, because he had been a man of blood. But, it was added, the work should be accomplished by his son Solomon, and Solomon’s work would be reckoned the same as David’s own work.',
      ],
      [
        113,
        'Next follows an anecdote of Bilkis, Queen of Sheba, whose reason was enlightened by the counsels of the Hoopoo sent to her by King Solomon. Outward sense is as opposed to true reason as Abu Jahl was to Muhammad, and when the outward senses are replaced by the light of reason all is well.',
      ],
      [
        43,
        'There was a certain merchant who kept a parrot in a cage. Being about to travel to Hindustan on business, he asked the parrot if he had any message to send to his kinsmen in that country, and the parrot begged him to tell them of its captivity.',
      ],
      [
        47,
        'In the time of the Khalifa ’Omar there lived a harper, whose voice was as sweet as that of the angel Israfil, and who was in great request at all feasts. But he grew old, and his voice broke, and no one would employ him any longer.',
      ],
      [
        157,
        'A PARTY of travelers lost their way in a wilderness, and were well nigh famished with hunger. While they were considering what to do, a sage came up and condoled with them on their unfortunate plight, and warned them against a certain course.',
      ],
      [
        161,
        'A certain villager paid a visit to the town, and there received hospitality from one of the townsmen. At his departure the villager was profuse of thanks, and pressed the townsman to come and see him in his village, and this he repeated many times.',
      ],
      [
        221,
        'THE fourth book begins with an address to Husamu-’d-Din, and this is followed by the story of the lover and his mistress, already commenced in the third book. A certain lover had been separated from his mistress for a long season.',
      ],
      [
        261,
        'The doctrine of the Mu’tazilites, 1 mentioned, that all men’s intellects are alike and equal at birth, is again controverted, and the poet dwells on the essential differences which characterize the intellects of different men.',
      ],
    ];

    for (const [sequence, text] of accepted) {
      const segments = classifyEnglishBlocks([
        block(sequence, `STORY #${String(sequence)}`, text),
      ]);
      expect(
        pairableSegments(segments),
        `block ${String(sequence)} must not be pairable`,
      ).toHaveLength(0);
      expect(segments[0]?.classification).toBe('prose_summary');
    }
  });

  it('finds verse in the real extraction and never pairs an argument', () => {
    let rows: EnglishSourceBlock[];
    try {
      rows = readFileSync(EXTRACTED, 'utf8')
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line) as EnglishSourceBlock);
    } catch {
      // Private staging is git-ignored; nothing to assert on a clean checkout.
      return;
    }

    const segments = classifyEnglishBlocks(rows);
    const verse = pairableSegments(segments);

    expect(verse.length).toBeGreaterThan(0);
    for (const segment of verse) {
      // No pairable segment may contain a prose-length line.
      const longest = Math.max(...segment.lines.map((line) => line.length));
      expect(longest).toBeLessThan(150);
    }
  });
});
