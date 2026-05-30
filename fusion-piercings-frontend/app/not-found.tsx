// Styled 404 page (server component) for unmatched routes.
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
        Page Not Found
      </span>
      <h1 className="font-serif text-[clamp(2.5rem,6vw,4rem)] font-semibold text-ink mb-4">
        404
      </h1>
      <p className="text-ink-2 text-sm leading-relaxed max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase bg-ink text-bg rounded-sm hover:bg-[#2a2620] transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
