// app/product/[id]/ProductDetailClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductSize } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { COLOR_DOT_GRADIENT, COLOR_LABELS } from '@/lib/products';

interface Props {
  productId: string;
}

function coerceSizes(raw: unknown): ProductSize[] {
  if (!Array.isArray(raw) || raw.length === 0) return [{ size: 'One Size', in_stock: true }];
  return raw.map((s: any) =>
      typeof s === 'string' ? { size: s, in_stock: true } : { size: String(s.size), in_stock: s.in_stock !== false }
  );
}

export default function ProductDetailClient({ productId }: Props) {
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [activeImage, setActiveImage]     = useState(0);
  const [selectedSize, setSelectedSize]   = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('gold');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`)
        .then(r => {
          if (!r.ok) throw new Error('not found');
          return r.json();
        })
        .then(data => {
          if (cancelled) return;
          setProduct(data);
          const sizes = coerceSizes(data.sizes);
          const firstAvailable = sizes.find(s => s.in_stock) ?? sizes[0];
          setSelectedSize(firstAvailable?.size ?? null);
          setActiveImage(0);
        })
        .catch(() => { if (!cancelled) setError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const sizes  = useMemo(() => coerceSizes(product?.sizes), [product?.sizes]);
  const images = useMemo(() => {
    if (!product) return [];
    if (product.image_urls && product.image_urls.length > 0) return product.image_urls;
    return product.image_url ? [product.image_url] : [];
  }, [product]);

  if (loading) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 text-center">
          <p className="text-ink-2 font-serif text-xl animate-pulse">Loading...</p>
        </div>
    );
  }

  if (error || !product) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 text-center">
          <p className="text-ink-2 text-sm mb-5">Product not found.</p>
          <Link href="/#shop" className="px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all">
            Back to Shop
          </Link>
        </div>
    );
  }

  const isBothColor     = product.color === 'both';
  const allSizesOOS     = sizes.every(s => !s.in_stock);
  const isProductOOS    = Number(product.stock_count) === 0 || allSizesOOS;
  const selectedSizeOOS = sizes.find(s => s.size === selectedSize)?.in_stock === false;
  const canAdd          = !isProductOOS && selectedSize !== null && !selectedSizeOOS;
  const formattedPrice  = Number(product.price).toFixed(2);

  function handleAdd() {
    if (!canAdd || !product) return;
    addToCart(product, selectedSize, isBothColor ? selectedColor : undefined);
  }

  return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <Link
            href="/#shop"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.12em] uppercase text-ink-3 hover:text-ink transition-colors mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Gallery ──────────────────────────────────────────────── */}
          <div>
            <div className="aspect-square relative overflow-hidden bg-gray-50 rounded-sm border border-border-lt">
              {images[activeImage] ? (
                  <Image
                      src={images[activeImage]}
                      alt={product.name}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-3 text-sm">
                    No Image
                  </div>
              )}
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {images.map((url, i) => (
                      <button
                          key={url + i}
                          onClick={() => setActiveImage(i)}
                          className={`aspect-square relative overflow-hidden rounded-sm border transition-all ${
                              activeImage === i ? 'border-ink' : 'border-border-lt hover:border-border'
                          }`}
                          aria-label={`Image ${i + 1}`}
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* ── Info ─────────────────────────────────────────────────── */}
          <div className="flex flex-col">
            {product.category && (
                <span className="block text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3 mb-2">
              {product.category}
            </span>
            )}

            <div className="flex items-start justify-between gap-6 mb-3">
              <h1 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-ink leading-tight">
                {product.name}
              </h1>
              <span className="font-serif text-[1.6rem] font-semibold text-ink whitespace-nowrap leading-none mt-1">
              ${formattedPrice}
            </span>
            </div>

            {product.description && (
                <p className="text-[0.9rem] text-ink-2 leading-relaxed mb-7">
                  {product.description}
                </p>
            )}

            {/* Color selector (only for "both" products) */}
            {isBothColor && (
                <div className="mb-6">
                  <p className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-3">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['gold', 'silver'].map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`flex items-center gap-2 px-4 py-1.5 text-[0.78rem] font-medium rounded-full border transition-all duration-200 ${
                                selectedColor === c
                                    ? 'bg-ink border-ink text-bg'
                                    : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                            }`}
                        >
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-border-lt"
                        style={{ background: COLOR_DOT_GRADIENT[c] || '#D4AF37' }}
                    />
                          {COLOR_LABELS[c] || c}
                        </button>
                    ))}
                  </div>
                </div>
            )}

            {/* Size selector */}
            <div className="mb-8">
              <p className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-3">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ size, in_stock }) => {
                  const selected = selectedSize === size;
                  return (
                      <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          aria-pressed={selected}
                          aria-label={`${size}${in_stock ? '' : ' (out of stock)'}`}
                          className={`min-w-[64px] px-4 py-2.5 text-[0.85rem] font-medium border rounded-sm transition-all duration-200 ${
                              selected
                                  ? 'bg-ink border-ink text-bg'
                                  : 'bg-transparent border-border text-ink hover:border-ink'
                          } ${!in_stock ? 'line-through text-ink-3 hover:border-border' : ''}`}
                      >
                        {size}
                      </button>
                  );
                })}
              </div>
              {selectedSizeOOS && (
                  <p className="text-[0.72rem] text-red-500 mt-2.5">This size is currently out of stock.</p>
              )}
            </div>

            {/* CTA */}
            {isProductOOS ? (
                <button
                    disabled
                    className="w-full bg-border-lt text-ink-3 text-[0.78rem] font-semibold tracking-[0.12em] uppercase py-4 rounded-sm cursor-not-allowed"
                >
                  Out of Stock
                </button>
            ) : (
                <button
                    onClick={handleAdd}
                    disabled={!canAdd}
                    className="w-full bg-ink text-bg text-[0.78rem] font-semibold tracking-[0.12em] uppercase py-4 rounded-sm hover:bg-[#2a2620] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
            )}
          </div>
        </div>
      </div>
  );
}