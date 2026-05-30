// components/admin/AdminProductRow.tsx
'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';

interface AdminProductRowProps {
  product: Product;
  onToggleStock: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function AdminProductRowBase({ product, onToggleStock, onEdit, onDelete }: AdminProductRowProps) {
  const isActive = product.stock_count !== 0;

  return (
    <div className="flex gap-3 sm:items-center sm:gap-6 p-3 sm:p-4 bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3">
      <div className="w-14 h-14 sm:w-16 sm:h-16 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
        {product.image_url
          ? <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
          : <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-ink-3">No Img</div>}
      </div>

      <div className="flex-grow min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3">{product.category || 'Collection'}</span>
            <span className={`text-[0.55rem] sm:text-[0.6rem] font-bold tracking-[0.15em] uppercase px-1.5 sm:px-2 py-0.5 rounded-full border ${
              (product.metal || 'gold') === 'titanium'
                ? 'border-blue-200 text-blue-500 bg-blue-50'
                : 'border-yellow-200 text-yellow-700 bg-yellow-50'
            }`}>
              {product.metal || 'gold'}
            </span>
          </div>
          <h3 className="text-[0.92rem] sm:text-[1rem] font-medium text-ink leading-snug">{product.name}</h3>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:flex-shrink-0">
          <button
            onClick={() => onToggleStock(product)}
            title={isActive ? 'Click to mark as Out of Stock' : 'Click to mark as In Stock'}
            className={`px-2 py-1 text-[0.55rem] sm:px-3 sm:py-1.5 sm:text-[0.7rem] font-bold uppercase tracking-wider rounded-full border whitespace-nowrap flex-shrink-0 transition-all ${
              isActive
                ? 'border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                : 'border-red-200 text-red-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
            }`}
          >
            {isActive ? 'In Stock' : 'Out of Stock'}
          </button>

          <button
            onClick={() => onEdit(product)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-border-lt text-ink-2 hover:border-ink hover:text-ink transition-all rounded-sm"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(product)}
            title="Delete product"
            className="flex-shrink-0 px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all rounded-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoized so a single product's change (or an unrelated dashboard re-render)
// doesn't re-render every row. Relies on stable callback props from the parent.
export default memo(AdminProductRowBase);
