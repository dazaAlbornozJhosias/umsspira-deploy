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
import { KEYWORD_EXTRACTOR_PORT } from '../src/modules/radar/application/ports/keyword-extractor.port';
import { PROFILE_TEXT_READER_PORT } from '../src/modules/radar/application/ports/profile-text-reader.port';
import { RADAR_REPOSITORY_PORT } from '../src/modules/radar/application/ports/radar-repository.port';
import { RADAR_AREA_IDS } from '../src/modules/radar/domain/entities/radar-area';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../src/shared/infrastructure/redis/redis.service';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { AFFINITY_AREAS } from '@umsspira/shared-types';
import { DEMO_ACCOUNTS, DEMO_GRADUATE_ID } from '../scripts/seed/demo-accounts';
import { InMemoryAuthStore } from './adapters/in-memory-auth.store';
import { InMemoryKeywordDictionary } from './adapters/in-memory-keyword-dictionary';
import { InMemoryRadarRepository } from './adapters/in-memory-radar.repository';
import {
  StubKeywordExtractor,
  StubProfileTextReader,
} from './adapters/in-memory-radar-ports';

const SOFTWARE = RADAR_AREA_IDS['software-development'];

const keywordSchema = z.strictObject({
  keyword: z.string().min(1),
  weight: z.number().min(1).max(5),
  frequency: z.number().positive(),
  points: z.number().positive(),
  percentage: z.number().min(0).max(100),
});

const areaSchema = z.strictObject({
  area: z.enum(AFFINITY_AREAS),
  affinity: z.number().min(0).max(100),
  previousAffinity: z.number().min(0).max(100).nullable(),
  weighting: z.number().min(1).max(5).nullable(),
  topKeywords: z.array(keywordSchema).max(5),
});

const vectorSchema = z.strictObject({
  graduateId: z.string().min(1),
  hasLaborHistory: z.boolean(),
  calculatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  status: z.enum(['ok', 'empty']),
  algorithmVersion: z.string().min(1),
  hasPendingChanges: z.boolean(),
  recalculated: z.boolean().optional(),
  processingMs: z.number().int().nonnegative(),
  areas: z.array(areaSchema).length(6),
  unmappedKeywords: z.array(z.string().min(1)),
});

const successSchema = z.strictObject({ data: vectorSchema });

const errorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

function account(role: 'titulado' | 'empresa') {
  const found = DEMO_ACCOUNTS.find((candidate) => candidate.role === role);

  if (!found) {
    throw new Error(`No existe la cuenta de prueba para ${role}`);
  }

  return found;
}

const radarRepository = new InMemoryRadarRepository();
const profileReader = new StubProfileTextReader();
const extractor = new StubKeywordExtractor();

async function createApp(): Promise<INestApplication> {
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
    .useValue(new InMemoryKeywordDictionary())
    .overrideProvider(RADAR_REPOSITORY_PORT)
    .useValue(radarRepository)
    .overrideProvider(PROFILE_TEXT_READER_PORT)
    .useValue(profileReader)
    .overrideProvider(KEYWORD_EXTRACTOR_PORT)
    .useValue(extractor)
    .compile();

  const app = module.createNestApplication();
  app.useLogger(false);
  configureHttp(app);
  await app.init();

  return app;
}

