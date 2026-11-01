import type { ChatRepository } from '../ports/chat-repository.port';

export class GetUnreadSummaryUseCase {
  constructor(private readonly repository: ChatRepository) {}
  execute(actorId: string) {
    return this.repository.unread(actorId);
  }
}
