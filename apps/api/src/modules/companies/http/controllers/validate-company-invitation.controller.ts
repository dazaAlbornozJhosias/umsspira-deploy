import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ValidateCompanyInvitationUseCase } from '../../application/use-cases/validate-company-invitation.use-case';
import { presentCompanyInvitation } from '../presenters/company-invitation.presenter';
import { invitationTokenSchema } from '../schemas/company-invitation.schemas';

@Controller('companies/invitations')
export class ValidateCompanyInvitationController {
  constructor(private readonly useCase: ValidateCompanyInvitationUseCase) {}

  @Get(':token')
  @Public()
  async validate(@Param('token', new ZodValidationPipe(invitationTokenSchema)) token: string) {
    return { data: presentCompanyInvitation(await this.useCase.execute(token)) };
  }
}