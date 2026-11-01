import type { ChatRepository } from '../ports/chat-repository.port';

export class ListMessagesUseCase {
  constructor(private readonly repository: ChatRepository) {}
  execute(actorId: string, id: string, before?: string) {
    return this.repository.messages(id, actorId, before);
  }
}
