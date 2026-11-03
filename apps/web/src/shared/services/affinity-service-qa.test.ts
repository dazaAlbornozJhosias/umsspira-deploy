import { RADAR_AREA_IDS } from '@umsspira/shared-types/src/affinity';

const originalFetch = global.fetch;
const originalEnv = process.env;
const contribution = { keyword: 'arquitectura', frequency: 3, weight: 0.63, points: 1.89, percentage: 37.8 };
const payload = {
  graduateId: 'qa-graduate', calculatedAt: '2026-11-03T10:00:00Z', hasPendingChanges: false,
  areas: [{ area: RADAR_AREA_IDS['software-development'], affinity: 50, previousAffinity: 15, weighting: 2.5, topKeywords: [contribution] }],
};

beforeEach(async () => {
  jest.resetModules();
  process.env = { ...originalEnv, NEXT_PUBLIC_USE_AFFINITY_MOCK: 'false' };
  const { setAccessToken } = await import('./auth-session');
  setAccessToken(`header.${btoa(JSON.stringify({ sub: 'qa-graduate', exp: Date.now() / 1000 + 3600 }))}.signature`);
});

afterEach(async () => {
  const { clearAccessToken } = await import('./auth-session');
  clearAccessToken();
  process.env = originalEnv;
  global.fetch = originalFetch;
  document.cookie = "umsspira_csrf=; Max-Age=0; path=/";
  jest.useRealTimers();
});

describe('QA HU7/HU8: contrato y limites reales de GET/POST', () => {
  it.each(['getAffinityVector', 'recalculateAffinity', 'calculateAffinityVector'] as const)(
    '%s conserva aportes reales, ponderaciones e historial usando la sesion y el proxy', async (method) => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: payload }) });
      const service = await import('./affinity-service');
      const result = await service[method]();
      expect(result.areas[0]).toMatchObject({ area: 'software-development', affinity: 50, previousAffinity: 15, weighting: 2.5, topKeywords: [contribution], keywords: ['arquitectura'], evidence: [] });
      expect(global.fetch).toHaveBeenCalledWith(method === 'getAffinityVector' ? '/api/v1/radar' : '/api/v1/radar/recalculate', expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Bearer /) }) }));
    },
  );

  it.each(['getAffinityVector', 'recalculateAffinity'] as const)('%s muestra el error de red sin sustituir el resultado por un mock', async (method) => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const service = await import('./affinity-service');
    await expect(service[method]()).rejects.toThrow('No se pudo actualizar tu radar');
  });

  it.each(['getAffinityVector', 'recalculateAffinity'] as const)('%s conserva el estado 503 del diccionario', async (method) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: { message: 'Diccionario no disponible' } }) });
    const service = await import('./affinity-service');
    await expect(service[method]()).rejects.toMatchObject({ status: 503 });
  });

  it.each(['getAffinityVector', 'recalculateAffinity'] as const)('%s vence exactamente a los 7000 ms aunque el cuerpo ignore abort', async (method) => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => new Promise(() => {}) });
    const service = await import('./affinity-service');
    let settled = false;
    const request = service[method]().finally(() => { settled = true; });
    const assertion = expect(request).rejects.toThrow('No se pudo actualizar tu radar');
    await jest.advanceTimersByTimeAsync(6999);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await assertion;
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.signal.aborted).toBe(true);
  });

  it('el limite GET incluye la renovacion de sesion pendiente', async () => {
    jest.useFakeTimers();
    document.cookie = 'umsspira_csrf=qa-csrf; path=/';
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 }).mockImplementation(() => new Promise(() => {}));
    const { getAffinityVector } = await import('./affinity-service');
    const assertion = expect(getAffinityVector()).rejects.toThrow('No se pudo actualizar tu radar');
    await jest.advanceTimersByTimeAsync(7000);
    await assertion;
  });
});
