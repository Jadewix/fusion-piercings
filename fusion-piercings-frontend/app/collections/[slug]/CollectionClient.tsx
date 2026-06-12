'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Nav from '@/components/Nav';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import Shop from '@/components/Shop';

interface Props {
  title: string;
  materialTag: string;
  showSubcategoryTabs?: boolean;
}

const SUBCATEGORIES = [
  { value: 'all',    label: 'All'    },
  { value: 'ear',    label: 'Ear'    },
  { value: 'belly',  label: 'Belly'  },
  { value: 'nipple', label: 'Nipple' },
  { value: 'nose',   label: 'Nose'   },
];

export default function CollectionClient({ title, materialTag, showSubcategoryTabs }: Props) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const urlCategory  = searchParams?.get('category') ?? 'all';
  const [subcategory, setSubcategory]   = useState<string>(urlCategory);

  // Sync state when the user navigates between submenu links on the same collection
  useEffect(() => {
    setSubcategory(urlCategory);
  }, [urlCategory]);

  // Keep the selected tab in the URL (replace, not push — tab switching
  // shouldn't pile up history entries). This way, coming back from a product
  // page restores the exact tab the user was on.
  const selectCategory = (value: string) => {
    setSubcategory(value);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value === 'all') params.delete('category');
    else params.set('category', value);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  return (
    <>
      <Nav />
      <CartDrawer />

      <main className="pt-[72px]">
        {/* Collection header */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-14 pb-2">
          <span className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-gold-dk mb-3 section-label-line">
            Collection
          </span>
          <h1 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-ink">
            {title}
          </h1>

          {/* Subcategory tabs */}
          {showSubcategoryTabs && (
            <div
              className="flex flex-wrap items-center gap-2 mt-8"
              role="group"
              aria-label="Filter by placement"
            >
              <span className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-ink-3 mr-1 shrink-0">
                Placement
              </span>
              {SUBCATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => selectCategory(cat.value)}
                  className={`px-5 py-1.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase rounded-full border transition-all duration-200 ${
                    subcategory === cat.value
                      ? 'bg-ink border-ink text-bg'
                      : 'bg-transparent border-border text-ink-2 hover:border-ink hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Shop
          materialTag={materialTag}
          category={showSubcategoryTabs ? subcategory : undefined}
          hideHeader
        />
      </main>

      <Footer />
      <Toast />
    </>
  );
}
