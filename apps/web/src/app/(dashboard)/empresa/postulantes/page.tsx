import { redirect } from 'next/navigation';

/**
 * Redirige /empresa/postulantes a la vista canónica de postulantes y reclutador.
 */
export default function EmpresaPostulantesPage() {
  redirect('/afinidad/reclutador');
}
