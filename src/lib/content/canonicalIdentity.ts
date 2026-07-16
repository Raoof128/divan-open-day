import type { AuthoringContentItem } from './authoringSchema';
import { canonicalSha256 } from './canonical';

/**
 * Bind Hafez to one canonical ghazal and Rumi to one exact Persian span.
 * Rumi section labels can cover long passages, so the selected-span digest is
 * part of the identity and prevents two microrecords from claiming one source.
 */
export function canonicalPersianIdentity(item: AuthoringContentItem): string {
  const reference = `${item.source.reference_type}:${item.source.reference_value
    .trim()
    .toLowerCase()}`;

  if (item.poet === 'hafez') {
    return `${item.source.edition_id}:${reference}`;
  }

  return `${item.source.edition_id}:${reference}:${canonicalSha256(
    item.text.persian_lines,
  )}`;
}
