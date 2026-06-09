import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Book your piercing appointment at Fusion Piercings. Choose your piercing type and preferred time, and we will confirm via WhatsApp.',
  alternates: { canonical: '/book' },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
