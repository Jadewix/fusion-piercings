import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fusion Piercings — Premium Body Jewelry',
    short_name: 'Fusion Piercings',
    description: 'Precision-crafted titanium & gold plated surgical steel body jewelry.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a1a1a',
    icons: [
      { src: '/img/Fusion-logo-svg.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
