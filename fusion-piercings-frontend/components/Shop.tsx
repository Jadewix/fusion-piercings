'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { METAL_DOT_GRADIENT } from '@/lib/products';
import ProductCard from './ProductCard';

const PLACEMENTS = ['all', 'ear', 'nose', 'belly'];

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

interface Props {
  onOpenModal: (product: Product) => void;
}

export default function Shop({ onOpenModal }: Props) {
  const [activeMetal, setActiveMetal]       = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching live products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Switching metal resets placement so the grid is never empty on first click
  const handleMetalChange = (metal: string) => {
    setActiveMetal(metal);
    setActiveCategory('all');
  };

  const filtered = products.filter(p => {
    const metalMatch = activeMetal === 'all' || (p.metal || 'gold') === activeMetal;
    const catMatch   = activeCategory === 'all' || p.category === activeCategory;
    return metalMatch && catMatch;
  });

  if (loading) {
    return (
      <section className="py-24 bg-bg min-h-screen flex items-center justify-center">
        <p className="text-ink-2 font-serif text-xl animate-pulse">Loading The Collection...</p>
      </section>
    );
  }

  return (
    <section id="shop" className="py-24 bg-bg">
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
              onClick={() => setActiveCategory(cat)}
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

        {/* ── Product grid ────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-ink-2 text-sm">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenModal={onOpenModal}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
