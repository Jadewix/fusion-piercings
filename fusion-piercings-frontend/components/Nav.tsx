'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

type Subcat = { label: string; category: string };

const SUBCATEGORIES: Subcat[] = [
  { label: 'Ear',    category: 'ear'    },
  { label: 'Belly',  category: 'belly'  },
  { label: 'Nipple', category: 'nipple' },
  { label: 'Nose',   category: 'nose'   },
];

type ShopCategory = {
  label: string;
  href: string;          // base collection page (also lists "all")
  subcategories?: Subcat[];
};

const SHOP_CATEGORIES: ShopCategory[] = [
  { label: 'Titanium',          href: '/collections/titanium',         subcategories: SUBCATEGORIES },
  { label: 'Surgical Steel',    href: '/collections/surgical-steel',   subcategories: SUBCATEGORIES },
  { label: 'Gold Plated Hoops', href: '/collections/gold-plated-hoops' },
];

const NAV_LINKS = [
  { label: 'Home',             href: '/#home',     hasDropdown: false },
  { label: 'Shop',             href: '/#shop',     hasDropdown: true  },
  { label: 'Care Guide',       href: '/care-guide', hasDropdown: false },
  { label: 'Book Appointment', href: '/book',       hasDropdown: false },
];

export default function Nav() {
  const [scrolled,        setScrolled]        = useState(false);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [mobileShopOpen,  setMobileShopOpen]  = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [activeSection,   setActiveSection]   = useState('home');
  const pathname = usePathname();
  const { cartCount, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== '/') return;
    const ids = ['shop', 'home'];
    const observers: IntersectionObserver[] = [];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-40% 0px -40% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, [pathname]);

  function isActive(href: string) {
    if (!href.startsWith('/#')) return pathname === href;
    if (pathname !== '/') return false;
    const hash = href.replace('/#', '');
    return activeSection === hash;
  }

  const isShopActive =
    isActive('/#shop') ||
    SHOP_CATEGORIES.some(c => pathname.startsWith(c.href));

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[900] transition-all duration-300 ${
      scrolled ? 'bg-bg/95 backdrop-blur-xl border-b border-border' : ''
    }`}>
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-5 flex items-center">

        {/* ── Mobile: hamburger ─────────────────────────────────────── */}
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

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <a
          href="#home"
          className="flex-shrink-0
                     absolute left-1/2 -translate-x-1/2
                     md:static md:translate-x-0 md:mr-auto"
        >
          <img src="/img/Fusion-logo-svg.svg" alt="Fusion Piercings" className="h-8 sm:h-9 w-auto" />
        </a>

        {/* ── Desktop nav links ─────────────────────────────────────── */}
        <ul className="hidden md:flex gap-10 ml-auto">
          {NAV_LINKS.map(({ label, href, hasDropdown }) => {
            const active = hasDropdown ? isShopActive : isActive(href);

            if (!hasDropdown) {
              return (
                <li key={label}>
                  <a
                    href={href}
                    className={`relative text-[0.75rem] font-medium tracking-[0.1em] uppercase hover:text-ink transition-colors duration-200 nav-link-line ${
                      active ? 'text-ink nav-link-active' : 'text-ink-2'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              );
            }

            /* Shop — trigger-only label with hover dropdown */
            return (
              <li key={label} className="relative group">
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`relative flex items-center gap-1 text-[0.75rem] font-medium tracking-[0.1em] uppercase hover:text-ink transition-colors duration-200 nav-link-line cursor-default ${
                    active ? 'text-ink nav-link-active' : 'text-ink-2'
                  }`}
                >
                  {label}
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className="transition-transform duration-200 group-hover:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {/* Primary dropdown panel */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block">
                  <div className="bg-bg border border-border rounded-sm shadow-md min-w-[200px] py-1.5 overflow-visible">
                    {SHOP_CATEGORIES.map(cat => {
                      const catActive = pathname.startsWith(cat.href);

                      if (!cat.subcategories) {
                        return (
                          <a
                            key={cat.href}
                            href={cat.href}
                            className={`block px-5 py-2.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase transition-colors hover:bg-ink/5 hover:text-ink ${
                              catActive ? 'text-ink' : 'text-ink-2'
                            }`}
                          >
                            {cat.label}
                          </a>
                        );
                      }

                      /* Category with submenu — flyout to the right on hover */
                      return (
                        <div key={cat.href} className="relative group/sub">
                          <a
                            href={cat.href}
                            className={`flex items-center justify-between gap-3 px-5 py-2.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase transition-colors hover:bg-ink/5 hover:text-ink ${
                              catActive ? 'text-ink' : 'text-ink-2'
                            }`}
                          >
                            <span>{cat.label}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 6l6 6-6 6"/>
                            </svg>
                          </a>

                          {/* Submenu — flyout */}
                          <div className="absolute top-0 left-full pl-2 hidden group-hover/sub:block">
                            <div className="bg-bg border border-border rounded-sm shadow-md min-w-[160px] py-1.5 overflow-hidden">
                              {cat.subcategories.map(sub => (
                                <a
                                  key={sub.category}
                                  href={`${cat.href}?category=${sub.category}`}
                                  className="block px-5 py-2.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
                                >
                                  {sub.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 ml-auto md:ml-6">
          <button className="hidden md:flex p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-ink/5 transition-all" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

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
          {NAV_LINKS.map(({ label, href, hasDropdown }) => {
            if (!hasDropdown) {
              return (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3.5 text-[0.8rem] font-medium tracking-[0.1em] uppercase hover:text-gold-dk border-b border-border-lt last:border-b-0 transition-colors ${
                    isActive(href) ? 'text-gold-dk' : 'text-ink-2'
                  }`}
                >
                  {label}
                </a>
              );
            }

            /* Shop accordion with nested category accordions */
            return (
              <div key={label} className="border-b border-border-lt">
                <button
                  onClick={() => setMobileShopOpen(v => !v)}
                  className={`w-full flex items-center justify-between py-3.5 text-[0.8rem] font-medium tracking-[0.1em] uppercase transition-colors ${
                    isShopActive ? 'text-gold-dk' : 'text-ink-2 hover:text-gold-dk'
                  }`}
                >
                  {label}
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className={`transition-transform duration-200 ${mobileShopOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {mobileShopOpen && (
                  <div className="pb-2 pl-3">
                    {SHOP_CATEGORIES.map(cat => {
                      if (!cat.subcategories) {
                        return (
                          <a
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block py-2.5 text-[0.74rem] font-medium tracking-[0.1em] uppercase transition-colors border-b border-border-lt last:border-b-0 ${
                              pathname.startsWith(cat.href) ? 'text-gold-dk' : 'text-ink-2 hover:text-gold-dk'
                            }`}
                          >
                            {cat.label}
                          </a>
                        );
                      }

                      const expanded = mobileExpandedCat === cat.href;
                      return (
                        <div key={cat.href} className="border-b border-border-lt last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setMobileExpandedCat(expanded ? null : cat.href)}
                            className={`w-full flex items-center justify-between py-2.5 text-[0.74rem] font-medium tracking-[0.1em] uppercase transition-colors ${
                              pathname.startsWith(cat.href) ? 'text-gold-dk' : 'text-ink-2 hover:text-gold-dk'
                            }`}
                          >
                            {cat.label}
                            <svg
                              width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2"
                              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            >
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>

                          {expanded && (
                            <div className="pb-2 pl-3">
                              <a
                                href={cat.href}
                                onClick={() => setMobileOpen(false)}
                                className="block py-2 text-[0.7rem] font-medium tracking-[0.1em] uppercase text-ink-2 hover:text-gold-dk transition-colors"
                              >
                                All
                              </a>
                              {cat.subcategories.map(sub => (
                                <a
                                  key={sub.category}
                                  href={`${cat.href}?category=${sub.category}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="block py-2 text-[0.7rem] font-medium tracking-[0.1em] uppercase text-ink-2 hover:text-gold-dk transition-colors"
                                >
                                  {sub.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}
