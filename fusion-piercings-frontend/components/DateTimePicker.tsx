// components/DateTimePicker.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isBefore,
    startOfDay,
} from 'date-fns';

interface Props {
    value: Date | null;
    onChange: (date: Date) => void;
    minDate?: Date;
    placeholder?: string;
    hasError?: boolean;
}

export default function DateTimePicker({ value, onChange, minDate, placeholder, hasError }: Props) {
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(value || minDate || new Date());
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

    // Build calendar grid
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const today = startOfDay(new Date());
    const minDay = minDate ? startOfDay(minDate) : null;

    function isDisabled(day: Date) {
        if (minDay && isBefore(day, minDay)) return true;
        return false;
    }

    function handleDayClick(day: Date) {
        if (isDisabled(day)) return;
        const hours = value ? value.getHours() : 10;
        const minutes = value ? value.getMinutes() : 0;
        const newDate = new Date(day);
        newDate.setHours(hours, minutes, 0, 0);
        onChange(newDate);
    }

    function handleTimeChange(type: 'hour' | 'minute' | 'ampm', val: string) {
        const current = value || new Date();
        const newDate = new Date(current);

        if (type === 'hour') {
            const hour = parseInt(val, 10);
            const isPM = newDate.getHours() >= 12;
            newDate.setHours(isPM ? (hour % 12) + 12 : hour % 12);
        } else if (type === 'minute') {
            newDate.setMinutes(parseInt(val, 10));
        } else if (type === 'ampm') {
            const hours = newDate.getHours();
            if (val === 'AM' && hours >= 12) newDate.setHours(hours - 12);
            else if (val === 'PM' && hours < 12) newDate.setHours(hours + 12);
        }

        onChange(newDate);
    }

    const selectedHour12 = value ? (value.getHours() % 12 === 0 ? 12 : value.getHours() % 12) : null;
    const selectedMinute = value ? value.getMinutes() : null;
    const selectedAMPM = value ? (value.getHours() >= 12 ? 'PM' : 'AM') : null;

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between bg-transparent border rounded-sm px-4 py-3 text-[0.85rem] text-left transition-colors ${
                    hasError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-border-lt focus:border-ink'
                } ${value ? 'text-ink' : 'text-ink-3'}`}
            >
                <span>
                    {value
                        ? format(value, "MMM d, yyyy  ·  h:mm aa")
                        : placeholder || 'Select date & time'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-3 flex-shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-bg-card border border-border-lt rounded-sm shadow-md animate-fade-in overflow-hidden">
                    <div className="flex">

                        {/* Calendar */}
                        <div className="p-3 w-[210px]">
                            {/* Month nav */}
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-ink-2 hover:bg-ink/5 hover:text-ink transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                                </button>
                                <span className="text-[0.72rem] font-semibold text-ink tracking-wide">
                                    {format(viewMonth, 'MMM yyyy')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-ink-2 hover:bg-ink/5 hover:text-ink transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 mb-0.5">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                    <div key={i} className="text-center text-[0.58rem] font-semibold uppercase text-ink-3 py-0.5">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days grid */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map(day => {
                                    const disabled = isDisabled(day);
                                    const inMonth = isSameMonth(day, viewMonth);
                                    const selected = value ? isSameDay(day, value) : false;
                                    const isToday = isSameDay(day, today);

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => handleDayClick(day)}
                                            className={`w-[26px] h-[26px] mx-auto rounded-full text-[0.68rem] font-medium flex items-center justify-center transition-all duration-150 ${
                                                selected
                                                    ? 'bg-ink text-bg'
                                                    : disabled
                                                        ? 'text-ink-3/40 cursor-not-allowed'
                                                        : !inMonth
                                                            ? 'text-ink-3/50 hover:bg-ink/5'
                                                            : isToday
                                                                ? 'text-gold-dk font-bold hover:bg-ink/5'
                                                                : 'text-ink hover:bg-ink/5'
                                            }`}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time columns */}
                        <div className="flex border-l border-border-lt">
                            {/* Hours */}
                            <TimeColumn
                                items={Array.from({ length: 12 }, (_, i) => i + 1)}
                                selected={selectedHour12}
                                onSelect={v => handleTimeChange('hour', v.toString())}
                                format={v => v.toString()}
                            />

                            {/* Minutes */}
                            <div className="border-l border-border-lt">
                                <TimeColumn
                                    items={Array.from({ length: 12 }, (_, i) => i * 5)}
                                    selected={selectedMinute}
                                    onSelect={v => handleTimeChange('minute', v.toString())}
                                    format={v => v.toString().padStart(2, '0')}
                                />
                            </div>

                            {/* AM/PM */}
                            <div className="border-l border-border-lt flex flex-col p-1 gap-0.5 justify-start">
                                {(['AM', 'PM'] as const).map(ampm => (
                                    <button
                                        key={ampm}
                                        type="button"
                                        onClick={() => handleTimeChange('ampm', ampm)}
                                        className={`w-8 h-8 rounded-sm text-[0.65rem] font-semibold tracking-[0.03em] transition-all duration-150 ${
                                            selectedAMPM === ampm
                                                ? 'bg-ink text-bg'
                                                : 'text-ink-2 hover:bg-ink/5 hover:text-ink'
                                        }`}
                                    >
                                        {ampm}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Scrollable time column ──────────────────────────────────────────────── */

function TimeColumn<T extends number>({ items, selected, onSelect, format: fmt }: {
    items: T[];
    selected: T | null;
    onSelect: (v: T) => void;
    format: (v: T) => string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the selected item once, on mount only (intentional empty deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!containerRef.current || selected === null) return;
        const idx = items.indexOf(selected);
        if (idx === -1) return;
        const child = containerRef.current.children[idx] as HTMLElement;
        if (child) child.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, []);

    return (
        <div
            ref={containerRef}
            className="flex flex-col p-1 gap-0.5 overflow-y-auto h-[240px] scrollbar-thin"
        >
            {items.map(item => (
                <button
                    key={item}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`w-8 h-8 rounded-sm text-[0.68rem] font-medium flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        selected === item
                            ? 'bg-ink text-bg'
                            : 'text-ink-2 hover:bg-ink/5 hover:text-ink'
                    }`}
                >
                    {fmt(item)}
                </button>
            ))}
        </div>
    );
}
