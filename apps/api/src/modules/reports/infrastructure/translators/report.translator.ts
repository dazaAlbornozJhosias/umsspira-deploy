import type { Prisma } from '../../../../generated/prisma/client';
import type { GraduateReportRecord, ReportStatus } from '../../domain/entities/graduate-report';

export const reportInclude = {
  detalle_solicitud: { include: { carrera: { select: { nombre: true } } } },
  dictamen_registros: {
    orderBy: [
      { fecha_creacion: { sort: 'desc' as const, nulls: 'last' as const } },
      { id: 'desc' as const },
    ],
    take: 1,
    select: { fecha_creacion: true, justificacion: true },
  },
} satisfies Prisma.SolicitudInclude;

type ReportRow = Prisma.SolicitudGetPayload<{ include: typeof reportInclude }>;

export function toGraduateReport(row: ReportRow): GraduateReportRecord {
  const detail = row.detalle_solicitud;
  if (
    !detail?.id_carrera ||
    !['PENDIENTE', 'APROBADA', 'OBSERVADA', 'RECHAZADA'].includes(row.estado ?? '')
  ) {
    throw new Error('Solicitud persistida sin datos válidos de reporte');
  }
  const review = row.dictamen_registros[0];
  return {
    id: row.id,
    careerId: detail.id_carrera,
    careerName: detail.carrera?.nombre ?? '',
    firstName: detail.nombre ?? '',
    lastName: detail.apellido ?? '',
    email: detail.email ?? '',
    phone: detail.telefono ?? '',
    identityNumber: detail.ci ?? '',
    identityComplement: detail.extension_ci ?? '',
    issuedIn: detail.expedido_en === 'Extranjero' ? 'EX' : (detail.expedido_en ?? ''),
    sisCode: detail.cod_sis?.toString() ?? '',
    graduationYear: detail.anio_egreso,
    admissionDate: detail.fecha_ingreso,
    graduationDate: detail.fecha_titulacion,
    submittedAt: row.fecha_creacion,
    reviewedAt: review?.fecha_creacion ?? null,
    justification: review?.justificacion ?? null,
    wantsMentorship: detail.desea_mentor === true,
    status: row.estado as ReportStatus,
  };
}
