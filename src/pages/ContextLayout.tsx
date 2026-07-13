import type { ReactNode } from 'react';

import { DecorativeGeometry } from '../components/DecorativeGeometry';

export function ContextLayout({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <article className="context-page">
      <a className="return-link" href="/">
        Return to the poetry experience
      </a>
      <div className="context-document">
        <DecorativeGeometry
          className="illuminated-frame__ornament"
          motif="manuscript-corners"
        />
        <h1>{title}</h1>
        {children}
      </div>
    </article>
  );
}
