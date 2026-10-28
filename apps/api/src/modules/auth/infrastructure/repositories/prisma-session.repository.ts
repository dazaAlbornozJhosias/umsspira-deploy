import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { AuthSession } from '../../domain/entities/auth-session.entity';
import type {
  SessionRepository,
  RotationResult,
} from '../../application/ports/session-repository.port';
import { toSession } from '../translators/session.translator';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: AuthSession, refreshHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      // El bloqueo serializa el login con los cambios de contraseña.
      await tx.$queryRaw`SELECT id_usuario FROM cuenta_acceso WHERE id_usuario = ${session.userId}::uuid FOR UPDATE`;
      const credential = await tx.cuentaAcceso.findUnique({
        where: { id_usuario: session.userId },
        include: { usuario: true },
      });
      if (
        credential?.version !== session.credentialVersion ||
        credential.usuario.estado !== 'ACTIVO'
      ) {
        return false;
      }
      await tx.sesionAcceso.create({
        data: {
          id: session.id,
          id_usuario: session.userId,
          version_credenciales: session.credentialVersion,
          csrf_hash: session.csrfHash,
          creada_en: session.createdAt,
          renovada_en: session.renewedAt,
          expira_en: session.expiresAt,
          recordar: session.remember,
          agente: session.agent,
          renovaciones: { create: { hash: refreshHash } },
        },
      });
      return true;
    });
  }

  async find(id: string): Promise<AuthSession | null> {
    const row = await this.prisma.sesionAcceso.findUnique({ where: { id } });
    return row ? toSession(row) : null;
  }

  async findRefresh(sessionId: string, hash: string) {
    const row = await this.prisma.renovacionAcceso.findUnique({
      where: { hash },
      include: { sesion: true },
    });
    return row && row.id_sesion === sessionId
      ? { session: toSession(row.sesion), consumed: row.consumida_en !== null }
      : null;
  }

  async rotate(
    sessionId: string,
    oldHash: string,
    newHash: string,
    now: Date,
  ): Promise<RotationResult> {
    return this.prisma.$transaction(async (tx) => {
      // Se bloquea la familia antes de leer el token; dos renovaciones no pueden consumirlo a la vez.
      await tx.$queryRaw`SELECT id FROM sesion_acceso WHERE id = ${sessionId}::uuid FOR UPDATE`;
      const token = await tx.renovacionAcceso.findUnique({
        where: { hash: oldHash },
        include: { sesion: true },
      });
      if (
        !token ||
        token.id_sesion !== sessionId ||
        token.sesion.revocada_en ||
        token.sesion.expira_en <= now
      ) {
        return 'invalid';
      }
      if (token.consumida_en) {
        await tx.sesionAcceso.update({
          where: { id: sessionId },
          data: { revocada_en: now, motivo_revocacion: 'refresh_reutilizado' },
        });
        // El resultado se devuelve después del commit: lanzar aquí revertiría la revocación.
        return 'reused';
      }
      const account = await tx.cuentaAcceso.findUnique({
        where: { id_usuario: token.sesion.id_usuario },
        include: { usuario: true },
      });
      if (
        !account ||
        account.version !== token.sesion.version_credenciales ||
        account.usuario.estado !== 'ACTIVO'
      ) {
        return 'invalid';
      }
      await tx.renovacionAcceso.update({ where: { hash: oldHash }, data: { consumida_en: now } });
      await tx.renovacionAcceso.create({ data: { hash: newHash, id_sesion: sessionId } });
      await tx.sesionAcceso.update({ where: { id: sessionId }, data: { renovada_en: now } });
      return 'rotated';
    });
  }

  async revoke(id: string, userId: string, now: Date, reason: string): Promise<boolean> {
    const result = await this.prisma.sesionAcceso.updateMany({
      where: { id, id_usuario: userId, revocada_en: null },
      data: { revocada_en: now, motivo_revocacion: reason },
    });
    return result.count > 0;
  }

  async revokeAll(userId: string, now: Date): Promise<void> {
    await this.prisma.sesionAcceso.updateMany({
      where: { id_usuario: userId, revocada_en: null },
      data: { revocada_en: now, motivo_revocacion: 'logout_all' },
    });
  }

  async list(userId: string, now: Date): Promise<AuthSession[]> {
    const rows = await this.prisma.sesionAcceso.findMany({
      where: { id_usuario: userId, revocada_en: null, expira_en: { gt: now } },
      orderBy: { creada_en: 'desc' },
      take: 100,
    });
    return rows.map(toSession);
  }
}
