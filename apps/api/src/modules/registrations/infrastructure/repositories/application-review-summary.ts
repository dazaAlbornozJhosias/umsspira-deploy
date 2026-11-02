import type { Prisma } from '../../../../generated/prisma/client';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export const MAX_OBSERVATIONS = 2;
const observed = { in: ['OBSERVADA', 'OBSERVED', 'OBSERVADO'] };

export async function assertObservationLimit(tx: Prisma.TransactionClient, id: string) {
  const count = await tx.dictamen.count({ where: { id_solicitud: id, decision: observed } });
  if (count >= MAX_OBSERVATIONS) {
    throw new BusinessRuleError('conflict', 'OBSERVATION_LIMIT_REACHED',
      'Esta solicitud ya tiene dos observaciones. Debes aprobarla o rechazarla.');
  }
}

export async function applicationReviewSummary(tx: Prisma.TransactionClient, id: string) {
  const [observations, latest, rejections] = await Promise.all([
    tx.dictamen.count({ where: { id_solicitud: id, decision: observed } }),
    tx.dictamen.findFirst({ where: { id_solicitud: id, decision: observed },
      orderBy: [{ fecha_creacion: 'desc' }, { id: 'desc' }], select: { justificacion: true } }),
    // Misma identidad y estados que T-11.1; incluye expedientes anteriores de la persona.
    tx.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::integer AS total FROM solicitud s
      JOIN detalle_solicitud d ON d.id = s.id_detalle_solicitud
      JOIN solicitud actual ON actual.id = ${id}::uuid
      JOIN detalle_solicitud identidad ON identidad.id = actual.id_detalle_solicitud
      WHERE UPPER(TRIM(s.estado)) IN ('REJECTED', 'RECHAZADO', 'RECHAZADA')
        AND REGEXP_REPLACE(COALESCE(d.ci, ''), '[^0-9]', '', 'g')
          = REGEXP_REPLACE(COALESCE(identidad.ci, ''), '[^0-9]', '', 'g')
        AND UPPER(TRIM(COALESCE(d.extension_ci, '')))
          = UPPER(TRIM(COALESCE(identidad.extension_ci, '')))
        AND d.expedido_en = identidad.expedido_en
    `,
  ]);
  return { observations, maxObservations: MAX_OBSERVATIONS, rejections: rejections[0]?.total ?? 0,
    maxRejections: 5, latestObservation: latest?.justificacion ?? null,
    canObserve: observations < MAX_OBSERVATIONS };
}
