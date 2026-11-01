import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import {
  assertCanSend,
  assertOwnMessage,
  messageContent,
} from '../../domain/policies/conversation.policy';
import type { ChatRepository } from '../ports/chat-repository.port';
import type { ChatEvents } from '../ports/chat-events.port';

export class EditMessageUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly events: ChatEvents,
  ) {}
  async execute(actorId: string, id: string, messageId: string, value: string) {
    const content = messageContent(value);
    const result = await this.repository.transaction(id, actorId, async (tx) => {
      assertCanSend(tx.conversation, actorId);
      const message = await tx.findMessage(messageId);
      assertOwnMessage(message, actorId);
      if (message.deletedAt) {
        throw new BusinessRuleError(
          'conflict',
          'CHAT_MESSAGE_DELETED',
          'El mensaje ya fue eliminado',
        );
      }
      return {
        message: message.content === content ? message : await tx.edit(messageId, content),
        participants: tx.conversation.participantIds,
      };
    });
    this.events.changed(id, result.participants);
    return result.message;
  }
}
