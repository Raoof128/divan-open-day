import { ContextLayout } from './ContextLayout';

const SESSION_KEYS = [
  ['divan.releaseId', 'the public release identifier'],
  ['divan.selectedPoet', 'Hafez or Rumi'],
  ['divan.shuffle.hafez', 'remaining public Hafez item identifiers'],
  ['divan.shuffle.rumi', 'remaining public Rumi item identifiers'],
  ['divan.currentPoemId', 'the current public poem identifier'],
] as const;

export function PrivacyPage() {
  return (
    <ContextLayout title="Privacy">
      <p>
        This poetry experience does not ask for your name, email or student
        details. It uses no advertising, analytics or tracking cookies. Your
        poem selection is handled on your device and is not saved by the
        Society. Cloudflare and DigitalOcean may process limited technical
        network information needed to deliver and protect the website under
        their configured service settings.
      </p>
      <section aria-labelledby="privacy-storage">
        <h2 id="privacy-storage">What stays in this browser</h2>
        <p>Session storage contains only public release and content identifiers:</p>
        <dl>
          {SESSION_KEYS.map(([key, purpose]) => (
            <div key={key}>
              <dt><code>{key}</code></dt>
              <dd>{purpose}</dd>
            </div>
          ))}
        </dl>
        <p>
          Local storage contains only <code>divan.motionPreference</code>, your
          choice of System preference, Reduced, or Full. These values are not
          transmitted by the application. No visitor intention is collected or
          stored.
        </p>
      </section>
      <section aria-labelledby="privacy-cache">
        <h2 id="privacy-cache">Offline files</h2>
        <p>
          When reviewed offline support is available, its service worker may
          store only public application and poetry files in browser Cache
          Storage. It does not create a visitor record. This notice does not
          claim that caching is active on this device; offline readiness must
          come from the verified application state.
        </p>
      </section>
      <section aria-labelledby="privacy-network">
        <h2 id="privacy-network">Network boundary</h2>
        <p>
          DIVAN has no account, form, runtime write API, visitor database,
          social SDK, analytics endpoint, or public administration path.
          Provider logging fields, access, and retention remain an explicit
          operational review gate rather than a zero-logging claim.
        </p>
      </section>
    </ContextLayout>
  );
}
