import type { VerifiedRelease } from '../app/runtime';
import { AboutPage } from './AboutPage';
import { AccessibilityPage } from './AccessibilityPage';
import { CreditsPage } from './CreditsPage';
import { OfflinePage } from './OfflinePage';
import { PrivacyPage } from './PrivacyPage';
import type { ContextRoute } from './routes';

export function ContextPage({
  route,
  release,
}: {
  readonly route: ContextRoute;
  readonly release: VerifiedRelease | null;
}) {
  switch (route) {
    case '/about':
      return <AboutPage />;
    case '/credits':
      return <CreditsPage release={release} />;
    case '/accessibility':
      return <AccessibilityPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/offline':
      return <OfflinePage />;
  }
}
