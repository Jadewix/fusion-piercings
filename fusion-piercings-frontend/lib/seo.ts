// lib/seo.ts — JSON-LD schema builders for structured data / answer engines (AEO).
import type { Product } from './types';
import { SITE_URL } from './site';
import { BUSINESS, isFilled } from './business';

const SITE_NAME = BUSINESS.name;

const SOCIALS = [BUSINESS.instagram, BUSINESS.tiktok];

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/img/Fusion-logo-svg.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS.phoneE164,
      contactType: 'customer service',
      areaServed: BUSINESS.countryCode,
      availableLanguage: ['en', 'ar'],
    },
    sameAs: SOCIALS,
  };
}

export function localBusinessSchema() {
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    addressCountry: BUSINESS.countryCode,
  };
  if (isFilled(BUSINESS.street)) address.streetAddress = BUSINESS.street;
  if (BUSINESS.postalCode) address.postalCode = BUSINESS.postalCode;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/img/Hero-img.png`,
    logo: `${SITE_URL}/img/Fusion-logo-svg.svg`,
    telephone: BUSINESS.phoneE164,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash on Delivery',
    address,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'Place', name })),
    sameAs: SOCIALS,
  };

  if (BUSINESS.hours.length) {
    schema.openingHoursSpecification = BUSINESS.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    }));
  }

  return schema;
}

export function productSchema(product: Product, url: string) {
  const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const images = product.image_urls?.length
    ? product.image_urls
    : product.image_url ? [product.image_url] : [];
  const inStock = (product.stock_count ?? 1) > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — premium body jewelry from ${SITE_NAME}.`,
    image: images,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      ...(Number.isFinite(priceNum) ? { price: Number(priceNum).toFixed(2) } : {}),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
