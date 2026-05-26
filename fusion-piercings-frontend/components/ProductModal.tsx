// components/ProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  const { addToCart } = useCart();

  // Safe fallback if the database product doesn't have a sizes array yet
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['One Size'];
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);

  // Escape key + body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function handleAdd() {
    addToCart(product, selectedSize);
    onClose();
  }

  const formattedPrice = Number(product.price).toFixed(2);
  const categoryName   = product.category  || 'Collection';
  const isOutOfStock   = Number(product.stock_count) === 0;

  return (
      <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-ink/50 backdrop-blur-[10px] animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-label={`Product details: ${product.name}`}
      >
        <div className="relative w-full max-w-[420px] bg-bg-card rounded-[20px] overflow-hidden shadow-xl animate-modal-enter">

          {/* Close Button */}
          <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink-2 hover:bg-ink/10 hover:text-ink transition-all backdrop-blur-md"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Real Image Area */}
          <div className="h-[260px] relative overflow-hidden bg-gray-50">
            {product.image_url ? (
                <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 420px) 100vw, 420px"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-3 text-sm">
                  No Image Available
                </div>
            )}
          </div>

          {/* Body */}
          <div className="px-7 pt-6 pb-8">
          <span className="block text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3 mb-1">
            {categoryName}
          </span>
            <h2 className="font-serif text-[1.5rem] font-semibold text-ink leading-tight mb-2">
              {product.name}
            </h2>

            {/* New Description Area */}
            {product.description && (
                <p className="text-sm text-ink-2 mb-5 line-clamp-2">
                  {product.description}
                </p>
            )}

            {/* Size selector */}
            <div className="mb-7 mt-4">
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2.5">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                    <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-1.5 text-[0.78rem] font-medium rounded-full border transition-all duration-200 ${
                            selectedSize === size
                                ? 'bg-ink border-ink text-bg'
                                : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                        }`}
                    >
                      {size}
                    </button>
                ))}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between gap-5">
              <span className="text-[1.7rem] font-bold text-ink leading-none">${formattedPrice}</span>
              {isOutOfStock ? (
                  <button
                      disabled
                      className="flex-1 bg-border-lt text-ink-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase py-3.5 rounded-full cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
              ) : (
                  <button
                      onClick={handleAdd}
                      className="flex-1 bg-ink text-bg text-[0.76rem] font-semibold tracking-[0.12em] uppercase py-3.5 rounded-full hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
                  >
                    Add to Cart
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}