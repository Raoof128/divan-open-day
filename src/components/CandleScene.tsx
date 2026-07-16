// Live warmth over the painted candle in the book-stage backdrop. The body
// and flame are part of the approved generated frame; this layer adds only a
// broad, slow-breathing glow and a soft reflected warmth on the table. Broad
// gradients tolerate object-fit cropping, so nothing depends on pixel
// alignment with the painting.
export function CandleScene() {
  return (
    <div className="candle-scene" aria-hidden="true">
      <div className="candle-scene__glow" />
      <div className="candle-scene__reflection" />
    </div>
  );
}
