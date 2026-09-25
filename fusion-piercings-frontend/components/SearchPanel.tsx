// components/SearchPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { isAftercare } from '@/lib/categories';

interface Props {
  open: boolean;
  onClose: () => void;
}

const RESULT_LIMIT = 8;
const DEBOUNCE_MS = 250;

// Drop-down search under the nav bar. Results are fetched live as the user
// types (debounced) from the same /products endpoint the shop grid uses.
export default function SearchPanel({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, limit: String(RESULT_LIMIT) });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.products || []);
        setTotal(data.total || 0);
        setError(false);
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [trimmed]);

  if (!open) return null;

  return (
      <>
        {/* Backdrop — click anywhere outside the panel to close. Anchored to
            the nav's bottom edge rather than `fixed`: the nav's backdrop-blur
            makes it the containing block for fixed children. */}
        <div className="absolute left-0 right-0 top-full h-screen bg-ink/20" onClick={onClose} aria-hidden="true" />

        <div className="bg-bg border-t border-b border-border shadow-md">
          <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-5">
            <div className="flex items-center gap-3 border-b border-ink pb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-3 flex-shrink-0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search jewelry & aftercare…"
                  aria-label="Search products"
                  className="flex-1 bg-transparent outline-none text-[0.95rem] text-ink placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                  onClick={onClose}
                  className="p-1 rounded-full text-ink hover:bg-ink/5 transition-all"
                  aria-label="Close search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {trimmed.length >= 2 && (
                <div className="mt-3 max-h-[60vh] overflow-y-auto">
                  {error ? (
                      <p className="py-6 text-center text-[0.85rem] text-ink-3">Search is unavailable right now. Please try again.</p>
                  ) : loading && results.length === 0 ? (
                      <p className="py-6 text-center text-[0.85rem] text-ink-3">Searching…</p>
                  ) : results.length === 0 ? (
                      <p className="py-6 text-center text-[0.85rem] text-ink-3">No products match “{trimmed}”.</p>
                  ) : (
                      <>
                        <ul className={loading ? 'opacity-60 transition-opacity' : ''}>
                          {results.map(product => (
                              <li key={product.id}>
                                <Link
                                    href={`/product/${product.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 py-2.5 px-2 -mx-2 rounded-sm hover:bg-ink/5 transition-colors"
                                >
                                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden">
                                    {product.image_url && (
                                        <Image src={product.image_url} alt="" fill sizes="48px" className="object-cover" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[0.62rem] font-semibold tracking-[0.16em] uppercase text-ink-3">
                                      {isAftercare(product) ? 'Aftercare' : (product.category || 'Collection')}
                                    </div>
                                    <div className="text-[0.875rem] font-medium text-ink truncate">{product.name}</div>
                                  </div>
                                  <span className="text-[0.85rem] font-bold text-ink flex-shrink-0">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                </Link>
                              </li>
                          ))}
                        </ul>
                        {total > results.length && (
                            <p className="pt-3 text-center text-[0.72rem] text-ink-3">
                              Showing {results.length} of {total} — keep typing to narrow it down.
                            </p>
                        )}
                      </>
                  )}
                </div>
            )}
          </div>
        </div>
      </>
  );
}
