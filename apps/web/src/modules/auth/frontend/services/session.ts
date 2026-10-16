import { ROLE_COOKIE, TOKEN_COOKIE } from "./route-access";

// Clave que lee la Epic 4 en su api-client (hasValidSession/getToken).
// TODO(Epic-4): migrar esa lectura a la cookie umsspira_token o a
// sessionStorage (umsspira.access-token) y eliminar esta compatibilidad.
export const LEGACY_TOKEN_KEY = "token";

function writeLegacyToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
    else window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* sin acceso a storage */
  }
}

// Solo se usa en el navegador. Con "Recordar mi sesión" dura 7 días;
// sin marcar, las cookies terminan al cerrar el navegador.
export function saveSession(token: string, role: string, remember: boolean): void {
  const maxAge = remember ? "; max-age=604800" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; samesite=lax${maxAge}`;
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; samesite=lax${maxAge}`;
  writeLegacyToken(token);
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
  writeLegacyToken(null);
  try {
    window.sessionStorage.removeItem("umsspira.access-token");
  } catch {
    /* sin acceso a storage */
  }
}

// El estado en memoria se pierde al recargar la página; la cookie sobrevive
// y mantiene la sesión activa en la misma pestaña o ventana.
export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${TOKEN_COOKIE}=`));
  if (!found) return null;
  try {
    return decodeURIComponent(found.slice(TOKEN_COOKIE.length + 1)) || null;
  } catch {
    return null;
  }
}