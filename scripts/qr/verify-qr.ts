#!/usr/bin/env tsx
/**
 * QR and physical-stall verification (design §25 / §30.9).
 *
 * The QR SVG/PDF generator and the physical scan matrix are a Phase-7
 * deliverable that depends on the final approved short URL (a §31.2 launch
 * gate). No generator exists yet and none may be fabricated, so this check is
 * fail-closed: it reports the open gate and exits non-zero.
 */
console.error(
  'QR verification BLOCKED: the QR generator and physical scan matrix are a pending Phase-7 deliverable and require the final approved short URL (launch gate §31.2). Not satisfied.',
);
process.exit(1);
