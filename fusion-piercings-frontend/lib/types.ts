// lib/types.ts

export interface ProductSize {
  size: string;
  in_stock: boolean;
  price?: number | null;
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
  symbol?: string;
  material_tags?: string[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  size?: string | null;
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
  color?: string;           // <-- Changed from metal to color
}