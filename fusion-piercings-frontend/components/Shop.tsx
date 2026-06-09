// components/Shop.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/types';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import ProductCard from './ProductCard';
import Pagination from '@/components/ui/Pagination';
import { PageMeta } from '@/lib/pagination';

const PLACEMENTS = ['all', 'ear', 'nose', 'belly', 'nipple'];
const PAGE_SIZE = 20;

type FilterKind = 'none' | 'color' | 'material_tag';

interface ColorOption {
  key:          string;
  label:        string;
  description:  string;
  filterKind:   FilterKind;
  filterValue:  string | null;
  activeBg:     string;
  activeBorder: string;
  activeText:   string;
  orb:          string | null;
}

const COLORS: ColorOption[] = [
  {
    key:         'all',
    label:       'All',
    description: 'Browse Everything',
    filterKind:  'none',
    filterValue: null,
    activeBg:    '#F5F4F2',
    activeBorder:'#1a1a1a',
    activeText:  '#1a1a1a',
    orb:         'linear-gradient(135deg, #C8922E 0%, #C8922E 50%, #94A3B8 50%, #94A3B8 100%)',
  },
  {
    key:         'surgical-steel',
    label:       'Surgical Steel',
    description: 'Classic & Warm',
    filterKind:  'color',
    filterValue: 'gold',
    activeBg:    '#FBF7EF',
    activeBorder:'#C8922E',
    activeText:  '#8A6030',
    orb:         'linear-gradient(135deg,#C8922E,#EDD898)',
  },
  {
    key:         'titanium',
    label:       'Titanium',
    description: 'Sleek & Cool',
    filterKind:  'color',
    filterValue: 'titanium',
    activeBg:    '#F0F5FA',
    activeBorder:'#94A3B8',
    activeText:  '#3A6888',
    orb:         'linear-gradient(135deg,#909090,#D0D0D0)',
  },
  {
    key:         'gold-plated-hoops',
    label:       '18k Gold Plated',
    description: 'Premium Shine',
    filterKind:  'material_tag',
    filterValue: 'gold-plated-hoops',
    activeBg:    '#FFF8E1',
    activeBorder:'#D4A017',
    activeText:  '#7A5410',
    orb:         'radial-gradient(circle, transparent 32%, #D4A017 34%, #F4D06F 65%, #B8860B 100%)',
  },
];

interface Props {
  materialTag?: string;
  category?: string;
  id?: string;
  title?: string;
  eyebrow?: string;
  hideHeader?: boolean;
}

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

export default function Shop({
                               materialTag,
                               category: controlledCategory,
                               id = 'shop',
                               title = 'Shop the Collection',
                               eyebrow = 'The Collection',
                               hideHeader = false,
                             }: Props) {
  const [activeColor, setActiveColor]           = useState<string>(COLORS[0].key);
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const activeCategory = controlledCategory ?? internalCategory;
  const setActiveCategory = (c: string) => setInternalCategory(c);
  const [page, setPage]                         = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta]         = useState<PageMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isOnline = useOnlineStatus();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          page:     String(page),
          limit:    String(PAGE_SIZE),
          category: activeCategory,
        });

        if (materialTag) {
          // Parent controls this section to a specific material — ignore user filter.
          params.set('color', 'all');
          params.append('material_tag', materialTag);
        } else {
          const selected = COLORS.find(c => c.key === activeColor) ?? COLORS[0];
          if (selected.filterKind === 'color' && selected.filterValue) {
            params.set('color', selected.filterValue);
          } else if (selected.filterKind === 'material_tag' && selected.filterValue) {
            params.set('color', 'all');
            params.append('material_tag', selected.filterValue);
          } else {
            params.set('color', 'all');
          }
        }
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
        if (data.page && data.page !== page) setPage(data.page);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
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
  }, [activeColor, activeCategory, page, reloadKey]);

  useEffect(() => {
    if (controlledCategory !== undefined) setPage(1);
  }, [controlledCategory]);

  const handleColorChange = (color: string) => {
    setActiveColor(color);
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
      <section id={id} ref={sectionRef} className="py-24 bg-bg scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">

          {!hideHeader && (
              <div className="mb-12">
            <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
              {eyebrow}
            </span>
                <h2 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-ink">
                  {title}
                </h2>
              </div>
          )}

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-8 w-full max-w-4xl ${materialTag ? 'hidden' : ''}`}>
            {COLORS.map(colorItem => {
              const isActive = activeColor === colorItem.key;
              return (
                  <button
                      key={colorItem.key}
                      onClick={() => handleColorChange(colorItem.key)}
                      style={isActive ? { background: colorItem.activeBg, borderColor: colorItem.activeBorder } : {}}
                      className={`flex items-center gap-2.5 sm:gap-3 px-3 py-3 sm:px-5 sm:py-5 rounded-sm border-2 text-left transition-all duration-200 min-w-0 ${
                          isActive
                              ? 'shadow-sm'
                              : 'border-border-lt bg-bg-card hover:border-border hover:shadow-sm'
                      }`}
                  >
                <span
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex-shrink-0 border border-border-lt"
                    style={{ background: colorItem.orb ?? undefined }}
                />
                    <div className="min-w-0 flex-1">
                      <p
                          className="text-[0.72rem] sm:text-[0.92rem] font-semibold font-sans sm:font-serif leading-tight tracking-tight sm:tracking-normal break-words"
                          style={isActive ? { color: colorItem.activeText } : { color: 'var(--color-ink)' }}
                      >
                        {colorItem.label}
                      </p>
                      <p className="text-[0.62rem] sm:text-[0.68rem] text-ink-3 mt-0.5 font-light hidden sm:block truncate">
                        {colorItem.description}
                      </p>
                    </div>
                  </button>
              );
            })}
          </div>

          <div
              className={`flex flex-wrap items-center gap-2 mb-12 ${materialTag ? 'hidden' : ''}`}
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

          {error ? (
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
          ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-ink-2 text-sm">No products in this category yet.</p>
              </div>
          ) : (
              <>
                <div
                    className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 transition-opacity duration-200 ${
                        loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                >
                  {products.map(product => (
                      <ProductCard
                          key={product.id}
                          product={product}
                      />
                  ))}
                </div>

                {meta && (
                    <Pagination
                        page={meta.page}
                        totalPages={meta.totalPages}
                        hasPrevPage={meta.hasPrevPage}
                        hasNextPage={meta.hasNextPage}
                        onPageChange={goToPage}
                        loading={loading}
                        total={meta.total}
                        pageSize={PAGE_SIZE}
                    />
                )}
              </>
          )}

        </div>
      </section>
  );
}