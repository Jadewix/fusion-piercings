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
      <div className="relative z-10 lg:max-w-[1240px] lg:mx-auto lg:px-8 lg:min-h-[calc(100vh-8rem)]">

        <div className="flex flex-col items-center lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:h-full lg:min-h-[calc(100vh-8rem)]">

          {/* ── IMAGE — edge-to-edge on mobile/tablet, square card on desktop ── */}
          <div className="order-1 lg:order-2 w-full lg:max-w-[440px] lg:mx-auto">
            <div
              ref={imageCardRef}
              className="relative w-full will-change-transform"
              style={{ transform: 'translate3d(0,0,0)' }}
            >
              <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] lg:aspect-[4/5] overflow-hidden lg:rounded-[2px] lg:border lg:border-border-lt bg-bg-warm">
                <Image
                  src="/img/Hero-img.webp"
                  alt="Fusion Piercings jewelry"
                  fill
                  priority
                  quality={72}
                  sizes="(max-width: 1024px) 100vw, 440px"
                  className="object-cover object-center select-none"
                />
              </div>
            </div>
          </div>

          {/* ── TEXT CONTENT — below image on mobile, left of image on desktop ── */}
          <div className="order-2 lg:order-1 w-full mx-auto max-w-[760px] lg:max-w-none px-4 sm:px-8 lg:px-0 mt-10 lg:mt-0 flex flex-col items-center lg:items-start text-center lg:text-left">

            <span className="text-[0.7rem] font-medium tracking-[0.08em] uppercase text-gold-dk mb-5">
              Est. 2023 — Premium Body Jewelry
            </span>

            <h1 className="text-[clamp(1.5rem,2.9vw,2.15rem)] text-ink leading-[1.3] max-w-2xl mb-8">
              At Fusion, we turn piercing into a luxury experience through an individualized approach and unparalleled standards for health and safety.
            </h1>

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
          </div>

        </div>
      </div>
    </section>
  );
}
