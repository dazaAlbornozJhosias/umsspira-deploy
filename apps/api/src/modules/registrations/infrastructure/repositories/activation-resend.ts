import type { Prisma } from '../../../../generated/prisma/client';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export function resendWait(control: { bloqueado_hasta: Date | null; enfriamiento_hasta: Date | null } | null, now: Date) {
  return Math.max(0, Math.ceil((Math.max(control?.bloqueado_hasta?.getTime() ?? 0,
    control?.enfriamiento_hasta?.getTime() ?? 0) - now.getTime()) / 1000));
}

// Se llama con la solicitud bloqueada FOR UPDATE y dentro de la misma transacción que encola el correo.
export async function reserveActivationResend(tx: Prisma.TransactionClient, id: string, now = new Date()) {
  const control = await tx.controlReenvioOtp.findUnique({ where: { id_solicitud: id } });
  if (resendWait(control, now) > 0) {
    throw new BusinessRuleError('limited', 'ACTIVATION_RESEND_BLOCKED', 'El reenvío está bloqueado temporalmente');
  }
  const previous = control && control.generaciones_ciclo < 10 ? control.generaciones_ciclo : 0;
  const count = previous + 1;
  const seconds = count === 5 ? 900 : count === 10 ? 7200 : 30;
  const data = {
    generaciones_ciclo: count,
    nivel_bloqueo: count >= 10 ? 2 : count >= 5 ? 1 : 0,
    enfriamiento_hasta: new Date(now.getTime() + 30000),
    bloqueado_hasta: count === 5 || count === 10 ? new Date(now.getTime() + seconds * 1000) : null,
    updated_at: now,
  };
  await tx.controlReenvioOtp.upsert({ where: { id_solicitud: id }, create: { id_solicitud: id, ...data }, update: data });
  return { resendCount: count, cooldownSeconds: seconds };
}
