import type { Metadata } from 'next';
import { RegistrationReview } from '@/modules/registration/frontend/components/registration-review';

export const metadata: Metadata = {
  title: 'Revisión de solicitud | UMSSPIRA',
};

export default function RegisterReviewPage() {
  return (
    <div className="min-h-screen bg-palladian px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-4xl">
        <RegistrationReview />
      </main>
    </div>
  );
}
