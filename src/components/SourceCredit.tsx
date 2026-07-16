import type { PublicContentItem } from '../contracts/content';

const CLASSIFICATION_LABELS = {
  society_translation: 'Society translation',
  licensed_translation: 'Licensed translation',
  public_domain_translation: 'Public-domain translation',
  adaptation: 'Adaptation',
} as const;

export interface SourceCreditProps {
  readonly item: PublicContentItem;
}

export function SourceCredit({ item }: SourceCreditProps) {
  return (
    <section aria-labelledby="source-heading">
      <h2 id="source-heading">Source and translation information</h2>
      <dl>
        <dt>Poet</dt>
        <dd>{item.poet === 'hafez' ? 'Hafez' : 'Rumi'}</dd>
        <dt>Work</dt>
        <dd>
          {item.source.workEn} (
          <bdi lang="fa" dir="rtl">
            {item.source.workFa}
          </bdi>
          )
        </dd>
        <dt>Edition reference</dt>
        <dd>
          <bdi>{item.source.reference}</bdi>
        </dd>
        {item.source.openingHemistichFa === null ? null : (
          <>
            <dt>Opening hemistich</dt>
            <dd lang="fa" dir="rtl">
              <bdi>{item.source.openingHemistichFa}</bdi>
            </dd>
          </>
        )}
        <dt>Source edition</dt>
        <dd>{item.source.editionPublicCredit}</dd>
        <dt>Translation classification</dt>
        <dd>{CLASSIFICATION_LABELS[item.translationClassification]}</dd>
        <dt>Translation credit</dt>
        <dd>{item.translationCredit}</dd>
      </dl>
    </section>
  );
}
