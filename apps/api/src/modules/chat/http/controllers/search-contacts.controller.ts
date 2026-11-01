import { Controller, Get, Query } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SearchContactsUseCase } from '../../application/use-cases/search-contacts.use-case';
import { contactsSchema } from '../schemas/chat.schemas';

@Controller('chat')
@RequirePermissions('user:self:read')
export class SearchContactsController {
  constructor(private readonly useCase: SearchContactsUseCase) {}
  @Get('contacts')
  async execute(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(contactsSchema)) query: z.output<typeof contactsSchema>,
  ) {
    return { data: await this.useCase.execute(actor.id, query.q, query.page) };
  }
}
