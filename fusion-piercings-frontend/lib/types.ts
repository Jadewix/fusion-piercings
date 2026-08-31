// lib/types.ts

// Per-colour override for one size (or gem size). A product available in both
// gold and silver can sell 8mm in silver while gold is sold out, and can price
// the two differently.
//
// `variants` is keyed by colour slug ('gold' | 'silver'). It is optional and
// may be partial: a colour with no entry inherits the size's own `in_stock`
// and `price`, which keeps every pre-existing product row valid with no
// migration. Resolve it through the helpers in lib/variants.ts rather than
// reading the map directly — availability is an AND across three levels
// (colour → size → this override) and it's easy to get wrong by hand.
export interface VariantOverride {
  in_stock: boolean;
  price?: number | null;
}

export type VariantMap = Record<string, VariantOverride>;

export interface ProductSize {
  size: string;
  in_stock: boolean;
  price?: number | null;
  variants?: VariantMap;
}

// Gem size variant, measured in mm (e.g. "2.5"). Optional per product.
export interface ProductGemSize {
  gem_size: string;
  in_stock: boolean;
  price?: number | null;
  variants?: VariantMap;
}

export interface ProductColor {
  color: string;
  in_stock: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  image_url?: string;
  image_urls?: string[];
  stock_count?: number;

  category?: string;
  categories?: string[];
  color?: string;           // <-- Changed from metal to color
  colors?: ProductColor[];
  sizes?: ProductSize[];
  gem_sizes?: ProductGemSize[];
  symbol?: string;
  material_tags?: string[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  size?: string | null;
  gemSize?: string | null;  // gem size in mm
  color?: string;           // <-- Changed from metal to color
  image_url?: string;
}

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  city: string;
  address: string;
  building?: string;
  items: OrderItem[];
  subtotal: number | string;
  delivery_fee: number | string;
  total_amount: number | string;
  status: OrderStatus;
  created_at: string;
}

export interface Collection {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
}

export interface CartItem {
  id: number;
  cartKey: string;
  name: string;
  price: number;
  image_url?: string;
  qty: number;
  size: string | null;
  gemSize?: string | null;  // gem size in mm
  color?: string;           // <-- Changed from metal to color
}