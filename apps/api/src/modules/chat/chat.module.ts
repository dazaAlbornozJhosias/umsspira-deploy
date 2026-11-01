import { Module } from '@nestjs/common';
import { SendAttachmentController } from './http/controllers/send-attachment.controller';
import { DownloadAttachmentController } from './http/controllers/download-attachment.controller';
import { GetUnreadSummaryController } from './http/controllers/get-unread-summary.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { chatProviders } from './infrastructure/providers/chat.providers';
import { StartConversationController } from './http/controllers/start-conversation.controller';
import { ListConversationsController } from './http/controllers/list-conversations.controller';
import { GetConversationController } from './http/controllers/get-conversation.controller';
import { ListMessagesController } from './http/controllers/list-messages.controller';
import { SendMessageController } from './http/controllers/send-message.controller';
import { RespondRequestController } from './http/controllers/respond-request.controller';
import { MarkReadController } from './http/controllers/mark-read.controller';
import { EditMessageController } from './http/controllers/edit-message.controller';
import { DeleteMessageController } from './http/controllers/delete-message.controller';
import { SearchContactsController } from './http/controllers/search-contacts.controller';

@Module({
  imports: [AuthModule, UserModule, PrismaModule],
  controllers: [
    SendAttachmentController,
    DownloadAttachmentController,
    GetUnreadSummaryController,
    StartConversationController,
    ListConversationsController,
    GetConversationController,
    ListMessagesController,
    SendMessageController,
    RespondRequestController,
    MarkReadController,
    EditMessageController,
    DeleteMessageController,
    SearchContactsController,
  ],
  providers: chatProviders,
})
export class ChatModule {}
