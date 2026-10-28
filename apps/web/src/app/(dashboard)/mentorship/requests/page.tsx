import Link from 'next/link';
import { PageLayout } from '@/shared/components/page-layout';

export default function MentorshipRequestsInboxRoute() {
  return (
    <main className="mentorship-shell mentor-availability-shell">
      <PageLayout
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Mentorías', href: '/mentorship' },
          { label: 'Mis solicitudes' },
        ]}
        eyebrow="Red universitaria de desarrollo"
        title="Mis solicitudes"
        description="Aquí verás el estado de tus solicitudes de mentoría."
      >
        <p className="mentor-request-empty">
          La bandeja de solicitudes estará disponible en una próxima versión. Tus solicitudes enviadas quedan registradas en estado Pendiente.
        </p>
        <Link href="/mentorship/directory" className="mentor-button mentor-button-secondary">Volver al directorio</Link>
      </PageLayout>
    </main>
  );
}
