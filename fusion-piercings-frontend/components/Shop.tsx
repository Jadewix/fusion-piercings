'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/types';
import { METAL_DOT_GRADIENT } from '@/lib/products';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import ProductCard from './ProductCard';

const PLACEMENTS = ['all', 'ear', 'nose', 'belly'];
const PAGE_SIZE = 20;

const METALS = [
  {
    key:         'all',
    label:       'All Metals',
    description: 'Gold & Titanium',
    activeBg:    '#F5F4F2',
    activeBorder:'#1a1a1a',
    activeText:  '#1a1a1a',
    orb:         'linear-gradient(135deg, #C8922E 0%, #C8922E 50%, #6898B8 50%, #6898B8 100%)',
  },
  {
    key:         'gold',
    label:       'Gold Plated Surgical Steel',
    description: 'Gold plated · Hypoallergenic',
    activeBg:    '#FBF7EF',
    activeBorder:'#C8922E',
    activeText:  '#8A6030',
    orb:         null,
  },
  {
    key:         'titanium',
    label:       'Titanium',
    description: 'Implant grade · Lightweight',
    activeBg:    '#F0F5FA',
    activeBorder:'#6898B8',
    activeText:  '#3A6888',
    orb:         null,
  },
];

interface PageMeta {
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Props {
  onOpenModal: (product: Product) => void;
}

/* Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 12 */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

/* Placeholder card shown while a page is loading */
function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border-lt rounded-sm overflow-hidden">
      <div className="aspect-square bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-2 w-1/3 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse mt-3" />
      </div>
    </div>
  );
}

export default function Shop({ onOpenModal }: Props) {
  const [activeMetal, setActiveMetal]       = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage]                     = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta]         = useState<PageMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bump to retry after an error

  const isOnline = useOnlineStatus();
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch a page of products whenever the filters or page change.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          page:     String(page),
          limit:    String(PAGE_SIZE),
          metal:    activeMetal,
          category: activeCategory,
        });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();

        setProducts(data.products || []);
        setMeta({
          total:       data.total,
          page:        data.page,
          totalPages:  data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage,
        });
        // If the server clamped the page (e.g. a filter shrank the result set),
        // sync our local page so the controls stay accurate.
        if (data.page && data.page !== page) setPage(data.page);
      } catch (err: any) {
        if (err.name === 'AbortError') return; // superseded by a newer request
        console.error('Error fetching live products:', err);
        setError(true);
        setProducts([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [activeMetal, activeCategory, page, reloadKey]);

  // Switching metal resets placement + page so the grid is never empty on first click
  const handleMetalChange = (metal: string) => {
    setActiveMetal(metal);
    setActiveCategory('all');
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const goToPage = (p: number) => {
    if (p < 1 || (meta && p > meta.totalPages) || p === page) return;
    setPage(p);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isInitialLoad = loading && products.length === 0;

  return (
    <section id="shop" ref={sectionRef} className="py-24 bg-bg scroll-mt-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
            The Collection
          </span>
          <h2 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-ink">
            Shop the Collection
          </h2>
        </div>

        {/* ── Step 1: Metal selector ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-2xl">
          {METALS.map(metal => {
            const isActive = activeMetal === metal.key;
            const orbBg    = metal.orb ?? (METAL_DOT_GRADIENT as any)[metal.key];
            return (
              <button
                key={metal.key}
                onClick={() => handleMetalChange(metal.key)}
                style={isActive ? { background: metal.activeBg, borderColor: metal.activeBorder } : {}}
                className={`flex items-center gap-2 sm:gap-3 px-2.5 py-3.5 sm:px-6 sm:py-5 rounded-sm border-2 text-left transition-all duration-200 ${
                  isActive
                    ? 'shadow-sm'
                    : 'border-border-lt bg-bg-card hover:border-border hover:shadow-sm'
                }`}
              >
                <span
                  className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex-shrink-0"
                  style={{ background: orbBg }}
                />
                <div className="min-w-0">
                  <p
                    className="text-[0.78rem] sm:text-[0.95rem] font-semibold font-sans sm:font-serif leading-tight tracking-tight sm:tracking-normal"
                    style={isActive ? { color: metal.activeText } : { color: 'var(--color-ink)' }}
                  >
                    {metal.label}
                  </p>
                  <p className="text-[0.62rem] sm:text-[0.68rem] text-ink-3 mt-0.5 font-light hidden sm:block">
                    {metal.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Step 2: Placement sub-filter ───────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-2 mb-12"
          role="group"
          aria-label="Filter by placement"
        >
          <span className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-ink-3 mr-1 shrink-0">
            Placement
          </span>
          {PLACEMENTS.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-5 py-1.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase rounded-full border transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-ink border-ink text-bg'
                  : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Product grid / states ───────────────────────────────────── */}
        {error ? (
          /* Error state — tailored when the visitor is offline */
          <div className="py-20 text-center">
            <p className="text-ink-2 text-sm mb-5">
              {isOnline
                ? 'Something went wrong loading the collection.'
                : 'You appear to be offline. Check your connection and try again.'}
            </p>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className="px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : isInitialLoad ? (
          /* Initial load — skeletons */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center">
            <p className="text-ink-2 text-sm">No products in this category yet.</p>
          </div>
        ) : (
          <>
            {/* Grid (dimmed while a page switch is in flight) */}
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 transition-opacity duration-200 ${
                loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            >
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={onOpenModal}
                />
              ))}
            </div>

            {/* ── Pagination controls ──────────────────────────────── */}
            {meta && meta.totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-1.5 mt-14"
                aria-label="Pagination"
              >
                {/* Prev */}
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={!meta.hasPrevPage || loading}
                  className="flex items-center gap-1 px-3 h-9 text-[0.72rem] font-medium tracking-[0.08em] uppercase rounded-sm border border-border text-ink-2 hover:border-ink hover:text-ink transition-all disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Previous page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page numbers */}
                {getPageNumbers(page, meta.totalPages).map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-ink-3 text-sm select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      disabled={loading}
                      aria-current={p === page ? 'page' : undefined}
                      className={`w-9 h-9 text-[0.78rem] font-medium rounded-sm border transition-all disabled:pointer-events-none ${
                        p === page
                          ? 'bg-ink border-ink text-bg'
                          : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!meta.hasNextPage || loading}
                  className="flex items-center gap-1 px-3 h-9 text-[0.72rem] font-medium tracking-[0.08em] uppercase rounded-sm border border-border text-ink-2 hover:border-ink hover:text-ink transition-all disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </nav>
            )}

            {/* Result count */}
            {meta && (
              <p className="text-center text-[0.72rem] text-ink-3 mt-5">
                Showing {(meta.page - 1) * PAGE_SIZE + 1}–{Math.min(meta.page * PAGE_SIZE, meta.total)} of {meta.total}
              </p>
            )}
          </>
        )}

      </div>
    </section>
  );
}
