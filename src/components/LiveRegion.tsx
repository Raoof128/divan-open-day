export interface LiveRegionProps {
  readonly message: string;
}

export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <div className="live-region" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
