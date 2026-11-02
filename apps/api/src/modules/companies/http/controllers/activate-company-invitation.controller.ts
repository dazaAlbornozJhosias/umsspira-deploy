import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ActivateCompanyInvitationUseCase } from '../../application/use-cases/activate-company-invitation.use-case';
import {
  activateCompanyInvitationSchema,
  invitationTokenSchema,
  type ActivateCompanyInvitationBody,
} from '../schemas/company-invitation.schemas';

@Controller('companies/invitations')
@UseGuards(TrustedOriginGuard)
export class ActivateCompanyInvitationController {
  constructor(private readonly useCase: ActivateCompanyInvitationUseCase) {}

  @Post(':token/activate')
  @Public()
  @HttpCode(200)
  async activate(
    @Param('token', new ZodValidationPipe(invitationTokenSchema)) token: string,
    @Body(new ZodValidationPipe(activateCompanyInvitationSchema)) body: ActivateCompanyInvitationBody,
  ) {
    return { data: await this.useCase.execute(token, body.password) };
  }
}