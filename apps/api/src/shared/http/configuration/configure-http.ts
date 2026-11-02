import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Environment } from '../../../config/environment';
import { ErrorHandlerFilter } from '../filters/error-handler.filter';

export function configureHttp(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);
  const origins = config.get('CORS_ORIGINS', { infer: true });

  app.setGlobalPrefix('api/v1', { exclude: ['/', 'health'] });
  app.use(helmet());
  app.use((_request: unknown, response: import('express').Response, next: () => void) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || origins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token', 'X-Correction-Token'],
    credentials: true,
  });
  app.useGlobalFilters(new ErrorHandlerFilter());
}
