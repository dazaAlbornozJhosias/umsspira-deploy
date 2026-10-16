import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';

// La navegación global la monta el layout del dashboard (navbar compartida de Epic 8);
// aquí solo van el estado compartido del perfil y el ancho del contenido
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-palladian font-sans text-blue-fantastic">
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-8 pt-6 lg:px-10">
        <ProfileStoreProvider>{children}</ProfileStoreProvider>
      </main>
    </div>
  );
}
