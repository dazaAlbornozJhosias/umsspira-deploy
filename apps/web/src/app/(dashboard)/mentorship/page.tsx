import Link from 'next/link';
import Image from 'next/image';
import { HomeIcon, ArrowRightIcon, CompassIcon, UserRoundCogIcon } from 'lucide-react';
import { ExploreCard } from '@/features/mentorship/components/explore-card';

export default function MentoriasPage() {
  return (
    <main className="mentorship-shell">
      <nav aria-label="Ruta de navegación" className="mentorship-breadcrumb">
        <ol className="breadcrumb-list">
          <li><Link href="/" className="breadcrumb-link"><HomeIcon aria-hidden="true" className="icon" />Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="breadcrumb-current">Mentorías</li>
        </ol>
      </nav>
      <section aria-labelledby="mentorship-title" className="mentorship-hero">
        <Image src="/mentorship-cover.jpg" alt="" fill priority sizes="(max-width: 1152px) 100vw, 1152px" className="mentorship-cover" />
        <div aria-hidden="true" className="mentorship-overlay" />
        <div className="mentorship-hero-content">
        <p className="mentorship-eyebrow">
          <span aria-hidden="true" className="mentorship-eyebrow-dot" />
          Red universitaria de desarrollo
        </p>
        <h1 id="mentorship-title" className="mentorship-title">
          Mentorías
        </h1>
        <p className="mentorship-quote">“Aprende de quienes ya recorrieron el camino”</p>
        <p className="mentorship-intro">
          Conecta con profesionales de la comunidad UMSS, aprende de su experiencia o comparte la tuya.
        </p>
        </div>
      </section>

      <div className="mentorship-cards">
        <ExploreCard icon={CompassIcon} />

        <article className="mentor-card">
          <span aria-hidden="true" className="mentor-card-icon mentor-card-icon-primary">
            <UserRoundCogIcon className="icon-lg" />
          </span>
          <h2 className="mentor-card-title">Comparte tu experiencia</h2>
          <p className="mentor-card-description">
            Activa tu participación como mentor y configura las áreas e intereses en los que deseas orientar a otros miembros de la comunidad.
          </p>
          <div className="mentor-card-actions">
            <Link
              href="/mentorship/profile"
              className="mentor-button mentor-button-primary mentor-card-button"
            >
              Configurar mi perfil de mentor
              <ArrowRightIcon className="icon" aria-hidden="true" />
            </Link>
            <p aria-hidden="true" className="mentor-card-notice" />
          </div>
        </article>
      </div>
    </main>
  );
}
