// app/admin/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, Order, OrderStatus } from '@/lib/types';
import AdminProductModal from '@/components/AdminProductModal';
import AdminProductRow from '@/components/admin/AdminProductRow';
import AdminOrderRow from '@/components/admin/AdminOrderRow';
import Pagination from '@/components/ui/Pagination';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { PageMeta } from '@/lib/pagination';

type ViewMode = 'active' | 'inactive';
type DashboardView = 'inventory' | 'orders';

interface Inventory {
    active:   Product[];
    inactive: Product[];
}

const ORDERS_PAGE_SIZE = 20;

// ─── Small presentational helpers (module scope = not recreated per render) ──

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-16">
            <p className="text-ink-2 text-sm mb-5">{message}</p>
            <button
                onClick={onRetry}
                className="px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
            >
                Try Again
            </button>
        </div>
    );
}

export default function AdminDashboard() {

    // --- Auth State ---
    const [isAuthed, setIsAuthed]       = useState(false);
    const [password, setPassword]       = useState('');
    const [authError, setAuthError]     = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // --- Top-level dashboard view ---
    const [dashboardView, setDashboardView] = useState<DashboardView>('inventory');
    const [dashDropdownOpen, setDashDropdownOpen] = useState(false);
    const dashDropdownRef = useRef<HTMLDivElement>(null);

    // --- Inventory State ---
    const [inventory, setInventory]           = useState<Inventory | null>(null);
    const [loading, setLoading]               = useState(false);
    const [inventoryError, setInventoryError] = useState(false);
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- Inventory view toggle (dropdown) ---
    const [viewMode, setViewMode]         = useState<ViewMode>('active');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef                     = useRef<HTMLDivElement>(null);

    // --- Orders State ---
    const [orders, setOrders]               = useState<Order[]>([]);
    const [ordersPage, setOrdersPage]       = useState(1);
    const [ordersMeta, setOrdersMeta]       = useState<PageMeta | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError]     = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const ordersSectionRef                  = useRef<HTMLElement>(null);

    const isOnline = useOnlineStatus();
    const offlineOr = (msg: string) =>
        isOnline ? msg : 'You appear to be offline. Check your connection and try again.';

    // Restore session on mount
    useEffect(() => {
        if (sessionStorage.getItem('admin_auth') === '1') setIsAuthed(true);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        if (!dropdownOpen && !dashDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
            if (dashDropdownOpen && dashDropdownRef.current && !dashDropdownRef.current.contains(e.target as Node)) {
                setDashDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen, dashDropdownOpen]);

    // --- Data fetching (stable references so memoized rows don't re-render) ---
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        setInventoryError(false);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory`);
            if (!res.ok) throw new Error('Failed to load inventory');
            const data = await res.json();
            setInventory(data);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setInventoryError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOrders = useCallback(async (page: number = 1) => {
        setOrdersLoading(true);
        setOrdersError(false);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(ORDERS_PAGE_SIZE) });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders?${params}`);
            if (!res.ok) throw new Error('Failed to load orders');
            const data = await res.json();
            setOrders(data.orders || []);
            setOrdersMeta({
                total:       data.total,
                page:        data.page,
                totalPages:  data.totalPages,
                hasNextPage: data.hasNextPage,
                hasPrevPage: data.hasPrevPage,
            });
            // Server clamps out-of-range pages; sync local state if it adjusted us.
            if (data.page && data.page !== page) setOrdersPage(data.page);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrdersError(true);
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    // Fetch inventory whenever auth is granted
    useEffect(() => {
        if (isAuthed) fetchInventory();
    }, [isAuthed, fetchInventory]);

    // Fetch the current page of orders whenever auth is granted or the page changes
    useEffect(() => {
        if (isAuthed) fetchOrders(ordersPage);
    }, [isAuthed, ordersPage, fetchOrders]);

    const handleUpdateOrderStatus = useCallback(async (orderId: number, newStatus: OrderStatus) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Error updating order status:', err);
        }
    }, []);

    const handleToggleStock = useCallback(async (product: Product) => {
        const newStatus = product.stock_count === 0 ? 'in_stock' : 'out_of_stock';
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update stock');
            fetchInventory();
        } catch (err) {
            console.error('Error toggling stock:', err);
        }
    }, [fetchInventory]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!res.ok) throw new Error('Incorrect password');
            sessionStorage.setItem('admin_auth', '1');
            setIsAuthed(true);
        } catch {
            setAuthError('Incorrect password. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setIsAuthed(false);
        setInventory(null);
        setOrders([]);
        setPassword('');
    };

    const handleAddNew = useCallback(() => { setEditingProduct(null); setIsModalOpen(true); }, []);
    const handleEdit   = useCallback((product: Product) => { setEditingProduct(product); setIsModalOpen(true); }, []);

    const handleDelete = useCallback(async (product: Product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete product');
            fetchInventory();
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    }, [fetchInventory]);

    const handleToggleExpand = useCallback((orderId: number) => {
        setExpandedOrder(prev => (prev === orderId ? null : orderId));
    }, []);

    const goToOrdersPage = useCallback((p: number) => {
        if (p < 1 || (ordersMeta && p > ordersMeta.totalPages) || p === ordersPage) return;
        setOrdersPage(p);
        setExpandedOrder(null);
        ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [ordersMeta, ordersPage]);

    // ─── PASSWORD GATE ────────────────────────────────────────────────────────
    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <img src="/img/Fusion-logo-svg.svg" alt="Fusion Piercings" className="h-14 w-auto mx-auto mb-2" />
                        <p className="text-[0.75rem] font-semibold tracking-[0.2em] uppercase text-ink-3">Admin Access</p>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            autoFocus
                            className="w-full bg-transparent border border-border-lt rounded-sm px-4 py-3 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors"
                        />
                        {authError && <p className="text-red-500 text-[0.78rem] text-center">{authError}</p>}
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-ink text-bg text-[0.8rem] font-semibold tracking-[0.12em] uppercase py-3 rounded-sm hover:bg-[#2a2620] transition-all disabled:opacity-50"
                        >
                            {authLoading ? 'Verifying...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── LOADING STATE ────────────────────────────────────────────────────────
    if (loading && !inventory && !inventoryError) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <p className="text-ink-2 font-serif text-xl animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    // ─── DASHBOARD VIEW OPTIONS ──────────────────────────────────────────────
    const dashOptions: { key: DashboardView; label: string; title: string }[] = [
        { key: 'inventory', label: 'Inventory Dashboard', title: 'Inventory Dashboard' },
        { key: 'orders',    label: 'Orders Dashboard',    title: 'Orders Dashboard'    },
    ];
    const currentDash = dashOptions.find(d => d.key === dashboardView)!;

    // ─── DASHBOARD ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg py-12 sm:py-24 px-4 sm:px-8 relative">
            <div className="max-w-[1000px] mx-auto">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
                    <div>
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
                            Management
                        </span>

                        {/* Dashboard selector dropdown */}
                        <div ref={dashDropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setDashDropdownOpen(o => !o)}
                                className="flex items-center gap-3 group"
                            >
                                <h1 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-ink group-hover:opacity-80 transition-opacity">
                                    {currentDash.title}
                                </h1>
                                <svg
                                    className={`w-5 h-5 text-ink-3 transition-transform duration-200 mt-1 ${dashDropdownOpen ? 'rotate-180' : ''}`}
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                                </svg>
                            </button>

                            {dashDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 w-72 bg-bg-card border border-border rounded-sm shadow-md z-30 overflow-hidden animate-fade-in">
                                    {dashOptions.map((opt, i) => {
                                        const selected = dashboardView === opt.key;
                                        return (
                                            <button
                                                key={opt.key}
                                                onClick={() => { setDashboardView(opt.key); setDashDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-[0.76rem] font-semibold tracking-[0.12em] uppercase hover:bg-bg-warm transition-colors ${
                                                    i > 0 ? 'border-t border-border-lt' : ''
                                                } ${selected ? 'bg-bg-warm' : ''}`}
                                            >
                                                <svg
                                                    className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? 'opacity-100 text-ink' : 'opacity-0'}`}
                                                    viewBox="0 0 20 20"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3.5 3.5L15 6.5" />
                                                </svg>
                                                <span className="text-ink">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="px-5 py-3 text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-border-lt text-ink-2 hover:border-ink hover:text-ink transition-all rounded-sm"
                        >
                            Log Out
                        </button>
                        {dashboardView === 'inventory' && (
                            <button
                                onClick={handleAddNew}
                                className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                            >
                                + Add New Product
                            </button>
                        )}
                        {dashboardView === 'orders' && (
                            <button
                                onClick={() => fetchOrders(ordersPage)}
                                className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                            >
                                Refresh Orders
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── INVENTORY DASHBOARD ──────────────────────────────────────── */}
                {dashboardView === 'inventory' && (() => {
                    if (inventoryError) {
                        return (
                            <section className="mb-12">
                                <ErrorState message={offlineOr('Failed to load inventory.')} onRetry={fetchInventory} />
                            </section>
                        );
                    }

                    const activeCount   = inventory?.active?.length   ?? 0;
                    const inactiveCount = inventory?.inactive?.length ?? 0;
                    const currentList   = viewMode === 'active' ? inventory?.active : inventory?.inactive;
                    const isInactive    = viewMode === 'inactive';

                    const options: { key: ViewMode; label: string; count: number; color: string }[] = [
                        { key: 'active',   label: 'Active Inventory',   count: activeCount,   color: 'text-ink'       },
                        { key: 'inactive', label: 'Inactive Inventory', count: inactiveCount, color: 'text-red-400'   },
                    ];

                    return (
                        <section className="mb-12">
                            <div className="flex items-center justify-between gap-3 border-b border-border-lt pb-3 mb-5">
                                <div ref={dropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(o => !o)}
                                        aria-haspopup="listbox"
                                        aria-expanded={dropdownOpen}
                                        className="flex items-center gap-2 text-sm font-semibold tracking-[0.15em] uppercase hover:opacity-80 transition-opacity"
                                    >
                                        <span className={isInactive ? 'text-red-400' : 'text-ink'}>
                                            {isInactive ? 'Inactive Inventory' : 'Active Inventory'}
                                        </span>
                                        <span className="text-ink-3 font-normal tracking-normal normal-case text-[0.78rem]">
                                            ({isInactive ? inactiveCount : activeCount})
                                        </span>
                                        <svg
                                            className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                                        </svg>
                                    </button>

                                    {dropdownOpen && (
                                        <div
                                            role="listbox"
                                            className="absolute left-0 top-full mt-2 w-64 bg-bg-card border border-border rounded-sm shadow-md z-20 overflow-hidden animate-fade-in"
                                        >
                                            {options.map((opt, i) => {
                                                const selected = viewMode === opt.key;
                                                return (
                                                    <button
                                                        key={opt.key}
                                                        role="option"
                                                        aria-selected={selected}
                                                        onClick={() => { setViewMode(opt.key); setDropdownOpen(false); }}
                                                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[0.72rem] font-semibold tracking-[0.15em] uppercase hover:bg-bg-warm transition-colors ${
                                                            i > 0 ? 'border-t border-border-lt' : ''
                                                        } ${selected ? 'bg-bg-warm' : ''}`}
                                                    >
                                                        <span className={`flex items-center gap-2 ${opt.color}`}>
                                                            <svg
                                                                className={`w-3.5 h-3.5 ${selected ? 'opacity-100' : 'opacity-0'}`}
                                                                viewBox="0 0 20 20"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3.5 3.5L15 6.5" />
                                                            </svg>
                                                            {opt.label}
                                                        </span>
                                                        <span className="text-ink-3 font-normal tracking-normal normal-case text-[0.72rem]">
                                                            {opt.count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {isInactive && (
                                    <span className="text-[0.62rem] text-ink-3 italic hidden sm:inline">
                                        hidden from storefront
                                    </span>
                                )}
                            </div>

                            {!currentList || currentList.length === 0
                                ? <p className="text-ink-2 text-sm">No {viewMode} products.</p>
                                : currentList.map(p => (
                                    <AdminProductRow
                                        key={p.id}
                                        product={p}
                                        onToggleStock={handleToggleStock}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                        </section>
                    );
                })()}

                {/* ─── ORDERS DASHBOARD ─────────────────────────────────────────── */}
                {dashboardView === 'orders' && (
                    <section ref={ordersSectionRef} className="mb-12 scroll-mt-24">
                        {ordersLoading && orders.length === 0 ? (
                            <p className="text-ink-2 font-serif text-lg animate-pulse">Loading Orders...</p>
                        ) : ordersError ? (
                            <ErrorState message={offlineOr('Failed to load orders.')} onRetry={() => fetchOrders(ordersPage)} />
                        ) : orders.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-ink-2 text-sm">No orders yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 border-b border-border-lt pb-3 mb-5">
                                    <span className="text-sm font-semibold tracking-[0.15em] uppercase text-ink">
                                        All Orders
                                    </span>
                                    <span className="text-ink-3 font-normal tracking-normal normal-case text-[0.78rem]">
                                        ({ordersMeta?.total ?? orders.length})
                                    </span>
                                </div>
                                <div className={`transition-opacity duration-200 ${ordersLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    {orders.map(order => (
                                        <AdminOrderRow
                                            key={order.id}
                                            order={order}
                                            isExpanded={expandedOrder === order.id}
                                            onToggleExpand={handleToggleExpand}
                                            onUpdateStatus={handleUpdateOrderStatus}
                                        />
                                    ))}
                                </div>
                                {ordersMeta && (
                                    <Pagination
                                        page={ordersMeta.page}
                                        totalPages={ordersMeta.totalPages}
                                        hasPrevPage={ordersMeta.hasPrevPage}
                                        hasNextPage={ordersMeta.hasNextPage}
                                        onPageChange={goToOrdersPage}
                                        loading={ordersLoading}
                                        total={ordersMeta.total}
                                        pageSize={ORDERS_PAGE_SIZE}
                                    />
                                )}
                            </>
                        )}
                    </section>
                )}

            </div>

            {isModalOpen && (
                <AdminProductModal
                    product={editingProduct}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchInventory}
                />
            )}
        </div>
    );
}
