import { ProgressSteps } from '@/shared/components/progress-steps';
import { RegistrationForm } from '@/modules/registration/frontend/components/registration-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-palladian px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl">
        <ProgressSteps currentStep="data" />
        <RegistrationForm />
      </main>
    </div>
  );
}
