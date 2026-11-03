import { getAccessToken } from './auth-session';

// Señal de UX por usuario; la autorización y el hash siguen siendo del servidor.
function storageKey(): string {
  let subject = 'current-session';
  try {
    const payload = getAccessToken()?.split('.')[1];
    if (payload) {
      const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof parsed.sub === 'string') subject = parsed.sub;
    }
  } catch { /* Un token inválido no se usa para autorizar peticiones. */ }
  return `umsspira:affinity:pending-deletion:${subject}`;
}

export function markPendingProfileChanges(): void {
  try { window.sessionStorage.setItem(storageKey(), 'true'); } catch { /* Almacenamiento opcional. */ }
}

export function hasPendingProfileChanges(): boolean {
  try { return window.sessionStorage.getItem(storageKey()) === 'true'; } catch { return false; }
}

export function clearPendingProfileChanges(): void {
  try { window.sessionStorage.removeItem(storageKey()); } catch { /* Almacenamiento opcional. */ }
}
