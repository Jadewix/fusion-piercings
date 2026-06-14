// lib/products.ts

// Canonical color/material values stored in DB: 'gold' (= Surgical Steel finish),
// 'titanium', and 'both'. Legacy 'silver' is mirrored to the titanium visual so
// any old rows still render correctly.
const titaniumDotGradient = 'linear-gradient(135deg,#909090,#D0D0D0)';

export const COLOR_DOT_GRADIENT: Record<string, string> = {
  gold:     'linear-gradient(135deg,#C8922E,#EDD898)',
  titanium: titaniumDotGradient,
  silver:   titaniumDotGradient,
  both:     'linear-gradient(135deg, #C8922E 0%, #C8922E 50%, #909090 50%, #909090 100%)',
};

export const COLOR_LABELS: Record<string, string> = {
  gold:     'Gold',
  silver:   'Silver',
  titanium: 'Silver',
  both:     'Both Colors',
};