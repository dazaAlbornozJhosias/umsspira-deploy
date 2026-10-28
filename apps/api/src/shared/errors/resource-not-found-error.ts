import { AppError } from './app-error';

export class ResourceNotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
