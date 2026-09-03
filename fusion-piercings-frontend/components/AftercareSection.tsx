import Shop from '@/components/Shop';
import { AFTERCARE_CATEGORY } from '@/lib/categories';

// Aftercare products (sprays, saline, cleaning solutions) sit in their own
// section rather than in the jewelry grid: they have no metal colour, no
// placement and no bar size, so every filter above the jewelry grid would be
// meaningless for them. Pinning the category and hiding the filters reuses the
// same grid, pagination and cart behaviour without the irrelevant controls.
export default function AftercareSection() {
  return (
    <Shop
      id="aftercare"
      category={AFTERCARE_CATEGORY}
      hideFilters
      eyebrow="Piercing Aftercare"
      title="Aftercare Products"
      emptyMessage="Aftercare products are coming soon."
      background="warm"
    />
  );
}
