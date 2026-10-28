import { z } from 'zod';
import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(public readonly fields: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Los datos enviados no son válidos');
  }

  static fromZod(error: z.ZodError): ValidationError {
    const fields: Record<string, string[]> = Object.create(null) as Record<string, string[]>;
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      (fields[path] ??= []).push(issue.message);
    }
    return new ValidationError(fields);
  }
}
