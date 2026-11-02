import { OBSERVED_APPLICATION_PORT } from '../../application/ports/observed-application.port';
import { PrismaObservedApplicationRepository } from '../repositories/prisma-observed-application.repository';
import { ObservedApplicationService } from '../../application/services/observed-application.service';
import { UpdateRegistrationUseCase } from '../../application/use-cases/update-registration.use-case';
import { GetDraftDocumentUseCase } from '../../application/use-cases/get-draft-document.use-case';
import type { Provider } from '@nestjs/common';
import { RenewActivationUseCase } from '../../application/use-cases/renew-activation.use-case';
import { CORRECTION_TOKEN_PORT } from '../../application/ports/correction-token.port';
import { PrismaCorrectionTokenRepository } from '../repositories/prisma-correction-token.repository';
import { CorrectionTokenService } from '../../application/services/correction-token.service';
import { RequestCorrectionLinkUseCase } from '../../application/use-cases/request-correction-link.use-case';
import { GetApplicationMetricsUseCase } from '../../application/use-cases/get-application-metrics.use-case';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../auth/application/ports/password-hasher.port';
import {
  REGISTRATION_REPOSITORY,
  type RegistrationRepository,
} from '../../application/ports/registration-repository.port';
import {
  APPLICATIONS_REPOSITORY,
  type ApplicationsRepository,
} from '../../application/ports/applications-repository.port';
import {
  REGISTRATION_SECURITY,
  type RegistrationSecurity,
} from '../../application/ports/registration-security.port';
import { PrismaRegistrationRepository } from '../repositories/prisma-registration.repository';
import { PrismaApplicationsRepository } from '../repositories/prisma-applications.repository';
import { NodeRegistrationSecurity } from '../security/registration-security';
import { ListRegistrationCareersUseCase } from '../../application/use-cases/list-registration-careers.use-case';
import { CreateRegistrationUseCase } from '../../application/use-cases/create-registration.use-case';
import { InspectRegistrationUseCase } from '../../application/use-cases/inspect-registration.use-case';
import { IssueRegistrationCodeUseCase } from '../../application/use-cases/issue-registration-code.use-case';
import { VerifyRegistrationCodeUseCase } from '../../application/use-cases/verify-registration-code.use-case';
import { UploadRegistrationDocumentUseCase } from '../../application/use-cases/upload-registration-document.use-case';
import { SubmitRegistrationUseCase } from '../../application/use-cases/submit-registration.use-case';
import { ListApplicationsUseCase } from '../../application/use-cases/list-applications.use-case';
import { GetApplicationUseCase } from '../../application/use-cases/get-application.use-case';
import { GetApplicationDocumentUseCase } from '../../application/use-cases/get-application-document.use-case';
import { ReviewApplicationUseCase } from '../../application/use-cases/review-application.use-case';
import { ActivateRegistrationUseCase } from '../../application/use-cases/activate-registration.use-case';
import { VerifyActivationCodeUseCase } from '../../application/use-cases/verify-activation-code.use-case';
import {
  MAIL_EVENTS_REPOSITORY,
  type MailEventsRepository,
} from '../../application/ports/mail-events-repository.port';
import { RetryMailEventsUseCase } from '../../application/use-cases/retry-mail-events.use-case';
import { PrismaMailEventsRepository } from '../repositories/prisma-mail-events.repository';
export const registrationsProviders: Provider[] = [
  ...[UpdateRegistrationUseCase, GetDraftDocumentUseCase].map((useCase) => ({
    provide: useCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new useCase(repository, security),
  })),
  {
    provide: RenewActivationUseCase,
    inject: [APPLICATIONS_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: ApplicationsRepository, security: RegistrationSecurity) =>
      new RenewActivationUseCase(repository, security),
  },
  PrismaRegistrationRepository,
  PrismaApplicationsRepository,
  PrismaCorrectionTokenRepository,
  { provide: CORRECTION_TOKEN_PORT, useExisting: PrismaCorrectionTokenRepository },
  CorrectionTokenService,
  RequestCorrectionLinkUseCase,
  PrismaObservedApplicationRepository,
  { provide: OBSERVED_APPLICATION_PORT, useExisting: PrismaObservedApplicationRepository },
  ObservedApplicationService,
  NodeRegistrationSecurity,
  { provide: REGISTRATION_REPOSITORY, useExisting: PrismaRegistrationRepository },
  { provide: APPLICATIONS_REPOSITORY, useExisting: PrismaApplicationsRepository },
  { provide: REGISTRATION_SECURITY, useExisting: NodeRegistrationSecurity },
  {
    provide: ListRegistrationCareersUseCase,
    inject: [REGISTRATION_REPOSITORY],
    useFactory: (repository: RegistrationRepository) =>
      new ListRegistrationCareersUseCase(repository),
  },
  {
    provide: CreateRegistrationUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new CreateRegistrationUseCase(repository, security),
  },
  {
    provide: InspectRegistrationUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new InspectRegistrationUseCase(repository, security),
  },
  {
    provide: IssueRegistrationCodeUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new IssueRegistrationCodeUseCase(repository, security),
  },
  {
    provide: VerifyRegistrationCodeUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new VerifyRegistrationCodeUseCase(repository, security),
  },
  {
    provide: UploadRegistrationDocumentUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new UploadRegistrationDocumentUseCase(repository, security),
  },
  {
    provide: SubmitRegistrationUseCase,
    inject: [REGISTRATION_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: RegistrationRepository, security: RegistrationSecurity) =>
      new SubmitRegistrationUseCase(repository, security),
  },
  {
    provide: ListApplicationsUseCase,
    inject: [APPLICATIONS_REPOSITORY],
    useFactory: (repository: ApplicationsRepository) => new ListApplicationsUseCase(repository),
  },
  {
    provide: GetApplicationMetricsUseCase,
    inject: [APPLICATIONS_REPOSITORY],
    useFactory: (repository: ApplicationsRepository) =>
      new GetApplicationMetricsUseCase(repository),
  },
  {
    provide: GetApplicationUseCase,
    inject: [APPLICATIONS_REPOSITORY],
    useFactory: (repository: ApplicationsRepository) => new GetApplicationUseCase(repository),
  },
  {
    provide: GetApplicationDocumentUseCase,
    inject: [APPLICATIONS_REPOSITORY],
    useFactory: (repository: ApplicationsRepository) =>
      new GetApplicationDocumentUseCase(repository),
  },
  {
    provide: ReviewApplicationUseCase,
    inject: [APPLICATIONS_REPOSITORY, REGISTRATION_SECURITY, CorrectionTokenService],
    useFactory: (
      repository: ApplicationsRepository,
      security: RegistrationSecurity,
      tokenService: CorrectionTokenService,
    ) => new ReviewApplicationUseCase(repository, security, tokenService),
  },
  {
    provide: ActivateRegistrationUseCase,
    inject: [APPLICATIONS_REPOSITORY, REGISTRATION_SECURITY, PASSWORD_HASHER],
    useFactory: (
      repository: ApplicationsRepository,
      security: RegistrationSecurity,
      passwords: PasswordHasher,
    ) => new ActivateRegistrationUseCase(repository, security, passwords),
  },
  {
    provide: VerifyActivationCodeUseCase,
    inject: [APPLICATIONS_REPOSITORY, REGISTRATION_SECURITY],
    useFactory: (repository: ApplicationsRepository, security: RegistrationSecurity) =>
      new VerifyActivationCodeUseCase(repository, security),
  },
  PrismaMailEventsRepository,
  { provide: MAIL_EVENTS_REPOSITORY, useExisting: PrismaMailEventsRepository },
  {
    provide: RetryMailEventsUseCase,
    inject: [MAIL_EVENTS_REPOSITORY],
    useFactory: (repository: MailEventsRepository) => new RetryMailEventsUseCase(repository),
  },
];