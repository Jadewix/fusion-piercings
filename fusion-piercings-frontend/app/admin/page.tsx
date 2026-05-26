// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import AdminProductModal from '@/components/AdminProductModal';

interface Inventory {
    active:   Product[];  // stock_count > 0  → visible in the storefront
    inactive: Product[];  // stock_count === 0 → hidden from the storefront
}

export default function AdminDashboard() {

    // --- Auth State ---
    const [isAuthed, setIsAuthed]       = useState(false);
    const [password, setPassword]       = useState('');
    const [authError, setAuthError]     = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // --- Dashboard State ---
    const [inventory, setInventory]           = useState<Inventory | null>(null);
    const [loading, setLoading]               = useState(false);
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Restore session on mount so a page refresh doesn't log the admin out
    useEffect(() => {
        if (sessionStorage.getItem('admin_auth') === '1') setIsAuthed(true);
    }, []);

    // Fetch inventory whenever auth is granted
    useEffect(() => {
        if (isAuthed) fetchInventory();
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

    // Toggle a product between in_stock (stock_count = 999) and out_of_stock (stock_count = 0)
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
    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <p className="text-ink-2 font-serif text-xl animate-pulse">Loading Inventory...</p>
            </div>
        );
    }

    // ─── PRODUCT ROW ─────────────────────────────────────────────────────────
    const AdminProductRow = ({ product }: { product: Product }) => {
        const isActive = product.stock_count !== 0;

        return (
            <div className="flex items-center gap-6 p-4 bg-bg-card border border-border-lt rounded-sm hover:border-ink transition-all mb-3">
                <div className="w-16 h-16 relative bg-gray-50 flex-shrink-0 border border-border-lt rounded-sm overflow-hidden">
                    {product.image_url
                        ? <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
                        : <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-ink-3">No Img</div>}
                </div>

                <div className="flex-grow">
                    <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink-3 mb-1">{product.category || 'Collection'}</div>
                    <h3 className="text-[1rem] font-medium text-ink">{product.name}</h3>
                </div>

                <div className="flex items-center gap-2 ml-4">
                    {/* Clicking the status badge toggles stock — title explains the action on hover */}
                    <button
                        onClick={() => handleToggleStock(product)}
                        title={isActive ? 'Click to mark as Out of Stock' : 'Click to mark as In Stock'}
                        className={`px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider rounded-full border transition-all ${
                            isActive
                                ? 'border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                : 'border-red-200 text-red-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                        }`}
                    >
                        {isActive ? 'In Stock' : 'Out of Stock'}
                    </button>

                    <button
                        onClick={() => handleEdit(product)}
                        className="px-4 py-2 text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-border-lt text-ink-2 hover:border-ink hover:text-ink transition-all rounded-sm"
                    >
                        Edit
                    </button>
                </div>
            </div>
        );
    };

    // ─── DASHBOARD ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg py-24 px-8 relative">
            <div className="max-w-[1000px] mx-auto">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
                    <div>
                        <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
                            Management
                        </span>
                        <h1 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-ink">Inventory Dashboard</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="px-5 py-3 text-[0.72rem] font-medium tracking-[0.1em] uppercase border border-border-lt text-ink-2 hover:border-ink hover:text-ink transition-all rounded-sm"
                        >
                            Log Out
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="bg-ink text-bg px-6 py-3 text-[0.76rem] font-semibold tracking-[0.12em] uppercase rounded-sm hover:bg-[#2a2620] transition-all"
                        >
                            + Add New Product
                        </button>
                    </div>
                </div>

                {/* Active Inventory — visible in the storefront */}
                <section className="mb-12">
                    <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-ink-3 border-b border-border-lt pb-3 mb-5">
                        Active Inventory
                    </h2>
                    {inventory?.active?.length === 0
                        ? <p className="text-ink-2 text-sm">No active products.</p>
                        : inventory?.active?.map(p => <AdminProductRow key={p.id} product={p} />)}
                </section>

                {/* Inactive Inventory — hidden from the storefront */}
                {inventory?.inactive?.length ? (
                    <section className="mb-12">
                        <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-red-400 border-b border-border-lt pb-3 mb-5">
                            Inactive Inventory <span className="text-ink-3 normal-case font-normal tracking-normal ml-1">(hidden from storefront)</span>
                        </h2>
                        {inventory.inactive.map(p => <AdminProductRow key={p.id} product={p} />)}
                    </section>
                ) : null}

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
