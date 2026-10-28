import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetCompanyHeaderUseCase } from '../../application/use-cases/get-company-header.use-case';
import { companyIdSchema } from '../schemas/companies.schemas';
import { presentCompanyHeader } from '../presenters/company-header.presenter';

@Controller('companies')
export class GetCompanyHeaderController {
  constructor(private readonly useCase: GetCompanyHeaderUseCase) {}

  @Get(':companyId/header')
  @RequirePermissions('empresas:self:read')
  async getHeader(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', new ZodValidationPipe(companyIdSchema)) companyId: string,
  ) {
    return { data: presentCompanyHeader(await this.useCase.execute(actor, companyId)) };
  }
}
