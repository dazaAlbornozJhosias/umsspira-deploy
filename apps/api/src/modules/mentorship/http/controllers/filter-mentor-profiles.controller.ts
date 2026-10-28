import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { FilterMentorProfilesUseCase } from '../../application/use-cases/filter-mentor-profiles.use-case';
import { presentDirectory } from '../presenters/mentor.presenter';
import {
  mentorDirectoryFilterSchema,
  type MentorDirectoryFilterQuery,
} from '../schemas/mentor-directory-filter.schema';

@Controller('mentorship')
export class FilterMentorProfilesController {
  constructor(private readonly useCase: FilterMentorProfilesUseCase) {}

  @Get('profiles/filter')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(mentorDirectoryFilterSchema)) query: MentorDirectoryFilterQuery,
  ) {
    return {
      data: (await this.useCase.execute(actor, query)).map(presentDirectory),
    };
  }
}
