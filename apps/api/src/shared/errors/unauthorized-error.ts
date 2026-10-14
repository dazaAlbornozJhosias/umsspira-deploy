// apps/api/src/shared/errors/unauthorized-error.ts
import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  constructor(message = 'Correo electrónico o contraseña incorrectos') {
    super(message, 'UNAUTHORIZED', 401);
  }
}