// Abstract manuscript motes: a handful of gold specks and paper fibres
// drifting slowly in the candle warmth. Purely decorative, never glyphs or
// pseudo-language, and confined to the right margin of the stage.
const MOTE_COUNT = 6;

export function PoetryMotes() {
  return (
    <div className="poetry-motes" aria-hidden="true">
      {Array.from({ length: MOTE_COUNT }, (_, index) => (
        <span
          key={index}
          className={`poetry-mote poetry-mote--${String(index + 1)}`}
        />
      ))}
    </div>
  );
}
