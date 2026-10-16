import { redirect } from 'next/navigation';

/**
 * Redirige /postulantes a la vista canónica de postulantes y reclutador.
 */
export default function PostulantesPage() {
  redirect('/afinidad/reclutador');
}
