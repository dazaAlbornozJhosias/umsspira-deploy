// Destino de regreso recibido por URL (por ejemplo returnTo=/afinidad desde la Épica 3).
// Solo se aceptan rutas internas para no redirigir a otro sitio (evita open redirect)
export function rutaDeRegreso(valor: string | undefined): string | undefined {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return undefined;
  return valor;
}
