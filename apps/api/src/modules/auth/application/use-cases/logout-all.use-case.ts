import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { SessionRepository } from '../ports/session-repository.port';

export class LogoutAllUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext): Promise<void> {
    await this.sessions.revokeAll(actor.id, this.now());
  }
}
