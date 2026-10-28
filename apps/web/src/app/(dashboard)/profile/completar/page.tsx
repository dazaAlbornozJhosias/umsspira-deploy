import { AcordeonPerfil } from '@/modules/profile/completar/acordeon-perfil';
import { seccionDeUrl } from '@/modules/profile/utils/profile-completeness';
import { rutaDeRegreso } from '@/modules/profile/utils/return-to';

export default function PerfilPage({
  searchParams,
}: {
  searchParams?: { returnTo?: string; seccion?: string };
}) {
  return (
    <AcordeonPerfil
      returnTo={rutaDeRegreso(searchParams?.returnTo)}
      seccionInicial={seccionDeUrl(searchParams?.seccion)}
    />
  );
}
