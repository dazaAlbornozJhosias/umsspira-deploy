import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetUnreadSummaryUseCase } from '../../application/use-cases/get-unread-summary.use-case';
import { presentSummary } from '../presenters/chat.presenter';

@Controller('chat')
@RequirePermissions('user:self:read')
export class GetUnreadSummaryController {
  constructor(private readonly useCase: GetUnreadSummaryUseCase) {}
  @Get('unread-summary')
  async execute(@CurrentActor() actor: ActorContext) {
    const result = await this.useCase.execute(actor.id);
    return {
      data: { total: result.total, conversations: result.conversations.map(presentSummary) },
    };
  }
}
