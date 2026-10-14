import { redirect } from 'next/navigation';

// La Épica 3 (afinidad) envía aquí al titulado desde "Añadir certificaciones"
// (/epica-2/certificaciones/nueva?returnTo=/afinidad). La Épica 2 no tiene una pantalla aparte para
// una certificación nueva: se agrega en el formulario de completar perfil, por eso se redirige ahí.
export default function NuevaCertificacionPage() {
  redirect('/profile/completar');
}
