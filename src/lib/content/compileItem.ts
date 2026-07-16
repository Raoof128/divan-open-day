import type { PublicContentItem } from '../../contracts/content';
import { authoringContentItemSchema } from './authoringSchema';
import { canonicalSha256 } from './canonical';
import {
  publicContentItemSchema,
  publicContentPayloadSchema,
} from './publicSchema';

export function compileItem(input: unknown): PublicContentItem {
  const authoringItem = authoringContentItemSchema.parse(input);
  if (authoringItem.status !== 'approved') {
    throw new Error('Only approved authoring records can be compiled.');
  }

  // Every public field is copied deliberately so private review and rights
  // metadata cannot leak through object spreading.
  const payload = publicContentPayloadSchema.parse({
    id: authoringItem.id,
    schemaVersion: authoringItem.schema_version,
    poet: authoringItem.poet,
    mode: authoringItem.mode,
    display: {
      visualVariant: authoringItem.display.visual_variant,
      accent: authoringItem.display.accent,
    },
    source: {
      workEn: authoringItem.source.work_en,
      workFa: authoringItem.source.work_fa,
      editionPublicCredit: authoringItem.source.edition_public_credit,
      reference: authoringItem.source.reference_value,
      openingHemistichFa: authoringItem.source.opening_hemistich_fa,
    },
    text: {
      persianLines: authoringItem.text.persian_lines,
      englishLines: authoringItem.text.english_lines,
      alignment: authoringItem.text.alignment,
    },
    translationClassification: authoringItem.translation.classification,
    translationCredit: authoringItem.translation.public_credit,
    reflection: authoringItem.reflection?.english ?? null,
    verificationStatus:
      authoringItem.review_authority.kind === 'machine_alignment'
        ? authoringItem.review_authority.verdict
        : 'HUMAN_ATTESTED',
    disclosures:
      authoringItem.review_authority.kind === 'machine_alignment'
        ? authoringItem.review_authority.disclosures
        : [],
    audio: authoringItem.audio.enabled
      ? {
          assetPath: authoringItem.audio.asset_path,
          mimeType: authoringItem.audio.mime_type,
          durationSeconds: authoringItem.audio.duration_seconds,
          performerCredit: authoringItem.audio.performer_public_credit,
        }
      : null,
  });

  return publicContentItemSchema.parse({
    id: payload.id,
    schemaVersion: payload.schemaVersion,
    poet: payload.poet,
    mode: payload.mode,
    display: payload.display,
    source: payload.source,
    text: payload.text,
    translationClassification: payload.translationClassification,
    translationCredit: payload.translationCredit,
    reflection: payload.reflection,
    verificationStatus: payload.verificationStatus,
    disclosures: payload.disclosures,
    audio: payload.audio,
    contentHash: canonicalSha256(payload),
  });
}
