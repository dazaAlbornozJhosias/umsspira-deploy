export const TOKEN_COOKIE = "umsspira_token";
export const ROLE_COOKIE = "umsspira_role";

export const LOGIN_PATH = "/login";
export const ADMIN_HOME = "/applications";
export const COMPANY_HOME = "/companies";
export const PORTAL_HOME = "/portal";
export const USER_HOME = "/me";

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string };

const GRADUATE_AFFINITY_ROUTES = ["/afinidad/egresado"];
const RECRUITER_ROUTES = [
  "/afinidad/reclutador",
  "/empresa/postulantes",
  "/postulantes",
];

function matchesRoute(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function homeFor(role: string | undefined): string {
  switch (role) {
    case "administrador":
      return ADMIN_HOME;
    case "empresa":
      return COMPANY_HOME;
    case "titulado":
      return PORTAL_HOME;
    default:
      return USER_HOME;
  }
}

export function decideAccess(
  pathname: string,
  token: string | undefined,
  role: string | undefined,
): AccessDecision {
  // Sesión recordada: quien ya tiene sesión no vuelve a ver el formulario de acceso,
  // lo lleva a su pantalla según el rol
  if (pathname === LOGIN_PATH) {
    return token ? { allowed: false, redirectTo: homeFor(role) } : { allowed: true };
  }

  // CA-05.1: sin sesión no se ve ninguna pantalla protegida
  if (!token) {
    return { allowed: false, redirectTo: LOGIN_PATH };
  }

  // CA-05.5: solo el administrador entra al panel administrativo
  if (matchesRoute(pathname, ADMIN_HOME) && role !== "administrador") {
    return { allowed: false, redirectTo: USER_HOME };
  }

  // HU-004: reportería institucional y sus subrutas requieren rol administrador.
  // La API también comprueba los permisos reales mediante sus guards.
  if (matchesRoute(pathname, "/reports") && role !== "administrador") {
    return { allowed: false, redirectTo: homeFor(role) };
  }
    // US-1.4: el registro de empresas es exclusivo del administrador UMSS.
  if (matchesRoute(pathname, "/company-registry") && role !== "administrador") {
    return { allowed: false, redirectTo: homeFor(role) };
  }

  // T4.1: la encuesta y todas sus subrutas pertenecen únicamente al titulado.
  if (matchesRoute(pathname, "/surveys") && role !== "titulado") {
    return { allowed: false, redirectTo: homeFor(role) };
  }

  // Empresa y Administrador: /afinidad/reclutador, /empresa/postulantes y /postulantes
  const isRecruiterRoute = RECRUITER_ROUTES.some((route) =>
    matchesRoute(pathname, route),
  );
  if (isRecruiterRoute && role !== "empresa" && role !== "administrador") {
    return { allowed: false, redirectTo: homeFor(role) };
  }

  // Titulado y Administrador: /afinidad y /afinidad/egresado
  const isGraduateAffinityRoute =
    pathname === "/afinidad" ||
    GRADUATE_AFFINITY_ROUTES.some((route) => matchesRoute(pathname, route));
  if (
    isGraduateAffinityRoute &&
    role !== "titulado" &&
    role !== "administrador"
  ) {
    return { allowed: false, redirectTo: homeFor(role) };
  }

  return { allowed: true };
}