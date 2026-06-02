import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import ProductDetailClient from './ProductDetailClient';

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Nav />
      <CartDrawer />

      <main className="pt-[72px] min-h-screen bg-bg">
        <ProductDetailClient productId={params.id} />
      </main>

      <Footer />
      <Toast />
    </>
  );
}
