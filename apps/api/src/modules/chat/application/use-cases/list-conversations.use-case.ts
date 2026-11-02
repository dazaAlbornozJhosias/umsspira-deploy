import type { ChatRepository } from '../ports/chat-repository.port';

export class ListConversationsUseCase {
  constructor(private readonly repository: ChatRepository) {}
  execute(actorId: string, page: number) {
    return this.repository.list(actorId, page);
  }
}
