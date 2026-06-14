import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Fusion Piercings collects, uses, and protects your personal information when you shop, book an appointment, or contact us.',
  alternates: { canonical: '/privacy' },
};

const linkCls = 'text-ink underline underline-offset-2 hover:text-gold-dk transition-colors';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This Privacy Policy explains how ${LEGAL.tradeName} collects, uses, and protects your personal information when you shop with us, book a piercing appointment, or get in touch. Last updated: ${LEGAL.lastUpdated}.`}
    >
      <LegalSection heading="1. Who We Are">
        <p>
          {LEGAL.tradeName} operates this website and is based in {LEGAL.country}.
          We are responsible for your personal information. You can reach us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>,
          or at {LEGAL.address}.
        </p>
        {LEGAL.registration && <p>Commercial registration / VAT: {LEGAL.registration}.</p>}
      </LegalSection>

      <LegalSection heading="2. Information We Collect">
        <ul className="list-disc pl-5 space-y-1.5 marker:text-gold-dk">
          <li><strong>Order information:</strong> your first and last name, email address, phone number, city/region, street address, building/floor/apartment details, and the items you order.</li>
          <li><strong>Appointment requests:</strong> when you use our booking page, your name, phone number, chosen piercing type, and preferred date and time are sent to us through WhatsApp so we can arrange your appointment.</li>
          <li><strong>Contact messages:</strong> your name, email, optional phone number, and the content of your message.</li>
          <li><strong>Information collected automatically:</strong> basic usage data such as pages viewed, device and browser type, and approximate location, collected through cookies and analytics (see Section 4).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5 marker:text-gold-dk">
          <li>To process, confirm, and deliver your orders, including coordinating Cash on Delivery.</li>
          <li>To send you order confirmations and receipts.</li>
          <li>To contact you by phone or WhatsApp to arrange delivery or piercing appointments.</li>
          <li>To respond to your questions and provide customer support.</li>
          <li>To send you marketing or promotional messages where you have given consent — you can opt out at any time.</li>
          <li>To maintain, secure, and improve our website and services.</li>
          <li>To comply with our legal and regulatory obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Cookies & Analytics">
        <p>
          We use Google Analytics to understand how visitors use our website. It places cookies on your device
          that collect anonymized information such as the pages you visit and how you got here. This helps us
          improve the site.
        </p>
        <p>
          We do not currently use a cookie consent banner; by continuing to use the site you acknowledge the use
          of these cookies. You can block or delete cookies in your browser settings, and you can opt out of
          Google Analytics using Google&rsquo;s official opt-out browser add-on. Disabling cookies will not stop
          you from shopping with us.
        </p>
      </LegalSection>

      <LegalSection heading="5. How We Share Your Information">
        <p>We do not sell your personal information. We share it only with the service providers that help us run our business:</p>
        <ul className="list-disc pl-5 space-y-1.5 marker:text-gold-dk">
          <li><strong>Our delivery partner ({LEGAL.courier}):</strong> to deliver your order and collect Cash on Delivery payment.</li>
          <li><strong>Brevo:</strong> to send order confirmation emails and, where you have consented, marketing emails.</li>
          <li><strong>Supabase:</strong> our secure database and image hosting provider.</li>
          <li><strong>Google Analytics:</strong> website usage analytics.</li>
        </ul>
        <p>We may also disclose information where required by law or to protect our rights.</p>
      </LegalSection>

      <LegalSection heading="6. Marketing Communications">
        <p>
          If you have consented, we may send you promotional emails about new products, collections, and offers.
          Every marketing email includes an unsubscribe link, and you can opt out at any time by clicking it or by
          messaging us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
          Opting out of marketing will not affect transactional messages such as order confirmations.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data Retention">
        <p>
          We keep your order and contact records for as long as necessary to fulfil the purposes described in this
          policy and to meet our legal, accounting, and business obligations. When information is no longer needed,
          we delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection heading="8. Your Rights">
        <p>
          You may request access to the personal information we hold about you, ask us to correct or delete it, or
          withdraw your consent to marketing. To exercise any of these rights, contact us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
          We will respond within a reasonable timeframe.
        </p>
      </LegalSection>

      <LegalSection heading="9. Children's Privacy">
        <p>
          Our online store is intended for customers aged 18 and over, or for minors with the involvement and
          consent of a parent or guardian. Piercing appointments for minors require a parent or legal guardian to
          be present and provide consent (see our <Link href="/terms" className={linkCls}>Terms of Service</Link>).
          We do not knowingly collect personal information from children without guardian involvement.
        </p>
      </LegalSection>

      <LegalSection heading="10. Security">
        <p>
          We take reasonable technical and organizational measures to protect your personal information. However,
          no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top of
          this page reflects the most recent changes. Please review it periodically.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contact Us">
        <p>
          Questions about this policy or your data? Message us on WhatsApp at{' '}
          <a href={LEGAL.whatsappLink} className={linkCls} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
