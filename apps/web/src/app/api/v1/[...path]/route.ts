import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
const MODULES = new Set([
  'auth', 'user', 'companies', 'job-postings', 'registrations', 'applications',
  'email-verification', 'documents', 'perfil', 'events', 'mentorship', 'reports',
  'nlp', 'radar',
]);

async function proxy(request: NextRequest, context: { params: { path: string[] } }): Promise<Response> {
  const segments = context.params.path;
  if (!MODULES.has(segments[0])) return Response.json({ error: { code: 'NOT_FOUND', message: 'Ruta no disponible' } }, { status: 404 });
  const origin = request.headers.get('origin');
  if (!['GET', 'HEAD'].includes(request.method)
    && ((origin && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site')) {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'Origen no permitido' } }, { status: 403 });
  }
  const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const headers = new Headers();
  for (const name of ['authorization', 'cookie', 'content-type', 'x-csrf-token', 'user-agent', 'origin']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/api/v1/${segments.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, {
      method: request.method, headers, cache: 'no-store', redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: await request.arrayBuffer() } : {}),
    });
    const outgoing = new Headers({ 'Cache-Control': 'no-store' });
    const contentType = upstream.headers.get('content-type');
    if (contentType) outgoing.set('Content-Type', contentType);
    const disposition = upstream.headers.get('content-disposition');
    if (disposition) outgoing.set('Content-Disposition', disposition);
    for (const cookie of upstream.headers.getSetCookie()) outgoing.append('Set-Cookie', cookie);
    const retry = upstream.headers.get('retry-after');
    if (retry) outgoing.set('Retry-After', retry);
    return new Response(upstream.body, { status: upstream.status, headers: outgoing });
  } catch {
    return Response.json({ error: { code: 'BACKEND_UNAVAILABLE', message: 'No fue posible conectar con el servidor' } }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
export const PUT = proxy;
export const PATCH = proxy;
