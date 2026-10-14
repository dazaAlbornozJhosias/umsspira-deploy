import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Transporter } from 'nodemailer';
import { MAIL_CONFIG, MAIL_TRANSPORTER } from '../mail.config';
import type { MailConfig } from '../mail.config';

// Constantes con nombre descriptivo para evitar cadenas repetidas o magicas
const OTP_VERIFICATION_SUBJECT = 'Tu código de verificación';
const OTP_TEMPLATE_NAME = 'otp-verification';
const SEND_ERROR_MESSAGE =
  'No se pudo enviar el correo. Intenta nuevamente en unos minutos';

// Ubicacion fisica de las plantillas compiladas respecto a este archivo en dist/
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const REVIEW_APPROVED_SUBJECT = 'Tu solicitud fue aprobada';
const REVIEW_OBSERVED_SUBJECT = 'Tu solicitud tiene observaciones';
const REVIEW_REJECTED_SUBJECT = 'Tu solicitud no fue aprobada';
const REVIEW_APPROVED_TEMPLATE = 'review-approved';
const REVIEW_OBSERVED_TEMPLATE = 'review-observed';
const REVIEW_REJECTED_TEMPLATE = 'review-rejected';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export type SendOtpVerificationParams = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

type OutgoingMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // Cache en memoria para leer cada plantilla del disco una sola vez durante el ciclo de vida
  private readonly templateCache = new Map<string, string>();

  constructor(
    @Inject(MAIL_TRANSPORTER) private readonly transporter: Transporter,
    @Inject(MAIL_CONFIG) private readonly config: MailConfig,
  ) {}

  /**
   * Envia el codigo de verificacion de correo al egresado.
   */
  async sendOtpVerification({
    to,
    code,
    expiresInMinutes,
  }: SendOtpVerificationParams): Promise<void> {
    const variables = {
      platformName: this.config.fromName,
      code,
      expiresInMinutes: String(expiresInMinutes),
    };

    const [html, text] = await Promise.all([
      this.renderTemplate(`${OTP_TEMPLATE_NAME}.html`, variables, true),
      this.renderTemplate(`${OTP_TEMPLATE_NAME}.txt`, variables, false),
    ]);

    await this.send({ to, subject: OTP_VERIFICATION_SUBJECT, html, text });
  }

    /**
   * Notifica la aprobación de la solicitud e incluye el código de activación.
   * Lanza ServiceUnavailableException si falla el envío: quien lo llame debe
   * capturarlo para no deshacer el dictamen.
   */
  async sendReviewApproved({
    to,
    fullName,
    code,
    expiresInHours,
  }: SendReviewApprovedParams): Promise<void> {
    await this.sendFromTemplate(to, REVIEW_APPROVED_SUBJECT, REVIEW_APPROVED_TEMPLATE, {
      platformName: this.config.fromName,
      greeting: this.greeting(fullName),
      code,
      expiresInHours: String(expiresInHours),
    });
  }

  /** Notifica que la solicitud tiene observaciones a corregir. */
  async sendReviewObserved({
    to,
    fullName,
    observation,
  }: SendReviewObservedParams): Promise<void> {
    await this.sendFromTemplate(to, REVIEW_OBSERVED_SUBJECT, REVIEW_OBSERVED_TEMPLATE, {
      platformName: this.config.fromName,
      greeting: this.greeting(fullName),
      observation,
    });
  }

  /** Notifica el rechazo de la solicitud con su justificación. */
  async sendReviewRejected({
    to,
    fullName,
    justification,
  }: SendReviewRejectedParams): Promise<void> {
    await this.sendFromTemplate(to, REVIEW_REJECTED_SUBJECT, REVIEW_REJECTED_TEMPLATE, {
      platformName: this.config.fromName,
      greeting: this.greeting(fullName),
      justification,
    });
  }

  private async send(message: OutgoingMessage): Promise<void> {
    try {
      if (this.config.brevoApiKey) {
        await this.sendViaBrevo(message);
        return;
      }
      await this.transporter.sendMail({
        from: { name: this.config.fromName, address: this.config.fromAddress },
        ...message,
      });
    } catch (error) {
      // Seguridad: en los logs solo se registra el motivo del error, nunca el codigo OTP ni credenciales
      const reason = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Falló el envío del correo "${message.subject}": ${reason}`);
      throw new ServiceUnavailableException(SEND_ERROR_MESSAGE);
    }
  }

  /**
   * Envío por la API HTTPS de Brevo (puerto 443). Alternativa a SMTP para
   * plataformas que bloquean el correo saliente, como Render en plan free.
   */
  private async sendViaBrevo(message: OutgoingMessage): Promise<void> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.config.brevoApiKey!,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.config.fromName, email: this.config.fromAddress },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    });

    if (!response.ok) {
      const detalle = await response.text().catch(() => '');
      throw new Error(`Brevo respondió ${String(response.status)}: ${detalle.slice(0, 200)}`);
    }
  }

    private async sendFromTemplate(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<void> {
    const [html, text] = await Promise.all([
      this.renderTemplate(`${templateName}.html`, variables, true),
      this.renderTemplate(`${templateName}.txt`, variables, false),
    ]);

    await this.send({ to, subject, html, text });
  }

  private greeting(fullName?: string): string {
    const name = fullName?.trim();
    return name ? `Hola, ${name}:` : 'Hola:';
  }

  private async renderTemplate(
    fileName: string,
    variables: Record<string, string>,
    escape: boolean,
  ): Promise<string> {
    const template = await this.loadTemplate(fileName);
    return template.replace(PLACEHOLDER_PATTERN, (_match, name: string) => {
      const value = variables[name];
      if (value === undefined) {
        throw new Error(`La plantilla ${fileName} usa la variable no definida: ${name}`);
      }
      return escape ? escapeHtml(value) : value;
    });
  }

  private async loadTemplate(fileName: string): Promise<string> {
    const cached = this.templateCache.get(fileName);
    if (cached !== undefined) {
      return cached;
    }
    const content = await readFile(join(TEMPLATES_DIR, fileName), 'utf-8');
    this.templateCache.set(fileName, content);
    return content;
  }
  
}

export type SendReviewApprovedParams = {
  to: string;
  fullName?: string;
  code: string;
  expiresInHours: number;
};

export type SendReviewObservedParams = {
  to: string;
  fullName?: string;
  observation: string;
};

export type SendReviewRejectedParams = {
  to: string;
  fullName?: string;
  justification: string;
};