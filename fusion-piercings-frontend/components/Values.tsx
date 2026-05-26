const VALUES = [
  { icon: '◉', title: 'Piercer Approved',  desc: 'Trusted and recommended by professional body piercers.' },
  { icon: '◎', title: 'Ethically Crafted', desc: 'Fair wages, sustainable practices. Beautiful without the compromise.' },
];

export default function Values() {
  return (
    <section className="py-20 bg-bg-warm border-t border-b border-border">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {VALUES.map(v => (
            <div
              key={v.title}
              className="p-8 bg-bg-card border border-border rounded-sm shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-gold/30 transition-all duration-300"
            >
              <div className="text-xl text-gold mb-4">{v.icon}</div>
              <h4 className="text-sm font-semibold text-ink mb-2 tracking-[0.02em]">{v.title}</h4>
              <p className="text-[0.78rem] text-ink-2 leading-relaxed font-light">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
