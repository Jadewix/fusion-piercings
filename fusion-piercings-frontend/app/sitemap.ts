import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Resilient: if the API is unreachable at build/request time, we still emit the
// static routes rather than failing the whole sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: '',            priority: 1.0,  freq: 'weekly'  as const },
    { path: '/care-guide', priority: 0.6,  freq: 'monthly' as const },
    { path: '/book',       priority: 0.7,  freq: 'monthly' as const },
    { path: '/privacy',    priority: 0.3,  freq: 'yearly'  as const },
    { path: '/terms',      priority: 0.3,  freq: 'yearly'  as const },
    { path: '/returns',    priority: 0.3,  freq: 'yearly'  as const },
    { path: '/shipping',   priority: 0.3,  freq: 'yearly'  as const },
  ].map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const colRes = await fetch(`${API}/collections`, { next: { revalidate: 3600 } });
    if (colRes.ok) {
      const cols = await colRes.json();
      for (const c of cols) {
        dynamicRoutes.push({
          url: `${SITE_URL}/collections/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch { /* keep static routes only */ }

  try {
    const prodRes = await fetch(`${API}/products?page=1&limit=100`, { next: { revalidate: 3600 } });
    if (prodRes.ok) {
      const data = await prodRes.json();
      for (const p of (data.products || [])) {
        dynamicRoutes.push({
          url: `${SITE_URL}/product/${p.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch { /* keep static routes only */ }

  return [...staticRoutes, ...dynamicRoutes];
}
