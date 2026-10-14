import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JobPostingsService } from './job-postings.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';

@Controller('api/vacantes')
@UseGuards(JwtAuthGuard)
export class JobPostingsController {
  constructor(
    private readonly jobPostingsService: JobPostingsService,
  ) {}

  @Post()
  async create(
    @CurrentUser('empresaId') empresaId: string,
    @Body() dto: CreateJobPostingDto,
  ) {
    return this.jobPostingsService.create(empresaId, dto);
  }
}