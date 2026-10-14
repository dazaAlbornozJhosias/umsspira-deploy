import { SubmissionConfirmation } from "../../../../modules/documents/frontend/components/submission-confirmation";

export const metadata = {
  title: "Solicitud enviada",
};

// Datos de ejemplo mientras se conecta la respuesta real del envío (HU-03 backend).
const MOCK_SUBMISSION = {
  submittedAt: "2026-10-01T15:30:00Z",
  documentType: "national-title" as const,
  fullName: "Juan Pérez Rojas",
  idNumber: "1234567",
  email: "juanperez@gmail.com",
};

export default function ConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center bg-palladian px-4 py-10">
      <SubmissionConfirmation {...MOCK_SUBMISSION} />
    </main>
  );
}