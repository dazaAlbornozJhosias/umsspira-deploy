import { AccessError } from '../../../../shared/security/errors/access-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { SessionRepository } from '../ports/session-repository.port';

export class RevokeSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, id: string): Promise<void> {
    if (!(await this.sessions.revoke(id, actor.id, this.now(), 'revocacion_manual'))) {
      throw new AccessError('SESSION_NOT_FOUND');
    }
  }
}
