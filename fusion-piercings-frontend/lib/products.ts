// lib/products.ts

export const COLOR_GRADIENT: Record<string, { background: string }> = {
  gold:   { background: 'linear-gradient(155deg,#EFE4CC 0%,#DBBF88 45%,#E8D0A0 100%)' },
  silver: { background: 'linear-gradient(155deg,#E8E8E8 0%,#CACACA 45%,#DCDCDC 100%)' },
  both:   { background: 'linear-gradient(155deg,#EFE4CC 0%,#DBBF88 50%,#CACACA 50%,#DCDCDC 100%)' },
};

export const COLOR_DOT_GRADIENT: Record<string, string> = {
  gold:   'linear-gradient(135deg,#C8922E,#EDD898)',
  silver: 'linear-gradient(135deg,#909090,#D0D0D0)',
  both:   'linear-gradient(135deg, #C8922E 0%, #C8922E 50%, #909090 50%, #909090 100%)',
};

export const COLOR_LABELS: Record<string, string> = {
  gold:   'Gold',
  silver: 'Silver',
  both:   'Both Colors',
};

export const CATEGORIES = ['all', 'ear', 'nose', 'body', 'sets'] as const;
export type Category = typeof CATEGORIES[number];