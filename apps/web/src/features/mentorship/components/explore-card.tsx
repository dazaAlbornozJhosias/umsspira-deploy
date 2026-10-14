import type { ComponentType } from 'react';
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
        <button
          type="button"
          disabled
          aria-describedby="explore-availability"
          className="mentor-button mentor-button-secondary mentor-card-button"
        >
          Explorar mentores
          <ArrowRightIcon className="icon" aria-hidden="true" />
        </button>
        <p id="explore-availability" className="mentor-card-notice">
          El directorio de mentores estará disponible en una próxima versión.
        </p>
      </div>
    </article>
  );
}
