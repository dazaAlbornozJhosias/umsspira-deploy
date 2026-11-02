import type { SubmitSurveyInput } from '../contracts/submit-survey.input';

export const SURVEY_REPOSITORY = Symbol('SURVEY_REPOSITORY');

export interface SurveyRepositoryPort {
  save(input: SubmitSurveyInput): Promise<{
    id: string;
  }>;
}
