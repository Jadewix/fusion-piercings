import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'Care Guide',
  description:
    'Our complete piercing care and aftercare guide is coming soon. Explore our jewelry collection or book a piercing appointment in the meantime.',
  alternates: { canonical: '/care-guide' },
};

export default function CareGuidePage() {
  return (
    <>
      <Nav />
      <CartDrawer />

      <main className="bg-bg min-h-screen flex items-center justify-center px-4 sm:px-8 py-32">
        <div className="relative max-w-[560px] mx-auto text-center">
          <span className="text-[0.7rem] font-medium tracking-[0.08em] uppercase text-gold-dk mb-6">
            Care &amp; Aftercare
          </span>

          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] text-ink leading-[1.15] mb-5">
            Care Guide<br />Coming Soon
          </h1>

          <p className="text-[clamp(0.9rem,1.4vw,1rem)] text-ink-2 leading-[1.9] font-light max-w-md mx-auto mb-9">
            We&rsquo;re putting together a complete piercing care &amp; aftercare guide. Check back soon — in the
            meantime, explore our collection or book an appointment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#shop"
              className="inline-flex items-center justify-center bg-ink text-bg border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
            >
              Shop Collection
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-transparent text-ink border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-ink hover:text-bg hover:-translate-y-px hover:shadow-md transition-all duration-200"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
