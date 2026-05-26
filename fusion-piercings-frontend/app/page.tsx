'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import Nav          from '@/components/Nav';
import Hero         from '@/components/Hero';
import TrustBar     from '@/components/TrustBar';
import Shop         from '@/components/Shop';
import Values       from '@/components/Values';
import Footer       from '@/components/Footer';
import CartDrawer   from '@/components/CartDrawer';
import ProductModal from '@/components/ProductModal';
import Toast        from '@/components/Toast';

export default function Home() {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  return (
    <>
      <Nav />
      <CartDrawer />

      <main>
        <Hero />
        <TrustBar />
        <Shop onOpenModal={setModalProduct} />
        <Values />
      </main>

      <Footer />

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}

      <Toast />
    </>
  );
}
