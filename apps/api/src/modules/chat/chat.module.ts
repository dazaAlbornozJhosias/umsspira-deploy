import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}