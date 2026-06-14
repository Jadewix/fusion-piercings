'use client';

// Shared FAQ accordion used by the care-guide and /faq pages. The visible Q&A
// is driven by each page's `faqs.ts`; the matching FAQPage JSON-LD lives in the
// page layouts for AEO/SEO.
import { useState } from 'react';

export interface Faq {
  q: string;
  a: string;
}

function FaqItem({ q, a }: Faq) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-lt">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-[0.88rem] sm:text-[0.92rem] font-medium text-ink group-hover:text-gold-dk transition-colors">{q}</span>
        <svg
          className={`w-4 h-4 text-ink-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 animate-fade-in">
          <p className="text-[0.82rem] text-ink-2 leading-[1.8] font-light">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqAccordion({ items }: { items: Faq[] }) {
  return (
    <div className="border-t border-border-lt">
      {items.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
    </div>
  );
}
