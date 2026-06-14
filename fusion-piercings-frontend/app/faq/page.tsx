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
                aria-expanded={open}
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
export default function FaqPage() {
    return (
        <>
            <Nav />
            <CartDrawer />

            <main className="bg-bg">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 text-center overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(184,150,90,0.07) 0%, transparent 70%)' }}
                    />
                    <div className="relative z-10 max-w-[640px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
                            Questions &amp; Answers
                        </span>
                        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold text-ink leading-[1.15] mb-5">
                            Piercing FAQ
                        </h1>
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                            <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
                        </div>
                        <p className="text-[clamp(0.88rem,1.4vw,1rem)] text-ink-2 leading-[1.9] font-light max-w-md mx-auto">
                            Clear answers about piercing pain, healing times, jewelry materials, and aftercare.
                        </p>
                    </div>
                </section>

                {/* ── FAQ list ─────────────────────────────────────────── */}
                <section className="pb-16 sm:pb-24 px-4 sm:px-8">
                    <div className="max-w-[700px] mx-auto">
                        <div className="border-t border-border-lt">
                            {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
                        </div>

                        {/* Internal links — natural cross-references for users & crawlers */}
                        <p className="text-[0.82rem] text-ink-2 leading-[1.9] font-light mt-10">
                            Looking for more detail? Read our full{' '}
                            <Link href="/care-guide" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">piercing care guide</Link>,
                            explore{' '}
                            <Link href="/collections/titanium" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">implant-grade titanium jewelry</Link>{' '}
                            for fresh piercings, or{' '}
                            <Link href="/book" className="text-gold-dk underline underline-offset-2 hover:text-ink transition-colors">book a piercing appointment</Link>.
                        </p>
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────────────────────── */}
                <section className="py-16 sm:py-24 px-4 sm:px-8 text-center bg-bg-warm border-t border-b border-border">
                    <div className="max-w-[500px] mx-auto">
                        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-ink mb-4">
                            Still have a question?
                        </h2>
                        <p className="text-[0.88rem] text-ink-2 leading-[1.8] font-light mb-8">
                            Message us on WhatsApp for personal advice, or book your appointment online.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href="https://wa.me/96171433119"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 bg-ink text-bg border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] hover:-translate-y-px hover:shadow-md transition-all duration-200"
                            >
                                Ask on WhatsApp
                            </a>
                            <Link
                                href="/book"
                                className="inline-flex items-center justify-center bg-transparent text-ink border-[1.5px] border-ink px-8 py-3.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-ink hover:text-bg hover:-translate-y-px hover:shadow-md transition-all duration-200"
                            >
                                Book an Appointment
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}
