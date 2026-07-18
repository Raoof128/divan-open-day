import type { VerifiedRelease } from '../app/runtime';
import { ContextLayout } from './ContextLayout';

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].toSorted();
}
function CreditList({ values }: { readonly values: readonly string[] }) {
  return (
    <ul className="credits-list">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  );
}

export function CreditsPage({
  release,
}: {
  readonly release: VerifiedRelease | null;
}) {
  const editions = unique(
    release?.corpus.items.map((item) => item.source.editionPublicCredit) ?? [],
  );
  const translations = unique(
    release?.corpus.items.map((item) => item.translationCredit) ?? [],
  );
  const performers = unique(
    release?.corpus.items.flatMap((item) =>
      item.audio === null ? [] : [item.audio.performerCredit],
    ) ?? [],
  );

  return (
    <ContextLayout title="Credits and sources">
      {release?.descriptor.buildProfile === 'fixture' ? (
        <p className="context-note">
          This is a non-production fixture release. Its TEST ONLY credits are
          synthetic test data, not evidence of publication permission or final
          cultural review.
        </p>
      ) : null}

      <section aria-labelledby="release-details">
        <h2 id="release-details">Release details</h2>
        {release === null ? (
          <p>Verified release details are not available on this device.</p>
        ) : (
          <dl className="release-facts">
            <dt>Release ID</dt>
            <dd>{release.descriptor.releaseId}</dd>
            <dt>Build date</dt>
            <dd>
              <time dateTime={release.descriptor.builtAt}>
                {release.descriptor.builtAt.slice(0, 10)}
              </time>
            </dd>
            <dt>Content checksum</dt>
            <dd>
              <code>{release.descriptor.contentSha256}</code>
            </dd>
          </dl>
        )}
      </section>

      <section aria-labelledby="source-editions">
        <h2 id="source-editions">Source editions</h2>
        {editions.length === 0 ? (
          <p>No verified public edition credits are available.</p>
        ) : (
          <CreditList values={editions} />
        )}
      </section>

      <section aria-labelledby="translation-credits">
        <h2 id="translation-credits">Translation and adaptation credits</h2>
        {translations.length === 0 ? (
          <p>No verified public translation credits are available.</p>
        ) : (
          <CreditList values={translations} />
        )}
      </section>

      {performers.length === 0 ? null : (
        <section aria-labelledby="recitation-credits">
          <h2 id="recitation-credits">Recitation credits</h2>
          <CreditList values={performers} />
        </section>
      )}

      <section aria-labelledby="font-credits">
        <h2 id="font-credits">Fonts</h2>
        <ul className="credits-list">
          <li>
            Cormorant Garamond — Fontsource 5.2.11, SIL Open Font License 1.1
          </li>
          <li>Inter — Fontsource 5.2.8, SIL Open Font License 1.1</li>
          <li>Vazirmatn — Fontsource 5.2.8, SIL Open Font License 1.1</li>
          <li>
            Noto Nastaliq Urdu — Fontsource 5.2.8, SIL Open Font License 1.1
          </li>
        </ul>
      </section>

      <section aria-labelledby="society-credit">
        <h2 id="society-credit">Made by</h2>
        <p>
          This project is made by the Macquarie Persian Society — with love, for
          everyone.
        </p>
      </section>

      <section aria-labelledby="design-credit">
        <h2 id="design-credit">Design and development</h2>
        <p>
          Original DIVAN interface geometry and implementation by project design
          and development contributors. No museum image, copied calligraphy,
          University mark, or third-party decorative artwork is used in this
          release.
        </p>
      </section>

      <p>
        Named reviewers, personal contacts, and production permissions appear
        only when their approved public records are present. None are invented
        here.
      </p>
    </ContextLayout>
  );
}
