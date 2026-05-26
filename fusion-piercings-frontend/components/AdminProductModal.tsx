// components/AdminProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

interface Props {
    product?: Product | null; // If null, we are ADDING. If it has data, we are EDITING.
    onClose: () => void;
    onSave: () => void; // A function to tell the dashboard to refresh the data
}

export default function AdminProductModal({ product, onClose, onSave }: Props) {
    const isEditing = !!product;

    // Form State
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price || '');
    const [description, setDescription] = useState(product?.description || '');
    const [category, setCategory] = useState(product?.category || 'ear');
    const [metal, setMetal] = useState(product?.metal || 'gold');

    // Convert the array of sizes to a comma-separated string for easy editing
    const [sizes, setSizes] = useState(product?.sizes?.join(', ') || 'One Size');
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Stock availability — true = In Stock, false = Out of Stock
    const [inStock, setInStock] = useState(product ? product.stock_count !== 0 : true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price.toString());
            formData.append('description', description);
            formData.append('category', category);
            formData.append('metal', metal);
            formData.append('sizes', sizes);

            // Only append the image if they actually uploaded a new one
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (!isEditing) {
                throw new Error('Please upload an image for the new product.');
            }

            const url = isEditing
                ? `${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData, // Notice we don't use JSON.stringify here because of the file!
            });

            if (!res.ok) throw new Error('Failed to save product');

            // Sync stock status for existing products
            if (isEditing) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}/stock`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: inStock ? 'in_stock' : 'out_of_stock' }),
                });
            }

            onSave(); // Tell the dashboard to refresh
            onClose(); // Close the modal
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Common input styling class
    const inputClass = "w-full bg-transparent border border-border-lt rounded-sm px-4 py-2.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors mb-4";

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-ink/50 backdrop-blur-[10px] animate-fade-in">
            <div className="relative w-full max-w-[500px] bg-bg-card rounded-[20px] overflow-hidden shadow-xl animate-modal-enter">

                {/* Header */}
                <div className="px-7 pt-6 pb-4 border-b border-border-lt flex justify-between items-center bg-bg">
                    <h2 className="font-serif text-[1.5rem] font-semibold text-ink leading-tight">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink-2 hover:bg-ink/10 hover:text-ink transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="px-7 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Name</label>
                            <input required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Gold Hoop" />
                        </div>
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Price ($)</label>
                            <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} placeholder="45.00" />
                        </div>
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Description</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} resize-none h-20`} placeholder="A seamless, everyday hoop..." />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                                <option value="ear">Ear</option>
                                <option value="nose">Nose</option>
                                <option value="belly">Belly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Metal</label>
                            <select value={metal} onChange={e => setMetal(e.target.value)} className={inputClass}>
                                <option value="gold">Gold</option>
                                <option value="titanium">Titanium</option>
                            </select>
                        </div>
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Sizes (Comma separated)</label>
                    <input required value={sizes} onChange={e => setSizes(e.target.value)} className={inputClass} placeholder="6mm, 8mm, 10mm" />

                    {/* Image Upload */}
                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Product Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-ink-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[0.7rem] file:font-semibold file:uppercase file:tracking-wider file:bg-ink file:text-bg hover:file:bg-[#2a2620] transition-all cursor-pointer"
                        required={!isEditing}
                    />

                    {/* Availability toggle — only relevant when editing an existing product */}
                    {isEditing && (
                        <div className="mt-6 mb-2">
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">
                                Availability
                            </label>
                            <div className="flex rounded-sm border border-border-lt overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setInStock(true)}
                                    className={`flex-1 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase transition-all ${
                                        inStock
                                            ? 'bg-green-600 text-white'
                                            : 'bg-transparent text-ink-2 hover:text-ink'
                                    }`}
                                >
                                    In Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInStock(false)}
                                    className={`flex-1 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border-l border-border-lt transition-all ${
                                        !inStock
                                            ? 'bg-red-500 text-white'
                                            : 'bg-transparent text-ink-2 hover:text-ink'
                                    }`}
                                >
                                    Out of Stock
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 bg-ink text-bg text-[0.76rem] font-semibold tracking-[0.12em] uppercase py-3.5 rounded-full hover:bg-[#2a2620] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
                    </button>
                </form>

            </div>
        </div>
    );
}