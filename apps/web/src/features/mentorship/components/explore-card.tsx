import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

export function ExploreCard({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <article className="mentor-card">
      <span aria-hidden="true" className="mentor-card-icon">
        <Icon className="icon-lg" />
      </span>
      <h2 className="mentor-card-title">Encuentra un mentor</h2>
      <p className="mentor-card-description">
        Explora mentores de la comunidad UMSS según sus áreas de especialidad e intereses de mentoría.
      </p>
      <div className="mentor-card-actions">
        <Link
          href="/mentorship/directory"
          className="mentor-button mentor-button-secondary mentor-card-button"
        >
          Explorar mentores
          <ArrowRightIcon className="icon" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
