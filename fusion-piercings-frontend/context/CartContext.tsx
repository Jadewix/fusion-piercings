// context/CartContext.tsx
'use client';

import { createContext, useContext, useReducer, useEffect, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';

type Action =
    | { type: 'LOAD'; items: CartItem[] }
    | { type: 'ADD';  item: CartItem }
    | { type: 'REMOVE'; cartKey: string }
    | { type: 'UPDATE_QTY'; cartKey: string; delta: number }
    | { type: 'CLEAR' };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'LOAD': return action.items;
    case 'ADD': {
      const existing = state.find(i => i.cartKey === action.item.cartKey);
      if (existing) return state.map(i => i.cartKey === action.item.cartKey ? { ...i, qty: i.qty + 1 } : i);
      return [...state, action.item];
    }
    case 'REMOVE':      return state.filter(i => i.cartKey !== action.cartKey);
    case 'UPDATE_QTY':
      return state.map(i => i.cartKey === action.cartKey ? { ...i, qty: i.qty + action.delta } : i).filter(i => i.qty > 0);
    case 'CLEAR': return [];
    default: return state;
  }
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string | null, colorOverride?: string, priceOverride?: number | null) => void;
  removeFromCart: (cartKey: string) => void;
  updateQty: (cartKey: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toast: string;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, []);
  const [isCartOpen, setIsCartOpen]   = useState(false);
  const [toast, setToast]             = useState('');

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fp_cart');
      if (saved) dispatch({ type: 'LOAD', items: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('fp_cart', JSON.stringify(cart));
  }, [cart]);

  // Block body scroll when cart open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
  }, [isCartOpen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);

  const addToCart = useCallback((product: Product, size: string | null, colorOverride?: string, priceOverride?: number | null) => {
    // Use the override (for "both" products) or the product's color
    const color = colorOverride || product.color || 'gold';
    const cartKey = `${product.id}-${size ?? 'default'}-${color}`;

    // Per-size price override takes precedence; otherwise parse the base price safely
    // (Postgres can send numerics as strings).
    const basePrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const safePrice = priceOverride != null && Number.isFinite(priceOverride) ? priceOverride : basePrice;

    dispatch({
      type: 'ADD',
      item: {
        id: product.id,
        cartKey,
        name: product.name,
        color,
        price: safePrice,
        image_url: product.image_url,
        size,
        qty: 1
      },
    });
    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const removeFromCart = useCallback((cartKey: string) => dispatch({ type: 'REMOVE', cartKey }), []);
  const updateQty      = useCallback((cartKey: string, delta: number) => dispatch({ type: 'UPDATE_QTY', cartKey, delta }), []);
  const clearCart      = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return (
      <CartContext.Provider value={{
        cart, addToCart, removeFromCart, updateQty, clearCart,
        cartCount: cart.reduce((s, i) => s + i.qty, 0),
        cartTotal: cart.reduce((s, i) => s + i.price * i.qty, 0),
        isCartOpen,
        openCart:  () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toast,
      }}>
        {children}
      </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}