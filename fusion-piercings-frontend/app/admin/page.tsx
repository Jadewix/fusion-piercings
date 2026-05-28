// app/admin/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product, Order, OrderStatus } from '@/lib/types';
import AdminProductModal from '@/components/AdminProductModal';

type ViewMode = 'active' | 'inactive';
type DashboardView = 'inventory' | 'orders';

interface Inventory {
    active:   Product[];
    inactive: Product[];
}

const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; bg: string; border: string }[] = [
    { value: 'pending',   label: 'Pending',   color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
    { value: 'shipped',   label: 'Shipped',   color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: 'delivered', label: 'Delivered', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-500',   bg: 'bg-red-50',    border: 'border-red-200'    },
];

function getStatusStyle(status: OrderStatus) {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatMetal(metal?: string) {
    if (!metal) return 'Gold';
    return metal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- Inventory view toggle (dropdown) ---
    const [viewMode, setViewMode]         = useState<ViewMode>('active');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef                     = useRef<HTMLDivElement>(null);

    // --- Orders State ---
    const [orders, setOrders]             = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

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

    // Fetch data whenever auth is granted
    useEffect(() => {
        if (isAuthed) {
            fetchInventory();
            fetchOrders();
        }
    }, [isAuthed]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory`);
            if (!res.ok) throw new Error('Failed to load inventory');
            const data = await res.json();
            setInventory(data);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders`);
            if (!res.ok) throw new Error('Failed to load orders');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
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
    };

    const handleToggleStock = async (product: Product) => {
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
    };

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

    const handleAddNew  = () => { setEditingProduct(null); setIsModalOpen(true); };
    const handleEdit    = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };

    // ─── PASSWORD GATE ────────────────────────────────────────────────────────
    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-[2rem] font-semibold text-ink mb-2">Fusion Piercings</h1>
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
    if (loading && !inventory) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <p className="text-ink-2 font-serif text-xl animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    // ─── PRODUCT ROW ─────────────────────────────────────────────────────────
    const AdminProductRow = ({ product }: { product: Product }) => {
        const isActive = product.stock_count !== 0;

        return (
            <div className="flex gap-3 sm:items-center sm:gap-6 p-3 sm:p-4 bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
                    {product.image_url
                        ? <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
                        : <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-ink-3">No Img</div>}
                </div>

                <div className="flex-grow min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3">{product.category || 'Collection'}</span>
                            <span className={`text-[0.55rem] sm:text-[0.6rem] font-bold tracking-[0.15em] uppercase px-1.5 sm:px-2 py-0.5 rounded-full border ${
                                (product.metal || 'gold') === 'titanium'
                                    ? 'border-blue-200 text-blue-500 bg-blue-50'
                                    : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                            }`}>
                                {product.metal || 'gold'}
                            </span>
                        </div>
                        <h3 className="text-[0.92rem] sm:text-[1rem] font-medium text-ink leading-snug">{product.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:flex-shrink-0">
                        <button
                            onClick={() => handleToggleStock(product)}
                            title={isActive ? 'Click to mark as Out of Stock' : 'Click to mark as In Stock'}
                            className={`px-2 py-1 text-[0.55rem] sm:px-3 sm:py-1.5 sm:text-[0.7rem] font-bold uppercase tracking-wider rounded-full border whitespace-nowrap flex-shrink-0 transition-all ${
                                isActive
                                    ? 'border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                    : 'border-red-200 text-red-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                            }`}
                        >
                            {isActive ? 'In Stock' : 'Out of Stock'}
                        </button>

                        <button
                            onClick={() => handleEdit(product)}
                            className="flex-1 sm:flex-none px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-border-lt text-ink-2 hover:border-ink hover:text-ink transition-all rounded-sm"
                        >
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── ORDER ROW ───────────────────────────────────────────────────────────
    const AdminOrderRow = ({ order }: { order: Order }) => {
        const style = getStatusStyle(order.status);
        const items: any[] = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const isExpanded = expandedOrder === order.id;

        return (
            <div className="bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-3 sm:p-4 text-left"
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
                </button>

                {isExpanded && (
                    <div className="px-3 sm:px-4 pb-4 border-t border-border-lt pt-4 animate-fade-in">
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
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-border-lt last:border-0">
                                        {item.image_url && (
                                            <div className="w-10 h-10 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
                                                <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="40px" />
                                            </div>
                                        )}
                                        <div className="flex-grow min-w-0">
                                            <p className="text-[0.82rem] font-medium text-ink truncate">{item.name}</p>
                                            <p className="text-[0.7rem] text-ink-3">
                                                Qty: {item.qty}{item.size ? ` · ${item.size}` : ''}{item.metal ? ` · ${formatMetal(item.metal)}` : ''}
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
                            <div className="flex flex-wrap gap-2">
                                {ORDER_STATUSES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => handleUpdateOrderStatus(order.id, s.value)}
                                        className={`px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider rounded-full border transition-all ${
                                            order.status === s.value
                                                ? `${s.color} ${s.bg} ${s.border}`
                                                : 'border-border-lt text-ink-3 hover:border-ink hover:text-ink'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

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
                                onClick={fetchOrders}
                                className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                            >
                                Refresh Orders
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── INVENTORY DASHBOARD ──────────────────────────────────────── */}
                {dashboardView === 'inventory' && (() => {
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
                                : currentList.map(p => <AdminProductRow key={p.id} product={p} />)}
                        </section>
                    );
                })()}

                {/* ─── ORDERS DASHBOARD ─────────────────────────────────────────── */}
                {dashboardView === 'orders' && (
                    <section className="mb-12">
                        {ordersLoading ? (
                            <p className="text-ink-2 font-serif text-lg animate-pulse">Loading Orders...</p>
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
                                {orders.map(order => <AdminOrderRow key={order.id} order={order} />)}
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
