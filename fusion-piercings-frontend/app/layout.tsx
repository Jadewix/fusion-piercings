import type { Metadata, Viewport } from 'next';
import { Jost } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { GoogleAnalytics } from '@next/third-parties/google'; // 👈 1. Added Import
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, localBusinessSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import './globals.css';

// The site runs on a single family. Headings, body, nav and labels are all
// Jost, differentiated by size, weight and letterspacing rather than by
// switching typeface — mixing a display serif with a separate body sans is
// what made the previous pairing read as two unrelated voices.
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fusion Piercings — Piercing Studio & Body Jewelry in Zgharta, Lebanon',
    template: '%s — Fusion Piercings',
  },
  description: 'Professional piercing studio in Zgharta, North Lebanon. Ear, nose & body piercings plus premium titanium and gold-plated jewelry — shop online with cash on delivery, or book your appointment.',
  applicationName: 'Fusion Piercings',
  keywords: ['piercing Zgharta', 'piercing studio Zgharta', 'piercing North Lebanon', 'piercing Ehden', 'piercing Lebanon', 'body jewelry Lebanon', 'titanium jewelry', 'gold plated hoops', 'Fusion Piercings'],
  openGraph: {
    type: 'website',
    siteName: 'Fusion Piercings',
    title: 'Fusion Piercings — Piercing Studio in Zgharta, North Lebanon',
    description: 'Professional piercing studio in Zgharta, North Lebanon. Ear, nose & body piercings plus premium titanium and gold-plated jewelry.',
    url: SITE_URL,
    images: [{ url: '/img/Hero-img.png', width: 1200, height: 630, alt: 'Fusion Piercings — Piercing Studio in Zgharta, North Lebanon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fusion Piercings — Piercing Studio in Zgharta, North Lebanon',
    description: 'Professional piercing studio in Zgharta, North Lebanon. Body jewelry, piercings, and appointments.',
    images: ['/img/Hero-img.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/img/Fusion-logo-svg.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en" className={`${jost.variable}`}>
      <body>
      <JsonLd data={[organizationSchema(), localBusinessSchema()]} />
      <CartProvider>{children}</CartProvider>
      <WhatsAppWidget />
      <GoogleAnalytics gaId="G-PC94DZ6KFN" /> {/* 👈 2. Added Google Analytics Tag */}
      </body>
      </html>
  );
}