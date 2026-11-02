import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MailEventsRepository, MailRetryResult } from '../ports/mail-events-repository.port';

export class RetryMailEventsUseCase {
  constructor(private readonly repository: MailEventsRepository) {}

  retryFailed(actor: ActorContext): Promise<MailRetryResult> {
    return this.repository.requeueFailed(actor);
  }

  retryOne(actor: ActorContext, id: string): Promise<MailRetryResult> {
    return this.repository.requeueFailed(actor, id);
  }
}