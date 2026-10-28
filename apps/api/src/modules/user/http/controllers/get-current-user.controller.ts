import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { presentUser } from '../presenters/user.presenter';

@Controller('user')
export class GetCurrentUserController {
  @Get('me')
  @RequirePermissions('user:self:read')
  me(@CurrentActor() actor: ActorContext) {
    return { data: presentUser(actor) };
  }
}
