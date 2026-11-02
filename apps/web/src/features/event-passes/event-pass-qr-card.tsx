
'use client';

import type { EventPassDto } from '@umsspira/shared-types';
import { EventPassCard } from '@/modules/events/components/EventPassCard';

interface EventPassQrCardProps {
  pass: EventPassDto;
}

function formatEventDate(value?: string): string {
  if (!value) return 'Fecha no disponible';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(date);
}

export function EventPassQrCard({ pass }: EventPassQrCardProps) {
  const isValid =
    pass.status === 'ACTIVO' && pass.isValidForAccess;

  const details = pass.eventDetails;

  const statusLabel = isValid
    ? 'PASE ACTIVO'
    : pass.status === 'VENCIDO'
      ? 'PASE VENCIDO'
      : pass.status === 'INVALIDADO'
        ? 'PASE INVALIDADO'
        : 'PASE NO HABILITADO';

  const statusDescription =
    pass.status === 'VENCIDO'
      ? 'Este pase ha vencido y ya no permite el acceso al evento.'
      : pass.status === 'INVALIDADO'
        ? 'Este pase ha sido invalidado y ya no permite el acceso al evento.'
        : 'Este pase no está habilitado para acceder al evento.';

  return (
    <EventPassCard
      status={isValid ? 'ACTIVO' : 'INVALID'}
      statusLabel={statusLabel}
      statusDescription={statusDescription}
      hideBackButton
      eventName={details?.name || 'Evento sin nombre'}
      userName={details?.userName || 'Titulado'}
      dateTime={formatEventDate(details?.dateTime)}
      location={details?.location || 'Ubicación no disponible'}
      passId={pass.id}
      qrToken={isValid ? pass.qrToken : undefined}
      onBack={() => window.history.back()}
    />
  );
}
