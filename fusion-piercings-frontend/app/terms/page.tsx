import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of the Fusion Piercings website, online orders (Cash on Delivery), and piercing appointments.',
  alternates: { canonical: '/terms' },
};

const linkCls = 'text-ink underline underline-offset-2 hover:text-gold-dk transition-colors';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These Terms of Service govern your use of the ${LEGAL.tradeName} website and your purchase of products and services from us. Please read them carefully. Last updated: ${LEGAL.lastUpdated}.`}
    >
      <LegalSection heading="1. Acceptance of These Terms">
        <p>
          By accessing our website, placing an order, or booking an appointment, you agree to be bound by these
          Terms of Service and our <Link href="/privacy" className={linkCls}>Privacy Policy</Link>. If you do not
          agree, please do not use our site or services.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility & Age">
        <p>
          To place an order you must be at least 18 years old, or a minor acting with the involvement and consent
          of a parent or guardian. Piercing appointments for minors require a parent or legal guardian to be
          present, to show valid identification, and to provide consent. We may ask for proof of age and may
          decline service if these requirements are not met.
        </p>
      </LegalSection>

      <LegalSection heading="3. Products, Pricing & Availability">
        <p>
          All prices are listed in US Dollars (USD). We do our best to display products, colors, and finishes
          accurately, but actual items may vary slightly due to photography, screens, and the handmade nature of
          some jewelry. Prices and availability may change at any time without notice, and certain items may be
          limited or out of stock.
        </p>
      </LegalSection>

      <LegalSection heading="4. Orders & Payment (Cash on Delivery)">
        <p>
          We currently accept <strong>Cash on Delivery (COD)</strong> only: you pay our driver in cash when your
          order arrives. Placing an order constitutes an offer to buy, which we may accept or decline — for
          example, if an item is out of stock, the address is outside our delivery area, or we suspect fraudulent
          or duplicate orders.
        </p>
        <p>
          We confirm and coordinate orders by phone or WhatsApp. We reserve the right to cancel or refuse any
          order, limit quantities, or correct pricing errors.
        </p>
      </LegalSection>

      <LegalSection heading="5. Delivery">
        <p>
          Delivery fees, areas, and timeframes are described in our{' '}
          <Link href="/shipping" className={linkCls}>Shipping &amp; Delivery</Link> policy, which forms part of
          these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="6. Returns & Refunds">
        <p>
          Returns and refunds are governed by our <Link href="/returns" className={linkCls}>Returns &amp; Refunds</Link>{' '}
          policy. Please note that, for health and hygiene reasons, body jewelry that has been opened or worn
          generally cannot be returned.
        </p>
      </LegalSection>

      <LegalSection heading="7. Piercing Services & Appointments">
        <p>
          Appointment requests made through our booking page or WhatsApp are requests only and are confirmed by
          our team. Piercings carry inherent risks, including irritation, infection, and allergic reaction. Please
          follow our <Link href="/care-guide" className={linkCls}>Piercing Care Guide</Link> before and after your
          appointment.
        </p>
        <p>
          We do not provide medical advice; if you have a medical condition or concern, consult a qualified
          healthcare professional. We may refuse or stop a service at our discretion — for example, in cases of
          intoxication, a health contraindication, or where a minor attends without a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection heading="8. Intellectual Property">
        <p>
          All content on this site — including our name, logo, text, images, and design — belongs to{' '}
          {LEGAL.tradeName} or its licensors and may not be copied or used without our written permission.
        </p>
      </LegalSection>

      <LegalSection heading="9. Acceptable Use">
        <p>
          You agree not to use our site unlawfully, to interfere with its operation or security, or to place
          fraudulent, abusive, or repeated duplicate orders. We may suspend access or cancel orders that breach
          these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {LEGAL.tradeName} is not liable for indirect, incidental, or
          consequential damages arising from your use of our site, products, or services. Our jewelry is
          decorative; proper aftercare and use are your responsibility. Nothing in these Terms limits liability
          that cannot be excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing Law">
        <p>
          These Terms are governed by the laws of {LEGAL.country}, and any disputes will be subject to the
          jurisdiction of the courts of {LEGAL.governingCity}.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to These Terms">
        <p>
          We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date above reflects the most
          recent version, and continued use of our site means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact Us">
        <p>
          Questions about these Terms? Email{' '}
          <a href={`mailto:${LEGAL.email}`} className={linkCls}>{LEGAL.email}</a> or message us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
