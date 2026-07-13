import { ContextLayout } from './ContextLayout';

export function OfflinePage() {
  return (
    <ContextLayout title="When you are offline">
      <p>
        This page cannot confirm network status. If the poetry experience was
        already open and a verified verse is still visible, keep that tab open:
        audio or links may be unavailable, but the text should remain readable.
      </p>
      <section aria-labelledby="offline-recovery">
        <h2 id="offline-recovery">Try these steps</h2>
        <ol>
          <li>
            Return to the open poetry tab instead of repeatedly refreshing.
          </li>
          <li>
            Reconnect to Wi-Fi or mobile data, then try the experience again.
          </li>
          <li>
            Ask the Persian Society stall for the prepared tablet or printed
            sample.
          </li>
        </ol>
      </section>
      <p className="context-note">
        Offline availability depends on an installed, verified release. This
        page does not infer network status or claim that caching is active on
        this device.
      </p>
    </ContextLayout>
  );
}
