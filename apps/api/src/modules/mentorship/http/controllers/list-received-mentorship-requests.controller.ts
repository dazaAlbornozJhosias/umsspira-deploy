import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ListReceivedMentorshipRequestsUseCase } from '../../application/use-cases/list-received-mentorship-requests.use-case';
import {
  mentorshipRequestQuerySchema,
  type MentorshipRequestQueryParams,
} from '../schemas/mentorship-request-query.schema';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { presentMentorshipRequest } from '../presenters/mentorship-request.presenter';

@Controller('mentorship/requests')
export class ListReceivedMentorshipRequestsController {
  constructor(private readonly useCase: ListReceivedMentorshipRequestsUseCase) {}

  @Get()
  async list(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(mentorshipRequestQuerySchema)) query: MentorshipRequestQueryParams,
  ) {
    const result = await this.useCase.execute(actor, {
      status: query.estado,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: result.items.map(presentMentorshipRequest),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
