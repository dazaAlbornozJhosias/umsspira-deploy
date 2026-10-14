import { profileHeader } from '@/modules/profile/data/profile-data';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import { DashboardShell } from '@/shared/components/dashboard-shell';

// Todas las pantallas del perfil comparten la barra lateral, la barra superior (formato Epic 8)
// y el mismo estado de datos de prueba
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-palladian font-sans text-blue-fantastic">
      <DashboardShell activeHref="/profile" userName={profileHeader.name} userRole="Egresado">
        <ProfileStoreProvider>{children}</ProfileStoreProvider>
      </DashboardShell>
    </div>
  );
}
