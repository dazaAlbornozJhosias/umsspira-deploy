import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { USER_READER } from './application/ports/user-reader.port';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { GetCurrentUserController } from './http/controllers/get-current-user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GetCurrentUserController],
  providers: [PrismaUserRepository, { provide: USER_READER, useExisting: PrismaUserRepository }],
  exports: [USER_READER],
})
export class UserModule {}
