import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type {
  CorrectionTokenPort,
  StoredCorrectionToken,
} from '../../application/ports/correction-token.port';

@Injectable()
export class PrismaCorrectionTokenRepository implements CorrectionTokenPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveToken(applicationId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.tokenSubsanacion.updateMany({
        where: { id_solicitud: applicationId, revocado: false, usado: false },
        data: { revocado: true },
      });
      await tx.tokenSubsanacion.create({
        data: {
          id_solicitud: applicationId,
          token_hash: tokenHash,
          expira_en: expiresAt,
          revocado: false,
          usado: false,
        },
      });
    });
  }

  async findActiveToken(tokenHash: string): Promise<StoredCorrectionToken | null> {
    const row = await this.prisma.tokenSubsanacion.findUnique({
      where: { token_hash: tokenHash },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      applicationId: row.id_solicitud,
      tokenHash: row.token_hash,
      expiresAt: row.expira_en,
      used: row.usado,
      revoked: row.revocado,
    };
  }

  async revokeByApplication(applicationId: string): Promise<void> {
    await this.prisma.tokenSubsanacion.updateMany({
      where: { id_solicitud: applicationId, revocado: false, usado: false },
      data: { revocado: true },
    });
  }

  async getApplicationStatus(applicationId: string): Promise<string | null> {
    const row = await this.prisma.solicitud.findUnique({
      where: { id: applicationId },
      select: { estado: true },
    });
    return row?.estado ?? null;
  }
}
