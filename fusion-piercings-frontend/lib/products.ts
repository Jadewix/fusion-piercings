export const METAL_GRADIENT: Record<string, { background: string }> = {
  gold:       { background: 'linear-gradient(155deg,#EFE4CC 0%,#DBBF88 45%,#E8D0A0 100%)' },
  titanium:   { background: 'linear-gradient(155deg,#D4E2EE 0%,#AECADE 45%,#C4D8E8 100%)' },
  silver:     { background: 'linear-gradient(155deg,#E8E8E8 0%,#CACACA 45%,#DCDCDC 100%)' },
  'rose-gold':{ background: 'linear-gradient(155deg,#ECD8D0 0%,#D4ACA0 45%,#E4C8C0 100%)' },
};

export const METAL_DOT_GRADIENT: Record<string, string> = {
  gold:       'linear-gradient(135deg,#C8922E,#EDD898)',
  titanium:   'linear-gradient(135deg,#6898B8,#AECADE)',
  both:       'linear-gradient(135deg, #C8922E 0%, #C8922E 50%, #6898B8 50%, #6898B8 100%)',
  silver:     'linear-gradient(135deg,#909090,#D0D0D0)',
  'rose-gold':'linear-gradient(135deg,#C08878,#E4C8C0)',
};

export const METAL_LABELS: Record<string, string> = {
  gold:       'Surgical Steel',
  titanium:   'Titanium',
  both:       'Gold & Titanium',
  silver:     '925 Silver',
  'rose-gold':'Rose Gold Ti.',
};

export const CATEGORIES = ['all', 'ear', 'nose', 'body', 'sets'] as const;
export type Category = typeof CATEGORIES[number];
