// lib/types.ts

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string; // Postgres often sends decimals as strings
  image_url?: string;     // The real picture from Supabase!
  stock_count?: number;

  // Optional UI fields (fallback until added to your DB)
  category?: string;
  metal?: string;
  sizes?: string[];
  symbol?: string;        // <-- Add this line right here!
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