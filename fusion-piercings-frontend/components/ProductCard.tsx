// components/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { METAL_DOT_GRADIENT, METAL_LABELS } from '@/lib/products';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const formattedPrice = Number(product.price).toFixed(2);
  const metalType      = product.metal    || 'gold';
  const categoryName   = product.category || 'Collection';
  const isOutOfStock   = Number(product.stock_count) === 0;

  return (
    <Link
      href={`/product/${product.id}`}
      aria-label={`View ${product.name}`}
      className="bg-bg-card border border-border-lt rounded-sm shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-border transition-all duration-300 overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-50 flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={`object-cover transition-all duration-300 ${isOutOfStock ? 'opacity-50' : 'group-hover:scale-105'}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-3 text-sm">
            No Image
          </div>
        )}

        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 text-ink text-[0.65rem] font-semibold tracking-[0.14em] uppercase px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-[0.62rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-1">
          {categoryName}
        </div>

        <div className="text-[0.875rem] font-medium text-ink mb-2.5 leading-snug line-clamp-2">
          {product.name}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-[0.9rem] font-bold text-ink">${formattedPrice}</span>

          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: (METAL_DOT_GRADIENT as any)?.[metalType] || '#D4AF37' }}
            title={(METAL_LABELS as any)?.[metalType] || 'Gold'}
          />
        </div>
      </div>
    </Link>
  );
}
