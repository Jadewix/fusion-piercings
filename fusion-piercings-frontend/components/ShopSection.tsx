'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import Shop from '@/components/Shop';
import ProductModal from '@/components/ProductModal';

/**
 * Client island that wires the product grid to the product detail modal.
 * Kept separate so the home page itself can remain a server component.
 */
export default function ShopSection() {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  return (
    <>
      <Shop onOpenModal={setModalProduct} />

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}
    </>
  );
}
