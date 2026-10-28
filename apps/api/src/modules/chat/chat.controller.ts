import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentActor } from '../../shared/http/auth/decorators/current-actor.decorator';
import type { ActorContext } from '../../shared/security/contexts/actor-context';
@Controller('chat/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('direct')
  async createDirectChat(
    @CurrentActor() actor: ActorContext,
    @Body() body: { targetUserId: string },
  ) {
    const conversation =
      await this.chatService.findOrCreateDirectConversation(
        actor.id,
        body.targetUserId,
      );

    return { conversationId: conversation.id };
  }

  @Get()
  async getMyConversations(@CurrentActor() actor: ActorContext) {
    return this.chatService.getUserConversations(actor.id);
  }

  @Get('users')
  async getUsersToChat(@CurrentActor() actor: ActorContext) {
    const users = await this.chatService.getAvailableUsersToChat();

    return users.filter((user) => user.usuario_id !== actor.id);
  }

    @Get(':id/messages')
  async getMessages(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
  ) {
    await this.chatService.assertParticipant(id, actor.id);

    return this.chatService.getMessages(
      id,
      Number(limit) || 30,
      beforeId,
    );
  }

  @Post(':id/simulate-reply')
  async simulateReply(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    await this.chatService.assertParticipant(id, actor.id);

    return this.chatService.simulateReply(
      id,
      'hola, en que le puedo ayudar',
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    await this.chatService.assertParticipant(id, actor.id);
    return this.chatService.markAsRead(id, actor.id);
  }
}