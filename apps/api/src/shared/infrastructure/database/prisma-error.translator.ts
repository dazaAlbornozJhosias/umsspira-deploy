import { Prisma } from '../../../generated/prisma/client';
import { HttpError } from '../../http/errors/http-error';

export function translatePrismaError(error: unknown): HttpError | undefined {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new HttpError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible');
  }
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return undefined;
  }

  switch (error.code) {
    case 'P2002':
      return new HttpError(409, 'CONFLICT', 'Ya existe un registro con esos datos');
    case 'P2003':
      return new HttpError(
        409,
        'RELATION_CONFLICT',
        'La operación entra en conflicto con registros relacionados',
      );
    case 'P2025':
      return new HttpError(404, 'NOT_FOUND', 'No se encontró el registro solicitado');
    case 'P2024':
      return new HttpError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible');
    default:
      return undefined;
  }
}
