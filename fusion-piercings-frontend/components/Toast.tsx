'use client';
import { useCart } from '@/context/CartContext';

export default function Toast() {
  const { toast } = useCart();
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-ink text-bg px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide shadow-xl z-[9999] pointer-events-none whitespace-nowrap transition-all duration-300 ${
        toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {toast}
    </div>
  );
}
