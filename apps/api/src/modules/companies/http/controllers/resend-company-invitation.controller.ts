import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ResendCompanyInvitationUseCase } from '../../application/use-cases/resend-company-invitation.use-case';
import { presentResentCompanyInvitation } from '../presenters/company-registry.presenter';
import { invitationIdSchema } from '../schemas/company-invitation.schemas';

@Controller('companies/invitations')
@UseGuards(TrustedOriginGuard)
export class ResendCompanyInvitationController {
  constructor(private readonly useCase: ResendCompanyInvitationUseCase) {}

  @Post(':invitationId/resend')
  @RequirePermissions('empresas:invite')
  @HttpCode(200)
  async resend(
    @CurrentActor() actor: ActorContext,
    @Param('invitationId', new ZodValidationPipe(invitationIdSchema)) invitationId: string,
  ) {
    return { data: presentResentCompanyInvitation(await this.useCase.execute(actor, invitationId)) };
  }
}