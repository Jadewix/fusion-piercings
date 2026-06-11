import Link from 'next/link';
import { BUSINESS, LOCATIONS } from '@/lib/business';

export default function Footer() {
  return (
    <footer className="bg-ink py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Social links */}
        <div className="flex gap-2">
          <a
            href="https://www.instagram.com/fusionpiercings/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center text-white/40 hover:border-gold-lt hover:text-gold-lt transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@rita.sayde"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center text-white/40 hover:border-gold-lt hover:text-gold-lt transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
            </svg>
          </a>
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Legal">
          <Link href="/privacy" className="text-[0.72rem] text-white/40 hover:text-gold-lt transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[0.72rem] text-white/40 hover:text-gold-lt transition-colors">Terms of Service</Link>
          <Link href="/returns" className="text-[0.72rem] text-white/40 hover:text-gold-lt transition-colors">Returns &amp; Refunds</Link>
          <Link href="/shipping" className="text-[0.72rem] text-white/40 hover:text-gold-lt transition-colors">Shipping &amp; Delivery</Link>
        </nav>

        {/* Locations + copyright */}
        <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-1 w-full sm:w-auto">

          {/* Mobile: stacked with location pin icons. The ul itself sizes to its widest
              row (inherits items-center from parent so it's centered as a block),
              while items-start keeps every row's icon and text on the same x. */}
          <ul className="flex flex-col items-start gap-1.5 sm:hidden">
            {LOCATIONS.map(loc => (
              <li key={loc.value} className="flex items-center gap-2 text-[0.72rem] text-white/45 font-light">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="text-white/40 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{loc.label}, {loc.region}</span>
              </li>
            ))}
          </ul>

          {/* Desktop: inline with · separators */}
          <p className="hidden sm:block text-[0.72rem] text-white/45 font-light text-right">
            {LOCATIONS.map((loc, i) => (
              <span key={loc.value}>
                {loc.label}, {loc.region}
                {i < LOCATIONS.length - 1 && <span className="mx-2 text-white/25">·</span>}
              </span>
            ))}
          </p>

          <p className="text-[0.72rem] text-white/25 font-light mt-1 sm:mt-0">
            &copy; 2026 Fusion Piercings. All rights reserved.
          </p>
          <p className="text-[0.65rem] text-white/15 font-light">
            Developed by Planck
          </p>
        </div>

      </div>
    </footer>
  );
}
