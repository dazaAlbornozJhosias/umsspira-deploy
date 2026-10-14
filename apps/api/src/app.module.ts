import { Module } from '@nestjs/common';
import { CompaniesModule } from './modules/companies/companies.module';
import { JobPostingsModule } from './modules/job-postings/job-postings.module';
import { HealthController } from './health.controller';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';
import { ReviewsModule } from './modules/reviews';
import { ConfigModule } from '@nestjs/config';

import { EventsModule } from './modules/events/events.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { PerfilModule } from './modules/perfil/perfil.module';
import { ReportsModule } from './modules/reports/reports.module';
import { assertServiceRoleKey } from './shared/lib/supabase-key-guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CompaniesModule,
    JobPostingsModule,
    EventsModule,
    MentorshipModule,
    PerfilModule,
    ReportsModule,
    MailModule,
    AuthModule,
    RegistrationsModule,
    DocumentsModule,
    EmailVerificationModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      // Fail-fast al arrancar: si SUPABASE_SERVICE_ROLE_KEY no es la clave
      // service_role, la API no levanta y el error queda claro en los logs.
      provide: 'SUPABASE_KEY_GUARD',
      useFactory: () => {
        assertServiceRoleKey();
        return true;
      },
    },
  ],
})
export class AppModule {}
