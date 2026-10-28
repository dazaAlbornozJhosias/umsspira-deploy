import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { presentUser } from '../../../user/http/presenters/user.presenter';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class GetAuthenticatedUserController {
  @Get('me')
  @RequirePermissions('user:self:read')
  me(@CurrentActor() actor: ActorContext) {
    return { data: presentUser(actor) };
  }
}