describe('Radar HU-8 - contrato HTTP de keywords influyentes', () => {
  let app: INestApplication;
  let tituladoToken: string;
  let empresaToken: string;

  beforeAll(async () => {
    app = await createApp();
    tituladoToken = await login('titulado');
    empresaToken = await login('empresa');
  });

  afterAll(async () => app?.close());

  beforeEach(() => {
    radarRepository.reset();
    profileReader.reset();
    extractor.reset();
    radarRepository.areaWeights = {
      [SOFTWARE]: [{ term: 'javascript', peso: 5 }],
    };
  });

  async function login(role: 'titulado' | 'empresa'): Promise<string> {
    const demo = account(role);
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: demo.email, password: demo.password, remember: false })
      .expect(200);

    return response.body.data.accessToken as string;
  }

  function getRadar(token = tituladoToken) {
    return request(app.getHttpServer())
      .get('/api/v1/radar')
      .auth(token, { type: 'bearer' });
  }

  function recalculate(token = tituladoToken) {
    return request(app.getHttpServer())
      .post('/api/v1/radar/recalculate')
      .auth(token, { type: 'bearer' });
  }

  it('GET sin calculo previo responde data con seis areas y previousAffinity null', async () => {
    profileReader.texts = ['javascript'];
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    extractor.unmapped = [{ term: 'xylophone', count: 1 }];

    const response = await getRadar().expect(200);
    const body = successSchema.parse(response.body);

    expect(body.data.graduateId).toBe(DEMO_GRADUATE_ID);
    expect(body.data.hasLaborHistory).toBe(true);
    expect(body.data.areas.map(({ area }) => area)).toEqual([...AFFINITY_AREAS]);
    expect(body.data.areas.every(({ previousAffinity }) => previousAffinity === null)).toBe(true);
    expect(body.data.areas[0]).toMatchObject({
      area: 'software-development',
      affinity: 12.5,
      previousAffinity: null,
      weighting: 5,
      topKeywords: [
        { keyword: 'javascript', weight: 5, frequency: 1, points: 5, percentage: 12.5 },
      ],
    });
    expect(body.data.unmappedKeywords).toEqual(['xylophone']);
    expect(body.data).not.toHaveProperty('recalculated');
    expect(radarRepository.saveCalls).toBe(1);
  });

  it('POST devuelve previousAffinity del calculo anterior y conserva la referencia si no cambia', async () => {
    profileReader.texts = ['javascript'];
    extractor.keywords = [{ term: 'javascript', count: 1 }];

    const first = successSchema.parse((await recalculate().expect(200)).body);
    expect(first.data.recalculated).toBe(true);
    expect(first.data.areas[0].previousAffinity).toBeNull();

    profileReader.texts = ['javascript javascript'];
    extractor.keywords = [{ term: 'javascript', count: 2 }];

    const second = successSchema.parse((await recalculate().expect(200)).body);
    expect(second.data.recalculated).toBe(true);
    expect(second.data.areas[0]).toMatchObject({
      affinity: 25,
      previousAffinity: 12.5,
      topKeywords: [
        { keyword: 'javascript', weight: 5, frequency: 2, points: 10, percentage: 25 },
      ],
    });

    const unchanged = successSchema.parse((await recalculate().expect(200)).body);
    expect(unchanged.data.recalculated).toBe(false);
    expect(unchanged.data.areas[0]).toMatchObject({
      affinity: 25,
      previousAffinity: 12.5,
    });
    expect(radarRepository.saveCalls).toBe(2);
  });

  it('GET posterior devuelve el top persistido sin exponer recalculated', async () => {
    profileReader.texts = ['javascript'];
    extractor.keywords = [{ term: 'javascript', count: 2 }];

    await recalculate().expect(200);
    const response = await getRadar().expect(200);
    const body = successSchema.parse(response.body);

    expect(body.data).not.toHaveProperty('recalculated');
    expect(body.data.areas[0].topKeywords).toEqual([
      { keyword: 'javascript', weight: 5, frequency: 2, points: 10, percentage: 25 },
    ]);
    expect(radarRepository.saveCalls).toBe(1);
  });

  it('un calculo VACIO devuelve seis areas en cero y listas vacias', async () => {
    profileReader.texts = ['texto sin diccionario'];
    extractor.keywords = [];

    const response = await recalculate().expect(200);
    const body = successSchema.parse(response.body);

    expect(body.data.status).toBe('empty');
    expect(
      body.data.areas.every(
        ({ affinity, previousAffinity, topKeywords }) =>
          affinity === 0 && previousAffinity === null && topKeywords.length === 0,
      ),
    ).toBe(true);
  });

  it('responde 401 sin token y 403 a una empresa con el esquema de error', async () => {
    const withoutToken = await request(app.getHttpServer()).get('/api/v1/radar').expect(401);
    expect(errorSchema.parse(withoutToken.body).error.code).toBe('UNAUTHENTICATED');

    const forbiddenGet = await getRadar(empresaToken).expect(403);
    expect(errorSchema.parse(forbiddenGet.body).error.code).toBe('FORBIDDEN');

    const withoutTokenPost = await request(app.getHttpServer())
      .post('/api/v1/radar/recalculate')
      .expect(401);
    expect(errorSchema.parse(withoutTokenPost.body).error.code).toBe('UNAUTHENTICATED');

    const forbiddenPost = await recalculate(empresaToken).expect(403);
    expect(errorSchema.parse(forbiddenPost.body).error.code).toBe('FORBIDDEN');
  });

  it('sin diccionario responde 503 y no persiste ningun calculo', async () => {
    profileReader.texts = ['javascript'];
    extractor.failWithDictionaryError = true;

    const response = await recalculate().expect(503);
    const body = errorSchema.parse(response.body);

    expect(body.error.code).toBe('NLP_DICTIONARY_UNAVAILABLE');
    expect(radarRepository.saveCalls).toBe(0);
    expect(radarRepository.savedCalculations).toHaveLength(0);
  });

  it('si falla la persistencia responde 500 generico sin guardar filas', async () => {
    profileReader.texts = ['javascript'];
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    radarRepository.failOnSave = true;

    const response = await recalculate().expect(500);
    const body = errorSchema.parse(response.body);

    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('persistencia');
    expect(radarRepository.savedCalculations).toHaveLength(0);
  });

  it('dos POST concurrentes con el mismo perfil crean un solo calculo', async () => {
    profileReader.texts = ['javascript'];
    extractor.keywords = [{ term: 'javascript', count: 1 }];

    const [first, second] = await Promise.all([recalculate().expect(200), recalculate().expect(200)]);
    const bodies = [successSchema.parse(first.body), successSchema.parse(second.body)];

    expect(radarRepository.saveCalls).toBe(1);
    expect(radarRepository.savedCalculations).toHaveLength(1);
    expect(bodies.map(({ data }) => data.recalculated).sort()).toEqual([false, true]);
    expect(bodies[0].data.areas[0].topKeywords).toEqual(bodies[1].data.areas[0].topKeywords);
  });
});
