import type { CompanyAccountRole } from '@umsspira/shared-types';

export const ROLE_LABELS: Record<CompanyAccountRole, string> = {
  administrador: 'Administrador',
  reclutador: 'Reclutador',
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}