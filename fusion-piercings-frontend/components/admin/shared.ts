// components/admin/shared.ts
// Shared constants & helpers for the admin dashboard rows.
import { OrderStatus } from '@/lib/types';

export interface OrderStatusConfig {
  value: OrderStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const ORDER_STATUSES: OrderStatusConfig[] = [
  { value: 'pending',   label: 'Pending',   color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { value: 'shipped',   label: 'Shipped',   color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'delivered', label: 'Delivered', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200'    },
];

export function getStatusStyle(status: OrderStatus): OrderStatusConfig {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
}

export function formatMetal(metal?: string): string {
  if (!metal) return 'Gold';
  return metal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
