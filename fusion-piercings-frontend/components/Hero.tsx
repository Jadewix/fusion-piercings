'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Hero() {
  const imageCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = imageCardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let running = false;
    let current = 0; // eased offset (px), trails the target for a smooth drift

    const render = () => {
      // How far we've scrolled into the hero drives a gentle downward drift.
      const target = Math.min(window.scrollY * 0.08, 40);
      // Lerp: ease current toward target so motion feels smooth, not snappy.
      current += (target - current) * 0.09;

      const y = current.toFixed(2);
      // A whisper of scale tied to the same drift — adds life without distortion.
      const scale = (1 + current / 2000).toFixed(4);
      el.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;

      // Keep animating until we've effectively reached the target, then idle
      // so we're not burning frames while the page is still.
      if (Math.abs(target - current) > 0.1) {
        raf = requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };

    kick(); // settle initial position (e.g. refreshed mid-page)
    window.addEventListener('scroll', kick, { passive: true });
    return () => {
      window.removeEventListener('scroll', kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative bg-bg overflow-hidden pt-24 pb-16 lg:pb-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[70%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 30%, rgba(184,150,90,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 lg:max-w-[1240px] lg:mx-auto lg:px-8 lg:min-h-[calc(100vh-8rem)]">

        <div className="flex flex-col items-center lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:h-full lg:min-h-[calc(100vh-8rem)]">

          {/* ── IMAGE — edge-to-edge on mobile/tablet, square card on desktop ── */}
          <div className="order-1 lg:order-2 w-full lg:max-w-[440px] lg:mx-auto">
            <div
              ref={imageCardRef}
              className="relative w-full will-change-transform"
              style={{ transform: 'translate3d(0,0,0)' }}
            >
              <div className="animate-badge-float">
                <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] lg:aspect-[4/5] overflow-hidden lg:rounded-[24px] lg:border lg:border-border-lt shadow-md bg-bg-warm">
                  <Image
                    src="/img/Hero-img.png"
                    alt="Fusion Piercings jewelry"
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 440px"
                    className="object-cover object-center select-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── TEXT CONTENT — below image on mobile, left of image on desktop ── */}
          <div className="order-2 lg:order-1 w-full mx-auto max-w-[760px] lg:max-w-none px-4 sm:px-8 lg:px-0 mt-10 lg:mt-0 flex flex-col items-center lg:items-start text-center lg:text-left">

            <span className="inline-flex items-center gap-2.5 text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
              Est. 2023 — Premium Body Jewelry
            </span>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
              <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
            </div>

            <h1 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] font-semibold text-ink leading-[1.25] max-w-xl mb-8">
              At Fusion, we turn piercing into a luxury experience through an individualized approach and unparalleled standards for health and safety.
            </h1>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mb-7">
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

            <div className="flex items-center gap-4 text-[0.62rem] font-semibold tracking-[0.16em] uppercase text-ink-3">
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
      </div>
    </section>
  );
}
