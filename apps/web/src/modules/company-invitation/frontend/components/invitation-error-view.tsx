'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import type { InvitationFailureReason } from '../services/invitation-error';

const INVALID_MESSAGE = {
  title: 'Enlace no válido',
  description:
    'El enlace de invitación no es válido o no puede utilizarse. Solicita una nueva invitación.',
};

const MESSAGES: Record<InvitationFailureReason, { title: string; description: string }> = {
  invalid: INVALID_MESSAGE,
  validation: INVALID_MESSAGE,
  expired: {
    title: 'Invitación vencida',
    description: 'Este enlace superó su vigencia de 7 días. Solicita una nueva invitación.',
  },
  used: {
    title: 'Invitación ya utilizada',
    description: 'Esta invitación ya se usó para activar una cuenta. Inicia sesión con tu correo.',
  },
  unavailable: {
    title: 'No fue posible validar la invitación',
    description: 'Ocurrió un problema de conexión o del servidor. Inténtalo nuevamente.',
  },
};

interface InvitationErrorViewProps {
  reason: InvitationFailureReason;
  onRetry?: () => void;
}

export function InvitationErrorView({ reason, onRetry }: InvitationErrorViewProps) {
  const { title, description } = MESSAGES[reason];

  return (
    <div className="flex flex-col items-center text-center" role="alert">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-truffle-trouble/10">
        <AlertCircle className="h-8 w-8 text-truffle-trouble" aria-hidden="true" />
      </div>
      <h1 className="text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
        {title}
      </h1>
      <p className="mt-2 text-sm text-blue-fantastic">{description}</p>

      {reason === 'unavailable' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 h-11 w-full rounded-lg bg-blue-fantastic text-sm font-semibold text-white hover:bg-abyssal-blue"
        >
          Reintentar
        </button>
      )}
      {reason === 'used' && (
        <Link
          href="/login"
          className="mt-8 flex h-11 w-full items-center justify-center rounded-lg bg-burning-flame text-sm font-bold text-white hover:bg-burning-flame/90"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  );
}