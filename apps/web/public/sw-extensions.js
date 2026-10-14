/**
 * Extensiones del Service Worker (se carga con importScripts desde sw.js).
 * Eventos (QR offline) y Chat (Push) agregan aquí sus handlers, sin tocar sw.js.
 *
 * Ejemplos:
 *   self.UMSSPIRA_SW.routes.push({
 *     match: (url) => url.pathname.startsWith('/portal/eventos/qr'),
 *     handle: (event) => fetch(event.request),
 *   });
 *   self.UMSSPIRA_SW.messages.MI_MENSAJE = (event) => { ... };
 *   self.addEventListener('push', (event) => { ... });
 */