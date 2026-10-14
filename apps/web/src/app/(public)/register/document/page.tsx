import { ProgressSteps } from '@/shared/components/progress-steps';
import { DocumentUploadStep } from '@/modules/documents/frontend/components/document-upload-step';

export default function RegisterDocumentPage() {
  return (
    <div className="min-h-screen bg-palladian px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <ProgressSteps currentStep="document" />
        <DocumentUploadStep />
      </main>
    </div>
  );
}
