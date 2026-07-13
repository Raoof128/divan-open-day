import { DecorativeGeometry } from '../components/DecorativeGeometry';

export function BootScene() {
  return (
    <section className="scene scene--boot" data-scene="boot" aria-busy="true">
      <DecorativeGeometry motif="field" />
      <h1 tabIndex={-1} data-focus-target="scene-heading">
        DIVAN
      </h1>
      <svg
        aria-hidden="true"
        className="boot-line"
        focusable="false"
        height="2"
        viewBox="0 0 320 2"
        width="320"
      >
        <path d="M0 1h320" stroke="currentColor" />
      </svg>
      <p>Preparing the poetry experience…</p>
    </section>
  );
}
