import type { Metadata, Viewport } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { GoogleAnalytics } from '@next/third-parties/google'; // 👈 1. Added Import
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, localBusinessSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Instrument Serif ships a single weight (400) — there is no bold cut. Headings
// carry themselves on size and the face's own stroke contrast, so never pair
// this with font-semibold/font-bold: the browser would synthesise a smeared
// fake bold instead.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
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
      <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body>
      <JsonLd data={[organizationSchema(), localBusinessSchema()]} />
      <CartProvider>{children}</CartProvider>
      <WhatsAppWidget />
      <GoogleAnalytics gaId="G-PC94DZ6KFN" /> {/* 👈 2. Added Google Analytics Tag */}
      </body>
      </html>
  );
}