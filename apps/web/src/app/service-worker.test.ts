/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

function loadWorker() {
  const listeners: Record<string, (event: any) => void> = {};
  const addEventListener = jest.fn((name: string, listener: (event: any) => void) => {
    listeners[name] = listener;
  });
  const cache = { match: jest.fn(), put: jest.fn(), addAll: jest.fn() };
  runInNewContext(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8'), {
    self: {
      location: { origin: 'https://umsspira.test', hostname: 'umsspira.test' },
      addEventListener, skipWaiting: jest.fn(), clients: { claim: jest.fn() },
    },
    caches: { open: async () => cache, match: async () => undefined },
    fetch: async () => { throw new Error('Sin conexión'); },
    URL, Response,
  });
  return { listeners, addEventListener };
}

describe('service worker del portal', () => {
  it('carga sin declaraciones duplicadas y registra un único manejador por evento', () => {
    const { addEventListener } = loadWorker();
    for (const name of ['install', 'activate', 'fetch', 'message']) {
      expect(addEventListener.mock.calls.filter(([event]) => event === name)).toHaveLength(1);
    }
  });

  it('no intercepta el homepage ni las consultas de otras épicas', () => {
    const { listeners } = loadWorker();
    for (const path of ['/', '/me', '/graduates-report', '/api/events']) {
      const respondWith = jest.fn();
      listeners.fetch({
        request: { method: 'GET', url: `https://umsspira.test${path}`, headers: new Headers(), mode: 'navigate' },
        respondWith,
      });
      expect(respondWith).not.toHaveBeenCalled();
    }
  });

  it('mantiene el aviso sin conexión cuando el portal no está en caché', async () => {
    const { listeners } = loadWorker();
    const respondWith = jest.fn();
    listeners.fetch({
      request: { method: 'GET', url: 'https://umsspira.test/portal', headers: new Headers(), mode: 'navigate' },
      respondWith,
    });
    const response: Response = await respondWith.mock.calls[0][0];
    expect(await response.text()).toContain('Sin conexión');
  });
});
