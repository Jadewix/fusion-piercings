// app/contact/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Toast from '@/components/Toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [error, setError]               = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to send message');
      setIsSuccess(true);
    } catch {
      setError('Something went wrong. Please try again or reach out on Instagram.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border border-border-lt rounded-sm px-4 py-3 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors';

  // ─── Success screen ───────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <>
        <Nav />
        <CartDrawer />
        <Toast />
        <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-32">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink mb-3 text-center">Message Sent</h1>
          <p className="text-ink-2 text-sm text-center max-w-sm mb-8">
            Thank you for reaching out! We'll get back to you as soon as possible.
          </p>
          <Link
            href="/"
            className="bg-ink text-bg px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
          >
            Back to Shop
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  // ─── Contact form ─────────────────────────────────────────────────────────
  return (
    <>
      <Nav />
      <CartDrawer />
      <Toast />

      <main className="min-h-screen bg-bg pt-32 pb-20 px-4 sm:px-8">
        <div className="max-w-[560px] mx-auto">

          {/* Header */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
              Get in Touch
            </span>
            <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-semibold text-ink">
              Contact Us
            </h1>
            <p className="text-[0.88rem] text-ink-2 mt-3 font-light leading-relaxed">
              Have a question about an order or a piece? We'd love to hear from you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-ink-3">Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-ink-3">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-ink-3">Email</label>
              <input
                required
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-ink-3">Message</label>
              <textarea
                required
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="What's on your mind?"
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && <p className="text-red-500 text-[0.8rem]">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink text-bg text-[0.8rem] font-semibold tracking-[0.12em] uppercase py-4 rounded-sm hover:bg-[#2a2620] transition-all disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
