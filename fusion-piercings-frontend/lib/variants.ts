// lib/variants.ts
//
// Parsing and resolution for product variants (colours, bar sizes, gem sizes).
//
// The storefront and the admin modal both need to read the same JSONB the API
// returns, so the coercion lives here rather than being copy-pasted into each.
// Everything is defensive: rows written before a given field existed still
// parse, and the API can hand back numerics as strings.

import { Product, ProductColor, ProductGemSize, ProductSize, VariantMap } from '@/lib/types';

/** Parse a price-ish value. Returns null for blank, missing, or non-numeric. */
function parsePrice(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse a per-colour override map, dropping malformed entries. */
function coerceVariantMap(raw: unknown): VariantMap | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: VariantMap = {};
  for (const [color, value] of Object.entries(raw as Record<string, any>)) {
    if (!color) continue;
    if (value == null || typeof value !== 'object') continue;
    out[String(color)] = {
      in_stock: value.in_stock !== false,
      price: parsePrice(value.price),
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function coerceSizes(raw: unknown): ProductSize[] {
  if (!Array.isArray(raw) || raw.length === 0) return [{ size: 'One Size', in_stock: true, price: null }];
  return raw.map((s: any) => {
    if (typeof s === 'string') return { size: s, in_stock: true, price: null };
    return {
      size: String(s.size),
      in_stock: s.in_stock !== false,
      price: parsePrice(s.price),
      variants: coerceVariantMap(s.variants),
    };
  });
}

// Gem sizes are optional — an empty array means the product has no gem variants
// and no gem-size selector renders.
export function coerceGemSizes(raw: unknown): ProductGemSize[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g: any): ProductGemSize | null => {
      if (typeof g === 'string') return { gem_size: g, in_stock: true, price: null };
      if (!g || g.gem_size == null) return null;
      return {
        gem_size: String(g.gem_size),
        in_stock: g.in_stock !== false,
        price: parsePrice(g.price),
        variants: coerceVariantMap(g.variants),
      };
    })
    .filter((g): g is ProductGemSize => g !== null);
}

// Falls back to the legacy single `color` column for rows predating colors[].
export function coerceColors(raw: unknown, legacyColor?: string): ProductColor[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((c: any) =>
      typeof c === 'string'
        ? { color: c, in_stock: true }
        : { color: String(c.color), in_stock: c.in_stock !== false }
    );
  }
  if (legacyColor === 'both') return [{ color: 'gold', in_stock: true }, { color: 'silver', in_stock: true }];
  if (legacyColor === 'silver' || legacyColor === 'titanium') return [{ color: 'silver', in_stock: true }];
  if (legacyColor === 'gold') return [{ color: 'gold', in_stock: true }];
  return [];
}

/** A size or gem size — both carry the same optional per-colour override map. */
type VariantEntry = { in_stock: boolean; price?: number | null; variants?: VariantMap };

/**
 * Is this size available in `color`?
 *
 * Availability is an AND of two levels: the size's own flag acts as a master
 * switch across every colour, and the per-colour override refines it. A colour
 * with no override entry inherits the size's flag, so untouched products behave
 * exactly as they did before per-colour stock existed.
 *
 * The colour's own in_stock flag is deliberately NOT folded in here — callers
 * combine it via `isColorAvailable`, because a struck-through colour swatch and
 * a struck-through size need to be distinguishable in the UI.
 */
export function isVariantInStock(entry: VariantEntry | undefined, color?: string | null): boolean {
  if (!entry) return false;
  if (!entry.in_stock) return false;
  if (!color) return true;
  const override = entry.variants?.[color];
  return override ? override.in_stock : true;
}

/** Price for this size in `color`, or null to fall through to the next level. */
export function variantPrice(entry: VariantEntry | undefined, color?: string | null): number | null {
  if (!entry) return null;
  if (color) {
    const override = entry.variants?.[color];
    if (override && override.price != null) return override.price;
  }
  return entry.price ?? null;
}

/** Is the colour itself sellable? Unknown colours are treated as available. */
export function isColorAvailable(colors: ProductColor[], color?: string | null): boolean {
  if (!color) return true;
  const entry = colors.find(c => c.color === color);
  return entry ? entry.in_stock : true;
}

/**
 * Resolve the price shown for a selection.
 * Precedence: per-colour gem → gem → per-colour size → size → product base.
 */
export function resolvePrice(
  product: Pick<Product, 'price'>,
  size: ProductSize | undefined,
  gemSize: ProductGemSize | undefined,
  color?: string | null,
): number {
  const gem = variantPrice(gemSize, color);
  if (gem != null) return gem;
  const bar = variantPrice(size, color);
  if (bar != null) return bar;
  const base = Number(product.price);
  return Number.isFinite(base) ? base : 0;
}

/**
 * Is there any buyable combination left? Used for the blanket "Out of Stock"
 * state on the product page and card.
 *
 * A product is sold out when every colour is out, or when no colour has both a
 * sellable bar size and (where the product has them) a sellable gem size.
 */
export function isProductSoldOut(
  colors: ProductColor[],
  sizes: ProductSize[],
  gemSizes: ProductGemSize[],
): boolean {
  // Products with no colours recorded still sell through the size axis alone.
  const palette = colors.length > 0 ? colors.filter(c => c.in_stock).map(c => c.color) : [null];
  if (palette.length === 0) return true;
  return !palette.some(color => {
    const hasSize = sizes.some(s => isVariantInStock(s, color));
    if (!hasSize) return false;
    if (gemSizes.length === 0) return true;
    return gemSizes.some(g => isVariantInStock(g, color));
  });
}
