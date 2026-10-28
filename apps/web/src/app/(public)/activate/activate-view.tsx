'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ActivateOtpStep, ActivatePasswordStep } from '@/modules/activation';
import { ActivationProgress } from '@/modules/activation/frontend/components/activation-progress';

export function ActivateView() {
  const params = useSearchParams();
  const applicationId = params.get('applicationId') || params.get('id') || params.get('solicitud') || '';
  return <ActivationFlow key={applicationId} applicationId={applicationId} />;
}

function ActivationFlow({ applicationId }: { applicationId: string }) {
  const [step, setStep] = useState<'otp' | 'password' | 'done'>('otp');
  const [token, setToken] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId)) {
    return <section className="w-full max-w-3xl rounded-2xl border border-oatmeal bg-white p-8 text-center">
      <h1 className="text-2xl font-bold text-abyssal-blue">Activa tu cuenta</h1>
      <p className="mt-4 text-abyssal-blue/75">Abre el enlace de activación que recibiste en tu correo de aprobación.</p>
      <Link href="/login" className="mt-6 inline-block font-semibold text-abyssal-blue underline">Ir a iniciar sesión</Link>
    </section>;
  }
  return <div className="w-full max-w-3xl">
    <ActivationProgress step={step} />
    {token && step !== 'otp' ? <ActivatePasswordStep applicationId={applicationId} activationToken={token} maskedEmail={maskedEmail}
      onSuccess={() => setStep('done')}
      onBackToOtp={() => { setToken(null); setStep('otp'); }} /> :
      <ActivateOtpStep applicationId={applicationId} onSuccess={(value, email) => { setToken(value); setMaskedEmail(email); setStep('password'); }} />}
  </div>;
}
