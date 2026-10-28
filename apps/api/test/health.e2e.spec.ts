import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { configureHttp } from '../src/shared/http/configuration/configure-http';

describe('Backend inicial', () => {
  let app: INestApplication;
  const query = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: query })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => query.mockReset().mockResolvedValue([{ valor: 1 }]));
  afterAll(async () => app?.close());

  it('comprueba PostgreSQL en GET /health', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', database: 'ok' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('responde 503 cuando PostgreSQL no está disponible', async () => {
    query.mockRejectedValueOnce(new Error('Credenciales privadas'));
    await request(app.getHttpServer())
      .get('/health')
      .expect(503, {
        error: { code: 'DATABASE_UNAVAILABLE', message: 'La base de datos no está disponible' },
      });
  });

  it.each(['/api/v1/solicitudes', '/mentorship/profiles', '/api/v1/health'])(
    'no expone endpoints funcionales ni otro health en %s',
    async (path) => {
      await request(app.getHttpServer())
        .get(path)
        .expect(404, {
          error: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado' },
        });
      expect(query).not.toHaveBeenCalled();
    },
  );

  it('permite el origen configurado', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3001')
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001')
      .expect(200);
  });

  it('no concede acceso CORS a un origen distinto', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://otro.ejemplo')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
