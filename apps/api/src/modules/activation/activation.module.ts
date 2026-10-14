// apps/api/src/modules/activation/activation.module.ts
import { Module } from '@nestjs/common';
import { redisClient } from '@/shared/lib/redis';
import { ACTIVATION_REDIS } from './activation.constants';
import { ActivationCodeRepository } from './repositories/activation-code.repository';
import { ActivationCodeService } from './services/activation-code.service';

@Module({
  providers: [
    { provide: ACTIVATION_REDIS, useValue: redisClient },
    ActivationCodeRepository,
    ActivationCodeService,
  ],
  exports: [ActivationCodeService],
})
export class ActivationModule {}