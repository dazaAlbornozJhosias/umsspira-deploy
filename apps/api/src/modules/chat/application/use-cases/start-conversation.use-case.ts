import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { UserDirectory } from '../../../user/application/ports/user-directory.port';
import { messageContent } from '../../domain/policies/conversation.policy';
import type { ChatEvents } from '../ports/chat-events.port';
import type { ChatRepository, MessageInput } from '../ports/chat-repository.port';

export class StartConversationUseCase {
  constructor(
    private readonly repository: ChatRepository,
    private readonly directory: UserDirectory,
    private readonly events: ChatEvents,
  ) {}

  async execute(actorId: string, recipientId: string, input: MessageInput) {
    if (actorId === recipientId) {
      throw new BusinessRuleError('invalid', 'CHAT_SELF', 'Selecciona a otra persona');
    }
    const content = messageContent(input.content);
    if (!(await this.directory.findActive(recipientId))) {
      throw new BusinessRuleError(
        'missing',
        'CHAT_USER_NOT_FOUND',
        'La persona ya no está disponible',
      );
    }
    const result = await this.repository.start(actorId, recipientId, {
      clientId: input.clientId,
      content,
    });
    this.events.changed(result.conversation.id, result.conversation.participantIds);
    return result;
  }
}
