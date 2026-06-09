// lib/pagination.ts
// Shared pagination helpers used by the storefront product grid (Shop.tsx) and
// the admin orders list. PageMeta mirrors the server-side pagination shape
// returned by the /api/products and /api/admin/orders endpoints.

export interface PageMeta {
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Build the list of page buttons to render, inserting 'ellipsis' markers so the
 * control stays compact for large page counts.
 * Shows: 1 … [current-1, current, current+1] … total
 */
export function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}
