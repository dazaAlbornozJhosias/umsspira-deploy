import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { presentSession } from '../presenters/session.presenter';
import { ListSessionsUseCase } from '../../application/use-cases/list-sessions.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class ListSessionsController {
  constructor(private readonly useCase: ListSessionsUseCase) {}

  @Get('sessions')
  @RequirePermissions('auth:sessions:self')
  async sessions(@Req() request: AuthRequest) {
    return {
      data: (await this.useCase.execute(request.auth!.actor)).map((session) =>
        presentSession(session, request.auth!.sessionId),
      ),
    };
  }
}
