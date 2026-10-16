import { AcordeonPerfil } from '@/modules/profile/completar/acordeon-perfil';
import { rutaDeRegreso } from '@/modules/profile/utils/return-to';

export default function PerfilPage({ searchParams }: { searchParams?: { returnTo?: string } }) {
  return <AcordeonPerfil returnTo={rutaDeRegreso(searchParams?.returnTo)} />;
}
