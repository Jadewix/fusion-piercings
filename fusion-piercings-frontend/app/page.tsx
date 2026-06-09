import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Values from '@/components/Values';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopSection from '@/components/ShopSection';
import Toast from '@/components/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Server component: Hero, TrustBar, Values and Footer are now rendered on the
// server (SSR/SSG). Only the interactive islands (Nav, CartDrawer, ShopSection,
// Toast) hydrate on the client.
export default function Home() {
  return (
    <>
      <Nav />
      <CartDrawer />

      <main>
        <Hero />
        <TrustBar />
        <ShopSection />
        <Values />
      </main>

      <Footer />

      <Toast />
    </>
  );
}
