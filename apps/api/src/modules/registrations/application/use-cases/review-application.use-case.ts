import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ReviewInput } from '../contracts/registration-inputs';
import { buildResolutionMail } from '../notifications/resolution-mail';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class ReviewApplicationUseCase {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly security: RegistrationSecurity,
  ) {}
 async execute(actor: ActorContext, id: string, input: ReviewInput) {
      const detail = await this.repository.find(actor, id);
      const code = input.decision === 'APROBADA' ? this.security.code() : null;
      const mail = buildResolutionMail({
        decision: input.decision,
        applicationId: id,
        fullName: detail.fullName,
        code,
        category: input.category,
        note: input.note,
      });
      return this.repository.review(
        actor,
        id,
        input,
        code ? this.security.hash('activation', id + ':' + code) : null,
        this.security.seal({ to: detail.email, subject: mail.subject, text: mail.text }),
        { type: mail.type, to: detail.email, subject: mail.subject },
      );
    }
}