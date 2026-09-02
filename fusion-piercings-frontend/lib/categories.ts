// lib/categories.ts
//
// Product categories live in one array column (`products.categories`), but they
// describe two different kinds of thing:
//
//   - PLACEMENTS ('ear', 'nose', …) — where a piece of jewelry is worn.
//   - AFTERCARE  — sprays, saline, cleaning solutions. Not jewelry at all.
//
// Aftercare shares the products table (same cart, same checkout, same admin
// screen) but has none of the jewelry attributes: no metal colour, no
// placement, no bar or gem size. That's why it gets its own storefront section
// and a trimmed-down admin form instead of being another placement chip.

import { Product } from '@/lib/types';

export const AFTERCARE_CATEGORY = 'aftercare';

/** Where a piece of jewelry is worn. Aftercare is deliberately absent. */
export const PLACEMENTS = ['ear', 'nose', 'belly', 'nipple'] as const;

export const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'ear',    label: 'Ear'    },
  { value: 'nose',   label: 'Nose'   },
  { value: 'belly',  label: 'Belly'  },
  { value: 'nipple', label: 'Nipple' },
];

/**
 * Is this an aftercare product?
 *
 * Checks the legacy single `category` alongside `categories[]` because rows
 * written before the multi-category migration only populate the former.
 */
export function isAftercare(
  product?: Pick<Product, 'category' | 'categories'> | null,
): boolean {
  if (!product) return false;
  if (product.categories?.includes(AFTERCARE_CATEGORY)) return true;
  return product.category === AFTERCARE_CATEGORY;
}
