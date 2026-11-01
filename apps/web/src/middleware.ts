import { NextResponse, type NextRequest } from 'next/server';
import { decideAccess, LOGIN_PATH } from './modules/auth/frontend/services/route-access';

const VALID_ROLES = new Set(['administrador', 'empresa', 'titulado']);
const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';



export async function middleware(request: NextRequest) {
  // HU-10: el enlace de corrección se valida con el token, no con la sesión
  if (request.nextUrl.pathname.startsWith('/applications/correct/')) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  const isReport = path === '/reports' || path.startsWith('/reports/');
  // Sprint 2 T4.1: las encuestas son privadas para el rol titulado.
  const isSurvey = path === '/surveys' || path.startsWith('/surveys/');
  const refresh = request.cookies.get('umsspira_refresh')?.value;
  const redirect = (destination: string) => NextResponse.redirect(new URL(destination, request.url));
  // HU-004: conservar el motivo para explicar al visitante por qué fue redirigido.
  const loginDestination = isReport ? '/login?reportes=requiere-sesion' : LOGIN_PATH;
  if (!refresh) return redirect(loginDestination);
  try {
    // Consultar la sesión sin rotarla permite navegaciones paralelas.
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/v1/auth/session`, {
      headers: { Cookie: `umsspira_refresh=${encodeURIComponent(refresh)}` },
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 403) {
      // La sesión ya no es válida: eliminar cookies de autenticación, no solo redirigir.
      const expired = redirect(loginDestination);
      for (const name of ['umsspira_token', 'umsspira_refresh', 'umsspira_csrf', 'umsspira_role']) {
        expired.cookies.delete(name);
      }
      expired.headers.set('Cache-Control', 'no-store');
      return expired;
    }
    if (!response.ok) throw new Error('Servicio no disponible');
    const body = await response.json() as { data?: { role?: unknown } };
    const role = body.data?.role;
    if (typeof role !== 'string' || !VALID_ROLES.has(role)) return redirect(loginDestination);
    const decision = decideAccess(path, 'sesion-verificada', role);
    const forbiddenDestination = isReport && !decision.allowed && role === 'titulado'
      ? '/portal?acceso=reportes-no-autorizado'
      : null;
    const result = decision.allowed
      ? NextResponse.next()
      : redirect(forbiddenDestination ?? decision.redirectTo);
    result.headers.set('Cache-Control', 'no-store');
    return result;
  } catch {
    if (isReport) {
      // No continuar hacia una vista privada si el estado de sesión es desconocido.
      // Reescribir a una pantalla estática que conserva el layout, sin reportes.
      const unavailable = NextResponse.rewrite(
        new URL('/reportes-no-disponibles', request.url),
        { status: 503 },
      );
      unavailable.headers.set('Cache-Control', 'no-store');
      return unavailable;
    }
    return new NextResponse('No se pudo verificar la sesión. Inténtalo nuevamente.', {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}

export const config = { matcher: [
  '/applications/:path*', '/reports/:path*', '/surveys/:path*', '/me/:path*', '/afinidad', '/afinidad/:path*',
  '/empresa/postulantes', '/empresa/postulantes/:path*', '/postulantes', '/postulantes/:path*',
] };