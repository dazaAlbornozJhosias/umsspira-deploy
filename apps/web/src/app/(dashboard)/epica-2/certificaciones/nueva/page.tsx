import { redirect } from 'next/navigation';

import { rutaDeRegreso } from '@/modules/profile/utils/return-to';

// La Épica 3 (afinidad) envía aquí al titulado desde "Añadir certificaciones"
// (/epica-2/certificaciones/nueva?returnTo=/afinidad). La Épica 2 no tiene una pantalla aparte para
// una certificación nueva: se agrega en el formulario de completar perfil, por eso se redirige ahí
// abriendo Certificaciones y conservando el destino de regreso (E2.3).
export default function NuevaCertificacionPage({ searchParams }: { searchParams?: { returnTo?: string } }) {
  const returnTo = rutaDeRegreso(searchParams?.returnTo);
  const params = new URLSearchParams({ seccion: 'certificaciones' });
  if (returnTo) params.set('returnTo', returnTo);
  redirect(`/profile/completar?${params.toString()}`);
}
