// lib/site.ts
// Absolute site origin used for canonical URLs, Open Graph, the sitemap and JSON-LD.
// IMPORTANT: set NEXT_PUBLIC_SITE_URL in production (e.g. https://fusionpiercings.com).
// The localhost fallback only keeps dev/build working when the var is unset.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
