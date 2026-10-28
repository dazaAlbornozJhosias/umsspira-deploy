import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { validateEnvironment } from './config/environment';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { HealthController } from './shared/http/controllers/health.controller';
import { RootController } from './shared/http/controllers/root.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { JobPostingsModule } from './modules/job-postings/job-postings.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { ProfileModule } from './modules/profile/profile.module';
import { EventsModule } from './modules/events/events.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NlpModule } from './modules/nlp/nlp.module';
import { RadarModule } from './modules/radar/radar.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '../.env'),
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    JobPostingsModule,
    RegistrationsModule,
    ProfileModule,
    EventsModule,
    MentorshipModule,
    ReportsModule,
    NlpModule,
    RadarModule,
    ChatModule,
  ],
  controllers: [RootController, HealthController],
})
export class AppModule {}
