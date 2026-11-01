import type { Provider } from '@nestjs/common';
import { SendAttachmentUseCase } from '../../application/use-cases/send-attachment.use-case';
import { DownloadAttachmentUseCase } from '../../application/use-cases/download-attachment.use-case';
import { GetUnreadSummaryUseCase } from '../../application/use-cases/get-unread-summary.use-case';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '../../../user/application/ports/user-directory.port';
import { CHAT_REPOSITORY, type ChatRepository } from '../../application/ports/chat-repository.port';
import { CHAT_EVENTS, type ChatEvents } from '../../application/ports/chat-events.port';
import { PrismaChatRepository } from '../repositories/prisma-chat.repository';
import { ChatGateway } from '../adapters/chat.gateway';
import { ChatRateLimitGuard } from '../../http/guards/chat-rate-limit.guard';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';
import { ListConversationsUseCase } from '../../application/use-cases/list-conversations.use-case';
import { GetConversationUseCase } from '../../application/use-cases/get-conversation.use-case';
import { ListMessagesUseCase } from '../../application/use-cases/list-messages.use-case';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { RespondRequestUseCase } from '../../application/use-cases/respond-request.use-case';
import { MarkReadUseCase } from '../../application/use-cases/mark-read.use-case';
import { EditMessageUseCase } from '../../application/use-cases/edit-message.use-case';
import { DeleteMessageUseCase } from '../../application/use-cases/delete-message.use-case';
import { SearchContactsUseCase } from '../../application/use-cases/search-contacts.use-case';

export const chatProviders: Provider[] = [
  {
    provide: SendAttachmentUseCase,
    inject: [SendMessageUseCase],
    useFactory: (send: SendMessageUseCase) => new SendAttachmentUseCase(send),
  },
  {
    provide: DownloadAttachmentUseCase,
    inject: [CHAT_REPOSITORY],
    useFactory: (repository: ChatRepository) => new DownloadAttachmentUseCase(repository),
  },
  {
    provide: GetUnreadSummaryUseCase,
    inject: [CHAT_REPOSITORY],
    useFactory: (repository: ChatRepository) => new GetUnreadSummaryUseCase(repository),
  },
  PrismaChatRepository,
  ChatGateway,
  ChatRateLimitGuard,
  { provide: CHAT_REPOSITORY, useExisting: PrismaChatRepository },
  { provide: CHAT_EVENTS, useExisting: ChatGateway },
  {
    provide: StartConversationUseCase,
    inject: [CHAT_REPOSITORY, USER_DIRECTORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, directory: UserDirectory, events: ChatEvents) =>
      new StartConversationUseCase(repository, directory, events),
  },
  {
    provide: ListConversationsUseCase,
    inject: [CHAT_REPOSITORY],
    useFactory: (repository: ChatRepository) => new ListConversationsUseCase(repository),
  },
  {
    provide: GetConversationUseCase,
    inject: [CHAT_REPOSITORY],
    useFactory: (repository: ChatRepository) => new GetConversationUseCase(repository),
  },
  {
    provide: ListMessagesUseCase,
    inject: [CHAT_REPOSITORY],
    useFactory: (repository: ChatRepository) => new ListMessagesUseCase(repository),
  },
  {
    provide: SendMessageUseCase,
    inject: [CHAT_REPOSITORY, USER_DIRECTORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, directory: UserDirectory, events: ChatEvents) =>
      new SendMessageUseCase(repository, directory, events),
  },
  {
    provide: RespondRequestUseCase,
    inject: [CHAT_REPOSITORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, events: ChatEvents) =>
      new RespondRequestUseCase(repository, events),
  },
  {
    provide: MarkReadUseCase,
    inject: [CHAT_REPOSITORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, events: ChatEvents) =>
      new MarkReadUseCase(repository, events),
  },
  {
    provide: EditMessageUseCase,
    inject: [CHAT_REPOSITORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, events: ChatEvents) =>
      new EditMessageUseCase(repository, events),
  },
  {
    provide: DeleteMessageUseCase,
    inject: [CHAT_REPOSITORY, CHAT_EVENTS],
    useFactory: (repository: ChatRepository, events: ChatEvents) =>
      new DeleteMessageUseCase(repository, events),
  },
  {
    provide: SearchContactsUseCase,
    inject: [USER_DIRECTORY],
    useFactory: (directory: UserDirectory) => new SearchContactsUseCase(directory),
  },
];
