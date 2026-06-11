'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Hero() {
  const imageCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let latest = window.scrollY;
    let ticking = false;

    const apply = () => {
      const el = imageCardRef.current;
      if (el) {
        const offset = Math.min(latest * 0.06, 32);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
      ticking = false;
    };

    const onScroll = () => {
      latest = window.scrollY;
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen bg-bg overflow-hidden pt-24 pb-16 lg:pb-20 px-4 sm:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 75% 50%, rgba(184,150,90,0.07) 0%, transparent 70%)',
        }}
      />

      <div
        className="
          relative z-10 max-w-[1240px] mx-auto
          min-h-[calc(100vh-7rem)]
          grid gap-8 items-center
          [grid-template-areas:'top''image''bottom']
          lg:gap-x-16 lg:gap-y-6
          lg:grid-cols-2
          lg:[grid-template-areas:'top_image''bottom_image']
        "
      >

        {/* ── TEXT TOP: label, divider, headline ─────────────────────── */}
        <div className="[grid-area:top] flex flex-col items-center lg:items-start text-center lg:text-left lg:self-end">
          <span className="inline-flex items-center gap-2.5 text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
            Est. 2023 — Premium Body Jewelry
          </span>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          <h1 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] font-semibold text-ink leading-[1.25] max-w-md">
            At FUSION we turn piercing into a luxury experience, an individualized approach, and unparalleled standards for health and safety.
          </h1>
        </div>

        {/* ── IMAGE CARD ─────────────────────────────────────────────── */}
        <div className="[grid-area:image] w-full max-w-[350px] mx-auto lg:max-w-[440px] lg:h-full lg:flex lg:items-center">
          <div
            ref={imageCardRef}
            className="relative w-full will-change-transform"
            style={{ transform: 'translate3d(0,0,0)' }}
          >
            <div className="animate-badge-float">
              <div className="relative w-full aspect-square lg:aspect-[4/5] overflow-hidden rounded-[24px] border border-border-lt shadow-md bg-bg-warm">
                <Image
                  src="/img/Hero-img.png"
                  alt="Fusion Piercings jewelry"
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 350px, 440px"
                  className="object-cover select-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── CTAs + TRUST ROW ──────────────────────────────────────── */}
        <div className="[grid-area:bottom] flex flex-col items-center lg:items-start w-full lg:self-start">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <a
              href="#shop"
              className="inline-flex items-center justify-center bg-ink text-bg border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
            >
              Shop Collection
            </a>
            <a
              href="/book"
              className="inline-flex items-center justify-center bg-transparent text-ink border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-ink hover:text-bg hover:-translate-y-px hover:shadow-md transition-all duration-200"
            >
              Book An Appointment
            </a>
          </div>

          <div className="flex items-center gap-4 mt-7 text-[0.62rem] font-semibold tracking-[0.16em] uppercase text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A6E3A" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              Sterile
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-ink-3" />
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A6E3A" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
              </svg>
              Hypoallergenic
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
