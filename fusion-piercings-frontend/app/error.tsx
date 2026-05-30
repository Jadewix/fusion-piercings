'use client';

// Route-segment error boundary. Catches render/runtime errors in any page under
// the root layout and shows an on-brand fallback instead of a blank screen.
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
        Something went wrong
      </span>
      <h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-ink mb-4">
        We hit an unexpected error
      </h1>
      <p className="text-ink-2 text-sm leading-relaxed max-w-md mb-8">
        Sorry for the inconvenience. You can try again, or head back to the homepage.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase bg-ink text-bg rounded-sm hover:bg-[#2a2620] transition-all"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
