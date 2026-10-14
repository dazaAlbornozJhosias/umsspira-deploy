import {
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type {
  IssueCodeResultDTO,
  VerifyEmailResultDTO,
} from '@umsspira/shared-types';
import { MailService } from '@/modules/mail/services/mail.service';
import {
  EMAIL_VERIFICATION_CONFIG,
  type EmailVerificationConfig,
} from '../email-verification.config';
import {
  CODE_LENGTH,
  CODE_TTL_SECONDS,
  EMAIL_VERIFICATION_MESSAGES,
  MAX_VERIFY_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  buildCooldownMessage,
} from '../email-verification.constants';
import { DraftAccessRepository } from '../repositories/draft-access.repository';
import { EmailVerificationRepository } from '../repositories/email-verification.repository';

const SECONDS_PER_MINUTE = 60;

// Oculta el centro del correo: ju****z@gmail.com
function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (local.length <= 3) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.slice(0, 2)}****${local.slice(-1)}@${domain}`;
}

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly repository: EmailVerificationRepository,
    private readonly drafts: DraftAccessRepository,
    private readonly mailService: MailService,
    @Inject(EMAIL_VERIFICATION_CONFIG)
    private readonly config: EmailVerificationConfig,
  ) {}

  /**
   * Genera un código nuevo, invalida el anterior y lo envía al correo del borrador.
   * Sirve tanto para el primer envío (CA-02.1) como para el reenvío (CA-02.6).
   */
  async issueCode(registrationId: string): Promise<IssueCodeResultDTO> {
    const draft = await this.drafts.find(registrationId);
    if (!draft) {
      throw new NotFoundException(EMAIL_VERIFICATION_MESSAGES.draftNotFound);
    }
    if (draft.emailVerified) {
      throw new ConflictException(EMAIL_VERIFICATION_MESSAGES.alreadyVerified);
    }

    const reserved = await this.repository.reserveCooldown(
      registrationId,
      RESEND_COOLDOWN_SECONDS,
    );
    if (!reserved) {
      const remaining = await this.repository.getCooldownRemaining(registrationId);
      throw new HttpException(
        buildCooldownMessage(remaining),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateCode();
    await this.repository.storeCode(
      registrationId,
      this.hashCode(registrationId, code),
      CODE_TTL_SECONDS,
    );

    try {
      await this.mailService.sendOtpVerification({
        to: draft.email,
        code,
        expiresInMinutes: CODE_TTL_SECONDS / SECONDS_PER_MINUTE,
      });
    } catch (error) {
      // Si el correo no salio, deshacemos todo en Redis para permitir reintento inmediato
      await this.repository.deleteAll(registrationId);
      throw error;
    }

    return {
      maskedEmail: maskEmail(draft.email),
      expiresInSeconds: CODE_TTL_SECONDS,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  /** Valida el código ingresado por el egresado (CA-02.2 a CA-02.5). */
  async verifyCode(
    registrationId: string,
    code: string,
  ): Promise<VerifyEmailResultDTO> {
    const draft = await this.drafts.find(registrationId);
    if (!draft) {
      throw new NotFoundException(EMAIL_VERIFICATION_MESSAGES.draftNotFound);
    }
    if (draft.emailVerified) {
      return { verified: true };
    }

    const storedHash = await this.repository.findCodeHash(registrationId);
    if (!storedHash) {
      throw new GoneException(EMAIL_VERIFICATION_MESSAGES.codeExpired);
    }

    // Se suma el intento antes de comparar para bloquear peticiones concurrentes
    const attempts = await this.repository.incrementAttempts(registrationId);
    if (attempts === null) {
      throw new GoneException(EMAIL_VERIFICATION_MESSAGES.codeExpired);
    }
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.repository.deleteCode(registrationId);
      throw new HttpException(
        EMAIL_VERIFICATION_MESSAGES.attemptsExceeded,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Mensaje genérico: nunca revela cuántos intentos restan (CA-02.3)
    if (!this.isSameHash(storedHash, this.hashCode(registrationId, code))) {
      throw new BadRequestException(EMAIL_VERIFICATION_MESSAGES.codeIncorrect);
    }

    await this.drafts.markEmailVerified(registrationId);
    // Código utilizado queda invalidado de inmediato (CA-02.2)
    await this.repository.deleteAll(registrationId);
    return { verified: true };
  }

  /**
   * Invalida el código y cooldown vigentes.
   * El módulo de registro lo llama si el egresado corrige su correo (CA-02.7).
   */
  async invalidateCode(registrationId: string): Promise<void> {
    await this.repository.deleteAll(registrationId);
  }

  private generateCode(): string {
    return randomInt(0, 10 ** CODE_LENGTH)
      .toString()
      .padStart(CODE_LENGTH, '0');
  }

  private hashCode(registrationId: string, code: string): string {
    return createHmac('sha256', this.config.hashSecret)
      .update(`${registrationId}:${code}`)
      .digest('hex');
  }

  private isSameHash(storedHash: string, candidateHash: string): boolean {
    const stored = Buffer.from(storedHash);
    const candidate = Buffer.from(candidateHash);
    return stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }
}