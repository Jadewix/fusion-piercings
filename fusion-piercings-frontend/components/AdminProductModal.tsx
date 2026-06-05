'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Product, ProductSize, ProductColor, Collection } from '@/lib/types';

interface Props {
    product?: Product | null;
    onClose: () => void;
    onSave: () => void;
}

function coerceSizes(raw: unknown): ProductSize[] {
    if (!Array.isArray(raw) || raw.length === 0) return [{ size: 'One Size', in_stock: true }];
    return raw.map((s: any) => {
        if (typeof s === 'string') return { size: s, in_stock: true };
        const rawPrice = s.price;
        const parsedPrice =
            rawPrice == null || rawPrice === ''
                ? null
                : Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : null;
        return {
            size: String(s.size),
            in_stock: s.in_stock !== false,
            price: parsedPrice,
        };
    });
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
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
        if (product?.categories && product.categories.length > 0) return [...product.categories];
        return product?.category ? [product.category] : [];
    });
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
        { value: 'ear',    label: 'Ear'    },
        { value: 'nose',   label: 'Nose'   },
        { value: 'belly',  label: 'Belly'  },
        { value: 'nipple', label: 'Nipple' },
    ];
    // Multi-select with per-color stock toggle. Persisted as a JSONB colors[]
    // and a derived single `color` value ('gold' | 'silver' | 'both') for the
    // legacy storefront filter.
    const [selectedColors, setSelectedColors] = useState<ProductColor[]>(() => {
        const fromNew = product?.colors;
        if (Array.isArray(fromNew) && fromNew.length > 0) {
            return fromNew.map(c => ({ color: String(c.color), in_stock: c.in_stock !== false }));
        }
        const c = product?.color;
        if (c === 'both')                       return [{ color: 'gold',   in_stock: true }, { color: 'silver', in_stock: true }];
        if (c === 'silver' || c === 'titanium') return [{ color: 'silver', in_stock: true }];
        if (c === 'gold')                       return [{ color: 'gold',   in_stock: true }];
        return [];
    });
    const [newColorPick, setNewColorPick] = useState<string>('');
    const COLOR_OPTIONS: { value: string; label: string }[] = [
        { value: 'gold',   label: 'Gold'   },
        { value: 'silver', label: 'Silver' },
    ];
    const colorLabelOf = (slug: string) =>
        COLOR_OPTIONS.find(o => o.value === slug)?.label || slug;

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

    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
    const collectionsDropdownRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setCollectionsLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Collection[]) => {
                if (!cancelled) setCollections(Array.isArray(data) ? data : []);
            })
            .catch(() => { if (!cancelled) setCollections([]); })
            .finally(() => { if (!cancelled) setCollectionsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!collectionsDropdownOpen) return;
        const handle = (e: MouseEvent) => {
            if (collectionsDropdownRef.current && !collectionsDropdownRef.current.contains(e.target as Node)) {
                setCollectionsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [collectionsDropdownOpen]);

    useEffect(() => {
        if (!categoryDropdownOpen) return;
        const handle = (e: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
                setCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [categoryDropdownOpen]);

    const toggleCollection = (slug: string) => {
        setMaterialTags(prev =>
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const addColor = (value: string) => {
        if (!value) return;
        setSelectedColors(prev =>
            prev.some(c => c.color === value) ? prev : [...prev, { color: value, in_stock: true }]
        );
        setNewColorPick('');
    };
    const removeColor = (value: string) => {
        setSelectedColors(prev => prev.filter(c => c.color !== value));
    };
    const toggleColorStock = (value: string) => {
        setSelectedColors(prev =>
            prev.map(c => c.color === value ? { ...c, in_stock: !c.in_stock } : c)
        );
    };

    const toggleCategory = (value: string) => {
        setSelectedCategories(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
    };

    useEffect(() => () => {
        pendingFiles.forEach(p => URL.revokeObjectURL(p.previewUrl));
    }, [pendingFiles]);

    const MAX_IMAGES = 5;

    function addPendingFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const usedSlots  = existingUrls.length + pendingFiles.length;
        const remaining  = Math.max(0, MAX_IMAGES - usedSlots);
        if (remaining === 0) {
            setError(`You can upload up to ${MAX_IMAGES} images per product.`);
            return;
        }
        const accepted = Array.from(files).slice(0, remaining);
        const next: PendingFile[] = accepted.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPendingFiles(prev => [...prev, ...next]);
        if (files.length > accepted.length) {
            setError(`Only the first ${accepted.length} image${accepted.length === 1 ? '' : 's'} were added — limit is ${MAX_IMAGES} per product.`);
        }
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

    function updateSizePrice(size: string, raw: string) {
        setSizes(prev => prev.map(s => {
            if (s.size !== size) return s;
            const trimmed = raw.trim();
            if (trimmed === '') return { ...s, price: null };
            const n = Number(trimmed);
            if (!Number.isFinite(n) || n < 0) return s;
            return { ...s, price: n };
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (sizes.length === 0) throw new Error('Please add at least one size.');
            if (selectedColors.length === 0) throw new Error('Please pick at least one color.');
            if (selectedCategories.length === 0) throw new Error('Please pick at least one placement.');
            const totalImages = existingUrls.length + pendingFiles.length;
            if (totalImages === 0)        throw new Error('Please upload at least one image.');
            if (totalImages > MAX_IMAGES) throw new Error(`You can upload up to ${MAX_IMAGES} images per product.`);

            const slugs = selectedColors.map(c => c.color);
            const hasGold   = slugs.includes('gold');
            const hasSilver = slugs.includes('silver');
            const colorPayload = hasGold && hasSilver ? 'both' : hasGold ? 'gold' : 'silver';

            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('category', selectedCategories[0]); // primary, kept in sync with categories[]
            formData.append('categories', JSON.stringify(selectedCategories));
            formData.append('color', colorPayload);
            formData.append('colors', JSON.stringify(selectedColors));
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
            if (!res.ok) {
                let msg = 'Failed to save product';
                try {
                    const body = await res.clone().json();
                    if (body && typeof body.error === 'string') msg = body.error;
                } catch { /* response wasn't JSON — keep the default */ }
                throw new Error(msg);
            }

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
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 bg-ink/50 backdrop-blur-[10px] animate-fade-in">
            <div className="relative w-full max-w-[560px] bg-bg-card rounded-[20px] overflow-hidden shadow-xl animate-modal-enter flex flex-col max-h-[90vh]">

                <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-border-lt flex justify-between items-center bg-bg flex-shrink-0">
                    <h2 className="font-serif text-[1.5rem] font-semibold text-ink leading-tight">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink-2 hover:bg-ink/10 hover:text-ink transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    {/* 👇 CHANGED TO RESPONSIVE GRID (1 col mobile, 2 col desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* 👇 CHANGED TO RESPONSIVE GRID (1 col mobile, 2 col desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Placement</label>
                            <div ref={categoryDropdownRef} className="relative mb-4">
                                <div
                                    role="combobox"
                                    tabIndex={0}
                                    aria-expanded={categoryDropdownOpen}
                                    aria-haspopup="listbox"
                                    aria-label="Select placements"
                                    onClick={() => setCategoryDropdownOpen(o => !o)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setCategoryDropdownOpen(o => !o);
                                        } else if (e.key === 'Escape') {
                                            setCategoryDropdownOpen(false);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between gap-3 min-h-[44px] px-3 py-2 bg-transparent border border-border-lt rounded-sm cursor-pointer hover:border-border focus:border-ink focus:outline-none transition-colors"
                                >
                                    <div className="flex flex-wrap gap-1.5 min-w-0 flex-1 py-0.5">
                                        {selectedCategories.length === 0 ? (
                                            <span className="text-[0.85rem] text-ink-3 px-1">Select placements…</span>
                                        ) : (
                                            selectedCategories.map(val => {
                                                const opt = PLACEMENT_OPTIONS.find(o => o.value === val);
                                                const label = opt?.label || val;
                                                return (
                                                    <span
                                                        key={val}
                                                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 text-[0.72rem] font-medium bg-ink/5 text-ink rounded-full"
                                                    >
                                                        {label}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleCategory(val); }}
                                                            aria-label={`Remove ${label}`}
                                                            className="w-4 h-4 rounded-full text-ink-3 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                                        >
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                            </svg>
                                                        </button>
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-ink-3 flex-shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                                    </svg>
                                </div>

                                {categoryDropdownOpen && (
                                    <div
                                        role="listbox"
                                        aria-multiselectable="true"
                                        className="absolute left-0 top-full mt-1 w-full bg-bg-card border border-border rounded-sm shadow-md z-10 overflow-hidden animate-fade-in"
                                    >
                                        {PLACEMENT_OPTIONS.map((opt, i) => {
                                            const checked = selectedCategories.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={checked}
                                                    onClick={() => toggleCategory(opt.value)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.78rem] font-medium hover:bg-bg-warm transition-colors ${
                                                        i > 0 ? 'border-t border-border-lt' : ''
                                                    } ${checked ? 'bg-bg-warm' : ''}`}
                                                >
                                                    <span className={`w-4 h-4 flex-shrink-0 border rounded-sm flex items-center justify-center transition-all ${
                                                        checked ? 'bg-ink border-ink' : 'border-border'
                                                    }`}>
                                                        {checked && (
                                                            <svg className="w-3 h-3 text-bg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3.5 3.5L15 6.5" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <span className="text-ink flex-1">{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Color & Stock</label>
                            <div className="border border-border-lt rounded-sm mb-3 overflow-hidden">
                                {selectedColors.length === 0 && (
                                    <div className="px-4 py-3 text-[0.78rem] text-ink-3 italic">No colors added yet.</div>
                                )}
                                {selectedColors.map(({ color: slug, in_stock }, i) => (
                                    <div
                                        key={slug}
                                        className={`flex items-center gap-2 px-3 py-2.5 ${i > 0 ? 'border-t border-border-lt' : ''}`}
                                    >
                                        <span className="flex-1 min-w-0 text-[0.85rem] text-ink font-medium truncate">
                                            {colorLabelOf(slug)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleColorStock(slug)}
                                            className={`px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase rounded-full border transition-all flex-shrink-0 ${
                                                in_stock
                                                    ? 'border-green-200 text-green-600 bg-green-50 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                                    : 'border-red-200 text-red-500 bg-red-50 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                                            }`}
                                        >
                                            {in_stock ? 'In Stock' : 'Out of Stock'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeColor(slug)}
                                            aria-label={`Remove ${colorLabelOf(slug)}`}
                                            className="w-7 h-7 rounded-full text-ink-3 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {(() => {
                                const remaining = COLOR_OPTIONS.filter(o => !selectedColors.some(c => c.color === o.value));
                                if (remaining.length === 0) return null;
                                return (
                                    <div className="flex gap-2 mb-4">
                                        <select
                                            value={newColorPick}
                                            onChange={e => setNewColorPick(e.target.value)}
                                            className="flex-grow bg-transparent border border-border-lt rounded-sm px-3 py-2 text-[0.85rem] text-ink focus:border-ink focus:outline-none transition-colors"
                                            aria-label="Pick a color to add"
                                        >
                                            <option value="">Add a color…</option>
                                            {remaining.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => addColor(newColorPick)}
                                            disabled={!newColorPick}
                                            className="px-4 py-2 text-[0.7rem] font-semibold tracking-[0.12em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink"
                                        >
                                            Add
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2 mb-2">Sizes, Pricing & Stock</label>
                    <p className="text-[0.7rem] text-ink-3 mb-2">Leave price blank to use the base price above.</p>
                    <div className="border border-border-lt rounded-sm mb-4 overflow-hidden">
                        {sizes.length === 0 && (
                            <div className="px-4 py-3 text-[0.78rem] text-ink-3 italic">No sizes added yet.</div>
                        )}
                        {sizes.map(({ size, in_stock, price: sizePrice }, i) => {
                            const baseNum = parseFloat(price);
                            const basePlaceholder = Number.isFinite(baseNum) && baseNum > 0 ? baseNum.toFixed(2) : '0.00';
                            return (
                                <div
                                    key={size}
                                    className={`flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2.5 ${i > 0 ? 'border-t border-border-lt' : ''}`}
                                >
                                    <span className="flex-1 min-w-0 text-[0.85rem] text-ink font-medium truncate">{size}</span>

                                    <div className="relative flex-shrink-0">
                                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.75rem] text-ink-3">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            inputMode="decimal"
                                            value={sizePrice == null ? '' : String(sizePrice)}
                                            onChange={e => updateSizePrice(size, e.target.value)}
                                            placeholder={basePlaceholder}
                                            aria-label={`Price for size ${size}`}
                                            title="Leave blank to use the product's base price"
                                            className="w-[88px] sm:w-24 pl-5 pr-2 py-1.5 text-[0.78rem] text-ink bg-transparent border border-border-lt rounded-sm focus:border-ink focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => toggleSizeStock(size)}
                                        className={`px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase rounded-full border transition-all flex-shrink-0 ${
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
                                        aria-label={`Remove size ${size}`}
                                        className="w-7 h-7 rounded-full text-ink-3 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
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
                    <div ref={collectionsDropdownRef} className="relative mb-5">
                        <div
                            role="combobox"
                            tabIndex={0}
                            aria-expanded={collectionsDropdownOpen}
                            aria-haspopup="listbox"
                            aria-label="Select material collections"
                            onClick={() => setCollectionsDropdownOpen(o => !o)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCollectionsDropdownOpen(o => !o);
                                } else if (e.key === 'Escape') {
                                    setCollectionsDropdownOpen(false);
                                }
                            }}
                            className="w-full flex items-center justify-between gap-3 min-h-[44px] px-3 py-2 bg-transparent border border-border-lt rounded-sm cursor-pointer hover:border-border focus:border-ink focus:outline-none transition-colors"
                        >
                            <div className="flex flex-wrap gap-1.5 min-w-0 flex-1 py-0.5">
                                {materialTags.length === 0 ? (
                                    <span className="text-[0.85rem] text-ink-3 px-1">
                                        {collectionsLoading ? 'Loading collections…' : 'Select collections…'}
                                    </span>
                                ) : (
                                    materialTags.map(slug => {
                                        const c = collections.find(co => co.slug === slug);
                                        const label = c?.name || slug;
                                        return (
                                            <span
                                                key={slug}
                                                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 text-[0.72rem] font-medium bg-ink/5 text-ink rounded-full"
                                            >
                                                {label}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleCollection(slug); }}
                                                    aria-label={`Remove ${label}`}
                                                    className="w-4 h-4 rounded-full text-ink-3 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                                >
                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                </button>
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                            <svg
                                className={`w-4 h-4 text-ink-3 flex-shrink-0 transition-transform duration-200 ${collectionsDropdownOpen ? 'rotate-180' : ''}`}
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                            </svg>
                        </div>

                        {collectionsDropdownOpen && (
                            <div
                                role="listbox"
                                aria-multiselectable="true"
                                className="absolute left-0 top-full mt-1 w-full bg-bg-card border border-border rounded-sm shadow-md z-10 overflow-hidden animate-fade-in max-h-64 overflow-y-auto"
                            >
                                {collectionsLoading ? (
                                    <div className="px-4 py-3 text-[0.78rem] text-ink-3 italic">Loading…</div>
                                ) : collections.length === 0 ? (
                                    <div className="px-4 py-3 text-[0.78rem] text-ink-3 italic">No collections found.</div>
                                ) : (
                                    collections.map((c, i) => {
                                        const checked = materialTags.includes(c.slug);
                                        return (
                                            <button
                                                key={c.slug}
                                                type="button"
                                                role="option"
                                                aria-selected={checked}
                                                onClick={() => toggleCollection(c.slug)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.78rem] font-medium hover:bg-bg-warm transition-colors ${
                                                    i > 0 ? 'border-t border-border-lt' : ''
                                                } ${checked ? 'bg-bg-warm' : ''}`}
                                            >
                                                <span className={`w-4 h-4 flex-shrink-0 border rounded-sm flex items-center justify-center transition-all ${
                                                    checked ? 'bg-ink border-ink' : 'border-border'
                                                }`}>
                                                    {checked && (
                                                        <svg className="w-3 h-3 text-bg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3.5 3.5L15 6.5" />
                                                        </svg>
                                                    )}
                                                </span>
                                                <span className="text-ink flex-1">{c.name}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                        <label className="block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-ink-2">Product Images</label>
                        <span className="text-[0.7rem] text-ink-3">{existingUrls.length + pendingFiles.length} of {MAX_IMAGES} used</span>
                    </div>
                    <p className="text-[0.7rem] text-ink-3 mb-3">First image is the main thumbnail. Up to {MAX_IMAGES} images per product.</p>
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
                    {existingUrls.length + pendingFiles.length >= MAX_IMAGES ? (
                        <p className="text-[0.72rem] text-ink-3 italic px-1">
                            Image limit reached. Remove one to add another.
                        </p>
                    ) : (
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => { addPendingFiles(e.target.files); e.target.value = ''; }}
                            className="w-full text-sm text-ink-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[0.7rem] file:font-semibold file:uppercase file:tracking-wider file:bg-ink file:text-bg hover:file:bg-[#2a2620] transition-all cursor-pointer"
                        />
                    )}

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