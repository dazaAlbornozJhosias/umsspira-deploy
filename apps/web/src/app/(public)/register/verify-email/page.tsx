'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerifyEmailForm } from '@/modules/email-verification/frontend/components/verify-email-form';
import { ProgressSteps } from '@/shared/components/progress-steps';

type VerifyEmailMode = 'initial' | 'update';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [mode, setMode] = useState<VerifyEmailMode>('initial');

  // El modo se lee del navegador despues de montar para no romper la generacion estatica.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(params.get('mode') === 'update' ? 'update' : 'initial');
  }, []);

  const isUpdate = mode === 'update';

  const handleSuccess = () => {
    // CA-07.2: el resumen muestra el correo como verificado solo despues de superar el OTP.
    // El store registra únicamente el correo confirmado por la respuesta OTP.

    // CA-07.4: al verificar el nuevo correo se regresa al resumen con los datos conservados.
    router.push(isUpdate ? '/register/review' : '/register/document');
  };

  const handleEditData = () => {
    // Redirige de regreso a la carga de datos personales (HU-01)
    router.push('/register');
  };

  const handleBackToReview = () => {
    router.push('/register/review');
  };

  return (
    <main className="min-h-[calc(100vh-144px)] bg-palladian px-4 py-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <ProgressSteps currentStep="email" />
        <VerifyEmailForm
          variant={isUpdate ? 'update' : 'initial'}
          onSuccess={handleSuccess}
          onEditData={isUpdate ? undefined : handleEditData}
          onBackToReview={isUpdate ? handleBackToReview : undefined}
        />
      </div>
    </main>
  );
}
