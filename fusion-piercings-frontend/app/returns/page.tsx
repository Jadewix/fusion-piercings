import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'Our returns and refunds policy for body jewelry, including hygiene rules, the return window for unopened items, and how to report a defective or incorrect order.',
  alternates: { canonical: '/returns' },
};

const linkCls = 'text-ink underline underline-offset-2 hover:text-gold-dk transition-colors';

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns & Refunds"
      intro={`We want you to love your jewelry. Because piercing jewelry is worn on and through the body, health and hygiene rules shape what we can accept back. Last updated: ${LEGAL.lastUpdated}.`}
    >
      <LegalSection heading="1. Hygiene Notice">
        <p>
          For health and safety reasons, body jewelry that has been <strong>opened, worn, or removed from its
          sealed packaging cannot be returned or exchanged</strong>. This protects all of our customers and is
          standard practice for piercing jewelry.
        </p>
      </LegalSection>

      <LegalSection heading="2. Returns of Unopened Items">
        <p>
          You may return <strong>unopened, unused items in their original sealed packaging</strong> within{' '}
          {LEGAL.returnWindowDays} days of delivery, along with proof of your order (your order number is enough).
          Once we receive and inspect the item and confirm it is unopened, we will process your refund.
        </p>
      </LegalSection>

      <LegalSection heading="3. Non-Returnable Items">
        <ul className="list-disc pl-5 space-y-1.5 marker:text-gold-dk">
          <li>Jewelry that has been opened, worn, or removed from its sealed packaging.</li>
          <li>Items returned without their original packaging.</li>
          <li>Items damaged through misuse or normal wear after delivery.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Defective, Damaged, or Incorrect Items">
        <p>
          If your order arrives faulty, damaged, or incorrect, please contact us within 48 hours of delivery with
          your order number and clear photos. We will arrange a replacement or refund at no extra cost to you.
        </p>
      </LegalSection>

      <LegalSection heading="5. How to Start a Return">
        <p>
          Message us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>{' '}
          with your order number and the reason for your return. We&rsquo;ll guide you through the next steps.
        </p>
      </LegalSection>

      <LegalSection heading="6. Refunds">
        <p>
          Because orders are paid by Cash on Delivery, approved refunds are given in {LEGAL.refundMethod} when the
          returned item is collected: our driver brings your refund and picks up the item at the same time. A
          return delivery fee applies and is payable to the driver (see Section 8). We&rsquo;ll let you know as soon
          as your refund has been approved.
        </p>
      </LegalSection>

      <LegalSection heading="7. Exchanges">
        <p>
          Exchanges are subject to availability and the same hygiene rules above. If the item you want is
          unavailable, we&rsquo;ll help you find an alternative or arrange a refund for eligible returns.
        </p>
      </LegalSection>

      <LegalSection heading="8. Return Shipping">
        <p>
          Unless the item was defective, damaged, or incorrect, return delivery costs are the customer&rsquo;s
          responsibility. Please see our <Link href="/shipping" className={linkCls}>Shipping &amp; Delivery</Link>{' '}
          policy for delivery details.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact Us">
        <p>
          Need help with a return? Reach us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
