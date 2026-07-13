export const POETS = ['hafez', 'rumi'] as const;
export type Poet = (typeof POETS)[number];

export const EXPERIENCE_MODES = [
  'open_the_divan',
  'moment_of_reflection',
] as const;
export type ExperienceMode = (typeof EXPERIENCE_MODES)[number];

export const TRANSLATION_CLASSIFICATIONS = [
  'society_translation',
  'licensed_translation',
  'adaptation',
] as const;
export type TranslationClassification =
  (typeof TRANSLATION_CLASSIFICATIONS)[number];

export type TextAlignment = 'line' | 'stanza';
export type VisualVariant = 'garden_night' | 'lamp_constellation';
export type Accent = 'pomegranate' | 'lapis';

export interface PublicSource {
  readonly workEn: string;
  readonly workFa: string;
  readonly editionPublicCredit: string;
  readonly reference: string;
  readonly openingHemistichFa: string | null;
}

export interface PublicText {
  readonly persianLines: readonly string[];
  readonly englishLines: readonly string[];
  readonly alignment: TextAlignment;
}

export interface PublicAudio {
  readonly assetPath: string;
  readonly mimeType: 'audio/mpeg' | 'audio/ogg';
  readonly durationSeconds: number;
  readonly performerCredit: string;
}

export interface PublicContentItem {
  readonly id: string;
  readonly schemaVersion: 2;
  readonly poet: Poet;
  readonly mode: ExperienceMode;
  readonly display: {
    readonly visualVariant: VisualVariant;
    readonly accent: Accent;
  };
  readonly source: PublicSource;
  readonly text: PublicText;
  readonly translationClassification: TranslationClassification;
  readonly translationCredit: string;
  readonly reflection: string;
  readonly audio: PublicAudio | null;
  readonly contentHash: string;
}
