import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import CollectionClient from './CollectionClient';

const COLLECTIONS: Record<string, { title: string; materialTag: string; showSubcategoryTabs?: boolean }> = {
  'titanium':          { title: 'Titanium',          materialTag: 'titanium',          showSubcategoryTabs: true  },
  'surgical-steel':    { title: 'Surgical Steel',    materialTag: 'surgical-steel',    showSubcategoryTabs: true  },
  'gold-plated-hoops': { title: '18k Gold Plated', materialTag: 'gold-plated-hoops'                              },
};

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = COLLECTIONS[params.slug];
  if (!collection) return {};
  return {
    title: collection.title,
    description: `Shop our ${collection.title} collection. Premium body jewelry crafted for every expression.`,
    alternates: { canonical: `/collections/${params.slug}` },
    openGraph: {
      title: `${collection.title} — Fusion Piercings`,
      description: `Shop our ${collection.title} collection of premium body jewelry.`,
      url: `${SITE_URL}/collections/${params.slug}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map(slug => ({ slug }));
}

export default function CollectionPage({ params }: Props) {
  const collection = COLLECTIONS[params.slug];
  if (!collection) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: collection.title, url: `${SITE_URL}/collections/${params.slug}` },
        ])}
      />
      {/* useSearchParams() inside CollectionClient requires a Suspense boundary
          for Next 14's static prerender to succeed. */}
      <Suspense fallback={null}>
        <CollectionClient
          title={collection.title}
          materialTag={collection.materialTag}
          showSubcategoryTabs={collection.showSubcategoryTabs}
        />
      </Suspense>
    </>
  );
}
