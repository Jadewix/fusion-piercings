// app/admin/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Product, Order, OrderStatus } from '@/lib/types';
import AdminProductModal from '@/components/AdminProductModal';
import AdminProductRow from '@/components/admin/AdminProductRow';
import AdminOrderRow from '@/components/admin/AdminOrderRow';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

type ViewMode = 'active' | 'inactive';
type DashboardView = 'inventory' | 'orders' | 'analytics';

interface Inventory {
    active:   Product[];
    inactive: Product[];
}

// ─── Small presentational helpers (module scope = not recreated per render) ──

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
    return (
        <div className="bg-bg-card border border-border-lt rounded-sm p-5 sm:p-6 hover:border-ink transition-all">
            <p className="text-[0.62rem] sm:text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3 mb-2">{label}</p>
            <p className={`font-serif text-[1.6rem] sm:text-[2rem] font-semibold leading-none ${accent || 'text-ink'}`}>{value}</p>
            {sub && <p className="text-[0.72rem] text-ink-3 mt-1.5">{sub}</p>}
        </div>
    );
}

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
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError]     = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

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

    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        setOrdersError(false);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders`);
            if (!res.ok) throw new Error('Failed to load orders');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrdersError(true);
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    // Fetch data whenever auth is granted
    useEffect(() => {
        if (isAuthed) {
            fetchInventory();
            fetchOrders();
        }
    }, [isAuthed, fetchInventory, fetchOrders]);

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

    // --- Analytics: derived once per `orders` change, not on every render ---
    const analytics = useMemo(() => {
        const nonCancelled = orders.filter(o => o.status !== 'cancelled');
        const totalOrders = orders.length;
        const totalRevenue = nonCancelled.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
        const shippedOrders = orders.filter(o => o.status === 'shipped').length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        const avgOrderValue = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

        // Best selling products — aggregate across all non-cancelled order items
        const productMap = new Map<string, { name: string; totalQty: number; totalRevenue: number; image_url?: string }>();
        nonCancelled.forEach(order => {
            const items: any[] = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            items.forEach((item: any) => {
                const key = item.name;
                const existing = productMap.get(key);
                if (existing) {
                    existing.totalQty += item.qty;
                    existing.totalRevenue += item.price * item.qty;
                } else {
                    productMap.set(key, { name: item.name, totalQty: item.qty, totalRevenue: item.price * item.qty, image_url: item.image_url });
                }
            });
        });
        const bestSellers = Array.from(productMap.values()).sort((a, b) => b.totalQty - a.totalQty);

        const statusBreakdown = [
            { label: 'Pending',   count: pendingOrders,   color: 'bg-yellow-400' },
            { label: 'Confirmed', count: confirmedOrders, color: 'bg-blue-400' },
            { label: 'Shipped',   count: shippedOrders,   color: 'bg-purple-400' },
            { label: 'Delivered', count: completedOrders, color: 'bg-green-400' },
            { label: 'Cancelled', count: cancelledOrders, color: 'bg-red-400' },
        ].filter(s => s.count > 0);

        return {
            totalOrders, totalRevenue, pendingOrders, completedOrders,
            cancelledOrders, avgOrderValue, bestSellers, statusBreakdown,
        };
    }, [orders]);

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
        { key: 'analytics', label: 'Analytics Dashboard', title: 'Analytics Dashboard' },
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
                                onClick={fetchOrders}
                                className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                            >
                                Refresh Orders
                            </button>
                        )}
                        {dashboardView === 'analytics' && (
                            <button
                                onClick={fetchOrders}
                                className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                            >
                                Refresh Data
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
                    <section className="mb-12">
                        {ordersLoading ? (
                            <p className="text-ink-2 font-serif text-lg animate-pulse">Loading Orders...</p>
                        ) : ordersError ? (
                            <ErrorState message={offlineOr('Failed to load orders.')} onRetry={fetchOrders} />
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
                                        ({orders.length})
                                    </span>
                                </div>
                                {orders.map(order => (
                                    <AdminOrderRow
                                        key={order.id}
                                        order={order}
                                        isExpanded={expandedOrder === order.id}
                                        onToggleExpand={handleToggleExpand}
                                        onUpdateStatus={handleUpdateOrderStatus}
                                    />
                                ))}
                            </>
                        )}
                    </section>
                )}

                {/* ─── ANALYTICS DASHBOARD ──────────────────────────────────────── */}
                {dashboardView === 'analytics' && (
                    <section className="mb-12">
                        {ordersLoading ? (
                            <p className="text-ink-2 font-serif text-lg animate-pulse">Loading Analytics...</p>
                        ) : ordersError ? (
                            <ErrorState message={offlineOr('Failed to load analytics data.')} onRetry={fetchOrders} />
                        ) : (
                            <>
                                {/* Stat Cards Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                                    <StatCard label="Total Orders" value={String(analytics.totalOrders)} />
                                    <StatCard label="Total Revenue" value={`$${analytics.totalRevenue.toFixed(2)}`} sub="excl. cancelled" accent="text-green-600" />
                                    <StatCard label="Avg Order Value" value={`$${analytics.avgOrderValue.toFixed(2)}`} sub="excl. cancelled" />
                                    <StatCard label="Pending Orders" value={String(analytics.pendingOrders)} sub="awaiting action" accent={analytics.pendingOrders > 0 ? 'text-yellow-700' : 'text-ink'} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
                                    <StatCard label="Completed Orders" value={String(analytics.completedOrders)} sub="delivered successfully" accent="text-green-600" />
                                    <StatCard label="Cancelled Orders" value={String(analytics.cancelledOrders)} sub={analytics.totalOrders > 0 ? `${((analytics.cancelledOrders / analytics.totalOrders) * 100).toFixed(1)}% cancellation rate` : 'no orders yet'} accent={analytics.cancelledOrders > 0 ? 'text-red-500' : 'text-ink'} />
                                </div>

                                {/* Order Status Breakdown Bar */}
                                {analytics.totalOrders > 0 && (
                                    <div className="bg-bg-card border border-border-lt rounded-sm p-5 sm:p-6 mb-8">
                                        <h3 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-4">Order Status Breakdown</h3>
                                        <div className="w-full h-3 rounded-full overflow-hidden flex bg-bg-warm">
                                            {analytics.statusBreakdown.map(s => (
                                                <div
                                                    key={s.label}
                                                    className={`h-full ${s.color} transition-all`}
                                                    style={{ width: `${(s.count / analytics.totalOrders) * 100}%` }}
                                                    title={`${s.label}: ${s.count}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                                            {analytics.statusBreakdown.map(s => (
                                                <div key={s.label} className="flex items-center gap-1.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                                    <span className="text-[0.7rem] text-ink-2">{s.label}</span>
                                                    <span className="text-[0.7rem] font-semibold text-ink">{s.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Best Selling Products */}
                                <div className="bg-bg-card border border-border-lt rounded-sm p-5 sm:p-6">
                                    <h3 className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-ink-3 mb-4">Best Selling Products</h3>
                                    {analytics.bestSellers.length === 0 ? (
                                        <p className="text-ink-2 text-sm">No product data yet.</p>
                                    ) : (
                                        <div className="space-y-0">
                                            {/* Table header */}
                                            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-3 py-2 text-[0.6rem] font-semibold tracking-[0.16em] uppercase text-ink-3 border-b border-border-lt">
                                                <span className="col-span-1">#</span>
                                                <span className="col-span-5">Product</span>
                                                <span className="col-span-3 text-right">Units Sold</span>
                                                <span className="col-span-3 text-right">Revenue</span>
                                            </div>
                                            {analytics.bestSellers.map((product, idx) => {
                                                const maxQty = analytics.bestSellers[0]?.totalQty || 1;
                                                const barWidth = (product.totalQty / maxQty) * 100;
                                                return (
                                                    <div key={product.name} className="relative group">
                                                        {/* Background bar */}
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-gold/[0.06] group-hover:bg-gold/[0.12] transition-colors rounded-sm"
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                        <div className="relative grid grid-cols-12 gap-4 items-center px-3 py-3 border-b border-border-lt last:border-0">
                                                            <span className="col-span-1 text-[0.75rem] font-semibold text-ink-3">{idx + 1}</span>
                                                            <div className="col-span-7 sm:col-span-5 flex items-center gap-3 min-w-0">
                                                                {product.image_url && (
                                                                    <div className="w-8 h-8 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
                                                                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="32px" />
                                                                    </div>
                                                                )}
                                                                <span className="text-[0.82rem] font-medium text-ink truncate">{product.name}</span>
                                                            </div>
                                                            <span className="col-span-2 sm:col-span-3 text-right text-[0.82rem] font-semibold text-ink">{product.totalQty}</span>
                                                            <span className="col-span-2 sm:col-span-3 text-right text-[0.82rem] font-medium text-green-600">${product.totalRevenue.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
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
