'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Product, ProductSize } from '@/lib/types';

interface Props {
    product?: Product | null;
    onClose: () => void;
    onSave: () => void;
}

function coerceSizes(raw: unknown): ProductSize[] {
    if (!Array.isArray(raw) || raw.length === 0) return [{ size: 'One Size', in_stock: true }];
    return raw.map((s: any) =>
        typeof s === 'string' ? { size: s, in_stock: true } : { size: String(s.size), in_stock: s.in_stock !== false }
    );
}

interface PendingFile {
    file: File;
    previewUrl: string;
}

export default function AdminProductModal({ product, onClose, onSave }: Props) {
    const isEditing = !!product;

    const [name, setName]               = useState(product?.name || '');
    const [price, setPrice]             = useState(product?.price?.toString() || '');
    const [description, setDescription] = useState(product?.description || '');
    const [category, setCategory]       = useState(product?.category || 'ear');
    const [color, setColor]             = useState(product?.color || 'gold'); // <-- Changed to Color

    const [sizes, setSizes] = useState<ProductSize[]>(coerceSizes(product?.sizes));
    const [newSizeLabel, setNewSizeLabel] = useState('');

    const initialExisting = useMemo(() => {
        if (!product) return [];
        if (product.image_urls && product.image_urls.length > 0) return product.image_urls;
        return product.image_url ? [product.image_url] : [];
    }, [product]);
    const [existingUrls, setExistingUrls] = useState<string[]>(initialExisting);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

    const [materialTags, setMaterialTags] = useState<string[]>(product?.material_tags || []);

    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => () => {
        pendingFiles.forEach(p => URL.revokeObjectURL(p.previewUrl));
    }, [pendingFiles]);

    function addPendingFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const next: PendingFile[] = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPendingFiles(prev => [...prev, ...next]);
    }

    function removeExisting(url: string) {
        setExistingUrls(prev => prev.filter(u => u !== url));
    }

    function removePending(idx: number) {
        setPendingFiles(prev => {
            URL.revokeObjectURL(prev[idx].previewUrl);
            return prev.filter((_, i) => i !== idx);
        });
    }

    function addSizeRow() {
        const label = newSizeLabel.trim();
        if (!label) return;
        if (sizes.some(s => s.size.toLowerCase() === label.toLowerCase())) {
            setNewSizeLabel('');
            return;
        }
        setSizes(prev => [...prev, { size: label, in_stock: true }]);
        setNewSizeLabel('');
    }

    function removeSizeRow(size: string) {
        setSizes(prev => prev.filter(s => s.size !== size));
    }

    function toggleSizeStock(size: string) {
        setSizes(prev => prev.map(s => s.size === size ? { ...s, in_stock: !s.in_stock } : s));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (sizes.length === 0) throw new Error('Please add at least one size.');
            const totalImages = existingUrls.length + pendingFiles.length;
            if (totalImages === 0) throw new Error('Please upload at least one image.');

            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('color', color); // <-- Sent to backend as color
            formData.append('sizes', JSON.stringify(sizes));
            formData.append('material_tags', JSON.stringify(materialTags));

            if (isEditing) formData.append('existing_image_urls', JSON.stringify(existingUrls));

            for (const p of pendingFiles) formData.append('images', p.file);

            const url = isEditing
                ? `${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/products`;

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to save product');

            const productId = isEditing ? product.id : (await res.clone().json()).product.id;
            const allOOS = sizes.every(s => !s.in_stock);
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: allOOS ? 'out_of_stock' : 'in_stock' }),
            });

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const inputClass = "w-full bg-transparent border border-border-lt rounded-sm px-4 py-2.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors mb-4";

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-ink/50 backdrop-blur-[10px] animate-fade-in">
            <div className="relative w-full max-w-[560px] bg-bg-card rounded-[20px] overflow-hidden shadow-xl animate-modal-enter">

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
                                <option value="nipple">Nipple</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Color</label>
                            <select value={color} onChange={e => setColor(e.target.value)} className={inputClass}>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Sizes & Stock</label>
                    <div className="border border-border-lt rounded-sm mb-4 overflow-hidden">
                        {sizes.length === 0 && (
                            <div className="px-4 py-3 text-[0.78rem] text-ink-3 italic">No sizes added yet.</div>
                        )}
                        {sizes.map(({ size, in_stock }, i) => (
                            <div
                                key={size}
                                className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-border-lt' : ''}`}
                            >
                                <span className="flex-grow text-[0.85rem] text-ink font-medium">{size}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleSizeStock(size)}
                                    className={`px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase rounded-full border transition-all ${
                                        in_stock
                                            ? 'border-green-200 text-green-600 bg-green-50 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                            : 'border-red-200 text-red-500 bg-red-50 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                                    }`}
                                >
                                    {in_stock ? 'In Stock' : 'Out of Stock'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSizeRow(size)}
                                    className="w-7 h-7 rounded-full text-ink-3 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mb-5">
                        <input
                            value={newSizeLabel}
                            onChange={e => setNewSizeLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSizeRow(); } }}
                            placeholder="Add size (e.g. 8mm)"
                            className="flex-grow bg-transparent border border-border-lt rounded-sm px-4 py-2 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors"
                        />
                        <button
                            type="button"
                            onClick={addSizeRow}
                            className="px-4 py-2 text-[0.7rem] font-semibold tracking-[0.12em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
                        >
                            Add
                        </button>
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Material Collections</label>
                    <div className="flex flex-col gap-2 mb-5">
                        {[
                            { value: 'titanium',          label: 'Titanium'          },
                            { value: 'surgical-steel',    label: 'Surgical Steel'    },
                            { value: 'gold-plated-hoops', label: 'Gold Plated Hoops' },
                        ].map(tag => {
                            const checked = materialTags.includes(tag.value);
                            return (
                                <label
                                    key={tag.value}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-sm border cursor-pointer transition-all ${
                                        checked
                                            ? 'border-ink bg-ink/5 text-ink'
                                            : 'border-border-lt text-ink-2 hover:border-border hover:text-ink'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="accent-ink w-3.5 h-3.5"
                                        checked={checked}
                                        onChange={() =>
                                            setMaterialTags(prev =>
                                                checked ? prev.filter(t => t !== tag.value) : [...prev, tag.value]
                                            )
                                        }
                                    />
                                    <span className="text-[0.78rem] font-medium">{tag.label}</span>
                                </label>
                            );
                        })}
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Product Images</label>
                    <p className="text-[0.7rem] text-ink-3 mb-3">First image is the main thumbnail shown on cards and the cart.</p>
                    {(existingUrls.length > 0 || pendingFiles.length > 0) && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {existingUrls.map(url => (
                                <div key={url} className="relative aspect-square border border-border-lt rounded-sm overflow-hidden group">
                                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                                    <button
                                        type="button"
                                        onClick={() => removeExisting(url)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 text-ink-2 hover:text-red-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {pendingFiles.map((p, idx) => (
                                <div key={p.previewUrl} className="relative aspect-square border border-dashed border-ink rounded-sm overflow-hidden group">
                                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                                    <span className="absolute bottom-1 left-1 text-[0.55rem] font-semibold tracking-wider uppercase bg-ink text-bg px-1.5 py-0.5 rounded-full">new</span>
                                    <button
                                        type="button"
                                        onClick={() => removePending(idx)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 text-ink-2 hover:text-red-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => { addPendingFiles(e.target.files); e.target.value = ''; }}
                        className="w-full text-sm text-ink-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[0.7rem] file:font-semibold file:uppercase file:tracking-wider file:bg-ink file:text-bg hover:file:bg-[#2a2620] transition-all cursor-pointer"
                    />

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