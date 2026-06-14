import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { faqPageSchema, breadcrumbSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { FAQS } from './faqs';

export const metadata: Metadata = {
  title: 'Piercing FAQ',
  description:
    'Answers to common piercing questions: healing times for nose, helix, tragus and conch piercings, titanium vs surgical steel, aftercare, sleeping on a new piercing, and when to change your jewelry.',
  alternates: { canonical: '/faq' },
  openGraph: {
    type: 'website',
    title: 'Piercing FAQ — Fusion Piercings',
    description:
      'Clear answers about piercing pain, healing times, jewelry materials, and aftercare from Fusion Piercings.',
    url: `${SITE_URL}/faq`,
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          faqPageSchema(FAQS),
          breadcrumbSchema([
            { name: 'Home', url: SITE_URL },
            { name: 'FAQ', url: `${SITE_URL}/faq` },
          ]),
        ]}
      />
      {children}
    </>
  );
}
