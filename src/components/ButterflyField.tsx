// One large amethyst butterfly with a deterministic entrance path that
// settles left of the book and keeps a gentle perpetual hover while reading.
// The contract allows at most two decorative butterflies; this field ships
// exactly one. It stays in the left third, behind the reading column.
export function ButterflyField() {
  return (
    <div className="butterfly-field" aria-hidden="true">
      <svg
        className="butterfly butterfly--amethyst"
        viewBox="0 0 32 24"
        role="presentation"
        focusable="false"
      >
        <g className="butterfly__wing butterfly__wing--left">
          <path
            d="M15 12 C10 2, 2 2, 2 9 C2 15, 9 17, 15 13 Z"
            fill="currentColor"
            opacity="0.92"
          />
          <path
            d="M15 13 C10 20, 4 21, 4 16.5 C4 13.5, 9 12.5, 15 13.5 Z"
            fill="currentColor"
            opacity="0.7"
          />
        </g>
        <g className="butterfly__wing butterfly__wing--right">
          <path
            d="M17 12 C22 2, 30 2, 30 9 C30 15, 23 17, 17 13 Z"
            fill="currentColor"
            opacity="0.92"
          />
          <path
            d="M17 13 C22 20, 28 21, 28 16.5 C28 13.5, 23 12.5, 17 13.5 Z"
            fill="currentColor"
            opacity="0.7"
          />
        </g>
        <ellipse cx="16" cy="12.5" rx="1.4" ry="4.6" fill="currentColor" />
      </svg>
    </div>
  );
}
