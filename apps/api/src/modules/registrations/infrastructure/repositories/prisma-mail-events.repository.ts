import { Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type {
  MailEventsRepository,
  MailRetryResult,
} from '../../application/ports/mail-events-repository.port';
import { MAIL_EVENT_PREFIX } from '../notifications/queue-mail';
import { scopedApplication } from './prisma-applications.repository';

const BATCH_LIMIT = 200;

@Injectable()
export class PrismaMailEventsRepository implements MailEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async requeueFailed(actor: ActorContext, id?: string): Promise<MailRetryResult> {
    return this.prisma.$transaction(async (tx) => {
      const failed = await tx.correoTramite.findMany({
        where: {
          estado: 'fallida',
          clave_evento: { startsWith: MAIL_EVENT_PREFIX + ':' },
          solicitud: { is: scopedApplication(actor) },
          ...(id ? { id } : {}),
        },
        select: { id: true, clave_evento: true },
        orderBy: { created_at: 'asc' },
        take: BATCH_LIMIT,
      });
      if (id && !failed.length) {
        throw new BusinessRuleError(
          'missing',
          'MAIL_EVENT_NOT_FOUND',
          'No hay un correo fallido con ese identificador a tu cargo',
        );
      }
      const now = new Date();
      const result: MailRetryResult = { requeued: 0, expired: 0 };
      for (const event of failed) {
        const outboxId = (event.clave_evento ?? '').slice(MAIL_EVENT_PREFIX.length + 1);
        // Solo se reprocesa si el contenido cifrado todavía existe (vigencia de 24 horas).
        const released = await tx.correoPendiente.updateMany({
          where: { id: outboxId, enviado_en: null, expira_en: { gt: now } },
          data: { proximo_en: now, intentos: 0 },
        });
        if (!released.count) {
          result.expired += 1;
          continue;
        }
        await tx.correoTramite.update({
          where: { id: event.id },
          data: { estado: 'pendiente', intentos: 0, siguiente_intento_en: now, updated_at: now },
        });
        result.requeued += 1;
      }
      return result;
    });
  }
}