// app/checkout/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart } = useCart();

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        building: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({});

    // Formatting helpers


    const deliveryFee = cartTotal >= 75 ? 0 : 3.00; // Standard $3 delivery fee if under $75
    const finalTotal = cartTotal + deliveryFee;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validation helpers
    const isValidEmail = (email: string) => {
        // Must have local@domain.tld format with a real TLD (2+ chars)
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    };

    const isValidPhone = (phone: string) => {
        // Strip spaces, dashes, parens — then check for 7-15 digits (optionally starting with +)
        const digits = phone.replace(/[\s\-().]/g, '');
        return /^\+?\d{7,15}$/.test(digits);
    };

    // --- UPDATED SUBMIT FUNCTION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setError('');

        // Validate email & phone before submitting
        const errors: { email?: string; phone?: string } = {};
        if (!isValidEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!isValidPhone(formData.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    items: cart,
                    // THESE THREE LINES MUST MATCH THE BACKEND EXACTLY:
                    subtotal: cartTotal,
                    deliveryFee: deliveryFee,
                    total: finalTotal,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to place order');
            }

            const data = await res.json();

            setOrderId(data.orderId);
            clearCart();
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-transparent border border-border-lt rounded-sm px-4 py-3 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors";

    // --- SUCCESS SCREEN ---
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-bg py-32 px-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1 className="font-serif text-3xl font-semibold text-ink mb-4 text-center">Order Confirmed</h1>
                {orderId && (
                    <p className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2 text-center">
                        Order #{orderId}
                    </p>
                )}
                <p className="text-ink-2 mb-8 text-center max-w-md">
                    Thank you for your purchase! We are preparing your order and will contact you at {formData.phone} for delivery details.
                </p>
                <Link href="/" className="bg-ink text-bg px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    // --- CHECKOUT SCREEN ---
    return (
        <div className="min-h-screen bg-bg pt-24 pb-16">
            <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

                {/* Left Column: Shipping Form */}
                <div className="lg:col-span-7">
                    <h1 className="font-serif text-[2rem] font-semibold text-ink mb-8">Checkout</h1>

                    <form onSubmit={handleSubmit}>
                        <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-6 border-b border-border-lt pb-3">
                            Delivery Information
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input required name="firstName" value={formData.firstName} onChange={handleChange}
                                   placeholder="First Name" className={inputClass}/>
                            <input required name="lastName" value={formData.lastName} onChange={handleChange}
                                   placeholder="Last Name" className={inputClass}/>
                        </div>
                        <div className="mb-4">
                            <input required name="email" type="email" value={formData.email}
                                   onChange={e => { handleChange(e); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: undefined })); }}
                                   placeholder="Email Address (For your receipt)"
                                   className={`${inputClass} ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : ''}`}/>
                            {fieldErrors.email && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.email}</p>}
                        </div>

                        <div className="mb-4">
                            <input required name="phone" type="tel" value={formData.phone}
                                   onChange={e => {
                                       // Only allow digits, spaces, dashes, parens, and leading +
                                       const val = e.target.value.replace(/[^\d\s\-()+]/g, '');
                                       setFormData(f => ({ ...f, phone: val }));
                                       if (fieldErrors.phone) setFieldErrors(f => ({ ...f, phone: undefined }));
                                   }}
                                   placeholder="Phone Number (e.g., +961 70 123 456)"
                                   className={`${inputClass} ${fieldErrors.phone ? 'border-red-400 focus:border-red-500' : ''}`}/>
                            {fieldErrors.phone && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.phone}</p>}
                        </div>
                        <input required name="city" value={formData.city} onChange={handleChange}
                               placeholder="City / Region" className={`${inputClass} mb-4`}/>
                        <input required name="address" value={formData.address} onChange={handleChange}
                               placeholder="Street Address" className={`${inputClass} mb-4`}/>
                        <input name="building" value={formData.building} onChange={handleChange}
                               placeholder="Building, Floor, Apartment (Optional)" className={`${inputClass} mb-8`}/>

                        <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-6 border-b border-border-lt pb-3">
                            Payment Method
                        </h2>

                        <div className="border border-ink rounded-sm p-4 mb-8 bg-ink/5">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border-[5px] border-ink flex-shrink-0"/>
                                <span className="text-[0.9rem] font-medium text-ink">Cash on Delivery (COD)</span>
                            </div>
                            <p className="text-[0.75rem] text-ink-2 mt-2 ml-7">
                                Pay in cash directly to the driver when your jewelry arrives.
                            </p>
                        </div>

                        {error && (
                            <p className="text-red-600 text-[0.8rem] mb-4 text-center">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting || cart.length === 0}
                            className="w-full bg-ink text-bg text-[0.8rem] font-semibold tracking-[0.12em] uppercase py-4 rounded-sm hover:bg-[#2a2620] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Place Order'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-bg-card border border-border-lt rounded-sm p-6 lg:p-8 sticky top-24">
                        <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-6 border-b border-border-lt pb-3">
                            Order Summary
                        </h2>

                        <div className="max-h-[300px] overflow-y-auto mb-6 divide-y divide-border-lt pr-2">
                            {cart.length === 0 ? (
                                <p className="text-sm text-ink-2 py-4">Your cart is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.cartKey} className="flex gap-4 py-4">
                                        <div className="w-16 h-16 bg-gray-50 border border-border-lt rounded-sm relative overflow-hidden flex-shrink-0">
                                            {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-[0.85rem] font-medium text-ink leading-tight mb-1">{item.name}</p>
                                            <p className="text-[0.7rem] text-ink-3 mb-1">{item.size ? `${item.size} · ` : ''}{item.color ? item.color.charAt(0).toUpperCase() + item.color.slice(1) : ''}</p>
                                            <p className="text-[0.75rem] text-ink-2">Qty: {item.qty}</p>
                                        </div>
                                        <div className="text-[0.85rem] font-medium text-ink">
                                            ${(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-border-lt pt-4 space-y-3 mb-6">
                            <div className="flex justify-between text-[0.85rem] text-ink-2">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[0.85rem] text-ink-2">
                                <span>Delivery</span>
                                <span>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span>
                            </div>
                        </div>

                        <div className="border-t border-ink pt-4 flex justify-between items-end">
                            <span className="text-[1rem] font-semibold text-ink">Total</span>
                            <span className="text-[1.4rem] font-bold text-ink">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}