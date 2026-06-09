// components/legal/LegalPage.tsx
// Shared shell + section helper for the legal/trust pages (server components).
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-[1.25rem] sm:text-[1.4rem] font-semibold text-ink pt-3">{heading}</h2>
      {children}
    </section>
  );
}

export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <CartDrawer />

      <main className="bg-bg min-h-screen pt-32 pb-24 px-4 sm:px-8">
        <div className="max-w-[760px] mx-auto">
          <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
            Legal &amp; Trust
          </span>
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] font-semibold text-ink mb-3">{title}</h1>
          {intro && <p className="text-[0.92rem] text-ink-2 leading-[1.85] mb-4">{intro}</p>}

          <div className="bg-bg-warm border border-border-lt rounded-sm px-4 py-3 text-[0.74rem] text-ink-3 mb-10">
            This page is provided for general information only and does not constitute legal advice.
          </div>

          <div className="space-y-8 text-[0.9rem] text-ink-2 leading-[1.85]">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
