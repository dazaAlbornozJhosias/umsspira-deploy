import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { companiesProviders } from './infrastructure/providers/companies.providers';
import { GetCompanyHeaderController } from './http/controllers/get-company-header.controller';
import { GetCompanyContactController } from './http/controllers/get-company-contact.controller';
import { UpdateCompanyProfileController } from './http/controllers/update-company-profile.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    GetCompanyHeaderController,
    GetCompanyContactController,
    UpdateCompanyProfileController,
  ],
  providers: companiesProviders,
})
export class CompaniesModule {}
