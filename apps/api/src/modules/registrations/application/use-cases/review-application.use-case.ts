import { Logger } from '@nestjs/common';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ReviewInput } from '../contracts/registration-inputs';
import { buildObservedMail } from '../notifications/observed-mail';
import { buildRejectedMail } from '../notifications/rejected-mail';
import { buildResolutionMail } from '../notifications/resolution-mail';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import type { CorrectionTokenService } from '../services/correction-token.service';

export interface CorrectionLinkIssuer {
  issueLink(applicationId: string): Promise<string>;
  revoke?(applicationId: string): Promise<void>;
}

// Debe coincidir con MAX_REJECTIONS de registration-transactions.ts
const REJECTION_LIMIT = 5;

export class ReviewApplicationUseCase {
  private readonly logger = new Logger(ReviewApplicationUseCase.name);

  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly security: RegistrationSecurity,
    private readonly tokenService?: CorrectionTokenService | CorrectionLinkIssuer,
  ) {}

  async execute(actor: ActorContext, id: string, input: ReviewInput) {
    const detail = await this.repository.find(actor, id);
    const code = input.decision === 'APROBADA' ? this.security.code() : null;
    const correctionUrl = await this.issueCorrectionLink(id, input);
    const remainingAttempts =
      input.decision === 'RECHAZADA' ? await this.remainingAttempts(id) : null;

    const mail =
      input.decision === 'OBSERVADA' && correctionUrl
        ? buildObservedMail({
            fullName: detail.fullName,
            category: input.category ?? '',
            note: input.note ?? '',
            correctionUrl,
          })
        : input.decision === 'RECHAZADA'
          ? buildRejectedMail({
              fullName: detail.fullName,
              category: input.category,
              note: input.note,
              remainingAttempts,
            })
          : buildResolutionMail({
              decision: input.decision,
              applicationId: id,
              fullName: detail.fullName,
              code,
              category: input.category,
              note: input.note,
              correctionUrl: correctionUrl ?? undefined,
            });

    try {
      return await this.repository.review(
        actor,
        id,
        input,
        code ? this.security.hash('activation', id + ':' + code) : null,
        this.security.seal({
          to: detail.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        }),
        { type: mail.type, to: detail.email, subject: mail.subject },
      );
    } catch (error) {
      if (input.decision === 'OBSERVADA' && correctionUrl && this.tokenService?.revoke) {
        await this.tokenService.revoke(id).catch(() => undefined);
      }
      throw error;
    }
  }

  private async issueCorrectionLink(id: string, input: ReviewInput): Promise<string | null> {
    if (input.decision !== 'OBSERVADA' || !this.tokenService) {
      return null;
    }
    try {
      return await this.tokenService.issueLink(id);
    } catch (error) {
      // El dictamen no depende del enlace: el titulado podrá pedirlo después
      const reason =
        error instanceof Error ? `${error.name}: ${error.message.split('\n').pop()}` : String(error);
      this.logger.error(
        `No se pudo generar el enlace de corrección para el correo de observado (${reason})`,
      );
      return null;
    }
  }

  private async remainingAttempts(id: string): Promise<number | null> {
    try {
      const previous = await this.repository.countRejections(id);
      // +1 porque el rechazo actual aún no está guardado
      return Math.max(0, REJECTION_LIMIT - (previous + 1));
    } catch (error) {
      // El dictamen no depende del conteo: el correo usa el texto genérico
      const reason = error instanceof Error ? error.message.split('\n').pop() : String(error);
      this.logger.error(`No se pudo contar los rechazos para el correo de rechazo (${reason})`);
      return null;
    }
  }
}