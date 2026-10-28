import { Body, Controller, Param, Put } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/update-company-profile.use-case';
import {
  companyIdSchema,
  updateCompanyProfileSchema,
  type UpdateCompanyProfileBody,
} from '../schemas/companies.schemas';
import { presentCompanyProfile } from '../presenters/company-profile.presenter';

@Controller('companies')
export class UpdateCompanyProfileController {
  constructor(private readonly useCase: UpdateCompanyProfileUseCase) {}

  @Put(':companyId/profile')
  @RequirePermissions('empresas:self:write')
  async updateProfile(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', new ZodValidationPipe(companyIdSchema)) companyId: string,
    @Body(new ZodValidationPipe(updateCompanyProfileSchema)) body: UpdateCompanyProfileBody,
  ) {
    return { data: presentCompanyProfile(await this.useCase.execute(actor, companyId, body)) };
  }
}
