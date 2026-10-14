const CACHE_NAME = 'umsspira-core-portal-v3';

const VERSION = 'v2';
const STATIC_CACHE = `umsspira-static-${VERSION}`;
const ASSETS_CACHE = `umsspira-assets-${VERSION}`;
const CONFIG_CACHE = `umsspira-config-${VERSION}`;
const ALL_CACHES = [CACHE_NAME, STATIC_CACHE, ASSETS_CACHE, CONFIG_CACHE];

const CORE_ASSETS = [
  "/portal",
];

const PRECACHE_URLS = ['/manifest.webmanifest', '/favicon.ico'];
const PRECACHE_ICONS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/favicon-32.png',
];

const PROFILES = {
  default: { maxAssets: 80 },
  desktop: { maxAssets: 200 },
  mobile: { maxAssets: 40 },
};
const DEFAULT_PROFILE = 'default';
const PROFILE_KEY = '/__sw-profile';

// ---------------------------------------------------------------------
// PUNTO DE EXTENSIÓN para otros equipos (Eventos: QR offline, Chat: Push).
// Se agregan en /sw-extensions.js, sin modificar este archivo.
// ---------------------------------------------------------------------
const EXT = (self.UMSSPIRA_SW = { routes: [], messages: {} });
try {
  if (typeof importScripts === 'function') importScripts('/sw-extensions.js');
} catch (error) {
  // Las extensiones son opcionales: si fallan, el núcleo sigue funcionando
}

// Lee el HTML del shell y precachea su JS, CSS y fuentes
async function precacheShellAssets(staticCache) {
  const response = await fetch('/portal');
  if (!response.ok) return;
  const html = await response.text();
  const urls = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url);
      if (res.ok) await staticCache.put(url, res);
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const coreCache = await caches.open(CACHE_NAME);
      await coreCache.addAll(CORE_ASSETS);

      const staticCache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          const response = await fetch(url);
          if (response.ok) await staticCache.put(url, response);
        })
      );

      const assetsCache = await caches.open(ASSETS_CACHE);
      await Promise.allSettled(
        PRECACHE_ICONS.map(async (url) => {
          const response = await fetch(url);
          if (response.ok) await assetsCache.put(url, response);
        })
      );

      await precacheShellAssets(staticCache).catch(() => undefined);
    })()
  );
  // Sin skipWaiting: la versión nueva espera a que el usuario acepte el aviso
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('umsspira-') && !ALL_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

const IS_LOCALHOST =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxEntries);
  }
}

function isCacheable(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'default');
}

function getHandledUrl(request) {
  if (request.method !== 'GET') return null;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return null;

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('webpack-hmr') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/sw-extensions.js'
  ) {
    return null;
  }

  // El portal conserva su caché sin almacenar vistas de otras épicas.
  if (request.mode === 'navigate' && url.pathname !== '/portal' && !url.pathname.startsWith('/portal/')) return null;
  if (request.headers.get('Authorization')) return null;
  if (
    url.pathname !== '/portal' && !url.pathname.startsWith('/portal/') &&
    !url.pathname.startsWith('/_next/static/') && !url.pathname.startsWith('/_next/image') &&
    !url.pathname.startsWith('/icons/') && url.pathname !== '/manifest.webmanifest'
  ) return null;

  return url;
}

async function saveProfile(name) {
  if (!Object.prototype.hasOwnProperty.call(PROFILES, name)) return;
  const cache = await caches.open(CONFIG_CACHE);
  await cache.put(PROFILE_KEY, new Response(name));
}

async function loadProfile() {
  const cache = await caches.open(CONFIG_CACHE);
  const response = await cache.match(PROFILE_KEY);
  if (!response) return DEFAULT_PROFILE;

  const name = await response.text();
  return Object.prototype.hasOwnProperty.call(PROFILES, name) ? name : DEFAULT_PROFILE;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        cache.put(request, response.clone());
        trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkPromise) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Rutas registradas por otros equipos (Eventos, Chat)
  for (const route of EXT.routes) {
    try {
      if (route.match(new URL(request.url), request)) {
        event.respondWith(route.handle(event));
        return;
      }
    } catch (error) {
      // Una extensión con error no debe romper el núcleo
    }
  }

  const url = getHandledUrl(request);

  if (!url) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      IS_LOCALHOST ? networkFirst(request, STATIC_CACHE) : cacheFirst(request, STATIC_CACHE)
    );
    return;
  }

  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/image')
  ) {
    event.respondWith(
      loadProfile().then((profile) =>
        staleWhileRevalidate(request, ASSETS_CACHE, PROFILES[profile].maxAssets)
      )
    );
    return;
  }

  event.respondWith(
    networkFirst(request, CACHE_NAME).catch(() =>
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return caches.match('/portal').then((portal) => portal || new Response('<!DOCTYPE html><html lang=es><title>Sin conexión</title><h1>Sin conexión</h1><p>No fue posible cargar esta página porque no hay conexión a Internet.</p></html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      })
    )
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  // El usuario aceptó el aviso de nueva versión
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'SET_DEVICE_PROFILE') {
    event.waitUntil(saveProfile(data.profile));
    return;
  }

  // Mensajes de otros equipos
  const handler = EXT.messages[data.type];
  if (typeof handler === 'function') handler(event);
});