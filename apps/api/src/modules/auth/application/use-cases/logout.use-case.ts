import type { AuthenticatedContext } from '../../../../shared/security/contexts/actor-context';
import type { SessionRepository } from '../ports/session-repository.port';

export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(context: AuthenticatedContext): Promise<void> {
    await this.sessions.revoke(context.sessionId, context.actor.id, this.now(), 'logout');
  }
}
