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