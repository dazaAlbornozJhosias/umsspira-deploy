import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { CREDENTIAL_REPOSITORY } from '../src/modules/auth/application/ports/credential-repository.port';
import { SESSION_REPOSITORY } from '../src/modules/auth/application/ports/session-repository.port';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import { USER_READER } from '../src/modules/user/application/ports/user-reader.port';
import { KEYWORD_DICTIONARY_PORT } from '../src/modules/nlp/application/ports/keyword-dictionary.port';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../src/shared/infrastructure/redis/redis.service';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { DEMO_ACCOUNTS } from '../scripts/seed/demo-accounts';
import { InMemoryAuthStore } from './adapters/in-memory-auth.store';
import { InMemoryKeywordDictionary, NLP_TEST_DICTIONARY } from './adapters/in-memory-keyword-dictionary';

jest.setTimeout(30000);

const keywordSchema = z.strictObject({
  term: z.string().min(1),
  count: z.number().int().positive(),
});

const extractionSchema = z.strictObject({
  data: z.strictObject({
    keywords: z.array(keywordSchema),
    unmapped: z.array(keywordSchema),
  }),
});

const errorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

function account(role: 'titulado' | 'administrador' | 'empresa') {
  const found = DEMO_ACCOUNTS.find((candidate) => candidate.role === role);

  if (!found) {
    throw new Error(`No existe la cuenta de prueba para ${role}`);
  }

  return found;
}

async function createApp(dictionary: InMemoryKeywordDictionary): Promise<INestApplication> {
  const passwords = new Argon2PasswordHasher();
  const hashes = new Map(
    await Promise.all(
      DEMO_ACCOUNTS.map(async (demo) => [demo.email, await passwords.hash(demo.password)] as const),
    ),
  );
  const auth = new InMemoryAuthStore(hashes);
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(RedisService)
    .useValue({})
    .overrideProvider(CREDENTIAL_REPOSITORY)
    .useValue(auth)
    .overrideProvider(SESSION_REPOSITORY)
    .useValue(auth)
    .overrideProvider(USER_READER)
    .useValue(auth)
    .overrideProvider(RATE_LIMITER)
    .useValue({
      consume: async () => ({ allowed: true, retryAfterSeconds: 0 }),
    })
    .overrideProvider(KEYWORD_DICTIONARY_PORT)
    .useValue(dictionary)
    .compile();

  const app = module.createNestApplication();
  app.useLogger(false);
  configureHttp(app);
  await app.init();

  return app;
}

async function login(app: INestApplication, role: 'titulado' | 'administrador' | 'empresa') {
  const demo = account(role);
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: demo.email, password: demo.password, remember: false })
    .expect(200);

  return response.body.data.accessToken as string;
}

function findCount(keywords: Array<{ term: string; count: number }>, term: string) {
  return keywords.find((keyword) => keyword.term === term)?.count;
}

