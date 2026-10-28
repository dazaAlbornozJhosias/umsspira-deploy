import 'reflect-metadata';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import type { Environment } from './config/environment';
import { configureHttp } from './shared/http/configuration/configure-http';

// Socket.IO usa los mismos orígenes permitidos que el resto de la API (CORS_ORIGINS).
class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    });
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureHttp(app);
  const config = app.get(ConfigService<Environment, true>);
  app.useWebSocketAdapter(new CorsIoAdapter(app, config.get('CORS_ORIGINS', { infer: true })));
  app.enableShutdownHooks();
  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  Logger.log(`API ejecutándose en el puerto ${port}`, 'Arranque');
}

void bootstrap().catch(() => {
  Logger.error('No se pudo iniciar la API. Revisa la configuración del entorno.', 'Arranque');
  process.exitCode = 1;
});