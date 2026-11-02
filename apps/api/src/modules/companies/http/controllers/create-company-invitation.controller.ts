import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateCompanyInvitationUseCase } from '../../application/use-cases/create-company-invitation.use-case';
import { presentCreatedCompanyInvitation } from '../presenters/company-invitation.presenter';
import {
  createCompanyInvitationSchema,
  type CreateCompanyInvitationBody,
} from '../schemas/company-invitation.schemas';

@Controller('companies/invitations')
@UseGuards(TrustedOriginGuard)
export class CreateCompanyInvitationController {
  constructor(private readonly useCase: CreateCompanyInvitationUseCase) {}

  @Post()
  @RequirePermissions('empresas:invite')
  @HttpCode(201)
  async create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createCompanyInvitationSchema)) body: CreateCompanyInvitationBody,
  ) {
    return { data: presentCreatedCompanyInvitation(await this.useCase.execute(actor, body)) };
  }
}