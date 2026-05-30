const ITEMS = [
  'FREE SHIPPING OVER $75',
  'NICKEL-FREE GUARANTEE',
  'STERILE & HYGIENIC',
  'PIERCER APPROVED',
];

export default function TrustBar() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-t border-b border-border bg-bg-warm py-3.5">
      <div className="flex gap-12 whitespace-nowrap animate-marquee w-max hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-ink-3">
            ✦ {item}
          </span>
        ))}
      </div>
    </div>
  );
}