describe('POST /api/v1/nlp/extract', () => {
  let app: INestApplication;
  let dictionary: InMemoryKeywordDictionary;
  let tituladoToken: string;
  let adminToken: string;
  let empresaToken: string;

  beforeAll(async () => {
    dictionary = new InMemoryKeywordDictionary();
    app = await createApp(dictionary);
    tituladoToken = await login(app, 'titulado');
    adminToken = await login(app, 'administrador');
    empresaToken = await login(app, 'empresa');
  });

  afterAll(async () => app?.close());

  it('responde 401 sin token o con token inválido', async () => {
    for (const authorization of [undefined, 'Bearer token-invalido']) {
      const requestBuilder = request(app.getHttpServer()).post('/api/v1/nlp/extract');
      if (authorization) {
        requestBuilder.set('Authorization', authorization);
      }

      const response = await requestBuilder.send({ text: 'JavaScript' }).expect(401);
      expect(response.body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
    }
  });

  it('responde 403 a una empresa', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(empresaToken, { type: 'bearer' })
      .send({ text: 'JavaScript' })
      .expect(403);

    expect(response.body).toMatchObject({ error: { code: 'FORBIDDEN' } });
  });

  it('permite titulado y administrador', async () => {
    for (const token of [tituladoToken, adminToken]) {
      await request(app.getHttpServer())
        .post('/api/v1/nlp/extract')
        .auth(token, { type: 'bearer' })
        .send({ text: 'Docker' })
        .expect(200)
        .expect((response) => {
          extractionSchema.parse(response.body);
        });
    }
  });

  it('normaliza símbolos, alias y la misma mención', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(tituladoToken, { type: 'bearer' })
      .send({
        text: [
          'Node.JS y nodejs',
          'C++ y C#',
          'CI/CD',
          'Amazon Web Services (AWS)',
          'Gobierno de TI',
          'Observabilidad',
        ].join('\n'),
      })
      .expect(200);

    const body = extractionSchema.parse(response.body);
    expect(findCount(body.data.keywords, 'node.js')).toBe(2);
    expect(findCount(body.data.keywords, 'c++')).toBe(1);
    expect(findCount(body.data.keywords, 'c#')).toBe(1);
    expect(findCount(body.data.keywords, 'ci cd')).toBe(1);
    expect(findCount(body.data.keywords, 'amazon web services')).toBe(1);
    expect(findCount(body.data.keywords, 'gobierno de ti')).toBe(1);
    expect(findCount(body.data.unmapped, 'observabilidad')).toBe(1);
  });

  it('cumple los casos del anexo B', async () => {
    interface ExtractionCase {
      text: string;
      keywords: Record<string, number>;
      presentInUnmapped?: string[];
      absentFromUnmapped?: string[];
    }

    const cases: ExtractionCase[] = [
      {
        text: 'Gestión de proyectos de TI',
        keywords: { 'gestion de proyectos': 1 },
        absentFromUnmapped: ['gestion', 'proyectos', 'de', 'ti'],
      },
      {
        text: 'Ciencia de datos y análisis de datos',
        keywords: { 'ciencia de datos': 1, 'analisis de datos': 1 },
        absentFromUnmapped: ['de', 'y'],
      },
      {
        text: 'Liderazgo de equipos',
        keywords: { 'liderazgo de equipos': 1 },
        absentFromUnmapped: ['de'],
      },
      {
        text: 'Experiencia de varios años',
        keywords: {},
        presentInUnmapped: ['experiencia'],
        absentFromUnmapped: ['de'],
      },
    ];

    for (const testCase of cases) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/nlp/extract')
        .auth(tituladoToken, { type: 'bearer' })
        .send({ text: testCase.text })
        .expect(200);

      const body = extractionSchema.parse(response.body);

      for (const [term, count] of Object.entries(testCase.keywords)) {
        expect(findCount(body.data.keywords, term)).toBe(count);
      }
      for (const term of testCase.absentFromUnmapped ?? []) {
        expect(findCount(body.data.unmapped, term)).toBeUndefined();
      }
      for (const term of testCase.presentInUnmapped ?? []) {
        expect(findCount(body.data.unmapped, term)).toBeGreaterThan(0);
      }
    }
  });

  it('no cruza n-gramas entre segmentos', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(tituladoToken, { type: 'bearer' })
      .send({ text: 'gobierno de\nti\nmachine\nlearning' })
      .expect(200);

    const body = extractionSchema.parse(response.body);
    expect(body.data.keywords).toEqual([]);
    expect(findCount(body.data.unmapped, 'machine')).toBe(1);
    expect(findCount(body.data.unmapped, 'learning')).toBe(1);
  });

  it('devuelve listas vacías para texto vacío o solo espacios', async () => {
    for (const text of ['', '   ', '\n\n']) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/nlp/extract')
        .auth(tituladoToken, { type: 'bearer' })
        .send({ text })
        .expect(200);

      expect(extractionSchema.parse(response.body).data).toEqual({
        keywords: [],
        unmapped: [],
      });
    }
  });

  it('acepta exactamente 5000 caracteres y rechaza 5001', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(tituladoToken, { type: 'bearer' })
      .send({ text: 'a'.repeat(5000) })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(tituladoToken, { type: 'bearer' })
      .send({ text: 'a'.repeat(5001) })
      .expect(400);

    expect(errorSchema.parse(response.body).error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields.text).toBeDefined();
  });

  it('rechaza campos extra, text ausente y text que no es cadena', async () => {
    const bodies = [{ text: 'JavaScript', extra: true }, {}, { text: 42 }, { text: null }];

    for (const body of bodies) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/nlp/extract')
        .auth(tituladoToken, { type: 'bearer' })
        .send(body)
        .expect(400);

      expect(errorSchema.parse(response.body).error.code).toBe('VALIDATION_ERROR');
    }
  });
});

describe.each(['fallo', 'vacío'] as const)('POST /api/v1/nlp/extract con diccionario: %s', (mode) => {
  let app: INestApplication;
  let dictionary: InMemoryKeywordDictionary;
  let token: string;

  beforeAll(async () => {
    dictionary = new InMemoryKeywordDictionary(mode === 'vacío' ? [] : NLP_TEST_DICTIONARY);
    dictionary.fail = mode === 'fallo';
    app = await createApp(dictionary);
    token = await login(app, 'titulado');
  });

  afterAll(async () => app?.close());

  it('responde 503 con el formato propio de NLP y reintenta en la siguiente petición', async () => {
    const previousCalls = dictionary.calls;
    const failed = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(token, { type: 'bearer' })
      .send({ text: 'JavaScript' })
      .expect(503);

    expect(failed.body).toEqual({
      error: {
        code: 'NLP_DICTIONARY_UNAVAILABLE',
        message: 'El diccionario de palabras clave no está disponible temporalmente',
      },
    });
    expect(dictionary.calls).toBe(previousCalls + 1);

    dictionary.fail = false;
    dictionary.entries = NLP_TEST_DICTIONARY;
    const response = await request(app.getHttpServer())
      .post('/api/v1/nlp/extract')
      .auth(token, { type: 'bearer' })
      .send({ text: 'JavaScript' })
      .expect(200);

    expect(findCount(extractionSchema.parse(response.body).data.keywords, 'javascript')).toBe(1);
    expect(dictionary.calls).toBe(previousCalls + 2);
  });
});