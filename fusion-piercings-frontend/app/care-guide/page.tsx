'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { FAQS } from './faqs';

/* ─── FAQ Accordion Item ──────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-border-lt">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
            >
                <span className="text-[0.88rem] sm:text-[0.92rem] font-medium text-ink group-hover:text-gold-dk transition-colors">{q}</span>
                <svg
                    className={`w-4 h-4 text-ink-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                </svg>
            </button>
            {open && (
                <div className="pb-5 animate-fade-in">
                    <p className="text-[0.82rem] text-ink-2 leading-[1.8] font-light">{a}</p>
                </div>
            )}
        </div>
    );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CareGuidePage() {
    return (
        <>
            <Nav />
            <CartDrawer />

            <main className="bg-bg">

                {/* ── 1. HERO ──────────────────────────────────────────── */}
                <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-8 text-center overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(184,150,90,0.07) 0%, transparent 70%)' }}
                    />
                    <div className="relative z-10 max-w-[640px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
                            Care &amp; Aftercare
                        </span>
                        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold text-ink leading-[1.15] mb-5">
                            Piercing Care Guide
                        </h1>
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                            <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
                        </div>
                        <p className="text-[clamp(0.88rem,1.4vw,1rem)] text-ink-2 leading-[1.9] font-light max-w-md mx-auto">
                            Everything you need to know before and after your piercing.
                        </p>
                    </div>
                </section>

                {/* ── 2. BEFORE YOUR PIERCING ──────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8">
                    <div className="max-w-[800px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            Preparation
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Before Your Piercing
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { icon: '01', title: 'Eat Before Your Appointment', desc: 'Have a proper meal beforehand to keep your blood sugar stable and reduce the chance of dizziness.' },
                                { icon: '02', title: 'Avoid Alcohol', desc: 'Do not drink alcohol for at least 24 hours before your piercing. It thins the blood and increases bleeding.' },
                                { icon: '03', title: 'Bring Valid ID', desc: 'A government-issued photo ID may be required. Check with your piercer about age and documentation requirements.' },
                                { icon: '04', title: 'Know the Requirements', desc: 'Minors typically need a parent or guardian present with valid ID. Ask about consent forms in advance.' },
                            ].map(item => (
                                <div key={item.icon} className="p-6 sm:p-7 bg-bg-card border border-border-lt rounded-sm hover:border-gold/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                                    <span className="text-[0.7rem] font-bold tracking-[0.2em] text-gold-dk mb-3 block">{item.icon}</span>
                                    <h3 className="text-[0.88rem] font-semibold text-ink mb-2 tracking-[0.02em]">{item.title}</h3>
                                    <p className="text-[0.78rem] text-ink-2 leading-relaxed font-light">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. AFTERCARE BASICS ──────────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8 bg-bg-warm border-t border-b border-border">
                    <div className="max-w-[800px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            Healing
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Aftercare Basics
                        </h2>
                        <div className="space-y-4">
                            {[
                                { title: 'Clean with sterile saline solution', desc: 'Use a sterile saline wound wash (0.9% sodium chloride) to gently clean around the piercing twice daily.' },
                                { title: 'Wash hands before touching', desc: 'Always wash your hands thoroughly with soap and water before touching or cleaning your piercing.' },
                                { title: 'Do not twist or rotate jewelry', desc: 'Rotating jewelry disrupts the healing tissue and can introduce bacteria. Let the piercing heal undisturbed.' },
                                { title: 'Avoid swimming during early healing', desc: 'Pools, hot tubs, and natural bodies of water harbor bacteria that can cause infections in fresh piercings.' },
                                { title: 'Sleep carefully and avoid pressure', desc: 'Sleeping on a fresh piercing can cause irritation bumps, migration, or prolonged swelling. Use a travel pillow if needed.' },
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-4 sm:gap-5 p-5 sm:p-6 bg-bg-card border border-border-lt rounded-sm">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center mt-0.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A6E3A" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[0.88rem] font-semibold text-ink mb-1 tracking-[0.02em]">{tip.title}</h3>
                                        <p className="text-[0.78rem] text-ink-2 leading-relaxed font-light">{tip.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 4. HEALING TIMELINE ──────────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8">
                    <div className="max-w-[800px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            Timeline
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Healing Timeline
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { area: 'Earlobe',   time: '6-8 weeks',   accent: 'bg-green-50 border-green-200 text-green-700' },
                                { area: 'Cartilage', time: '3-9 months',  accent: 'bg-blue-50 border-blue-200 text-blue-600'    },
                                { area: 'Nose',      time: '2-4 months',  accent: 'bg-purple-50 border-purple-200 text-purple-600' },
                                { area: 'Belly',     time: '6-12 months', accent: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                            ].map(item => (
                                <div key={item.area} className="p-5 sm:p-6 bg-bg-card border border-border-lt rounded-sm text-center hover:border-gold/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                                    <h3 className="text-[0.78rem] font-semibold tracking-[0.1em] uppercase text-ink-3 mb-3">{item.area}</h3>
                                    <span className={`inline-block px-3 py-1.5 text-[0.72rem] font-bold tracking-[0.08em] uppercase rounded-full border ${item.accent}`}>
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 5. NORMAL VS NOT NORMAL ─────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8 bg-bg-warm border-t border-b border-border">
                    <div className="max-w-[800px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            What to Expect
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Normal vs. Not Normal
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Normal */}
                            <div className="p-6 sm:p-7 bg-bg-card border border-border-lt rounded-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[0.78rem] font-semibold tracking-[0.12em] uppercase text-green-600">Normal</h3>
                                </div>
                                <ul className="space-y-3">
                                    {['Light swelling', 'Mild redness', 'Tenderness around the area', 'Clear or pale fluid discharge'].map(item => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                                            <span className="text-[0.82rem] text-ink-2 leading-relaxed font-light">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Not Normal */}
                            <div className="p-6 sm:p-7 bg-bg-card border border-border-lt rounded-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[0.78rem] font-semibold tracking-[0.12em] uppercase text-red-500">Not Normal</h3>
                                </div>
                                <ul className="space-y-3">
                                    {['Strong or increasing pain', 'Yellow or green discharge', 'Bad smell from the piercing', 'Excessive swelling or spreading redness'].map(item => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                                            <span className="text-[0.82rem] text-ink-2 leading-relaxed font-light">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 6. JEWELRY MATERIAL GUIDE ───────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8">
                    <div className="max-w-[800px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            Materials
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Jewelry Material Guide
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: 'Implant-Grade Titanium', badge: 'Recommended', badgeColor: 'border-green-200 text-green-600 bg-green-50', desc: 'The gold standard for piercings. Biocompatible, lightweight, and hypoallergenic. Ideal for fresh piercings and sensitive skin.' },
                                { title: 'Gold Plated Surgical Steel', badge: 'Premium', badgeColor: 'border-yellow-200 text-yellow-700 bg-yellow-50', desc: 'A durable, skin-safe option. Surgical steel provides strength and biocompatibility, while the gold plating adds a luxurious finish.' },
                                { title: 'Nickel-Free Jewelry', badge: 'Essential', badgeColor: 'border-blue-200 text-blue-600 bg-blue-50', desc: 'Nickel is the most common cause of jewelry allergies. All Fusion Piercings jewelry is 100% nickel-free and allergy safe.' },
                                { title: 'Why Quality Matters', badge: 'Important', badgeColor: 'border-purple-200 text-purple-600 bg-purple-50', desc: 'Low-quality metals cause reactions, slow healing, and increase infection risk. Investing in quality jewelry protects your piercing and your health.' },
                            ].map(item => (
                                <div key={item.title} className="p-6 sm:p-7 bg-bg-card border border-border-lt rounded-sm hover:border-gold/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <h3 className="text-[0.88rem] font-semibold text-ink tracking-[0.02em]">{item.title}</h3>
                                        <span className={`text-[0.55rem] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    </div>
                                    <p className="text-[0.78rem] text-ink-2 leading-relaxed font-light">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 7. FAQS ─────────────────────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8 bg-bg-warm border-t border-b border-border">
                    <div className="max-w-[640px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-4 section-label-line">
                            Questions
                        </span>
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-10">
                            Frequently Asked Questions
                        </h2>
                        <div className="border-t border-border-lt">
                            {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
                        </div>
                        <p className="text-[0.82rem] text-ink-2 leading-[1.9] font-light mt-8 text-center">
                            Have more questions? Visit our{' '}
                            <Link href="/faq" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">full piercing FAQ</Link>.
                        </p>
                    </div>
                </section>

                {/* ── 8. CTA ──────────────────────────────────────────── */}
                <section className="py-20 sm:py-28 px-4 sm:px-8 text-center">
                    <div className="max-w-[500px] mx-auto">
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-4">
                            Need help with your piercing?
                        </h2>
                        <p className="text-[0.88rem] text-ink-2 leading-[1.8] font-light mb-8">
                            Our team is here to help. Reach out anytime for advice or aftercare support.
                        </p>
                        <a
                            href="https://wa.me/96171433119"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 bg-ink text-bg border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 13.58c-.25.7-1.47 1.35-2.03 1.39-.5.04-1.12.19-3.65-.78-3.06-1.18-5.02-4.3-5.17-4.5-.15-.2-1.24-1.65-1.24-3.15s.78-2.24 1.06-2.55c.28-.3.62-.38.82-.38.2 0 .4 0 .58.01.18.01.43-.07.68.52.25.59.85 2.07.93 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.31.38-.45.51-.15.15-.3.3-.13.6.18.3.78 1.29 1.68 2.08 1.15.98 2.12 1.29 2.42 1.43.3.15.48.13.65-.08.18-.2.75-.88.95-1.18.2-.3.4-.25.68-.15.28.1 1.75.83 2.05.98.3.15.5.22.58.35.07.12.07.7-.18 1.4z"/>
                            </svg>
                            Contact Us on WhatsApp
                        </a>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}
