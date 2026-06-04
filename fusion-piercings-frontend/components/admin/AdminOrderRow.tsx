// components/admin/AdminOrderRow.tsx
'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Order, OrderItem, OrderStatus } from '@/lib/types';
  import { ORDER_STATUSES, getStatusStyle, formatDate, formatColor } from './shared';

interface AdminOrderRowProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpand: (orderId: number) => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void> | void;
}

function AdminOrderRowBase({ order, isExpanded, onToggleExpand, onUpdateStatus }: AdminOrderRowProps) {
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const style = getStatusStyle(order.status);
  const items: OrderItem[] = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const hasChanged = pendingStatus !== order.status;

  // Sync local pending status when the saved order status changes
  useEffect(() => { setPendingStatus(order.status); }, [order.status]);

  return (
    <div className="bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3 overflow-hidden">
      <div
        onClick={() => onToggleExpand(order.id)}
        className="w-full p-3 sm:p-4 text-left cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3">
                Order #{order.id}
              </span>
              <span className="text-[0.6rem] text-ink-3">
                {formatDate(order.created_at)}
              </span>
            </div>
            <h3 className="text-[0.92rem] sm:text-[1rem] font-medium text-ink leading-snug">
              {order.first_name} {order.last_name}
            </h3>
            <p className="text-[0.75rem] text-ink-3 mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''} · ${Number(order.total_amount).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:flex-shrink-0">
            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider rounded-full border whitespace-nowrap ${style.color} ${style.bg} ${style.border}`}>
              {style.label}
            </span>
            <svg
              className={`w-4 h-4 text-ink-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 border-t border-border-lt pt-4 animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-3">Customer Details</h4>
              <div className="space-y-1.5 text-[0.82rem] text-ink">
                <p><span className="text-ink-3">Name:</span> {order.first_name} {order.last_name}</p>
                <p><span className="text-ink-3">Phone:</span> {order.phone}</p>
                {order.email && <p><span className="text-ink-3">Email:</span> {order.email}</p>}
                <p><span className="text-ink-3">Address:</span> {order.building ? `${order.building}, ` : ''}{order.address}, {order.city}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-3">Payment Summary</h4>
              <div className="space-y-1.5 text-[0.82rem] text-ink">
                <p className="flex justify-between"><span className="text-ink-3">Subtotal</span> <span>${Number(order.subtotal).toFixed(2)}</span></p>
                <p className="flex justify-between"><span className="text-ink-3">Delivery</span> <span>{Number(order.delivery_fee) === 0 ? 'Free' : `$${Number(order.delivery_fee).toFixed(2)}`}</span></p>
                <p className="flex justify-between font-semibold border-t border-border-lt pt-1.5 mt-1.5"><span>Total (COD)</span> <span>${Number(order.total_amount).toFixed(2)}</span></p>
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="mt-5">
            <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-3">Ordered Items</h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-border-lt last:border-0">
                  {item.image_url && (
                    <div className="w-10 h-10 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <p className="text-[0.82rem] font-medium text-ink truncate">{item.name}</p>
                    <p className="text-[0.7rem] text-ink-3">
                      Qty: {item.qty}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${formatColor(item.color)}` : ""}
                    </p>
                  </div>
                  <span className="text-[0.82rem] font-medium text-ink flex-shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Selector */}
          <div className="mt-5 pt-4 border-t border-border-lt">
            <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-3">Update Status</h4>
            <div className="flex flex-wrap items-center gap-2">
              {ORDER_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setPendingStatus(s.value)}
                  className={`px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider rounded-full border transition-all ${
                    pendingStatus === s.value
                      ? `${s.color} ${s.bg} ${s.border}`
                      : 'border-border-lt text-ink-3 hover:border-ink hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {hasChanged && (
                <button
                  onClick={async () => {
                    setSaving(true);
                    await onUpdateStatus(order.id, pendingStatus);
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="ml-2 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider rounded-sm bg-ink text-bg hover:bg-[#2a2620] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized: only rows whose props actually change (e.g. the one being expanded)
// re-render when the dashboard re-renders. Requires stable callback props.
export default memo(AdminOrderRowBase);
