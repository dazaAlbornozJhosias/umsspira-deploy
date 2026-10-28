import { Body, Controller, Post } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateJobPostingUseCase } from '../../application/use-cases/create-job-posting.use-case';
import { createJobPostingSchema, type CreateJobPostingBody } from '../schemas/job-postings.schemas';
import { presentJobPosting } from '../presenters/job-posting.presenter';

@Controller('job-postings')
export class CreateJobPostingController {
  constructor(private readonly useCase: CreateJobPostingUseCase) {}

  @Post()
  @RequirePermissions('vacantes:create')
  async create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createJobPostingSchema)) body: CreateJobPostingBody,
  ) {
    return { data: presentJobPosting(await this.useCase.execute(actor, body)) };
  }
}
