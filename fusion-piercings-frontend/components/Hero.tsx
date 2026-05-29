// components/Hero.tsx
export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8 pt-24 pb-20 bg-bg text-center"
    >
      {/* Subtle radial glow centred behind the content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 65% at 50% 50%, rgba(184,150,90,0.07) 0%, transparent 70%)`,
        }}
      />

      {/* FUSION watermark — the user liked this */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(10rem,26vw,28rem)] font-extrabold tracking-[0.06em] leading-none whitespace-nowrap pointer-events-none select-none"
        style={{ color: 'transparent', WebkitTextStroke: '1px rgba(20,18,15,0.04)' }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[740px] mx-auto flex flex-col items-center justify-evenly flex-1 gap-2">

        {/* Label */}
        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk section-label-line">
          Est. 2025 — Premium Body Jewelry
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

          <p className="text-[clamp(0.88rem,1.4vw,1rem)] text-ink-2 leading-[1.9] font-light max-w-md">
            At FUSION we turn piercing into a luxury experience, an individualized approach, and unparalleled standards for health and safety.
          </p>
        </div>

        {/* CTA */}
        <a
          href="#shop"
          className="inline-flex items-center bg-ink text-bg border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
        >
          Shop Collection
        </a>

        {/* Stats */}
        <div className="flex items-center justify-center divide-x divide-border">
          {[['10k+','Customers'],['50+','Designs'],['100%','Nickel Free']].map(([n, l]) => (
            <div key={n} className="flex flex-col items-center px-6 sm:px-10">
              <span className="text-[1.6rem] font-bold text-ink leading-none">{n}</span>
              <span className="text-[0.63rem] text-ink-3 tracking-[0.1em] uppercase mt-1.5">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-4 sm:left-8 flex items-center gap-3 z-10">
        <span className="text-[0.62rem] tracking-[0.22em] uppercase text-ink-3">Scroll</span>
        <div className="w-9 h-px" style={{ background: 'linear-gradient(to right,#8A6E3A,transparent)' }} />
      </div>
    </section>
  );
}
