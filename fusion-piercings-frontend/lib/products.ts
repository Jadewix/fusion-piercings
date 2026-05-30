import { Product } from './types';

export const PRODUCTS: Product[] = [
  { id: 1,  name: 'Aurora Helix Ring',       category: 'ear',  metal: 'titanium',  price: 34, symbol: '◯', sizes: ['16G', '18G', '20G'] },
  { id: 2,  name: 'Celestine Nose Stud',     category: 'nose', metal: 'gold',      price: 42, symbol: '✦', sizes: ['20G', '18G'] },
  { id: 3,  name: 'Obsidian Industrial Bar', category: 'ear',  metal: 'titanium',  price: 48, symbol: '—', sizes: ['14G'] },
  { id: 4,  name: 'Daith Crystal Clicker',   category: 'ear',  metal: 'gold',      price: 56, symbol: '◈', sizes: ['16G', '14G'] },
  { id: 5,  name: 'Septum Opal Ring',        category: 'nose', metal: 'gold',      price: 45, symbol: '◎', sizes: ['16G', '14G'] },
  { id: 6,  name: 'Conch Shield Stud',       category: 'ear',  metal: 'titanium',  price: 38, symbol: '⟡', sizes: ['16G', '14G'] },
  { id: 7,  name: 'Navel Cascade Bar',       category: 'body', metal: 'gold',      price: 52, symbol: '↓', sizes: ['14G'] },
  { id: 8,  name: 'Tragus Mini Flat-Back',   category: 'ear',  metal: 'titanium',  price: 28, symbol: '·', sizes: ['18G', '16G'] },
  { id: 9,  name: 'Orbital Loop Pair',       category: 'ear',  metal: 'titanium',  price: 44, symbol: '∞', sizes: ['16G', '18G', '20G'] },
  { id: 10, name: 'Rose Gold Starter Set',   category: 'sets', metal: 'rose-gold', price: 89, symbol: '✿', sizes: ['S', 'M', 'L'] },
  { id: 11, name: 'Nostril Twist Stud',      category: 'nose', metal: 'gold',      price: 32, symbol: '❋', sizes: ['20G', '18G'] },
  { id: 12, name: 'Helix Trio Set',          category: 'sets', metal: 'silver',    price: 72, symbol: '⋮', sizes: ['S', 'M', 'L'] },
];

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
