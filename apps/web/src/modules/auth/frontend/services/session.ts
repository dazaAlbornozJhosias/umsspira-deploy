import { ROLE_COOKIE, TOKEN_COOKIE } from "./route-access";

// Solo se usa en el navegador. Con "Recordar mi sesión" dura 7 días;
// sin marcar, las cookies terminan al cerrar el navegador.
export function saveSession(token: string, role: string, remember: boolean): void {
  const maxAge = remember ? "; max-age=604800" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; samesite=lax${maxAge}`;
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; samesite=lax${maxAge}`;
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
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