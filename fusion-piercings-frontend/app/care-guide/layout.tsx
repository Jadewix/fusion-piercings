import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/lib/seo';
import { FAQS } from './faqs';

export const metadata: Metadata = {
  title: 'Piercing Care Guide',
  description: 'How to care for a new piercing: aftercare basics, healing timelines, what is normal, jewelry materials, and answers to common questions.',
  alternates: { canonical: '/care-guide' },
};

export default function CareGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQS)} />
      {children}
    </>
  );
}
