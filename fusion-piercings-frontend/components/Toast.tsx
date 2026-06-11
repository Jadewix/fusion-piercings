'use client';
import { useCart } from '@/context/CartContext';

export default function Toast() {
  const { toast } = useCart();
  const visible = !!toast;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
      }`}
      style={{
        transitionTimingFunction: visible
          ? 'cubic-bezier(0.34, 1.5, 0.64, 1)'
          : 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex items-center gap-2.5 bg-ink text-bg pl-2.5 pr-5 py-2 rounded-full shadow-xl whitespace-nowrap">
        <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-300 flex items-center justify-center flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-xs font-semibold tracking-wide">{toast || ' '}</span>
      </div>
    </div>
  );
}
