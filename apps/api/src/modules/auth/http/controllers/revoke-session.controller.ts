import { Controller, Delete, HttpCode, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { sessionIdSchema } from '../schemas/session-id.schema';
import { SessionCookies } from '../cookies/session.cookies';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class RevokeSessionController {
  constructor(
    private readonly useCase: RevokeSessionUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Delete('sessions/:id')
  @HttpCode(204)
  @RequirePermissions('auth:sessions:self')
  async revokeSession(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.useCase.execute(actor, id);
    if (id === request.auth!.sessionId) {
      this.cookies.clear(response);
    }
  }
}
