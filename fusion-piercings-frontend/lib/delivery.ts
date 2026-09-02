// lib/delivery.ts
//
// Delivery pricing for checkout.
//
// The server runs this same rule in fusion-piercings-backend/server.js and its
// answer is the one that's charged — this copy exists so the order summary can
// show the right number before the request is sent. The two live in separate
// deploys, so if you change a number here, change it there too.

/** Free delivery everywhere once the subtotal reaches this. */
export const FREE_DELIVERY_THRESHOLD = 75;

/** Flat fee below the threshold, outside the free-delivery towns. */
export const STANDARD_DELIVERY_FEE = 3;

/** The studio's own town — always free, at any order value. */
export const FREE_DELIVERY_CITY = 'Zgharta';

/**
 * The options in the checkout city picker.
 *
 * `custom` marks the catch-all that reveals a text box, so the owner still
 * learns which town to deliver to instead of just seeing "Other" on the order.
 */
export const DELIVERY_CITIES: { value: string; label: string; custom?: boolean }[] = [
  { value: FREE_DELIVERY_CITY, label: `${FREE_DELIVERY_CITY} — free delivery` },
  { value: 'other',            label: 'Other city',                custom: true },
];

// Spelling variants, normalised. The picker only ever sends the exact value
// above; this set is the safety net for orders placed from an older client or
// typed by hand.
const FREE_DELIVERY_KEYS = new Set(['zgharta', 'zghorta', 'zgarta', 'zghartaa', 'زغرتا']);

/**
 * Reduce a city to a comparison key. Matching is exact rather than
 * substring-based — a loose match would waive the fee for any address that
 * merely mentions Zgharta.
 */
function normaliseCity(city: string): string {
  const lower = String(city || '').trim().toLowerCase();
  // NFD splits accents into combining marks; dropping every non a-z character
  // then removes those marks along with spaces and punctuation.
  const latin = lower.normalize('NFD').replace(/[^a-z]/g, '');
  // Non-Latin input (Arabic) leaves nothing behind — match it as typed.
  return latin || lower;
}

/** Does this city get free delivery regardless of order value? */
export function isFreeDeliveryCity(city: string): boolean {
  return FREE_DELIVERY_KEYS.has(normaliseCity(city));
}

/** The delivery fee for an order. Zgharta is always free. */
export function calcDeliveryFee(city: string, subtotal: number): number {
  if (isFreeDeliveryCity(city)) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}
