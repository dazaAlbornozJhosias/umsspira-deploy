import { assertOwnMessage } from '../../domain/policies/conversation.policy';
import type { ChatRepository } from '../ports/chat-repository.port';
import type { ChatEvents } from '../ports/chat-events.port';

export class DeleteMessageUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly events: ChatEvents,
  ) {}
  async execute(actorId: string, id: string, messageId: string) {
    const result = await this.repository.transaction(id, actorId, async (tx) => {
      const message = await tx.findMessage(messageId);
      assertOwnMessage(message, actorId);
      return {
        message: message.deletedAt ? message : await tx.remove(messageId),
        participants: tx.conversation.participantIds,
      };
    });
    this.events.changed(id, result.participants);
    return result.message;
  }
}
