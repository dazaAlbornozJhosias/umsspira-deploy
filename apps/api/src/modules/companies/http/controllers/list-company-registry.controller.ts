import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ListCompanyRegistryUseCase } from '../../application/use-cases/list-company-registry.use-case';
import { presentCompanyRegistryPage } from '../presenters/company-registry.presenter';
import {
  companyRegistryQuerySchema,
  type CompanyRegistryQueryInput,
} from '../schemas/company-invitation.schemas';

@Controller('companies/registry')
export class ListCompanyRegistryController {
  constructor(private readonly useCase: ListCompanyRegistryUseCase) {}

  @Get()
  @RequirePermissions('empresas:invite')
  async list(@Query(new ZodValidationPipe(companyRegistryQuerySchema)) query: CompanyRegistryQueryInput) {
    return { data: presentCompanyRegistryPage(await this.useCase.execute(query)) };
  }
}