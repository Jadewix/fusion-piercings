// app/product/[id]/ProductDetailClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { COLOR_DOT_GRADIENT, COLOR_LABELS } from '@/lib/products';
import {
  coerceColors, coerceGemSizes, coerceSizes,
  isColorAvailable, isProductSoldOut, isVariantInStock, resolvePrice, variantPrice,
} from '@/lib/variants';
import { parseDescription } from '@/lib/description';

interface Props {
  productId: string;
}

export default function ProductDetailClient({ productId }: Props) {
  const { addToCart } = useCart();
  const router = useRouter();

  // Go back to wherever the user came from (collection page, filtered shop,
  // specific pagination page). Falls back to /#shop only when the product page
  // was opened directly (shared link, new tab) and there is no in-app history.
  const goBack = (e: React.MouseEvent) => {
    // Preserve default behavior for new-tab/middle-click style interactions
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    let cameFromSite = false;
    try {
      cameFromSite =
          sessionStorage.getItem('fp_internal_nav') === '1' ||
          (!!document.referrer && new URL(document.referrer).origin === window.location.origin);
    } catch { /* ignore */ }
    if (cameFromSite || window.history.length > 2) {
      router.back();
    } else {
      router.push('/#shop');
    }
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [activeImage, setActiveImage]       = useState(0);
  const [selectedSize, setSelectedSize]     = useState<string | null>(null);
  const [selectedGemSize, setSelectedGemSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor]   = useState<string>('gold'); // 'gold' = Surgical Steel

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
          // Land on a colour first, then default the size and gem size to
          // something actually buyable *in that colour* — otherwise a product
          // whose 8mm is sold out only in gold would open pre-set to a dead
          // combination.
          const colors = coerceColors(data.colors, data.color);
          const firstColor = colors.find(c => c.in_stock) ?? colors[0];
          const startColor = firstColor?.color ?? null;
          if (startColor) setSelectedColor(startColor);

          const sizes = coerceSizes(data.sizes);
          const firstAvailable = sizes.find(s => isVariantInStock(s, startColor)) ?? sizes[0];
          setSelectedSize(firstAvailable?.size ?? null);

          const gems = coerceGemSizes(data.gem_sizes);
          const firstGem = gems.find(g => isVariantInStock(g, startColor)) ?? gems[0];
          setSelectedGemSize(firstGem?.gem_size ?? null);
          setActiveImage(0);
        })
        .catch(() => { if (!cancelled) setError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const sizes    = useMemo(() => coerceSizes(product?.sizes), [product?.sizes]);
  const gemSizes = useMemo(() => coerceGemSizes(product?.gem_sizes), [product?.gem_sizes]);
  const colors = useMemo(
      () => coerceColors(product?.colors, product?.color),
      [product?.colors, product?.color]
  );
  const descriptionItems = useMemo(
      () => parseDescription(product?.description),
      [product?.description]
  );
  const images = useMemo(() => {
    if (!product) return [];
    if (product.image_urls && product.image_urls.length > 0) return product.image_urls;
    return product.image_url ? [product.image_url] : [];
  }, [product]);

  // Keyboard navigation for the gallery. Declared here (before any early
  // returns) so hook order stays stable across renders.
  useEffect(() => {
    if (images.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveImage(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActiveImage(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length]);

  // Show the floating Back pill once the user has scrolled past the inline one.
  const [showFloatBack, setShowFloatBack] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowFloatBack(window.scrollY > 180);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 text-center">
          <p className="text-ink-2 text-xl animate-pulse">Loading...</p>
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
  const hasGemSizes     = gemSizes.length > 0;

  // Availability is asked per colour: a bar size can be sold out in gold while
  // still in stock in silver, so every check below is scoped to the colour the
  // shopper currently has selected.
  const activeColor     = selectedColor;
  const colorLabel      = COLOR_LABELS[activeColor] || activeColor;

  const isProductOOS    = Number(product.stock_count) === 0 || isProductSoldOut(colors, sizes, gemSizes);
  const selectedSizeObj = sizes.find(s => s.size === selectedSize);
  const selectedSizeOOS = !!selectedSizeObj && !isVariantInStock(selectedSizeObj, activeColor);
  const selectedGemObj  = hasGemSizes ? gemSizes.find(g => g.gem_size === selectedGemSize) : undefined;
  const selectedGemOOS  = hasGemSizes && !!selectedGemObj && !isVariantInStock(selectedGemObj, activeColor);
  const selectedColorOOS = !isColorAvailable(colors, activeColor);
  const canAdd          = !isProductOOS && selectedSize !== null && !selectedSizeOOS
                          && !selectedColorOOS
                          && (!hasGemSizes || (selectedGemSize !== null && !selectedGemOOS));

  // Price priority: per-colour gem > gem > per-colour size > size > base.
  const effectivePrice  = resolvePrice(product, selectedSizeObj, selectedGemObj, activeColor);
  const formattedPrice  = effectivePrice.toFixed(2);
  // null here means "no variant override" — the cart then uses the base price.
  const priceOverride   = variantPrice(selectedGemObj, activeColor)
                          ?? variantPrice(selectedSizeObj, activeColor);

  function handleAdd() {
    if (!canAdd || !product) return;
    addToCart(
        product,
        selectedSize,
        isBothColor ? selectedColor : undefined,
        priceOverride,
        hasGemSizes ? selectedGemSize : null,
    );
  }

  const hasMultipleImages = images.length > 1;
  const goPrev = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImage(i => (i + 1) % images.length);

  return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Inline Back — sits in the natural reading flow */}
        <Link
            href="/#shop"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.12em] uppercase text-ink-3 hover:text-ink transition-colors mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </Link>

        {/* Floating Back — appears once the inline one has scrolled off */}
        <Link
            href="/#shop"
            onClick={goBack}
            aria-label="Back to shop"
            className={`fixed top-[78px] sm:top-[88px] left-3 sm:left-6 z-[850] inline-flex items-center gap-1.5 bg-bg-card/85 backdrop-blur-md text-ink px-3.5 py-2 rounded-full shadow-md border border-border-lt text-[0.7rem] font-semibold tracking-[0.12em] uppercase hover:bg-bg-card hover:shadow-lg transition-all duration-300 ease-out ${
              showFloatBack
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Gallery ──────────────────────────────────────────────── */}
          <div>
            <div className="aspect-square relative overflow-hidden bg-gray-50 rounded-sm border border-border-lt group">
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

              {hasMultipleImages && (
                  <>
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous image"
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 backdrop-blur-sm text-ink shadow-sm flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next image"
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 backdrop-blur-sm text-ink shadow-sm flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                    <span
                        aria-hidden="true"
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-ink/70 text-bg text-[0.62rem] font-medium tracking-wider"
                    >
                      {activeImage + 1} / {images.length}
                    </span>
                  </>
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
              <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] text-ink leading-tight">
                {product.name}
              </h1>
              <span className="text-[1.6rem] text-ink whitespace-nowrap leading-none mt-1">
              ${formattedPrice}
            </span>
            </div>

            {/* Descriptions are typed as a separator-run spec list in the admin
                and get split into bullets here, so the formatting is right for
                products that were saved long before this existed. Genuine prose
                comes back as a single item and still renders as a paragraph. */}
            {descriptionItems.length === 1 && (
                <p className="text-[0.9rem] text-ink-2 leading-relaxed mb-7">
                  {descriptionItems[0]}
                </p>
            )}
            {descriptionItems.length > 1 && (
                <ul className="mb-7 space-y-1.5">
                  {descriptionItems.map((item, i) => (
                      <li key={i} className="relative pl-4 text-[0.9rem] text-ink-2 leading-relaxed">
                        <span aria-hidden="true" className="absolute left-0 top-[0.62em] w-1 h-1 rounded-full bg-gold" />
                        {item}
                      </li>
                  ))}
                </ul>
            )}

            {/* Color selector (only for "both" products) */}
            {isBothColor && (
                <div className="mb-6">
                  <p className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-3">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['gold', 'silver'].map(c => {
                      const colorEntry = colors.find(co => co.color === c);
                      const inStock    = colorEntry ? colorEntry.in_stock : true;
                      const selected   = selectedColor === c;
                      return (
                          <button
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              aria-pressed={selected}
                              aria-label={`${COLOR_LABELS[c] || c}${inStock ? '' : ' (out of stock)'}`}
                              className={`flex items-center gap-2 px-4 py-1.5 text-[0.78rem] font-medium rounded-full border transition-all duration-200 ${
                                  selected
                                      ? 'bg-ink border-ink text-bg'
                                      : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                              } ${!inStock ? 'line-through text-ink-3 hover:border-border' : ''}`}
                          >
                      <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-border-lt"
                          style={{ background: COLOR_DOT_GRADIENT[c] || '#D4AF37' }}
                      />
                            {COLOR_LABELS[c] || c}
                          </button>
                      );
                    })}
                  </div>
                  {selectedColorOOS && (
                      <p className="text-[0.72rem] text-red-500 mt-2.5">This color is currently out of stock.</p>
                  )}
                </div>
            )}

            {/* Bar size selector */}
            <div className="mb-8">
              <p className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-3">
                Bar Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(entry => {
                  const size     = entry.size;
                  const selected = selectedSize === size;
                  // Struck through when unavailable in the colour on screen —
                  // switching colour restrikes the row without moving the
                  // shopper's selection.
                  const inStock  = isVariantInStock(entry, activeColor);
                  return (
                      <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          aria-pressed={selected}
                          aria-label={`${size}${inStock ? '' : ` (out of stock in ${colorLabel})`}`}
                          className={`min-w-[64px] px-4 py-2.5 text-[0.85rem] font-medium border rounded-sm transition-all duration-200 ${
                              selected
                                  ? 'bg-ink border-ink text-bg'
                                  : 'bg-transparent border-border text-ink hover:border-ink'
                          } ${!inStock ? 'line-through text-ink-3 hover:border-border' : ''}`}
                      >
                        {size}
                      </button>
                  );
                })}
              </div>
              {selectedSizeOOS && (
                  <p className="text-[0.72rem] text-red-500 mt-2.5">
                    {isBothColor
                        ? `This bar size is out of stock in ${colorLabel}.`
                        : 'This bar size is currently out of stock.'}
                  </p>
              )}
            </div>

            {/* Gem size selector (only when the product has gem-size variants) */}
            {hasGemSizes && (
                <div className="mb-8">
                  <p className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-3">
                    Gem Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {gemSizes.map(entry => {
                      const gemSize  = entry.gem_size;
                      const selected = selectedGemSize === gemSize;
                      const inStock  = isVariantInStock(entry, activeColor);
                      return (
                          <button
                              key={gemSize}
                              onClick={() => setSelectedGemSize(gemSize)}
                              aria-pressed={selected}
                              aria-label={`${gemSize} mm${inStock ? '' : ` (out of stock in ${colorLabel})`}`}
                              className={`min-w-[64px] px-4 py-2.5 text-[0.85rem] font-medium border rounded-sm transition-all duration-200 ${
                                  selected
                                      ? 'bg-ink border-ink text-bg'
                                      : 'bg-transparent border-border text-ink hover:border-ink'
                              } ${!inStock ? 'line-through text-ink-3 hover:border-border' : ''}`}
                          >
                            {gemSize} mm
                          </button>
                      );
                    })}
                  </div>
                  {selectedGemOOS && (
                      <p className="text-[0.72rem] text-red-500 mt-2.5">
                        {isBothColor
                            ? `This gem size is out of stock in ${colorLabel}.`
                            : 'This gem size is currently out of stock.'}
                      </p>
                  )}
                </div>
            )}

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

            {/* Aftercare cross-link — helpful for new customers and internal SEO */}
            <p className="text-[0.78rem] text-ink-2 mt-5 leading-relaxed">
              New to piercings? Read our{' '}
              <Link href="/care-guide" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">aftercare guide</Link>{' '}
              or the{' '}
              <Link href="/faq" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">piercing FAQ</Link>.
            </p>
          </div>
        </div>
      </div>
  );
}