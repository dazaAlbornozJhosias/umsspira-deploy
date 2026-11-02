import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../../../generated/prisma/client';
import { MAIL_MAX_ATTEMPTS } from '../../domain/policies/mail-retry.policy';

export const MAIL_EVENT_PREFIX = 'outbox';

// La clave une la fila de seguimiento (correo_tramite) con el correo en cola (correo_pendiente).
export function mailEventKey(outboxId: string): string {
  return MAIL_EVENT_PREFIX + ':' + outboxId;
}

export interface TrackedMail {
  encrypted: string;
  expiresAt: Date;
  applicationId: string;
  reviewId?: string;
  type: 'aprobacion' | 'observacion' | 'rechazo' | 'otp';
  to: string;
  subject: string;
}

// Debe llamarse dentro de la transacción que cambia el estado de la solicitud.
export async function queueTrackedMail(
  tx: Prisma.TransactionClient,
  mail: TrackedMail,
): Promise<string> {
  const outboxId = randomUUID();
  await tx.correoPendiente.create({
    data: { id: outboxId, contenido: mail.encrypted, expira_en: mail.expiresAt },
  });
  await tx.correoTramite.create({
    select: { id: true },
    data: {
      id_solicitud: mail.applicationId,
      id_dictamen: mail.reviewId ?? null,
      tipo: mail.type,
      email_destino: mail.to,
      asunto: mail.subject,
      estado: 'pendiente',
      max_intentos: MAIL_MAX_ATTEMPTS,
      clave_evento: mailEventKey(outboxId),
    },
  });
  return outboxId;
}