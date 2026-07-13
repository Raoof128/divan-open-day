import type { ReactNode } from 'react';

import { DecorativeGeometry } from './DecorativeGeometry';

export function ManuscriptPortal({ children }: { readonly children: ReactNode }) {
  return (
    <div className="manuscript-portal">
      <DecorativeGeometry
        className="manuscript-portal__corners"
        motif="manuscript-corners"
      />
      <div className="manuscript-portal__content">{children}</div>
    </div>
  );
}
