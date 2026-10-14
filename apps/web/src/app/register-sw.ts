/**
 * Registro y activación del Service Worker de UMSSpira.
 * Solo se ejecuta en el navegador y si este soporta Service Workers.
 */

type DeviceProfile = 'desktop' | 'mobile' | 'default';
export type UpdateHandler = (applyUpdate: () => void) => void;

let isReloading = false;

function activateWorker(worker: ServiceWorker): void {
  worker.postMessage({ type: 'SKIP_WAITING' });
}

// Cuando una versión nueva termina de instalarse, se AVISA al usuario
function trackInstalling(worker: ServiceWorker, onUpdate?: UpdateHandler): void {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      onUpdate?.(() => activateWorker(worker));
    }
  });
}

function listenForUpdates(
  registration: ServiceWorkerRegistration,
  onUpdate?: UpdateHandler,
): void {
  if (registration.waiting && navigator.serviceWorker.controller) {
    const waiting = registration.waiting;
    onUpdate?.(() => activateWorker(waiting));
  }

  if (registration.installing) {
    trackInstalling(registration.installing, onUpdate);
  }

  registration.addEventListener('updatefound', () => {
    if (registration.installing) {
      trackInstalling(registration.installing, onUpdate);
    }
  });
}

// Móvil = pantalla táctil sin mouse ni hover
// Escritorio = pantalla grande y puntero preciso (mouse)
function detectDeviceProfile(): DeviceProfile {
  const isTouchOnly =
    window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(hover: none)').matches;
  if (isTouchOnly) return 'mobile';

  const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
  const hasMouse = window.matchMedia('(pointer: fine)').matches;
  return isLargeScreen && hasMouse ? 'desktop' : 'default';
}

// Pide al navegador que no borre la caché por su cuenta si falta espacio
async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

// Le avisa al SW qué perfil de caché debe usar
async function sendDeviceProfile(): Promise<DeviceProfile> {
  const profile = detectDeviceProfile();
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: 'SET_DEVICE_PROFILE', profile });

  if (profile === 'desktop') {
    await requestPersistentStorage();
  }
  return profile;
}

// Al volver a primer plano en móvil: se reenvía el perfil y se busca una versión nueva del SW
function listenForForeground(registration: ServiceWorkerRegistration): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (detectDeviceProfile() !== 'mobile') return;

    registration.update().catch(() => undefined);
    sendDeviceProfile().catch((error) => {
      console.error('[SW] No se pudo reenviar el perfil de dispositivo:', error);
    });
  });
}

export async function registerServiceWorker(
  onUpdate?: UpdateHandler,
): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  // En la primera visita no había SW controlando la página: no hace falta recargar
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || isReloading) return;
    isReloading = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/portal' });
    listenForUpdates(registration, onUpdate);
    listenForForeground(registration);
    sendDeviceProfile().catch((error) => {
      console.error('[SW] No se pudo enviar el perfil de dispositivo:', error);
    });
    return registration;
  } catch (error) {
    console.error('[SW] No se pudo registrar el service worker:', error);
    return undefined;
  }
}