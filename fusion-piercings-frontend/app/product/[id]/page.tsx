import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import JsonLd from '@/components/seo/JsonLd';
import { productSchema, breadcrumbSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { Product } from '@/lib/types';
import ProductDetailClient from './ProductDetailClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fetched on the server for metadata + JSON-LD. Cached and deduped within a
// request, so generateMetadata and the page body share a single API call.
// Returns null if the API is unreachable so the page still renders.
async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/products/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) {
    return { title: 'Product', description: 'Browse premium body jewelry at Fusion Piercings.' };
  }
  const desc = (product.description || `${product.name} — premium body jewelry from Fusion Piercings.`).slice(0, 200);
  const img = product.image_url || product.image_urls?.[0];
  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `/product/${params.id}` },
    openGraph: {
      type: 'website',
      title: `${product.name} — Fusion Piercings`,
      description: desc,
      url: `${SITE_URL}/product/${params.id}`,
      images: img ? [{ url: img, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <>
      <Nav />
      <CartDrawer />

      {product && (
        <JsonLd
          data={[
            productSchema(product, `${SITE_URL}/product/${params.id}`),
            breadcrumbSchema([
              { name: 'Home', url: SITE_URL },
              { name: product.name, url: `${SITE_URL}/product/${params.id}` },
            ]),
          ]}
        />
      )}

      <main className="pt-[72px] min-h-screen bg-bg">
        <ProductDetailClient productId={params.id} />
      </main>

      <Footer />
      <Toast />
    </>
  );
}
