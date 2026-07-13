export type DivanMotif =
  'field' | 'manuscript-corners' | 'pomegranate-cypress' | 'reed-rosette';

export interface DecorativeGeometryProps {
  readonly motif: DivanMotif;
  readonly className?: string;
}
function FieldGeometry() {
  return (
    <>
      <path d="M400 56 456 112 400 168 344 112Z" />
      <path d="m400 72 40 40-40 40-40-40Z" />
      <circle cx="400" cy="112" r="12" />
      <path d="M104 420 160 476 104 532 48 476ZM696 420l56 56-56 56-56-56Z" />
      <path d="M160 476h480M400 168v270" />
      <circle cx="400" cy="438" r="82" />
      <circle cx="400" cy="438" r="52" />
      <path d="m400 356 24 58 58 24-58 24-24 58-24-58-58-24 58-24Z" />
    </>
  );
}

function ManuscriptCorners() {
  return (
    <>
      <path d="M10 72V10h62M190 72V10h-62M10 128v62h62M190 128v62h-62" />
      <path d="M10 42 42 10M190 42l-32-32M10 158l32 32M190 158l-32 32" />
      <path d="m42 42 20-8 8-20 8 20 20 8-20 8-8 20-8-20ZM158 42l-20-8-8-20-8 20-20 8 20 8 8 20 8-20ZM42 158l20 8 8 20 8-20 20-8-20-8-8-20-8 20ZM158 158l-20 8-8 20-8-20-20-8 20-8 8-20 8 20Z" />
    </>
  );
}

function PomegranateCypress() {
  return (
    <>
      <path d="M100 18c-8 18-30 26-30 52 0 22 13 40 30 40s30-18 30-40c0-26-22-34-30-52Z" />
      <path d="M92 25 100 8l8 17M100 110v72" />
      <path d="M100 42c-18 12-26 34-24 58M100 42c18 12 26 34 24 58" />
      <circle cx="88" cy="72" r="3" />
      <circle cx="100" cy="66" r="3" />
      <circle cx="112" cy="72" r="3" />
      <path d="M32 182c18-22 28-48 28-78 0-31-10-58-28-82-18 24-28 51-28 82 0 30 10 56 28 78Z" />
      <path d="M32 42v140M168 182c18-22 28-48 28-78 0-31-10-58-28-82-18 24-28 51-28 82 0 30 10 56 28 78Z" />
      <path d="M168 42v140" />
    </>
  );
}

function ReedRosette() {
  return (
    <>
      <circle cx="100" cy="100" r="72" />
      <circle cx="100" cy="100" r="42" />
      <path d="m100 28 17 55 55 17-55 17-17 55-17-55-55-17 55-17Z" />
      <path d="m49 49 41 31 10-52 10 52 41-31-31 41 52 10-52 10 31 41-41-31-10 52-10-52-41 31 31-41-52-10 52-10Z" />
      <path d="M28 180c24-36 30-76 18-120M172 180c-24-36-30-76-18-120" />
      <circle cx="28" cy="36" r="3" />
      <circle cx="172" cy="44" r="3" />
      <circle cx="154" cy="22" r="2" />
    </>
  );
}

export function DecorativeGeometry({
  motif,
  className = '',
}: DecorativeGeometryProps) {
  const isField = motif === 'field';
  return (
    <svg
      aria-hidden="true"
      className={`${isField ? 'geometric-field' : 'geometry-motif'} ${className}`.trim()}
      data-divan-geometry="original"
      data-motif={motif}
      focusable="false"
      height={isField ? 600 : 200}
      preserveAspectRatio={isField ? 'xMidYMid slice' : 'xMidYMid meet'}
      viewBox={isField ? '0 0 800 600' : '0 0 200 200'}
      width={isField ? 800 : 200}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isField ? 1 : 2}
      >
        {motif === 'field' ? <FieldGeometry /> : null}
        {motif === 'manuscript-corners' ? <ManuscriptCorners /> : null}
        {motif === 'pomegranate-cypress' ? <PomegranateCypress /> : null}
        {motif === 'reed-rosette' ? <ReedRosette /> : null}
      </g>
    </svg>
  );
}
