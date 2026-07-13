import type { MouseEvent } from 'react';

import { focusMainRegion } from '../lib/accessibility/focus';

export function SkipLink() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    focusMainRegion('main-content');
  };

  return (
    <a className="skip-link" href="#main-content" onClick={handleClick}>
      Skip to main content
    </a>
  );
}
