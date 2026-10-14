import { Module } from '@nestjs/common';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingsService } from './job-postings.service';

@Module({
  controllers: [JobPostingsController],
  providers: [JobPostingsService],
})
export class JobPostingsModule {}