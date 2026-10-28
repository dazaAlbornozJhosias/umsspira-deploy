import { AppError } from './app-error';

export type RuleFailure = 'invalid' | 'missing' | 'conflict' | 'expired' | 'forbidden' | 'limited';

export class BusinessRuleError extends AppError {
  constructor(
    public readonly reason: RuleFailure,
    code: string,
    message: string,
  ) {
    super(code, message);
  }
}
