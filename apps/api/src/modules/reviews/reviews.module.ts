import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsService } from './services/reviews.service';
import { ApplicationsRepository } from './repositories/applications.repository';
import { ApplicationsService } from './services/applications.service';
import { ActivationModule } from '@/modules/activation/activation.module';
import { MailModule } from '@/modules/mail/mail.module';
@Module({
  imports: [ActivationModule, MailModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository, ApplicationsService, ApplicationsRepository],
  exports: [ReviewsService, ApplicationsService],
})
export class ReviewsModule {}