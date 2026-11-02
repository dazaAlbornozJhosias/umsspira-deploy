import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { RecoveryTokenRecord } from '../../domain/entities/password-recovery.entity';
import { recoveryLinkState } from '../../domain/policies/password-recovery.policy';
import type {
  PasswordRecoveryRepository,
  RecoveryEvent,
  RecoveryIssue,
  RecoveryRequestResult,
  RecoveryResetOutcome,
} from '../../application/ports/password-recovery-repository.port';

// Código de Prisma para una violación de índice único.
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

interface LockedToken {
  id: string;
  id_usuario: string;
  expira_en: Date;
  usado_en: Date | null;
  revocado: boolean;
}

@Injectable()
export class PrismaPasswordRecoveryRepository implements PasswordRecoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countRecentRequests(email: string, originHash: string, since: Date) {
    // Las solicitudes rechazadas por límite no cuentan: así el bloqueo termina una hora después de la última aceptada.
    const accepted = { creado_en: { gte: since }, resultado: { not: 'rechazado_rate' } };
    const [byEmail, byOrigin] = await this.prisma.$transaction([
      this.prisma.passwordResetSolicitud.count({ where: { ...accepted, correo_normalizado: email } }),
      this.prisma.passwordResetSolicitud.count({ where: { ...accepted, origen_hash: originHash } }),
    ]);
    return { byEmail, byOrigin };
  }

  async recordRequest(input: {
    email: string;
    originHash: string;
    userId: string | null;
    result: RecoveryRequestResult;
    at: Date;
  }): Promise<void> {
    await this.prisma.passwordResetSolicitud.create({
      data: {
        correo_normalizado: input.email,
        origen_hash: input.originHash,
        usuario_id: input.userId,
        resultado: input.result,
        creado_en: input.at,
      },
    });
  }

  async issue(input: RecoveryIssue): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Solo puede haber un enlace activo por usuario: el anterior se revoca antes de crear el nuevo.
        const revoked = await tx.passwordResetToken.updateMany({
          where: { id_usuario: input.userId, usado_en: null, revocado: false },
          data: { revocado: true },
        });
        if (revoked.count) {
          await tx.passwordResetEvento.create({
            data: {
              usuario_id: input.userId,
              correo_normalizado: input.email,
              tipo: 'enlace_revocado',
              creado_en: input.now,
            },
          });
        }
        // creado_en se envía explícito para que la restricción de vigencia use el mismo reloj que expira_en.
        const token = await tx.passwordResetToken.create({
          data: {
            id_usuario: input.userId,
            token_hash: input.tokenHash,
            expira_en: input.expiresAt,
            creado_en: input.now,
          },
        });
        await tx.passwordResetCorreo.create({
          data: {
            id_token: token.id,
            email_destino: input.email,
            asunto: input.subject,
            cuerpo: input.body,
            siguiente_intento_en: input.now,
            creado_en: input.now,
          },
        });
        await tx.passwordResetEvento.create({
          data: {
            usuario_id: input.userId,
            correo_normalizado: input.email,
            tipo: 'solicitud',
            creado_en: input.now,
          },
        });
      });
      return true;
    } catch (error) {
      // Dos solicitudes simultáneas chocan con el índice de enlace activo: la otra ya lo creó.
      if (isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  async findByHash(tokenHash: string): Promise<RecoveryTokenRecord | null> {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      select: { id: true, id_usuario: true, expira_en: true, usado_en: true, revocado: true },
    });
    return row
      ? {
          id: row.id,
          userId: row.id_usuario,
          expiresAt: row.expira_en,
          usedAt: row.usado_en,
          revoked: row.revocado,
        }
      : null;
  }

  async reset(input: {
    tokenHash: string;
    passwordHash: string;
    now: Date;
  }): Promise<RecoveryResetOutcome> {
    return this.prisma.$transaction(async (tx) => {
      // El bloqueo evita que dos usos simultáneos del mismo enlace cambien la contraseña dos veces.
      const rows = await tx.$queryRaw<LockedToken[]>`
        SELECT id, id_usuario, expira_en, usado_en, revocado
        FROM password_reset_token
        WHERE token_hash = ${input.tokenHash}
        FOR UPDATE`;
      const token = rows[0];
      if (!token) {
        return { status: 'invalid' } as const;
      }
      const state = recoveryLinkState(
        { expiresAt: token.expira_en, usedAt: token.usado_en, revoked: token.revocado },
        input.now,
      );
      if (state !== 'valid') {
        return { status: state, userId: token.id_usuario } as const;
      }
      // El bloqueo serializa este cambio con los inicios de sesión y con el cambio de contraseña normal.
      await tx.$queryRaw`SELECT id_usuario FROM cuenta_acceso WHERE id_usuario = ${token.id_usuario}::uuid FOR UPDATE`;
      const account = await tx.cuentaAcceso.findUnique({
        where: { id_usuario: token.id_usuario },
        include: { usuario: true },
      });
      if (!account || account.usuario.estado !== 'ACTIVO') {
        return { status: 'invalid' } as const;
      }
      await tx.cuentaAcceso.update({
        where: { id_usuario: token.id_usuario },
        data: { password_hash: input.passwordHash, version: { increment: 1 }, actualizada_en: input.now },
      });
      await tx.sesionAcceso.updateMany({
        where: { id_usuario: token.id_usuario, revocada_en: null },
        data: { revocada_en: input.now, motivo_revocacion: 'recuperacion_password' },
      });
      await tx.passwordResetToken.update({ where: { id: token.id }, data: { usado_en: input.now } });
      await tx.passwordResetEvento.create({
        data: {
          usuario_id: token.id_usuario,
          correo_normalizado: account.usuario.correo,
          tipo: 'password_cambiada',
          creado_en: input.now,
        },
      });
      return { status: 'reset', userId: token.id_usuario } as const;
    });
  }

  async recordEvent(event: RecoveryEvent): Promise<void> {
    await this.prisma.passwordResetEvento.create({
      data: {
        usuario_id: event.userId,
        correo_normalizado: event.email,
        tipo: event.type,
        creado_en: event.at,
      },
    });
  }
}