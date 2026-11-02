import type { UserDirectory } from '../../../user/application/ports/user-directory.port';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import {
  assertCanSend,
  assertSameDelivery,
  messageContent,
} from '../../domain/policies/conversation.policy';
import type { ChatEvents } from '../ports/chat-events.port';
import type { ChatRepository, MessageInput } from '../ports/chat-repository.port';

export class SendMessageUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly directory: UserDirectory,
    private readonly events: ChatEvents,
  ) {}

  async execute(actorId: string, id: string, input: MessageInput) {
    const content = input.attachment && !input.content.trim() ? '' : messageContent(input.content);
    const result = await this.repository.transaction(id, actorId, async (tx) => {
      const existing = await tx.findDelivery(input.clientId);
      if (existing) {
        assertSameDelivery(existing, id, content);
        if (
          !existing.deletedAt &&
          (existing.attachment?.name !== input.attachment?.name ||
            existing.attachment?.size !== input.attachment?.size)
        ) {
          throw new BusinessRuleError(
            'conflict',
            'CHAT_CLIENT_ID_REUSED',
            'El identificador de envío ya fue utilizado',
          );
        }
        return { message: existing, participants: tx.conversation.participantIds };
      }
      assertCanSend(tx.conversation, actorId);
      const recipientId = tx.conversation.participantIds.find(
        (participant) => participant !== actorId,
      )!;
      if (!(await this.directory.findActive(recipientId))) {
        throw new BusinessRuleError(
          'conflict',
          'CHAT_USER_UNAVAILABLE',
          'Esta persona ya no está disponible',
        );
      }
      return {
        message: await tx.append({
          clientId: input.clientId,
          content,
          attachment: input.attachment,
        }),
        participants: tx.conversation.participantIds,
      };
    });
    this.events.changed(id, result.participants);
    return result.message;
  }
}
