import { Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SessionCookies } from '../cookies/session.cookies';
import { LogoutAllUseCase } from '../../application/use-cases/logout-all.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class LogoutAllController {
  constructor(
    private readonly useCase: LogoutAllUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(
    @CurrentActor() actor: ActorContext,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.useCase.execute(actor);
    this.cookies.clear(response);
  }
}
