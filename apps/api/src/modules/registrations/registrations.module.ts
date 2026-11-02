import { ActivationAccessController } from './http/controllers/activation-access.controller';
import { ActivationAccessService } from './application/services/activation-access.service';
import { ObservedApplicationController } from './http/controllers/observed-application.controller';
import { ObservedApplicationService } from './application/services/observed-application.service';
import { CorrectionTokenService } from './application/services/correction-token.service';
import { CorrectionTokenGuard } from './http/guards/correction-token.guard';
import { ValidateCorrectionAccessController } from './http/controllers/validate-correction-access.controller';
import { RequestCorrectionLinkController } from './http/controllers/request-correction-link.controller';
import { UpdateRegistrationController } from './http/controllers/update-registration.controller';
import { GetDraftDocumentController } from './http/controllers/get-draft-document.controller';
import { Module } from '@nestjs/common';
import { RenewActivationController } from './http/controllers/renew-activation.controller';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { REGISTRATION_SECURITY } from './application/ports/registration-security.port';
import { AuthModule } from '../auth/auth.module';
import { registrationsProviders } from './infrastructure/providers/registrations.providers';
import { SmtpOutboxWorker } from './infrastructure/notifications/smtp-outbox.worker';
import { RegistrationTrafficGuard } from './http/guards/registration-traffic.guard';
import { TrustedOriginGuard } from '../../shared/http/auth/guards/trusted-origin.guard';
import { ListRegistrationCareersController } from './http/controllers/list-registration-careers.controller';
import { CreateRegistrationController } from './http/controllers/create-registration.controller';
import { InspectRegistrationController } from './http/controllers/inspect-registration.controller';
import { IssueRegistrationCodeController } from './http/controllers/issue-registration-code.controller';
import { VerifyRegistrationCodeController } from './http/controllers/verify-registration-code.controller';
import { SubmitRegistrationController } from './http/controllers/submit-registration.controller';
import { ActivateRegistrationController } from './http/controllers/activate-registration.controller';
import { VerifyActivationCodeController } from './http/controllers/verify-activation-code.controller';
import { UploadRegistrationDocumentController } from './http/controllers/upload-registration-document.controller';
import { ListApplicationsController } from './http/controllers/list-applications.controller';
import { GetApplicationController } from './http/controllers/get-application.controller';
import { ReviewApplicationController } from './http/controllers/review-application.controller';
import { GetApplicationDocumentLinkController } from './http/controllers/get-application-document-link.controller';
import { GetApplicationDocumentController } from './http/controllers/get-application-document.controller';
import { GetApplicationMetricsController } from './http/controllers/get-application-metrics.controller';
import { MailEventsController } from './http/controllers/mail-events.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ActivationAccessController,
    UpdateRegistrationController,
    GetDraftDocumentController,
    RenewActivationController,
    ListRegistrationCareersController,
    CreateRegistrationController,
    InspectRegistrationController,
    IssueRegistrationCodeController,
    VerifyRegistrationCodeController,
    SubmitRegistrationController,
    ActivateRegistrationController,
    VerifyActivationCodeController,
    UploadRegistrationDocumentController,
    ListApplicationsController,
    GetApplicationMetricsController,
    GetApplicationController,
    ReviewApplicationController,
    GetApplicationDocumentLinkController,
    GetApplicationDocumentController,
    ValidateCorrectionAccessController,
    RequestCorrectionLinkController,
    ObservedApplicationController,
    MailEventsController,
  ],
  providers: [
    ActivationAccessService,
    ...registrationsProviders,
    SmtpOutboxWorker,
    RegistrationTrafficGuard,
    TrustedOriginGuard,
    CorrectionTokenGuard,
  ],
  exports: [REGISTRATION_SECURITY, CorrectionTokenService, CorrectionTokenGuard, ObservedApplicationService],
})
export class RegistrationsModule {}
