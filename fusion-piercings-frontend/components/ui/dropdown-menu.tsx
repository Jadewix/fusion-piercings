// components/ui/dropdown-menu.tsx
// Custom dropdown menu component styled like shadcn, compatible with Tailwind v3
'use client';

import { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';

/* ── Context ──────────────────────────────────────────────────────────── */

interface DropdownCtx {
    open: boolean;
    setOpen: (v: boolean) => void;
}
const Ctx = createContext<DropdownCtx>({ open: false, setOpen: () => {} });

/* ── Root ─────────────────────────────────────────────────────────────── */

export function DropdownMenu({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    return (
        <Ctx.Provider value={{ open, setOpen }}>
            <div ref={ref} className="relative">
                {children}
            </div>
        </Ctx.Provider>
    );
}

/* ── Trigger ──────────────────────────────────────────────────────────── */

export function DropdownMenuTrigger({ children, className }: { children: ReactNode; className?: string }) {
    const { open, setOpen } = useContext(Ctx);
    return (
        <button type="button" onClick={() => setOpen(!open)} className={className}>
            {children}
        </button>
    );
}

/* ── Content ──────────────────────────────────────────────────────────── */

export function DropdownMenuContent({ children, className, align = 'start' }: { children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
    const { open } = useContext(Ctx);
    if (!open) return null;

    const alignClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

    return (
        <div className={`absolute z-50 top-full mt-1.5 ${alignClass} min-w-[200px] w-full bg-bg-card border border-border-lt rounded-sm shadow-md animate-fade-in overflow-hidden ${className || ''}`}>
            <div className="py-1">
                {children}
            </div>
        </div>
    );
}

/* ── Group ────────────────────────────────────────────────────────────── */

export function DropdownMenuGroup({ children }: { children: ReactNode }) {
    return <div role="group">{children}</div>;
}

/* ── Label ────────────────────────────────────────────────────────────── */

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={`px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-ink-3 ${className || ''}`}>
            {children}
        </div>
    );
}

/* ── Item ─────────────────────────────────────────────────────────────── */

export function DropdownMenuItem({ children, onClick, className, disabled }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
    const { setOpen } = useContext(Ctx);

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => {
                if (disabled) return;
                onClick?.();
                setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-[0.82rem] transition-colors duration-100 ${
                disabled
                    ? 'text-ink-3/50 cursor-not-allowed'
                    : className || 'text-ink hover:bg-ink/5 cursor-pointer'
            }`}
        >
            {children}
        </button>
    );
}

/* ── Separator ────────────────────────────────────────────────────────── */

export function DropdownMenuSeparator({ className }: { className?: string }) {
    return <div className={`my-1 h-px bg-border-lt ${className || ''}`} />;
}
