import { AppError } from './app-error';

export class DependencyUnavailableError extends AppError {
  constructor() {
    super('RATE_LIMIT_UNAVAILABLE', 'El control de acceso no está disponible temporalmente');
  }
}
