import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../auth/application/ports/password-hasher.port';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import {
  COMPANY_PROFILE_REPOSITORY,
  type CompanyProfileRepository,
} from '../../application/ports/company-profile-repository.port';
import {
  COMPANY_INVITATION_REPOSITORY,
  type CompanyInvitationRepository,
} from '../../application/ports/company-invitation-repository.port';
import { GetCompanyHeaderUseCase } from '../../application/use-cases/get-company-header.use-case';
import { GetCompanyContactUseCase } from '../../application/use-cases/get-company-contact.use-case';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/update-company-profile.use-case';
import { ValidateCompanyInvitationUseCase } from '../../application/use-cases/validate-company-invitation.use-case';
import { ActivateCompanyInvitationUseCase } from '../../application/use-cases/activate-company-invitation.use-case';
import { CreateCompanyInvitationUseCase } from '../../application/use-cases/create-company-invitation.use-case';
import { ListCompanyRegistryUseCase } from '../../application/use-cases/list-company-registry.use-case';
import { ResendCompanyInvitationUseCase } from '../../application/use-cases/resend-company-invitation.use-case';
import { buildCompanyInvitationEmail } from '../notifications/company-invitation-email';
import { PrismaCompanyProfileRepository } from '../repositories/prisma-company-profile.repository';
import { PrismaCompanyInvitationRepository } from '../repositories/prisma-company-invitation.repository';
import {
  COMPANY_MEMBER_INVITATION_REPOSITORY,
  type CompanyMemberInvitationRepository,
} from '../../application/ports/company-member-invitation-repository.port';
import { InviteCompanyMemberUseCase } from '../../application/use-cases/invite-company-member.use-case';
import { PrismaCompanyMemberInvitationRepository } from '../repositories/prisma-company-member-invitation.repository';

export const companiesProviders: Provider[] = [
  PrismaCompanyMemberInvitationRepository,
  {
    provide: COMPANY_MEMBER_INVITATION_REPOSITORY,
    useExisting: PrismaCompanyMemberInvitationRepository,
  },
  {
    provide: InviteCompanyMemberUseCase,
    inject: [COMPANY_MEMBER_INVITATION_REPOSITORY, ConfigService],
    useFactory: (
      repository: CompanyMemberInvitationRepository,
      config: ConfigService<Environment, true>,
    ) =>
      new InviteCompanyMemberUseCase(
        repository,
        buildCompanyInvitationEmail,
        config.get('CORS_ORIGINS', { infer: true })[0] ?? 'http://localhost:3001',
      ),
  },
  PrismaCompanyProfileRepository,
  { provide: COMPANY_PROFILE_REPOSITORY, useExisting: PrismaCompanyProfileRepository },
  PrismaCompanyInvitationRepository,
  { provide: COMPANY_INVITATION_REPOSITORY, useExisting: PrismaCompanyInvitationRepository },
  TrustedOriginGuard,
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
  {
    provide: ValidateCompanyInvitationUseCase,
    inject: [COMPANY_INVITATION_REPOSITORY],
    useFactory: (repository: CompanyInvitationRepository) =>
      new ValidateCompanyInvitationUseCase(repository),
  },
  {
    provide: ActivateCompanyInvitationUseCase,
    inject: [COMPANY_INVITATION_REPOSITORY, PASSWORD_HASHER],
    useFactory: (repository: CompanyInvitationRepository, passwords: PasswordHasher) =>
      new ActivateCompanyInvitationUseCase(repository, passwords),
  },
  {
    provide: CreateCompanyInvitationUseCase,
    inject: [COMPANY_INVITATION_REPOSITORY, ConfigService],
    useFactory: (
      repository: CompanyInvitationRepository,
      config: ConfigService<Environment, true>,
    ) => {
      // La primera URL de CORS_ORIGINS es la web pública (en local, http://localhost:3001).
      const webUrl = config.get('CORS_ORIGINS', { infer: true })[0] ?? 'http://localhost:3001';
      return new CreateCompanyInvitationUseCase(repository, buildCompanyInvitationEmail, webUrl);
    },
  },
  {
    provide: ListCompanyRegistryUseCase,
    inject: [COMPANY_INVITATION_REPOSITORY],
    useFactory: (repository: CompanyInvitationRepository) =>
      new ListCompanyRegistryUseCase(repository),
  },
  {
    provide: ResendCompanyInvitationUseCase,
    inject: [COMPANY_INVITATION_REPOSITORY, ConfigService],
    useFactory: (
      repository: CompanyInvitationRepository,
      config: ConfigService<Environment, true>,
    ) => {
      const webUrl = config.get('CORS_ORIGINS', { infer: true })[0] ?? 'http://localhost:3001';
      return new ResendCompanyInvitationUseCase(repository, buildCompanyInvitationEmail, webUrl);
    },
  },
];
