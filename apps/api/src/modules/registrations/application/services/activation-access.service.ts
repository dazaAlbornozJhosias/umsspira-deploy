import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { NodeRegistrationSecurity } from '../../infrastructure/security/registration-security';
import { reserveActivationResend, resendWait } from '../../infrastructure/repositories/activation-resend';
import { buildResolutionMail } from '../notifications/resolution-mail';
import { ACTIVATION_CODE_SECONDS } from '../../domain/policies/activation.policy';

@Injectable()
export class ActivationAccessService {
  constructor(private readonly prisma: PrismaService, private readonly security: NodeRegistrationSecurity) {}

  async inspect(id: string) {
    const row = await this.prisma.solicitud.findUnique({ where: { id }, include: { detalle_solicitud: true } });
    if (!row || !['APROBADA', 'APPROVED'].includes(row.estado ?? '')) {
      throw new BusinessRuleError('missing', 'ACTIVATION_UNAVAILABLE', 'El enlace de activación no está disponible');
    }
    if (row.activada_en) {
      throw new BusinessRuleError('conflict', 'ACTIVATION_ALREADY_DONE', 'Tu cuenta ya está activa. Inicia sesión o recupera tu contraseña');
    }
    const control = await this.prisma.controlReenvioOtp.findUnique({ where: { id_solicitud: id } });
    const [local = '', domain = ''] = (row.detalle_solicitud?.email ?? '').split('@');
    return {
      maskedEmail: local.slice(0, 2) + '****@' + domain,
      expiresAt: row.activacion_expira_en?.toISOString() ?? null,
      cooldownSeconds: resendWait(control, new Date()),
      resendCount: control?.generaciones_ciclo ?? 0,
      failedAttempts: row.activacion_intentos,
    };
  }

  async resend(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${id}::uuid FOR UPDATE`;
      const row = await tx.solicitud.findUnique({ where: { id }, include: { detalle_solicitud: true } });
      if (!row || !['APROBADA', 'APPROVED'].includes(row.estado ?? '') || row.activada_en || !row.detalle_solicitud?.email) {
        throw new BusinessRuleError('invalid', 'ACTIVATION_UNAVAILABLE', 'No se puede reenviar el código de esta solicitud');
      }
      const now = new Date();
      const limit = await reserveActivationResend(tx, id, now);
      const code = this.security.code();
      const expiresAt = new Date(now.getTime() + ACTIVATION_CODE_SECONDS * 1000);
      const mail = buildResolutionMail({ decision: 'APROBADA', applicationId: id, code, fullName: row.detalle_solicitud.nombre ?? '' });
      await tx.solicitud.update({ where: { id }, data: {
        activacion_hash: this.security.hash('activation', id + ':' + code),
        activacion_expira_en: expiresAt, activacion_intentos: 0,
      } });
      await tx.correoPendiente.create({ data: {
        contenido: this.security.seal({ to: row.detalle_solicitud.email, subject: mail.subject, text: mail.text }),
        expira_en: expiresAt,
      } });
      await tx.correoTramite.create({ select: { id: true }, data: {
        id_solicitud: id, tipo: 'otp', email_destino: row.detalle_solicitud.email,
        asunto: mail.subject, estado: 'pendiente',
      } });
      return { ...limit, expiresAt: expiresAt.toISOString(), notificationStatus: 'EN_COLA' };
    }, { timeout: 15000 });
  }
}
