import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Shipping & Delivery',
  description: 'Where Fusion Piercings delivers, our Cash on Delivery process, delivery fees, and how we coordinate your order.',
  alternates: { canonical: '/shipping' },
};

const linkCls = 'text-ink underline underline-offset-2 hover:text-gold-dk transition-colors';

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & Delivery"
      intro={`Here's how we get your jewelry to you, including where we deliver, our fees, and our Cash on Delivery process. Last updated: ${LEGAL.lastUpdated}.`}
    >
      <LegalSection heading="1. Where We Deliver">
        <p>We currently deliver across {LEGAL.country} ({LEGAL.deliveryAreas}).</p>
      </LegalSection>

      <LegalSection heading="2. Delivery Fees">
        <p>
          We charge a flat ${LEGAL.deliveryFee} delivery fee on orders under ${LEGAL.freeShipThreshold}. Orders of
          ${LEGAL.freeShipThreshold} or more qualify for <strong>free delivery</strong>. Any applicable fee is
          shown at checkout before you place your order.
        </p>
      </LegalSection>

      <LegalSection heading="3. Cash on Delivery (COD)">
        <p>
          All orders are paid by <strong>Cash on Delivery</strong>: you pay our driver in cash when your order
          arrives. Where possible, please have the exact total ready to make handover smooth.
        </p>
      </LegalSection>

      <LegalSection heading="4. Processing & Delivery Times">
        <p>
          Orders are typically delivered within {LEGAL.deliveryTime}. Delivery times may vary during busy periods,
          holidays, or due to circumstances outside our control.
        </p>
      </LegalSection>

      <LegalSection heading="5. Order Coordination">
        <p>
          After you place an order, our team will contact you by phone or WhatsApp to confirm your details and
          arrange a convenient delivery time. Please make sure the phone number and address you provide at
          checkout are correct.
        </p>
      </LegalSection>

      <LegalSection heading="6. Failed or Incorrect Deliveries">
        <p>
          If we are unable to reach you or the address provided is incorrect or incomplete, your delivery may be
          delayed. Repeated failed delivery attempts may result in the order being cancelled.
        </p>
      </LegalSection>

      <LegalSection heading="7. Returns">
        <p>
          For returns and refunds, including the rules for body jewelry, see our{' '}
          <Link href="/returns" className={linkCls}>Returns &amp; Refunds</Link> policy.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact Us">
        <p>
          Questions about delivery? Message us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
