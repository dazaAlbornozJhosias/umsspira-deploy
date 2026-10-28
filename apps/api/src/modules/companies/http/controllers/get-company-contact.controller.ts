import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetCompanyContactUseCase } from '../../application/use-cases/get-company-contact.use-case';
import { companyIdSchema } from '../schemas/companies.schemas';
import { presentCompanyContact } from '../presenters/company-contact.presenter';

@Controller('companies')
export class GetCompanyContactController {
  constructor(private readonly useCase: GetCompanyContactUseCase) {}

  @Get(':companyId/contact')
  @RequirePermissions('empresas:self:read')
  async getContact(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', new ZodValidationPipe(companyIdSchema)) companyId: string,
  ) {
    return { data: presentCompanyContact(await this.useCase.execute(actor, companyId)) };
  }
}
