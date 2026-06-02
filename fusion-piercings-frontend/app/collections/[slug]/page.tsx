import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CollectionClient from './CollectionClient';

const COLLECTIONS: Record<string, { title: string; materialTag: string; showSubcategoryTabs?: boolean }> = {
  'titanium':          { title: 'Titanium',          materialTag: 'titanium',          showSubcategoryTabs: true  },
  'surgical-steel':    { title: 'Surgical Steel',    materialTag: 'surgical-steel',    showSubcategoryTabs: true  },
  'gold-plated-hoops': { title: 'Gold Plated Hoops', materialTag: 'gold-plated-hoops'                              },
};

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = COLLECTIONS[params.slug];
  if (!collection) return {};
  return {
    title: `${collection.title} — Fusion Piercings`,
    description: `Shop our ${collection.title} collection. Premium body jewelry crafted for every expression.`,
  };
}

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map(slug => ({ slug }));
}

export default function CollectionPage({ params }: Props) {
  const collection = COLLECTIONS[params.slug];
  if (!collection) notFound();
  return (
    // useSearchParams() inside CollectionClient requires a Suspense boundary
    // for Next 14's static prerender to succeed.
    <Suspense fallback={null}>
      <CollectionClient
        title={collection.title}
        materialTag={collection.materialTag}
        showSubcategoryTabs={collection.showSubcategoryTabs}
      />
    </Suspense>
  );
}
