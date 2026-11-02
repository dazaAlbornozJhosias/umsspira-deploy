import {
  COMPANY_ROLES,
  INVITATION_STATUSES,
  type CompanyInvitation,
  type CompanyRole,
  type InvitationStatus,
} from '../../domain/entities/company-invitation.entity';

export const companyInvitationSelect = {
  id: true,
  id_empresa: true,
  correo: true,
  rol: true,
  estado: true,
  expira_en: true,
  aceptado_en: true,
  nombre: true,
  empresa: { select: { razon_social: true } },
} as const;

interface CompanyInvitationRecord {
  id: string;
  id_empresa: string;
  correo: string;
  rol: string;
  estado: string;
  expira_en: Date;
  aceptado_en: Date | null;
  nombre?: string | null;
  empresa: { razon_social: string | null };
}

export function toCompanyInvitation(record: CompanyInvitationRecord): CompanyInvitation | null {
  if (
    !INVITATION_STATUSES.includes(record.estado as InvitationStatus) ||
    !COMPANY_ROLES.includes(record.rol as CompanyRole)
  ) {
    return null;
  }
  return {
    id: record.id,
    companyId: record.id_empresa,
    companyName: record.empresa.razon_social ?? '',
    email: record.correo,
    role: record.rol as CompanyRole,
    status: record.estado as InvitationStatus,
    expiresAt: record.expira_en,
    acceptedAt: record.aceptado_en,
    name: record.nombre ?? null,
  };
}
