// components/admin/AdminPromoCodes.tsx
// Promo Codes dashboard: create codes with a percentage off, switch them on and
// off, and delete them. Checkout validates against whatever is active here.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PromoCode } from '@/lib/types';
import { formatDate } from './shared';
import ErrorState from './ErrorState';
import { adminFetch } from '@/lib/adminFetch';

const inputClass = "w-full bg-transparent border border-border-lt rounded-sm px-4 py-3 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors";

interface Props {
    offlineOr: (msg: string) => string;
}

export default function AdminPromoCodes({ offlineOr }: Props) {
    const [codes, setCodes]         = useState<PromoCode[] | null>(null);
    const [loadError, setLoadError] = useState(false);

    const [code, setCode]           = useState('');
    const [percent, setPercent]     = useState('');
    const [formError, setFormError] = useState('');
    const [creating, setCreating]   = useState(false);

    const [busyId, setBusyId]       = useState<number | null>(null);
    const [rowError, setRowError]   = useState('');

    const fetchCodes = useCallback(async () => {
        setLoadError(false);
        try {
            const res = await adminFetch('/admin/promo-codes');
            if (!res.ok) throw new Error('Failed to load promo codes');
            setCodes(await res.json());
        } catch (err) {
            console.error('Error fetching promo codes:', err);
            setLoadError(true);
        }
    }, []);

    useEffect(() => { fetchCodes(); }, [fetchCodes]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        const pct = Number(percent);
        if (code.length < 3) return setFormError('Codes need at least 3 characters.');
        if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
            return setFormError('The discount must be a whole number from 1 to 100.');
        }

        setCreating(true);
        try {
            const res = await adminFetch('/admin/promo-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, percent: pct }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || 'Failed to create promo code');
            setCodes(prev => [data, ...(prev || [])]);
            setCode('');
            setPercent('');
        } catch (err: any) {
            setFormError(offlineOr(err.message || 'Failed to create promo code'));
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (promo: PromoCode) => {
        setBusyId(promo.id);
        setRowError('');
        try {
            const res = await adminFetch(`/admin/promo-codes/${promo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !promo.active }),
            });
            if (!res.ok) throw new Error('Failed to update promo code');
            const updated: PromoCode = await res.json();
            setCodes(prev => prev?.map(p => p.id === updated.id ? updated : p) ?? null);
        } catch (err) {
            console.error('Error updating promo code:', err);
            setRowError(offlineOr(`Couldn't update ${promo.code}. Please try again.`));
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (promo: PromoCode) => {
        if (!window.confirm(`Delete promo code "${promo.code}"? Shoppers will no longer be able to use it.`)) return;
        setBusyId(promo.id);
        setRowError('');
        try {
            const res = await adminFetch(`/admin/promo-codes/${promo.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete promo code');
            setCodes(prev => prev?.filter(p => p.id !== promo.id) ?? null);
        } catch (err) {
            console.error('Error deleting promo code:', err);
            setRowError(offlineOr(`Couldn't delete ${promo.code}. Please try again.`));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="mb-12">
            {/* ─── New code ─────────────────────────────────────────────── */}
            <form onSubmit={handleCreate} className="bg-bg-card border border-border-lt rounded-sm p-4 sm:p-5 mb-10">
                <h2 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-4">New Promo Code</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        value={code}
                        onChange={e => {
                            // Codes are stored upper-case; restrict to what the server accepts.
                            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                            if (formError) setFormError('');
                        }}
                        placeholder="Code, e.g. SUMMER10"
                        aria-label="Promo code"
                        maxLength={30}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${inputClass} sm:flex-grow`}
                    />
                    <div className="relative sm:w-40 flex-shrink-0">
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={100}
                            step={1}
                            value={percent}
                            onChange={e => { setPercent(e.target.value); if (formError) setFormError(''); }}
                            placeholder="Discount"
                            aria-label="Discount percentage"
                            className={`${inputClass} pr-9`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.85rem] text-ink-3 pointer-events-none">%</span>
                    </div>
                    <button
                        type="submit"
                        disabled={creating || !code || !percent}
                        className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                        {creating ? 'Adding...' : 'Add Code'}
                    </button>
                </div>
                {formError
                    ? <p className="text-red-500 text-[0.72rem] mt-2">{formError}</p>
                    : <p className="text-[0.7rem] text-ink-3 mt-2">Takes this percentage off the items at checkout. Delivery is not discounted.</p>}
            </form>

            {/* ─── Existing codes ───────────────────────────────────────── */}
            {loadError ? (
                <ErrorState message={offlineOr('Failed to load promo codes.')} onRetry={fetchCodes} />
            ) : codes === null ? (
                <p className="text-ink-2 text-lg animate-pulse">Loading Promo Codes...</p>
            ) : (
                <>
                    <div className="flex items-center gap-3 border-b border-border-lt pb-3 mb-5">
                        <span className="text-sm font-semibold tracking-[0.15em] uppercase text-ink">All Codes</span>
                        <span className="text-ink-3 font-normal tracking-normal normal-case text-[0.78rem]">({codes.length})</span>
                    </div>

                    {rowError && <p className="text-red-500 text-[0.78rem] mb-4">{rowError}</p>}

                    {codes.length === 0 ? (
                        <p className="text-ink-2 text-sm">No promo codes yet.</p>
                    ) : codes.map(promo => (
                        <div
                            key={promo.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 sm:p-4 bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3 ${
                                busyId === promo.id ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        >
                            <div className="flex-grow min-w-0">
                                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                                    <h3 className={`text-[0.95rem] sm:text-[1rem] font-semibold tracking-[0.08em] break-all ${promo.active ? 'text-ink' : 'text-ink-3 line-through'}`}>
                                        {promo.code}
                                    </h3>
                                    <span className="text-[0.85rem] font-medium text-green-600">{promo.percent}% off</span>
                                </div>
                                <p className="text-[0.72rem] text-ink-3">
                                    Used {promo.times_used} time{promo.times_used !== 1 ? 's' : ''} · Added {formatDate(promo.created_at)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:flex-shrink-0">
                                <button
                                    onClick={() => handleToggle(promo)}
                                    title={promo.active ? 'Click to turn this code off' : 'Click to turn this code on'}
                                    className={`px-3 py-1.5 text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider rounded-full border whitespace-nowrap transition-all ${
                                        promo.active
                                            ? 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                                            : 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
                                    }`}
                                >
                                    {promo.active ? 'Active' : 'Off'}
                                </button>
                                <button
                                    onClick={() => handleDelete(promo)}
                                    title="Delete promo code"
                                    className="px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all rounded-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </section>
    );
}
