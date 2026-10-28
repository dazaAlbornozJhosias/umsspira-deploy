import type { Prisma } from '../../../../generated/prisma/client';
import type { ApplicationDetail } from '../../domain/entities/application';
import { applicationInclude } from './registration.translator';

type ApplicationRow = Prisma.SolicitudGetPayload<{ include: typeof applicationInclude }>;

function normalizeStatus(rawEstado: string | null | undefined): ApplicationDetail['status'] {
  const upper = (rawEstado ?? '').toUpperCase();
  if (upper === 'PENDING' || upper === 'PENDIENTE') {return 'PENDIENTE';}
  if (upper === 'APPROVED' || upper === 'APROBADA') {return 'APROBADA';}
  if (upper === 'OBSERVED' || upper === 'OBSERVADA') {return 'OBSERVADA';}
  if (upper === 'REJECTED' || upper === 'RECHAZADA') {return 'RECHAZADA';}
  return (rawEstado as ApplicationDetail['status']) ?? 'PENDIENTE';
}

export function toApplication(row: ApplicationRow): ApplicationDetail {
  const detail = row.detalle_solicitud;
  const file = row.registro?.archivo;
  const submittedAt = row.fecha_creacion?.toISOString() ?? '';
  return {
    id: row.id,
    code:
      'TIT-' + submittedAt.slice(0, 4) + '-' + row.id.replaceAll('-', '').slice(0, 6).toUpperCase(),
    fullName: [detail?.nombre, detail?.apellido].filter(Boolean).join(' '),
    firstName: detail?.nombre ?? '',
    lastName: detail?.apellido ?? '',
    email: detail?.email ?? '',
    ci: detail?.ci ?? '',
    issuedIn: detail?.expedido_en === 'Extranjero' ? 'EX' : (detail?.expedido_en ?? ''),
    sisCode: detail?.cod_sis?.toString() ?? '',
    career: detail?.carrera?.nombre ?? '',
    careerId: detail?.id_carrera ?? null,
    status: normalizeStatus(row.estado),
    submittedAt,
    phone: detail?.telefono ?? '',
    graduationYear: detail?.anio_egreso ?? null,
    documentName: file?.nombre ?? '',
    documentPath: file?.id ?? null,
    documentFormat: file?.mime ?? '',
  };
}
