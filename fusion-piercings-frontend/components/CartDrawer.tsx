'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, cartTotal, updateQty, removeFromCart } = useCart();
  const count  = cart.reduce((s, i) => s + i.qty, 0);
  const needed = 75 - cartTotal;

  // A quick helper to format the metal name cleanly without needing the old dummy data file


  return (
      <>
        {/* Overlay */}
        <div
            className={`fixed inset-0 z-[950] bg-ink/35 backdrop-blur-[4px] transition-opacity duration-300 ${
                isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeCart}
        />

        {/* Drawer */}
        <aside
            className={`fixed top-0 right-0 bottom-0 z-[1000] w-[420px] max-w-full bg-bg-card border-l border-border flex flex-col transition-transform duration-[380ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCartOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            aria-label="Shopping cart"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-6 border-b border-border-lt flex-shrink-0">
            <h3 className="font-serif text-[1.2rem] font-semibold text-ink">
              Your Cart{' '}
              {count > 0 && <span className="font-sans text-[0.8rem] text-ink-3 font-normal">({count})</span>}
            </h3>
            <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-ink/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-7 py-4">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-ink-3">
                  <div className="w-16 h-16 rounded-full border-2 border-border" />
                  <p className="text-sm text-ink-2">Your cart is empty</p>
                  <button
                      onClick={closeCart}
                      className="text-[0.72rem] font-medium tracking-[0.08em] uppercase text-gold-dk border border-gold px-5 py-2 rounded-sm hover:bg-ink hover:text-bg hover:border-ink transition-all"
                  >
                    Browse Collection
                  </button>
                </div>
            ) : (
                <div className="divide-y divide-border-lt">
                  {cart.map(item => (
                      <div key={item.cartKey} className="grid grid-cols-[64px_1fr_auto] gap-3 items-center py-4">

                        {/* Real Image Thumbnail */}
                        <div className="w-16 h-16 rounded-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden bg-gray-50 border border-border-lt">
                          {item.image_url ? (
                              <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                              />
                          ) : (
                              <span className="text-[0.6rem] text-ink-3">No Img</span>
                          )}
                        </div>

                        {/* Details */}
                        <div>
                          <p className="text-[0.85rem] font-medium text-ink mb-0.5">{item.name}</p>
                          <p className="text-[0.72rem] text-ink-3 mb-2 tracking-[0.04em]">
                              {item.size ? `${item.size} · ` : ''}{item.color ? item.color.charAt(0).toUpperCase() + item.color.slice(1) : ''}
                          </p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.cartKey, -1)} className="w-6 h-6 rounded-full bg-border-lt text-ink-2 text-sm flex items-center justify-center hover:bg-ink hover:text-bg transition-all">−</button>
                            <span className="text-[0.82rem] font-medium text-ink min-w-[20px] text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.cartKey,  1)} className="w-6 h-6 rounded-full bg-border-lt text-ink-2 text-sm flex items-center justify-center hover:bg-ink hover:text-bg transition-all">+</button>
                            <button onClick={() => removeFromCart(item.cartKey)} className="w-6 h-6 rounded-full bg-border-lt text-ink-3 text-[0.7rem] flex items-center justify-center hover:bg-ink hover:text-bg transition-all ml-1">✕</button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-[0.9rem] font-bold text-ink">${(item.price * item.qty).toFixed(2)}</div>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
              <div className="px-7 py-5 border-t border-border-lt flex-shrink-0 space-y-3">
                <div className="flex justify-between items-center text-[0.9rem]">
                  <span className="text-ink-2">Subtotal</span>
                  <span className="font-bold text-[1.1rem] text-ink">${cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[0.72rem] text-gold-dk text-center">
                  {needed > 0 ? `Add $${needed.toFixed(2)} more for free shipping` : '✓ You qualify for free shipping!'}
                </p>
                  <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="w-full bg-ink text-bg text-[0.78rem] font-semibold tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-[#2a2620] transition-all flex items-center justify-center text-center mt-4"
                  >
                      Proceed to Checkout
                  </Link>
                <p className="text-[0.68rem] text-ink-3 text-center">Free shipping over $75 · 30-day returns</p>
              </div>
          )}
        </aside>
      </>
  );
}