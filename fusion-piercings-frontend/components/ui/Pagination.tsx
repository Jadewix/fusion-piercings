// components/ui/Pagination.tsx
'use client';

import { getPageNumbers } from '@/lib/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
  /** When both are provided, renders a "Showing X–Y of Z" summary line. */
  total?: number;
  pageSize?: number;
}

export default function Pagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPageChange,
  loading = false,
  total,
  pageSize,
}: PaginationProps) {
  return (
    <>
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-14" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage || loading}
            className="flex items-center gap-1 px-3 h-9 text-[0.72rem] font-medium tracking-[0.08em] uppercase rounded-sm border border-border text-ink-2 hover:border-ink hover:text-ink transition-all disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span className="hidden sm:inline">Prev</span>
          </button>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-ink-3 text-sm select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={loading}
                aria-current={p === page ? 'page' : undefined}
                className={`w-9 h-9 text-[0.78rem] font-medium rounded-sm border transition-all disabled:pointer-events-none ${
                  p === page
                    ? 'bg-ink border-ink text-bg'
                    : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || loading}
            className="flex items-center gap-1 px-3 h-9 text-[0.72rem] font-medium tracking-[0.08em] uppercase rounded-sm border border-border text-ink-2 hover:border-ink hover:text-ink transition-all disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </nav>
      )}

      {total !== undefined && pageSize !== undefined && (
        <p className="text-center text-[0.72rem] text-ink-3 mt-5">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </p>
      )}
    </>
  );
}
