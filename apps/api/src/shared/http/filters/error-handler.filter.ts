import { DependencyUnavailableError } from '../../errors/dependency-unavailable-error';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/app-error';
import { BusinessRuleError } from '../../errors/business-rule-error';
import { ResourceNotFoundError } from '../../errors/resource-not-found-error';
import { ValidationError } from '../../errors/validation-error';
import { translatePrismaError } from '../../infrastructure/database/prisma-error.translator';
import { HttpError } from '../errors/http-error';
import { AccessError } from '../../security/errors/access-error';

const HTTP_ERRORS: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'La solicitud no es válida' },
  401: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión para continuar' },
  403: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta operación' },
  404: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado' },
  405: { code: 'METHOD_NOT_ALLOWED', message: 'El método HTTP no está permitido' },
  409: { code: 'CONFLICT', message: 'La operación entra en conflicto con el estado actual' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'El contenido supera el tamaño permitido' },
  429: { code: 'TOO_MANY_REQUESTS', message: 'Se han enviado demasiadas solicitudes' },
};

@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorHandlerFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = exception instanceof z.ZodError ? ValidationError.fromZod(exception) : exception;

    if (error instanceof BusinessRuleError) {
      const statuses = {
        invalid: 400,
        missing: 404,
        conflict: 409,
        expired: 410,
        forbidden: 403,
        limited: 429,
      };
      response
        .status(statuses[error.reason])
        .json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof AccessError) {
      if (error.retryAfter) {
        response.setHeader('Retry-After', String(error.retryAfter));
      }
      const statuses: Record<string, number> = {
        INVALID_CREDENTIALS: 401,
        UNAUTHENTICATED: 401,
        FORBIDDEN: 403,
        SESSION_REUSED: 401,
        RATE_LIMITED: 429,
        SESSION_NOT_FOUND: 404,
        PASSWORD_CONFLICT: 409,
      };
      response
        .status(statuses[error.code] ?? 500)
        .json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof ResourceNotFoundError) {
      response.status(404).json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof DependencyUnavailableError) {
      response.status(503).json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof ValidationError) {
      response
        .status(400)
        .json({ error: { code: error.code, message: error.message, fields: error.fields } });
      return;
    }

    const httpError = error instanceof HttpError ? error : translatePrismaError(error);
    if (httpError) {
      response
        .status(httpError.status)
        .json({ error: { code: httpError.code, message: httpError.message } });
      return;
    }

    if (error instanceof HttpException && error.getStatus() < 500) {
      const status = error.getStatus();
      const detail = HTTP_ERRORS[status] ?? {
        code: 'HTTP_ERROR',
        message: 'No se pudo procesar la solicitud',
      };
      response.status(status).json({ error: detail });
      return;
    }

    // Un error de aplicación sin traducción explícita es un fallo de configuración.
    // Se registra su tipo, sin volcar consultas, credenciales ni datos de la petición.
    const name = error instanceof Error ? error.name : 'ErrorDesconocido';
    const code = error instanceof AppError ? ` (${error.code})` : '';
    this.logger.error(`Error inesperado: ${name}${code}`);
    response
      .status(500)
      .json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado' } });
  }
}
