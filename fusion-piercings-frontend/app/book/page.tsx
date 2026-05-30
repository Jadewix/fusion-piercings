// app/book/page.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import DateTimePicker from '@/components/DateTimePicker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const PIERCING_TYPES = [
    'Earlobe',
    'Helix',
    'Tragus',
    'Conch',
    'Daith',
    'Industrial',
    'Nose (Nostril)',
    'Septum',
    'Belly / Navel',
    'Other',
];

const WHATSAPP_NUMBER = '96171433119';

export default function BookAppointmentPage() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        piercingType: '',
        otherPiercing: '',
        notes: '',
    });
    const [dateTime, setDateTime] = useState<Date | null>(null);

    const [fieldErrors, setFieldErrors] = useState<{ phone?: string; name?: string; piercingType?: string; dateTime?: string }>({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const cleaned = value.replace(/[^\d\s\-()+]/g, '');
            setFormData(f => ({ ...f, phone: cleaned }));
        } else if (name === 'piercingType') {
            // Clear otherPiercing when switching away from "Other"
            setFormData(f => ({ ...f, piercingType: value, otherPiercing: value === 'Other' ? f.otherPiercing : '' }));
        } else {
            setFormData(f => ({ ...f, [name]: value }));
        }
        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors(f => ({ ...f, [name]: undefined }));
        }
        // Clear piercing error when typing in the "other" field
        if (name === 'otherPiercing' && fieldErrors.piercingType) {
            setFieldErrors(f => ({ ...f, piercingType: undefined }));
        }
    };

    const isValidPhone = (phone: string) => {
        const digits = phone.replace(/[\s\-().]/g, '');
        return /^\+?\d{7,15}$/.test(digits);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: typeof fieldErrors = {};
        if (!formData.name.trim()) errors.name = 'Please enter your name';
        if (!isValidPhone(formData.phone)) errors.phone = 'Please enter a valid phone number';
        if (!formData.piercingType) errors.piercingType = 'Please select a piercing type';
        if (formData.piercingType === 'Other' && !formData.otherPiercing.trim()) errors.piercingType = 'Please specify your piercing type';
        if (!dateTime) errors.dateTime = 'Please select a date and time';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Build WhatsApp message
        const formattedDate = format(dateTime!, 'EEEE, MMMM d, yyyy');
        const formattedTime = format(dateTime!, 'h:mm a');

        const message = [
            `Hi! I'd like to book an appointment.`,
            ``,
            `*Name:* ${formData.name}`,
            `*Phone:* ${formData.phone}`,
            `*Piercing:* ${formData.piercingType === 'Other' ? formData.otherPiercing : formData.piercingType}`,
            `*Preferred Date:* ${formattedDate}`,
            `*Preferred Time:* ${formattedTime}`,
            formData.notes ? `*Notes:* ${formData.notes}` : '',
        ].filter(Boolean).join('\n');

        const encoded = encodeURIComponent(message);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

        setSubmitted(true);
        window.open(url, '_blank');
    };

    // Minimum date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const inputClass = "w-full bg-transparent border border-border-lt rounded-sm px-4 py-3 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors";

    return (
        <>
            <Nav />
            <CartDrawer />

            <main className="bg-bg">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-8 text-center overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(184,150,90,0.07) 0%, transparent 70%)' }}
                    />
                    <div className="relative z-10 max-w-[640px] mx-auto">
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-6 section-label-line">
                            Appointments
                        </span>
                        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold text-ink leading-[1.15] mb-5">
                            Book an Appointment
                        </h1>
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                            <div className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50" />
                        </div>
                        <p className="text-[clamp(0.88rem,1.4vw,1rem)] text-ink-2 leading-[1.9] font-light max-w-md mx-auto">
                            Fill in your details and we'll confirm your appointment via WhatsApp.
                        </p>
                    </div>
                </section>

                {/* ── Booking Form ─────────────────────────────────────── */}
                <section className="pb-24 sm:pb-32 px-4 sm:px-8">
                    <div className="max-w-[540px] mx-auto">

                        {submitted ? (
                            /* ── Success State ────────────────────────── */
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <h2 className="font-serif text-[1.8rem] font-semibold text-ink mb-4">
                                    You're All Set!
                                </h2>
                                <p className="text-ink-2 text-[0.9rem] leading-[1.8] mb-8 max-w-sm mx-auto">
                                    Your appointment request has been sent via WhatsApp. We'll get back to you shortly to confirm.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => { setSubmitted(false); setFormData({ name: '', phone: '', piercingType: '', otherPiercing: '', notes: '' }); setDateTime(null); }}
                                        className="px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
                                    >
                                        Book Another
                                    </button>
                                    <a
                                        href="/"
                                        className="px-8 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase bg-ink text-bg rounded-sm hover:bg-[#2a2620] transition-all text-center"
                                    >
                                        Back to Home
                                    </a>
                                </div>
                            </div>
                        ) : (
                            /* ── Form ─────────────────────────────────── */
                            <form onSubmit={handleSubmit} className="bg-bg-card border border-border-lt rounded-sm p-6 sm:p-10">

                                <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-6 border-b border-border-lt pb-3">
                                    Your Details
                                </h2>

                                {/* Name */}
                                <div className="mb-4">
                                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        className={`${inputClass} ${fieldErrors.name ? 'border-red-400 focus:border-red-500' : ''}`}
                                    />
                                    {fieldErrors.name && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.name}</p>}
                                </div>

                                {/* Phone */}
                                <div className="mb-4">
                                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        required
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+961 70 123 456"
                                        className={`${inputClass} ${fieldErrors.phone ? 'border-red-400 focus:border-red-500' : ''}`}
                                    />
                                    {fieldErrors.phone && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.phone}</p>}
                                </div>

                                <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-6 mt-8 border-b border-border-lt pb-3">
                                    Appointment Details
                                </h2>

                                {/* Piercing Type */}
                                <div className="mb-5">
                                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                        Piercing Type
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            className={`w-full flex items-center justify-between bg-transparent border rounded-sm px-4 py-3 text-[0.85rem] text-left transition-colors cursor-pointer ${
                                                fieldErrors.piercingType
                                                    ? 'border-red-400'
                                                    : 'border-border-lt focus:border-ink'
                                            } ${formData.piercingType ? 'text-ink' : 'text-ink-3'}`}
                                        >
                                            <span>{formData.piercingType || 'Select a piercing type'}</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3 flex-shrink-0">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-bg-card border-border-lt shadow-md" align="start">
                                            <DropdownMenuLabel className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-ink-3">
                                                Choose a piercing
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border-lt" />
                                            <DropdownMenuGroup>
                                                {PIERCING_TYPES.map(type => (
                                                    <DropdownMenuItem
                                                        key={type}
                                                        onClick={() => {
                                                            setFormData(f => ({
                                                                ...f,
                                                                piercingType: type,
                                                                otherPiercing: type === 'Other' ? f.otherPiercing : '',
                                                            }));
                                                            if (fieldErrors.piercingType) setFieldErrors(f => ({ ...f, piercingType: undefined }));
                                                        }}
                                                        className={`text-[0.82rem] cursor-pointer rounded-sm transition-colors ${
                                                            formData.piercingType === type
                                                                ? 'bg-ink text-bg focus:bg-ink focus:text-bg'
                                                                : 'text-ink hover:bg-ink/5 focus:bg-ink/5'
                                                        }`}
                                                    >
                                                        {type}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {formData.piercingType === 'Other' && (
                                        <input
                                            name="otherPiercing"
                                            value={formData.otherPiercing}
                                            onChange={handleChange}
                                            placeholder="Please describe your piercing"
                                            className={`${inputClass} mt-2 ${fieldErrors.piercingType && !formData.otherPiercing.trim() ? 'border-red-400 focus:border-red-500' : ''}`}
                                        />
                                    )}
                                    {fieldErrors.piercingType && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.piercingType}</p>}
                                </div>

                                {/* Date & Time Picker */}
                                <div className="mb-6">
                                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                        Preferred Date & Time
                                    </label>
                                    <DateTimePicker
                                        value={dateTime}
                                        onChange={(d) => {
                                            setDateTime(d);
                                            if (fieldErrors.dateTime) setFieldErrors(f => ({ ...f, dateTime: undefined }));
                                        }}
                                        minDate={tomorrow}
                                        placeholder="Pick a date and time"
                                        hasError={!!fieldErrors.dateTime}
                                    />
                                    {fieldErrors.dateTime && <p className="text-red-500 text-[0.72rem] mt-1.5">{fieldErrors.dateTime}</p>}
                                </div>

                                {/* Notes */}
                                <div className="mb-8">
                                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                        Additional Notes <span className="font-normal text-ink-3">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Any questions or special requests..."
                                        className={`${inputClass} resize-none h-24`}
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="w-full bg-ink text-bg text-[0.78rem] font-semibold tracking-[0.12em] uppercase py-4 rounded-sm hover:bg-[#2a2620] transition-all flex items-center justify-center gap-2.5"
                                >
                                    <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                                        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.651 4.823 1.785 6.845L2 30l7.345-1.763A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.55 11.55 0 0 1-5.882-1.608l-.422-.25-4.358 1.047 1.068-4.245-.275-.437A11.554 11.554 0 0 1 4.4 16C4.4 9.593 9.593 4.4 16 4.4 22.407 4.4 27.6 9.593 27.6 16c0 6.407-5.193 11.6-11.6 11.6zm6.36-8.674c-.348-.174-2.06-1.016-2.38-1.132-.32-.116-.552-.174-.784.174-.232.348-.9 1.132-1.103 1.364-.203.232-.406.26-.754.086-.348-.174-1.47-.542-2.8-1.727-1.034-.922-1.732-2.062-1.935-2.41-.203-.348-.022-.536.153-.71.157-.155.348-.406.522-.61.174-.202.232-.348.348-.58.116-.232.058-.436-.029-.61-.087-.174-.784-1.89-1.074-2.588-.283-.68-.57-.587-.784-.598l-.667-.011c-.232 0-.61.087-.928.435-.319.348-1.218 1.19-1.218 2.9s1.247 3.364 1.421 3.596c.174.232 2.454 3.746 5.946 5.253.831.359 1.48.573 1.985.733.834.265 1.594.228 2.194.138.669-.1 2.06-.842 2.35-1.656.29-.813.29-1.51.203-1.656-.086-.145-.319-.232-.667-.406z"/>
                                    </svg>
                                    Send via WhatsApp
                                </button>

                                <p className="text-[0.72rem] text-ink-3 text-center mt-4 leading-relaxed">
                                    This will open WhatsApp with your appointment details pre-filled. We'll confirm your slot shortly.
                                </p>
                            </form>
                        )}

                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}
