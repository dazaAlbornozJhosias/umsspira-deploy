import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import { createTransport, type Transporter } from 'nodemailer';
import { z } from 'zod';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { describeMailError, mailRetryDelaySeconds } from '../../domain/policies/mail-retry.policy';
import { NodeRegistrationSecurity } from '../security/registration-security';
import { mailEventKey } from './queue-mail';

const messageSchema = z.object({
  to: z.email(),
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),
});

interface OutboxRow {
  id: string;
  contenido: string;
  expira_en: Date;
}



@Injectable()
export class SmtpOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmtpOutboxWorker.name);
  private timer?: NodeJS.Timeout;
  private transport?: Transporter;
  private running = false;
  private task?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly security: NodeRegistrationSecurity,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  onModuleInit(): void {
    if (this.config.get('NODE_ENV') === 'test') {
      return;
    }
    this.transport = createTransport({
      url: this.config.get<string>('SMTP_URL', 'smtp://127.0.0.1:1025'),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    this.timer = setInterval(() => {
      if (!this.running) {
        this.task = this.drain();
      }
    }, 5000);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.task;
    this.transport?.close();
  }

  private async sendViaBrevo(mail: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const from = this.config.get<string>('MAIL_FROM', 'UMSSPIRA <no-reply@umsspira.local>');

    const match = from.match(/^(?:(.*)<)?([^>]+)>?$/);
    const senderName = match?.[1]?.trim() || 'UMSSPIRA';
    const senderEmail = match?.[2]?.trim() || 'umsspira.fcyt@gmail.com';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: mail.to }],
        subject: mail.subject,
        textContent: mail.text,
        
        ...(mail.html ? { htmlContent: mail.html } : {}),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API Error (${response.status}): ${errorBody}`);
    }
  }

  async drain(): Promise<void> {
    if (this.running || !this.transport) {
      return;
    }
    this.running = true;
    try {
      const rows: OutboxRow[] = await this.prisma.correoPendiente.findMany({
        where: { enviado_en: null, proximo_en: { lte: new Date() }, expira_en: { gt: new Date() } },
        orderBy: { creado_en: 'asc' },
        take: 10,
      });
      for (const row of rows) {
        // La reserva permite varios procesos. SMTP ofrece entrega al menos una vez.
        const claimed = await this.prisma.correoPendiente.updateMany({
          where: {
            id: row.id,
            enviado_en: null,
            proximo_en: { lte: new Date() },
            expira_en: { gt: new Date() },
          },
          data: { proximo_en: new Date(Date.now() + 60000), intentos: { increment: 1 } },
        });
        if (!claimed.count) {
          continue;
        }
        let delivered = false;
        try {
          const mail = messageSchema.parse(this.security.open(row.contenido));
          const brevoKey = this.config.get<string>('BREVO_API_KEY');
          if (brevoKey) {
            // Si está configurada la API Key de Brevo (Producción / Render), se envía por HTTPS puerto 443
            await this.sendViaBrevo(mail);
          } else if (this.transport) {
            // Si no hay API Key de Brevo (Local), usa el transporte Nodemailer hacia Mailpit
            await this.transport.sendMail({
              from: this.config.get<string>('MAIL_FROM', 'UMSSPIRA <no-reply@umsspira.local>'),
              ...mail,
              messageId: '<' + row.id + '@umsspira.local>',
            });
          }
          delivered = true;
        } catch (error) {
          this.logger.warn('No se entregó la notificación ' + row.id + '; se reintentará');
          await this.recordFailure(row, error);
        }
        if (delivered) {
          await this.recordDelivery(row.id);
        }
      }
      await this.prisma.correoPendiente.deleteMany({
        where: {
          OR: [
            { expira_en: { lte: new Date() } },
            { enviado_en: { lt: new Date(Date.now() - 86400000) } },
          ],
        },
      });
      await this.prisma.borradorRegistro.deleteMany({
        where: { expira_en: { lte: new Date() }, id_solicitud: null },
      });
    } catch {
      this.logger.warn('No se pudo consultar la cola de correo');
    } finally {
      this.running = false;
    }
  }

  private findTracking(outboxId: string) {
    return this.prisma.correoTramite.findFirst({
      where: { clave_evento: mailEventKey(outboxId) },
      select: { id: true, intentos: true, max_intentos: true },
    });
  }

  private async recordDelivery(outboxId: string): Promise<void> {
    const now = new Date();
    try {
      // Se elimina el contenido cifrado después de entregar; no se conserva el código.
      await this.prisma.correoPendiente.update({
        where: { id: outboxId },
        data: { enviado_en: now, contenido: '' },
      });
      const tracking = await this.findTracking(outboxId);
      if (tracking) {
        await this.prisma.correoTramite.update({
          where: { id: tracking.id },
          data: {
            estado: 'enviada',
            intentos: Math.min(tracking.intentos + 1, tracking.max_intentos),
            ultimo_error: null,
            fecha_envio: now,
            fecha_ultimo_intento: now,
            updated_at: now,
          },
        });
      }
    } catch {
      this.logger.warn('Se entregó la notificación ' + outboxId + ' pero no se registró el resultado');
    }
  }

  // Sin fila de seguimiento (por ejemplo el código de registro) se mantiene el reintento
  // por tiempo hasta que el mensaje expira.
  private async recordFailure(row: OutboxRow, error: unknown): Promise<void> {
    try {
      const tracking = await this.findTracking(row.id);
      if (!tracking) {
        return;
      }
      const now = new Date();
      const attempts = Math.min(tracking.intentos + 1, tracking.max_intentos);
      const exhausted = attempts >= tracking.max_intentos;
      const nextAttempt = new Date(now.getTime() + mailRetryDelaySeconds(attempts) * 1000);
      await this.prisma.correoTramite.update({
        where: { id: tracking.id },
        data: {
          estado: exhausted ? 'fallida' : 'pendiente',
          intentos: attempts,
          ultimo_error: describeMailError(error),
          fecha_ultimo_intento: now,
          ...(exhausted ? {} : { siguiente_intento_en: nextAttempt }),
          updated_at: now,
        },
      });
      // Agotados los intentos, el mensaje queda estacionado hasta que expire:
      // conserva su contenido para poder reprocesarlo, pero el worker ya no lo toma.
      await this.prisma.correoPendiente.update({
        where: { id: row.id },
        data: { proximo_en: exhausted ? row.expira_en : nextAttempt },
      });
      if (exhausted) {
        this.logger.error('La notificación ' + row.id + ' agotó sus intentos de entrega');
      }
    } catch {
      this.logger.warn('No se pudo registrar el fallo de la notificación ' + row.id);
    }
  }
}