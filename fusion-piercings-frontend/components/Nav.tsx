'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function Nav() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[900] transition-all duration-300 ${
      scrolled ? 'bg-bg/95 backdrop-blur-xl border-b border-border' : ''
    }`}>
      {/* relative so the absolutely-centred logo has a reference on mobile */}
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-5 flex items-center">

        {/* ── Mobile: hamburger on the left ─────────────────────────── */}
        <button
          className="md:hidden p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-ink/5 transition-all"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* ── Logo — centred on mobile, left-anchored on desktop ────── */}
        <a
          href="#home"
          className="flex flex-col leading-none flex-shrink-0
                     absolute left-1/2 -translate-x-1/2
                     md:static md:translate-x-0 md:mr-auto"
        >
          <span className="text-[1.1rem] font-bold tracking-[0.28em] text-ink">FUSION</span>
          <span className="font-serif italic text-[0.68rem] text-gold tracking-[0.06em] mt-px">Piercings</span>
        </a>

        {/* ── Desktop nav links ─────────────────────────────────────── */}
        <ul className="hidden md:flex gap-10 ml-auto">
          {[
            { label: 'Home',    href: '/#home'    },
            { label: 'Shop',    href: '/#shop'    },
            { label: 'Contact', href: '/contact'  },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="relative text-[0.75rem] font-medium tracking-[0.1em] uppercase text-ink-2 hover:text-ink transition-colors duration-200 nav-link-line"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 ml-auto md:ml-6">
          {/* Search — hidden on mobile to keep the bar uncluttered */}
          <button className="hidden md:flex p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-ink/5 transition-all" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Cart */}
          <button onClick={openCart} className="relative p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-ink/5 transition-all" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-ink text-bg text-[0.58rem] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down menu ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden bg-bg/98 backdrop-blur-xl border-t border-border px-6 pb-4">
          {[
            { label: 'Home',    href: '/#home'   },
            { label: 'Shop',    href: '/#shop'   },
            { label: 'Contact', href: '/contact' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block py-3.5 text-[0.8rem] font-medium tracking-[0.1em] uppercase text-ink-2 hover:text-gold-dk border-b border-border-lt last:border-b-0 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
