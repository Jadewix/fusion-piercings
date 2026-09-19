// lib/promo.ts
//
// Promo codes at checkout.
//
// The owner creates codes in the admin dashboard, each worth a whole-number
// percentage off the item subtotal (never the delivery fee). The server checks
// the code again when the order is placed and prices it with this same rule in
// fusion-piercings-backend/server.js — its answer is the one that's charged. If
// you change the rounding here, change it there too, or orders get rejected.

/** A code the shopper has applied, as confirmed by the server. */
export interface AppliedPromo {
  code: string;
  percent: number;
}

/** Dollar discount for a percentage off, rounded to cents. */
export function calcDiscount(subtotal: number, percent: number): number {
  return Math.round(subtotal * percent) / 100;
}
