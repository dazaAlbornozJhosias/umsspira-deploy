'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { VerifyEmailForm } from '@/modules/email-verification/frontend/components/verify-email-form';
import { ProgressSteps } from '@/shared/components/progress-steps';

export default function VerifyEmailPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirige al paso 3: Carga de documento de respaldo (HU-03)
    router.push('/register/document');
  };

  const handleEditData = () => {
    // Redirige de regreso a la carga de datos personales (HU-01)
    router.push('/register');
  };

  return (
    <main className="min-h-[calc(100vh-144px)] bg-palladian px-4 py-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <ProgressSteps currentStep="email" />
        <VerifyEmailForm
          onSuccess={handleSuccess}
          onEditData={handleEditData}
        />
      </div>
    </main>
  );
}
