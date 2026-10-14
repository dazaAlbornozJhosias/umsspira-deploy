import { Module } from '@nestjs/common';
import { MailModule } from '@/modules/mail/mail.module';
import { EmailVerificationController } from './controllers/email-verification.controller';
import {
  EMAIL_VERIFICATION_CONFIG,
  readEmailVerificationConfig,
} from './email-verification.config';
import { DraftAccessRepository } from './repositories/draft-access.repository';
import { EmailVerificationRepository } from './repositories/email-verification.repository';
import { EmailVerificationService } from './services/email-verification.service';

@Module({
  imports: [MailModule],
  controllers: [EmailVerificationController],
  providers: [
    {
      provide: EMAIL_VERIFICATION_CONFIG,
      useFactory: () => readEmailVerificationConfig(),
    },
    EmailVerificationService,
    EmailVerificationRepository,
    DraftAccessRepository,
  ],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}