import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { Environment } from '../../../../config/environment';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { recoveryLinkState } from '../../domain/policies/password-recovery.policy';

interface PendingMail {
  id: string;
  email_destino: string;
  asunto: string;
  cuerpo: string | null;
  intentos: number;
  max_intentos: number;
  token: { id_usuario: string; expira_en: Date; usado_en: Date | null; revocado: boolean };
}

// Envía los correos de recuperación de la tabla password_reset_correo (CA-12.4).
// Usa el mismo SMTP_URL y MAIL_FROM que el resto de la API. El cuerpo lleva el enlace con el token en claro,
// por eso se borra en cuanto el correo se entrega o falla de forma definitiva.
@Injectable()
export class PasswordResetMailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetMailWorker.name);
  private timer?: NodeJS.Timeout;
  private transport?: Transporter;
  private running = false;
  private task?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
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

  async drain(): Promise<void> {
    if (this.running || !this.transport) {
      return;
    }
    this.running = true;
    try {
      const rows = await this.prisma.passwordResetCorreo.findMany({
        where: { estado: 'pendiente', siguiente_intento_en: { lte: new Date() } },
        include: { token: true },
        orderBy: { creado_en: 'asc' },
        take: 10,
      });
      for (const row of rows) {
        await this.deliver(row);
      }
    } catch {
      this.logger.warn('No se pudo consultar la cola de correos de recuperación');
    } finally {
      this.running = false;
    }
  }

  private async deliver(row: PendingMail): Promise<void> {
    const now = new Date();
    // La reserva permite varios procesos: solo uno envía cada correo.
    const claimed = await this.prisma.passwordResetCorreo.updateMany({
      where: { id: row.id, estado: 'pendiente', siguiente_intento_en: { lte: now } },
      data: { siguiente_intento_en: new Date(now.getTime() + 60_000), intentos: { increment: 1 } },
    });
    if (!claimed.count) {
      return;
    }

    // No se envía un enlace que ya no sirve (usado, reemplazado o vencido mientras esperaba).
    const state = recoveryLinkState(
      { expiresAt: row.token.expira_en, usedAt: row.token.usado_en, revoked: row.token.revocado },
      now,
    );
    if (state !== 'valid' || !row.cuerpo) {
      await this.prisma.passwordResetCorreo.update({
        where: { id: row.id },
        data: { estado: 'fallida', cuerpo: null, ultimo_error: 'enlace_no_vigente', actualizado_en: now },
      });
      return;
    }

    const attempt = row.intentos + 1;
    try {
      const info = await this.transport!.sendMail({
        from: this.config.get<string>('MAIL_FROM', 'UMSSPIRA <no-reply@umsspira.local>'),
        to: row.email_destino,
        subject: row.asunto,
        text: row.cuerpo,
        messageId: `<${row.id}@umsspira.local>`,
      });
      await this.prisma.passwordResetCorreo.update({
        where: { id: row.id },
        data: {
          estado: 'enviada',
          cuerpo: null,
          fecha_envio: now,
          smtp_message_id: String(info?.messageId ?? '').slice(0, 255) || null,
          ultimo_error: null,
          actualizado_en: now,
        },
      });
      await this.event(row, 'enlace_enviado', now);
    } catch (error) {
      const finalAttempt = attempt >= row.max_intentos;
      await this.prisma.passwordResetCorreo.update({
        where: { id: row.id },
        data: {
          estado: finalAttempt ? 'fallida' : 'pendiente',
          ...(finalAttempt ? { cuerpo: null } : {}),
          siguiente_intento_en: new Date(now.getTime() + attempt * 120_000),
          ultimo_error: String((error as Error)?.message ?? 'error_smtp').slice(0, 500),
          actualizado_en: now,
        },
      });
      if (finalAttempt) {
        await this.event(row, 'error_smtp', now);
      }
      this.logger.warn(`No se entregó el correo de recuperación ${row.id}; intento ${attempt}`);
    }
  }

  private async event(row: PendingMail, type: string, at: Date): Promise<void> {
    await this.prisma.passwordResetEvento.create({
      data: { usuario_id: row.token.id_usuario, correo_normalizado: row.email_destino, tipo: type, creado_en: at },
    });
  }
}