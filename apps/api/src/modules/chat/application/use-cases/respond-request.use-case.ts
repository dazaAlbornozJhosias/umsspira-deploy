import { assertCanRespond } from '../../domain/policies/conversation.policy';
import type { ChatRepository } from '../ports/chat-repository.port';
import type { ChatEvents } from '../ports/chat-events.port';

export class RespondRequestUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly events: ChatEvents,
  ) {}

  async execute(actorId: string, id: string, decision: 'accept' | 'decline') {
    const status = decision === 'accept' ? 'ACEPTADO' : 'RECHAZADO';
    const result = await this.repository.transaction(id, actorId, async (tx) => {
      assertCanRespond(tx.conversation, actorId, status);
      return tx.respond(status);
    });
    this.events.changed(id, result.participantIds);
    return result;
  }
}
