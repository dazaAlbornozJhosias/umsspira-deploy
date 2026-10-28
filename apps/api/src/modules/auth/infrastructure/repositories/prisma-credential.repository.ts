import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { Credential } from '../../domain/entities/credential.entity';
import type { CredentialRepository } from '../../application/ports/credential-repository.port';

@Injectable()
export class PrismaCredentialRepository implements CredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Credential | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { correo: email },
      select: { usuario_id: true, correo: true, cuenta_acceso: true },
    });
    if (!user?.correo || !user.cuenta_acceso) {
      return null;
    }
    return {
      userId: user.usuario_id,
      email: user.correo,
      passwordHash: user.cuenta_acceso.password_hash,
      version: user.cuenta_acceso.version,
    };
  }

  async rehash(credential: Credential, hash: string): Promise<void> {
    await this.prisma.cuentaAcceso.updateMany({
      where: {
        id_usuario: credential.userId,
        version: credential.version,
        password_hash: credential.passwordHash,
      },
      data: { password_hash: hash },
    });
  }

  async changePassword(credential: Credential, hash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.cuentaAcceso.updateMany({
        where: {
          id_usuario: credential.userId,
          version: credential.version,
          password_hash: credential.passwordHash,
        },
        data: { password_hash: hash, version: { increment: 1 }, actualizada_en: now },
      });
      if (!changed.count) {
        return false;
      }
      await tx.sesionAcceso.updateMany({
        where: { id_usuario: credential.userId, revocada_en: null },
        data: { revocada_en: now, motivo_revocacion: 'cambio_password' },
      });
      return true;
    });
  }
}
