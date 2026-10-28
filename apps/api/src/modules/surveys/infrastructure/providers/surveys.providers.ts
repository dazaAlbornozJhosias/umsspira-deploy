import { Provider } from '@nestjs/common';
import { PrismaSurveyRepository } from '../repositories/prisma-survey.repository';

export const SURVEY_REPOSITORY_PORT = 'SURVEY_REPOSITORY_PORT';

export const surveysProviders: Provider[] = [
  {
    provide: SURVEY_REPOSITORY_PORT,
    useClass: PrismaSurveyRepository,
  },
];