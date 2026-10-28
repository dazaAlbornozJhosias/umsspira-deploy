import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { jobPostingsProviders } from './infrastructure/providers/job-postings.providers';
import { CreateJobPostingController } from './http/controllers/create-job-posting.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CreateJobPostingController],
  providers: jobPostingsProviders,
})
export class JobPostingsModule {}
