export interface HafezProductionSelection {
  readonly bellPoemId: string;
  readonly bellPage: number;
  readonly ghazalNumber: number;
}

export const HAFEZ_PRODUCTION_SELECTION = [
  ['hafez-bell-1897-p071', 71, 1],
  ['hafez-bell-1897-p077', 77, 268],
  ['hafez-bell-1897-p078', 78, 79],
  // p079 is Bell poem VIII — her rendering of ghazal 25 (شکفته شد گل حمرا…),
  // proven by the poem's continuation ("Hail, Sufis! lovers of wine" =
  // صلای سرخوشی ای صوفیان باده پرست). The former ghazal-46 pairing was a
  // wrong-poem alignment caught by the Fable 5 adversarial review; Bell never
  // translated ghazal 46.
  ['hafez-bell-1897-p079', 79, 25],
  ['hafez-bell-1897-p080', 80, 11],
  ['hafez-bell-1897-p083', 83, 65],
  ['hafez-bell-1897-p084', 84, 2],
  ['hafez-bell-1897-p087', 87, 134],
  ['hafez-bell-1897-p119', 119, 288],
  ['hafez-bell-1897-p093', 93, 145],
  ['hafez-bell-1897-p073', 73, 90],
  ['hafez-bell-1897-p097', 97, 163],
  ['hafez-bell-1897-p101', 101, 166],
  ['hafez-bell-1897-p102', 102, 101],
  ['hafez-bell-1897-p106', 106, 255],
  ['hafez-bell-1897-p107', 107, 279],
  ['hafez-bell-1897-p108', 108, 164],
  ['hafez-bell-1897-p110', 110, 254],
  ['hafez-bell-1897-p112', 112, 184],
  ['hafez-bell-1897-p113', 113, 103],
  ['hafez-bell-1897-p115', 115, 8],
  ['hafez-bell-1897-p116', 116, 233],
  ['hafez-bell-1897-p121', 121, 169],
  ['hafez-bell-1897-p122', 122, 336],
].map(([bellPoemId, bellPage, ghazalNumber]) => ({
  bellPoemId,
  bellPage,
  ghazalNumber,
})) as readonly HafezProductionSelection[];

export interface RumiProductionSelection {
  readonly segmentId: string;
  readonly persianSequence: number;
}

export const RUMI_PRODUCTION_SELECTION = [
  ['rumi-whinfield-abridged-en-b0171-s2', 29],
  ['rumi-whinfield-abridged-en-b0019-s2', 112],
  ['rumi-whinfield-abridged-en-b0171-s4', 300],
  ['rumi-whinfield-abridged-en-b0161-s2', 306],
  ['rumi-whinfield-abridged-en-b0101-s2', 357],
  ['rumi-whinfield-abridged-en-b0023-s2', 397],
  ['rumi-whinfield-abridged-en-b0169-s2', 418],
  ['rumi-whinfield-abridged-en-b0043-s2', 557],
  ['rumi-whinfield-abridged-en-b0039-s2', 633],
  ['rumi-whinfield-abridged-en-b0137-s2', 643],
  ['rumi-whinfield-abridged-en-b0145-s2', 674],
  ['rumi-whinfield-abridged-en-b0059-s2', 724],
  ['rumi-whinfield-abridged-en-b0061-s2', 812],
  ['rumi-whinfield-abridged-en-b0201-s2', 946],
  ['rumi-whinfield-abridged-en-b0205-s2', 947],
  ['rumi-whinfield-abridged-en-b0055-s2', 959],
].map(([segmentId, persianSequence]) => ({
  segmentId,
  persianSequence,
})) as readonly RumiProductionSelection[];

export interface RumiArchivedSelection extends RumiProductionSelection {
  readonly verdict: 'EXCLUDED';
  readonly archiveReason: string;
}

export const RUMI_ARCHIVED_SELECTION: readonly RumiArchivedSelection[] = [
  {
    segmentId: 'rumi-whinfield-abridged-en-b0089-s2',
    persianSequence: 116,
    verdict: 'EXCLUDED',
    archiveReason:
      'Composite, reordered correspondence across multiple Persian sections creates excessive disclosure burden.',
  },
  {
    segmentId: 'rumi-whinfield-abridged-en-b0217-s2',
    persianSequence: 347,
    verdict: 'EXCLUDED',
    archiveReason:
      'Only three ranking votes and composite correspondence make stronger continuous candidates preferable.',
  },
  {
    segmentId: 'rumi-whinfield-abridged-en-b0225-s2',
    persianSequence: 483,
    verdict: 'EXCLUDED',
    archiveReason:
      'Only three ranking votes and composite correspondence make stronger continuous candidates preferable.',
  },
  {
    segmentId: 'rumi-whinfield-abridged-en-b0225-s8',
    persianSequence: 622,
    verdict: 'EXCLUDED',
    archiveReason:
      'Two ranking votes are the weakest source-identification signal among the 21 verified alignments.',
  },
  {
    segmentId: 'rumi-whinfield-abridged-en-b0031-s1',
    persianSequence: 668,
    verdict: 'EXCLUDED',
    archiveReason:
      'Composite correspondence and prose-summary boundary burden make stronger candidates more suitable.',
  },
];
