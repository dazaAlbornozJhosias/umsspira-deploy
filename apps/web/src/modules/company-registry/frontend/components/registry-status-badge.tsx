import type { CompanyAccessStatus, CompanyInvitationStatus } from '@umsspira/shared-types';

type BadgeStatus = CompanyAccessStatus | CompanyInvitationStatus;

const LABELS: Record<BadgeStatus, string> = {
  activa: 'Activa',
  aceptada: 'Aceptada',
  pendiente: 'Pendiente',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

const STYLES: Record<BadgeStatus, string> = {
  activa: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  aceptada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pendiente: 'border-amber-200 bg-amber-50 text-amber-800',
  vencida: 'border-red-200 bg-red-50 text-truffle-trouble',
  cancelada: 'border-gray-200 bg-gray-100 text-gray-600',
};

export function RegistryStatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}