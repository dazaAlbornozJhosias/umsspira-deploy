import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { loginSchema } from '../schemas/login.schema';
import type { LoginBody } from '../schemas/login.schema';
import { presentLogin } from '../presenters/login.presenter';
import { SessionCookies } from '../cookies/session.cookies';
import { LoginUseCase } from '../../application/use-cases/login.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class LoginController {
  constructor(
    private readonly useCase: LoginUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginBody,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.useCase.execute(body, {
      ip: request.ip ?? 'desconocida',
      agent: request.headers['user-agent'] ?? null,
    });
    this.cookies.write(response, result);
    return presentLogin(result);
  }
}
