import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { AuthSession } from '../../domain/entities/auth-session.entity';
import type { SessionRepository } from '../ports/session-repository.port';

export class ListSessionsUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext): Promise<AuthSession[]> {
    return this.sessions.list(actor.id, this.now());
  }
}
