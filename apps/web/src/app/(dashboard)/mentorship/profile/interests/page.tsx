import { PageLayout } from '@/shared/components/page-layout';
import { MentorInterestsDemo } from '@/features/mentorship/components/mentor-interests-demo';
import { MentorInterestsConnected } from '@/features/mentorship/components/mentor-interests-connected';
import '@/features/mentorship/mentor-interests.css';

export default function MentorInterestsPage({ searchParams }: { searchParams: { demo?: string } }) {
  const demo = process.env.NODE_ENV !== 'production' && searchParams.demo === '1';
  return <div className="interests-page"><main className="mentorship-shell"><PageLayout
    breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Mentorías', href: '/mentorship' }, { label: 'Mi perfil de mentor', href: '/mentorship/profile' }, { label: 'Áreas técnicas', href: '/mentorship/profile/areas' }, { label: 'Configurar intereses específicos' }]}
    eyebrow="Red universitaria de desarrollo" title="Intereses específicos de mentoría"
    description="Gestiona los tópicos y herramientas clave asociados a tus áreas técnicas para orientar las consultas y solicitudes de orientación de los estudiantes.">
    {demo ? <MentorInterestsDemo /> : <MentorInterestsConnected />}
  </PageLayout></main></div>;
}
