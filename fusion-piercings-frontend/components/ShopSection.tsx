import Shop from '@/components/Shop';

// Thin wrapper around <Shop /> so the home page can stay a server component
// while the shop grid stays a client island.
export default function ShopSection() {
  return <Shop />;
}
