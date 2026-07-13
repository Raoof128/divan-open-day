import { ContextLayout } from './ContextLayout';

export function AboutPage() {
  return (
    <ContextLayout title="About this experience">
      <p>
        DIVAN is a bilingual encounter with Persian poetry. It offers a short,
        reviewed passage and space to reflect; it does not tell the future or
        prescribe what anyone should do.
      </p>

      <section aria-labelledby="about-hafez">
        <h2 id="about-hafez">Fāl-e Hafez</h2>
        <p>
          Opening the Divan is inspired by the Iranian tradition of opening the
          poetry of Hafez while holding a question or hope in mind. Practices
          differ across families and communities. This experience honours that
          living tradition without claiming to reproduce every ritual or give
          one fixed meaning to an ambiguous ghazal.
        </p>
      </section>

      <section aria-labelledby="about-rumi">
        <h2 id="about-rumi">A Rumi reflection</h2>
        <p>
          The Rumi path is a separate moment of literary contemplation, not a
          traditional “Fāl-e Rumi”. Passages retain their Persian, historical,
          literary, and relevant Islamic or Sufi context rather than becoming
          anonymous motivational quotations.
        </p>
      </section>

      <section aria-labelledby="about-text">
        <h2 id="about-text">Source, translation, adaptation, reflection</h2>
        <p>
          The source is the traceable Persian work and edition. A translation
          interprets that text in another language; an adaptation takes a more
          openly interpretive form. The reflection is newly reviewed commentary
          labelled as neither poem nor prediction. Every translation is an
          interpretation, so the Persian original and edition reference remain
          visible beside it.
        </p>
      </section>

      <p className="context-note">
        Everyone is welcome to experience the poetry and meet the Persian
        Society team at the stall. No ethnicity, language background, or prior
        knowledge is required.
      </p>
      <nav className="context-links" aria-label="Related information">
        <a href="/credits">Credits and sources</a>
        <a href="/privacy">Privacy</a>
      </nav>
    </ContextLayout>
  );
}
