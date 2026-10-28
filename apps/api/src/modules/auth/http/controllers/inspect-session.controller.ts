import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { REFRESH_COOKIE } from '../../../../shared/http/auth/cookies/request-cookies';
import { readCookie } from '../../../../shared/http/auth/cookies/request-cookies';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { presentUser } from '../../../user/http/presenters/user.presenter';
import { InspectSessionUseCase } from '../../application/use-cases/inspect-session.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class InspectSessionController {
  constructor(private readonly useCase: InspectSessionUseCase) {}

  @Get('session')
  @Public()
  async session(@Req() request: AuthRequest) {
    return {
      data: presentUser(await this.useCase.execute(readCookie(request, REFRESH_COOKIE) ?? '')),
    };
  }
}
