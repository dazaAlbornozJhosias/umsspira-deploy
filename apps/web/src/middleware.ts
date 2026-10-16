import { NextResponse, type NextRequest } from "next/server";
import {
  decideAccess,
  LOGIN_PATH,
  TOKEN_COOKIE,
} from "./modules/auth/frontend/services/route-access";

const VALID_ROLES = new Set(["administrador", "empresa", "titulado"]);

// Las pantallas privadas nunca deben guardarse en la caché del navegador (CA-05.1 y CA-05.6)
const NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";

// Variable exclusiva del servidor cuando exista; la pública conserva compatibilidad.
const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (!token || !API_URL) return redirect(LOGIN_PATH);

  try {
    const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return redirect(LOGIN_PATH);
    const body: unknown = await response.json();
    const payload = body as { data?: { role?: unknown } } | null;
    const role = payload?.data?.role;
    if (typeof role !== "string" || !VALID_ROLES.has(role)) {
      return redirect(LOGIN_PATH);
    }

    // Solo el rol verificado por el backend participa en la autorización.
    const decision = decideAccess(pathname, token, role);
    const res = decision.allowed ? NextResponse.next() : redirect(decision.redirectTo);
    res.headers.set("Cache-Control", NO_STORE);
    return res;
  } catch {
    // API caída o respuesta inválida: nunca se concede acceso por defecto.
    return redirect(LOGIN_PATH);
  }
}

export const config = {
  matcher: [
    "/applications/:path*",
    "/me/:path*",
    "/afinidad",
    "/afinidad/:path*",
    "/empresa/postulantes",
    "/empresa/postulantes/:path*",
    "/postulantes",
    "/postulantes/:path*",
  ],
};