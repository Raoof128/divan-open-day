import { ContextLayout } from './ContextLayout';

export function AccessibilityPage() {
  return (
    <ContextLayout title="Accessibility">
      <p>
        DIVAN is designed for keyboard, touch, screen-reader, zoom, and
        reduced-motion use. The English translation appears before the live
        Persian text; Persian passages carry their own language and
        right-to-left direction.
      </p>
      <section aria-labelledby="access-keyboard">
        <h2 id="access-keyboard">Keyboard and focus</h2>
        <p>
          Use Tab and Shift+Tab to move between controls, Enter or Space to
          activate buttons, and the first focusable link to skip to the active
          content. Focus moves to the result heading only when the verse is
          ready. No step has a time limit.
        </p>
      </section>
      <section aria-labelledby="access-motion">
        <h2 id="access-motion">Motion</h2>
        <p>
          The Motion menu offers System preference, Reduced, and Full. Reduced
          removes rotation, parallax, path drawing, particles, and continuous
          movement while keeping a short opacity reveal.
        </p>
      </section>
      <section aria-labelledby="access-audio">
        <h2 id="access-audio">Audio and text</h2>
        <p>
          Recitation is optional, starts only when requested, and uses native
          browser controls. The visible Persian poem is the transcript. A
          failed recording never removes the poem or its actions.
        </p>
      </section>
      <section aria-labelledby="access-gates">
        <h2 id="access-gates">Testing still required</h2>
        <p>
          Automated checks support but do not establish WCAG conformance.
          Public launch still requires recorded VoiceOver and TalkBack flows,
          Persian pronunciation review, Safari/Chrome/Firefox/Edge coverage,
          physical-device zoom and orientation checks, measured contrast, and
          a manual focus-order review.
        </p>
      </section>
    </ContextLayout>
  );
}
