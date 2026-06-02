// lib/types.ts

export interface ProductSize {
  size: string;
  in_stock: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string; // Postgres often sends decimals as strings
  image_url?: string;     // Primary thumbnail (also image_urls[0])
  image_urls?: string[];  // Full gallery, ordered
  stock_count?: number;

  // Optional UI fields (fallback until added to your DB)
  category?: string;
  metal?: string;
  sizes?: ProductSize[];
  symbol?: string;
  material_tags?: string[]; // e.g. ['titanium', 'surgical-steel', 'gold-plated-hoops']
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  size?: string | null;
  metal?: string;
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

export interface CartItem {
  id: number;
  cartKey: string;
  name: string;
  price: number;
  image_url?: string;
  qty: number;
  size: string | null;
  metal?: string;
}