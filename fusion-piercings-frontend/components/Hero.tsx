// components/Hero.tsx
'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Hero() {
  const imageRef = useRef<HTMLDivElement>(null);

  // Subtle parallax driven by rAF — no React re-renders, GPU accelerated.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let latest = window.scrollY;
    let ticking = false;

    const apply = () => {
      const el = imageRef.current;
      if (el) {
        const offset = Math.min(latest * 0.3, 220);
        el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8 pt-24 pb-20 bg-bg text-center"
    >
      {/* Hero image — full-bleed, parallax on scroll, optimised via next/image */}
      <div
        ref={imageRef}
        className="absolute inset-0 -top-[10%] -bottom-[10%] pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(0,0,0) scale(1.08)' }}
        aria-hidden="true"
      >
        <Image
          src="/img/Hero-img.png"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center select-none"
        />
      </div>

      {/* Single seamless gradient — only a whisper of tone at top and bottom edges,
          nothing in the middle. No bands, no patches. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,18,15,0.10) 0%, rgba(20,18,15,0) 18%, rgba(245,242,236,0) 82%, rgba(245,242,236,0.5) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[740px] mx-auto flex flex-col items-center justify-evenly flex-1 gap-2">

        {/* Label */}
        <span className="inline-flex items-center gap-2.5 text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-ink section-label-line">
          Est. 2023 — Premium Body Jewelry
        </span>

        {/* Logo + divider + tagline group */}
        <div className="flex flex-col items-center">
          <h1 className="flex items-center justify-center mb-4">
            <img src="/img/Fusion-logo-svg.svg" alt="Fusion Piercings" className="w-[clamp(240px,45vw,420px)] h-auto" />
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          <p className="text-[clamp(0.9rem,1.42vw,1.02rem)] text-ink leading-[1.85] font-normal max-w-md">
            At FUSION we turn piercing into a luxury experience, an individualized approach, and unparalleled standards for health and safety.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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
      </div>

    </section>
  );
}
