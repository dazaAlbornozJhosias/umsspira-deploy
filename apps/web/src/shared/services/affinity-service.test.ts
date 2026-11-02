
/// <reference types="jest" />

import snapshotsMock from '../mocks/affinity-snapshots-mock.json';

const originalFetch = global.fetch;

const AREAS_ORDER = [
  'software-development',
  'cloud-devops',
  'data-ai',
  'quality-assurance',
  'cybersecurity-networks',
  'it-management',
];

async function resetTestSession() {
  const authSession = await import('@/shared/services/auth-session');
  authSession.clearAccessToken();
}

async function setTestAccessToken() {
  const authSession = await import('@/shared/services/auth-session');
  authSession.clearAccessToken();
  authSession.setAccessToken('test-token');
}

describe('getAffinityVector', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    await resetTestSession();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await resetTestSession();
    global.fetch = originalFetch;
  });

  it('devuelve el mock con 6 Ã¡reas en orden fijo y valores entre 0 y 100', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

    const { getAffinityVector } = await import('./affinity-service');
    const result = await getAffinityVector();

    expect(result.areas.map((item) => item.area)).toEqual(AREAS_ORDER);

    result.areas.forEach((item) => {
      expect(item.affinity).toBeGreaterThanOrEqual(0);
      expect(item.affinity).toBeLessThanOrEqual(100);
    });
  });

  it('consulta el endpoint real cuando el mock estÃ¡ desactivado', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    const payload = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-28T12:00:00.000Z',
      areas: [],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    });

    const { getAffinityVector } = await import('./affinity-service');
    const result = await getAffinityVector();

    expect(result.graduateId).toBe(payload.graduateId);
    expect(result.areas).toEqual([]);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/radar'),
      expect.anything(),
    );
  });

  it('consulta el endpoint real cuando la variable de mock no está definida', async () => {
    delete process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK;
    await setTestAccessToken();

    const payload = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-28T12:00:00.000Z',
      hasPendingChanges: true,
      areas: [{
        area: 'software-development',
        affinity: 85,
        weighting: 5,
        topKeywords: [{ keyword: 'typescript', weight: 5, frequency: 2, points: 10, percentage: 25 }],
      }],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    });

    const { getAffinityVector } = await import('./affinity-service');
    const result = await getAffinityVector();

    expect(result.graduateId).toBe(payload.graduateId);
    expect(result.hasPendingChanges).toBe(true);
    expect(result.areas[0]).toMatchObject({
      weighting: 5,
      topKeywords: payload.areas[0].topKeywords,
      evidence: [],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/radar'),
      expect.anything(),
    );
  });

  it('lanza error con el estado HTTP cuando el backend responde con fallo', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      }),
    });

    const { getAffinityVector } = await import('./affinity-service');

    await expect(getAffinityVector()).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('saveAffinityConfig', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    await resetTestSession();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await resetTestSession();
    global.fetch = originalFetch;
  });

  it('guarda la configuraciÃ³n exitosamente con mock', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

    const { saveAffinityConfig } = await import('./affinity-service');

    await expect(
      saveAffinityConfig({
        axes: [{ area: 'software-development', weight: 3 }],
      }),
    ).resolves.toBeUndefined();
  });

  it('envÃ­a la configuraciÃ³n al endpoint real cuando el mock estÃ¡ desactivado', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });

    const { saveAffinityConfig } = await import('./affinity-service');

    await saveAffinityConfig({
      axes: [{ area: 'software-development', weight: 3 }],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/affinity/config'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('getAffinityConfig', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    await resetTestSession();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await resetTestSession();
    global.fetch = originalFetch;
  });

  it('devuelve los 6 ejes del mock en el orden fijo con ponderaciones enteras', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

    const { getAffinityConfig } = await import('./affinity-service');
    const config = await getAffinityConfig();

    expect(config.axes.map((axis) => axis.area)).toEqual(AREAS_ORDER);

    config.axes.forEach((axis) => {
      expect(Number.isInteger(axis.weight)).toBe(true);
    });
  });

  it('ordena la respuesta del backend segÃºn AFFINITY_AREAS', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    const payload = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-28T12:00:00.000Z',
      hasPendingChanges: true,
      areas: [
        { area: 'it-management', affinity: 0, weighting: null },
        { area: 'data-ai', affinity: 65, weighting: 3 },
        { area: 'software-development', affinity: 85, weighting: 5 },
        { area: 'cybersecurity-networks', affinity: 20, weighting: 1 },
        { area: 'quality-assurance', affinity: 40, weighting: 2 },
        { area: 'cloud-devops', affinity: 60, weighting: 4 },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    });

    const { getAffinityConfig } = await import('./affinity-service');
    const config = await getAffinityConfig();

    expect(config.axes.map((axis) => axis.area)).toEqual(AREAS_ORDER);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/radar'),
      expect.anything(),
    );
    expect(config.axes.map((axis) => axis.weight)).toEqual([5, 4, 3, 2, 1, null]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('recalculateAffinity', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    await resetTestSession();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await resetTestSession();
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('recalcula exitosamente con mock', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

    const { recalculateAffinity } = await import('./affinity-service');
    const result = await recalculateAffinity();

    expect(result.areas).toHaveLength(6);
    expect(result.calculatedAt).toBeDefined();
  });

  it('conserva previousAffinity y recalculated de la respuesta real', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    const payload = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-28T12:00:00.000Z',
      recalculated: false,
      areas: [
        {
          area: 'software-development',
          affinity: 83,
          previousAffinity: 75,
          topKeywords: ['React', 'TypeScript'],
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    });

    const { recalculateAffinity } = await import('./affinity-service');
    const result = await recalculateAffinity();

    expect(result.recalculated).toBe(false);
    expect(result.areas[0]).toMatchObject({
      area: 'software-development',
      affinity: 83,
      previousAffinity: 75,
    });
  });

  it('aborta a los 7000 ms y lanza el mensaje exacto del criterio', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    jest.useFakeTimers();

    const fetchMock = jest.fn().mockImplementation(
      (_input: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    global.fetch = fetchMock as unknown as typeof fetch;

    const { recalculateAffinity } = await import('./affinity-service');

    let settled = false;

    const pending = recalculateAffinity().finally(() => {
      settled = true;
    });

    const assertion = expect(pending).rejects.toThrow(
      'No se pudo actualizar tu radar',
    );

    await jest.advanceTimersByTimeAsync(6999);

    expect(settled).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await assertion;

    expect(settled).toBe(true);
  });

  it('lanza error con el estado HTTP cuando la respuesta no es exitosa', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'false';
    await setTestAccessToken();

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Servicio temporalmente no disponible',
        },
      }),
    });

    const { recalculateAffinity } = await import('./affinity-service');

    await expect(recalculateAffinity()).rejects.toMatchObject({
      status: 503,
    });
  });

  it(
    'rota entre los 3 snapshots del mock en cada recÃ¡lculo',
    async () => {
      process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

      const { recalculateAffinity } = await import('./affinity-service');

      const first = await recalculateAffinity();
      const second = await recalculateAffinity();
      const third = await recalculateAffinity();
      const fourth = await recalculateAffinity();

      [first, second, third].forEach((vector) => {
        expect(vector.areas.map((item) => item.area)).toEqual(AREAS_ORDER);

        vector.areas.forEach((item) => {
          expect(Number.isInteger(item.affinity)).toBe(true);
          expect(item.affinity).toBeGreaterThanOrEqual(0);
          expect(item.affinity).toBeLessThanOrEqual(100);
        });
      });

      expect(JSON.stringify(second.areas)).not.toEqual(
        JSON.stringify(first.areas),
      );
      expect(JSON.stringify(third.areas)).not.toEqual(
        JSON.stringify(second.areas),
      );
      expect(JSON.stringify(fourth.areas)).toEqual(
        JSON.stringify(first.areas),
      );
    },
    15000,
  );

  it(
    'devuelve snapshots distintos y guarda calculatedAt distintos en el JSON',
    async () => {
      process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

      const { recalculateAffinity } = await import('./affinity-service');

      const first = await recalculateAffinity();
      const second = await recalculateAffinity();

      expect(JSON.stringify(second.areas)).not.toEqual(
        JSON.stringify(first.areas),
      );

      expect(snapshotsMock.map((snapshot) => snapshot.calculatedAt)).toEqual([
        '2026-09-28T12:00:00.000Z',
        '2026-09-29T12:00:00.000Z',
        '2026-09-30T12:00:00.000Z',
      ]);

      snapshotsMock.forEach((snapshot) => {
        expect(snapshot.areas.map((item) => item.area)).toEqual(AREAS_ORDER);

        snapshot.areas.forEach((item) => {
          expect(Number.isInteger(item.affinity)).toBe(true);
          expect(item.affinity).toBeGreaterThanOrEqual(0);
          expect(item.affinity).toBeLessThanOrEqual(100);
        });
      });
    },
    15000,
  );
});

describe('convivencia con la Ã©pica', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    await resetTestSession();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await resetTestSession();
  });

  it('mantiene calculateAffinityVector sin parÃ¡metros junto a las funciones nuevas', async () => {
    process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK = 'true';

    const service = await import('./affinity-service');

    expect(service.calculateAffinityVector.length).toBe(0);

    const vector = await service.calculateAffinityVector();

    expect(vector.areas.map((item) => item.area)).toEqual(AREAS_ORDER);
    expect(typeof service.getAffinityConfig).toBe('function');
    expect(typeof service.saveAffinityConfig).toBe('function');
    expect(typeof service.recalculateAffinity).toBe('function');
  });
});
