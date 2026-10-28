import { ConfirmationContent } from '@/modules/documents/frontend/components/confirmation-content';

export const metadata = {
  title: 'Solicitud enviada',
};

export default function ConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center bg-palladian px-4 py-10">
      <ConfirmationContent />
    </main>
  );
}
