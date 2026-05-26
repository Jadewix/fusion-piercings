import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Fusion Piercings — Premium Body Jewelry',
  description: 'Precision-crafted titanium & 14k gold body jewelry for every expression.',
};

// Locks viewport to device width and disables pinch/double-tap zoom
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
        <WhatsAppWidget />
      </body>
    </html>
  );
}
