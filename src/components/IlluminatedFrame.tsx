import type { ReactNode } from 'react';

import { DecorativeGeometry } from './DecorativeGeometry';

export function IlluminatedFrame({ children }: { readonly children: ReactNode }) {
  return (
    <div className="illuminated-frame">
      <DecorativeGeometry
        className="illuminated-frame__ornament"
        motif="manuscript-corners"
      />
      {children}
    </div>
  );
}
