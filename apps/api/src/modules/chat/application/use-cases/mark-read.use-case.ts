import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ChatRepository } from '../ports/chat-repository.port';
import type { ChatEvents } from '../ports/chat-events.port';

export class MarkReadUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly events: ChatEvents,
  ) {}
  async execute(actorId: string, id: string, messageId: string) {
    const participants = await this.repository.transaction(id, actorId, async (tx) => {
      const message = await tx.findMessage(messageId);
      if (!message) {
        throw new BusinessRuleError(
          'missing',
          'CHAT_MESSAGE_NOT_FOUND',
          'No se encontró el mensaje',
        );
      }
      await tx.markRead(message);
      return tx.conversation.participantIds;
    });
    this.events.changed(id, participants);
  }
}
