export const TOKEN_COOKIE = "umsspira_token";
export const ROLE_COOKIE = "umsspira_role";

export const LOGIN_PATH = "/login";
export const ADMIN_HOME = "/applications";
export const USER_HOME = "/me";

export type AccessDecision = { allowed: true } | { allowed: false; redirectTo: string };

export function decideAccess(
  pathname: string,
  token: string | undefined,
  role: string | undefined,
): AccessDecision {
  // CA-05.1: sin sesión no se ve ninguna pantalla protegida
  if (!token) return { allowed: false, redirectTo: LOGIN_PATH };

  // CA-05.5: solo el administrador entra al panel administrativo
  if (pathname.startsWith(ADMIN_HOME) && role !== "administrador") {
    return { allowed: false, redirectTo: USER_HOME };
  }

  return { allowed: true };
}