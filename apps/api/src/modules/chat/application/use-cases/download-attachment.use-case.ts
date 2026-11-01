import type { ChatRepository } from '../ports/chat-repository.port';

export class DownloadAttachmentUseCase {
  constructor(private readonly repository: ChatRepository) {}
  execute(actorId: string, id: string, messageId: string) {
    return this.repository.attachment(id, actorId, messageId);
  }
}
