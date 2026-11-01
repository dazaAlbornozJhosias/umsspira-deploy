import type { ChatRepository } from '../ports/chat-repository.port';

export class GetConversationUseCase {
  constructor(private readonly repository: ChatRepository) {}
  execute(actorId: string, id: string) {
    return this.repository.get(id, actorId);
  }
}
