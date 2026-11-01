import { Module } from '@nestjs/common';
import { USER_DIRECTORY } from './application/ports/user-directory.port';
import { PrismaUserDirectory } from './infrastructure/repositories/prisma-user-directory';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { USER_READER } from './application/ports/user-reader.port';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { GetCurrentUserController } from './http/controllers/get-current-user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GetCurrentUserController],
  providers: [
    PrismaUserRepository,
    PrismaUserDirectory,
    { provide: USER_READER, useExisting: PrismaUserRepository },
    { provide: USER_DIRECTORY, useExisting: PrismaUserDirectory },
  ],
  exports: [USER_READER, USER_DIRECTORY],
})
export class UserModule {}
