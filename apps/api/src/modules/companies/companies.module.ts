import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { companiesProviders } from './infrastructure/providers/companies.providers';

import { GetCompanyHeaderController } from './http/controllers/get-company-header.controller';
import { GetCompanyContactController } from './http/controllers/get-company-contact.controller';
import { UpdateCompanyProfileController } from './http/controllers/update-company-profile.controller';
import { ValidateCompanyInvitationController } from './http/controllers/validate-company-invitation.controller';
import { ActivateCompanyInvitationController } from './http/controllers/activate-company-invitation.controller';
import { CreateCompanyInvitationController } from './http/controllers/create-company-invitation.controller';
import { ListCompanyRegistryController } from './http/controllers/list-company-registry.controller';
import { ResendCompanyInvitationController } from './http/controllers/resend-company-invitation.controller';

// HU-03: Gestión de usuarios
import { CompanyUsersController } from './company-users.controller';
import { CompanyUsersService } from './company-users.service';

@Module({
  // AuthModule aporta PASSWORD_HASHER; RegistrationsModule, el cifrado de la cola de correos.
  imports: [PrismaModule, AuthModule, RegistrationsModule],
  controllers: [
    GetCompanyHeaderController,
    GetCompanyContactController,
    UpdateCompanyProfileController,
    // HU-01 y HU-02
    ValidateCompanyInvitationController,
    ActivateCompanyInvitationController,
    CreateCompanyInvitationController,
    ListCompanyRegistryController,
    ResendCompanyInvitationController,
    // HU-03
    CompanyUsersController,
  ],
  providers: [...companiesProviders, CompanyUsersService],
})
export class CompaniesModule {}