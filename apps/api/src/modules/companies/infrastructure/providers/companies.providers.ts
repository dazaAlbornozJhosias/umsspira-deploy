import type { Provider } from '@nestjs/common';
import {
  COMPANY_PROFILE_REPOSITORY,
  type CompanyProfileRepository,
} from '../../application/ports/company-profile-repository.port';
import { GetCompanyHeaderUseCase } from '../../application/use-cases/get-company-header.use-case';
import { GetCompanyContactUseCase } from '../../application/use-cases/get-company-contact.use-case';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/update-company-profile.use-case';
import { PrismaCompanyProfileRepository } from '../repositories/prisma-company-profile.repository';

export const companiesProviders: Provider[] = [
  PrismaCompanyProfileRepository,
  { provide: COMPANY_PROFILE_REPOSITORY, useExisting: PrismaCompanyProfileRepository },
  {
    provide: GetCompanyHeaderUseCase,
    inject: [COMPANY_PROFILE_REPOSITORY],
    useFactory: (repository: CompanyProfileRepository) => new GetCompanyHeaderUseCase(repository),
  },
  {
    provide: GetCompanyContactUseCase,
    inject: [COMPANY_PROFILE_REPOSITORY],
    useFactory: (repository: CompanyProfileRepository) => new GetCompanyContactUseCase(repository),
  },
  {
    provide: UpdateCompanyProfileUseCase,
    inject: [COMPANY_PROFILE_REPOSITORY],
    useFactory: (repository: CompanyProfileRepository) =>
      new UpdateCompanyProfileUseCase(repository),
  },
];
