import Link from 'next/link';
import { BrainCogIcon, CalendarDaysIcon, ContactIcon, MessagesSquareIcon } from 'lucide-react';
import { SecondaryButton } from './mentor-button';
import { MentorAreasEditor } from './mentor-areas-editor';

const options = [
  { title: 'Áreas técnicas', description: 'Define las áreas técnicas en las que puedes brindar orientación.', icon: BrainCogIcon, action: 'Configurar áreas' },
  { title: 'Intereses de mentoría', description: 'Selecciona los temas específicos sobre los que deseas orientar.', icon: MessagesSquareIcon, action: 'Configurar intereses' },
  { title: 'Disponibilidad', description: 'Indica si puedes atender nuevas solicitudes de orientación.', icon: CalendarDaysIcon, action: 'Configurar disponibilidad' },
  { title: 'Información del perfil', description: 'Presenta tu descripción, experiencia e información relevante para la mentoría.', icon: ContactIcon, action: 'Agregar información' },
];

/** Estructura visual permanente; estas acciones configuran el perfil del mentor. */
export function MentorConfiguration() {
  return (
    <section className="active-panel-settings" aria-labelledby="mentor-configuration-title">
      <h3 id="mentor-configuration-title" className="active-panel-section-title">Configuración del perfil</h3>
      <div className="active-panel-options">
        {options.map(({ title, description, icon: Icon, action }) => (
          <article
            key={title}
            className={`mentor-card active-panel-option${title === 'Áreas técnicas' ? ' active-panel-option-areas' : ''}`}
          >
            <div className="active-panel-option-top">
              <span aria-hidden="true" className="mentor-card-icon">
                <Icon className="icon-lg" />
              </span>
              {title !== 'Áreas técnicas' && title !== 'Información del perfil' && title !== 'Disponibilidad' && (
                <span className="active-panel-option-status">
                  {action === 'Configurar intereses' ? 'Intereses de mentoría' : 'Próximamente'}
                </span>
              )}
            </div>
            <h4
              id={title === 'Áreas técnicas' ? 'mentor-areas-title' : undefined}
              className="mentor-card-title active-panel-option-title"
            >
              {title}
            </h4>
            <p className="mentor-card-description">{description}</p>
            {title === 'Áreas técnicas' ? (
              <MentorAreasEditor />
            ) : action === 'Configurar intereses' ? (
              <div className="active-panel-option-action">
                <Link href="/mentorship/profile/interests" className="mentor-button mentor-button-secondary">
                  {action}
                </Link>
              </div>
              ) : title === 'Disponibilidad' ? (
              <div className="active-panel-option-action">
                <Link href="/mentorship/profile/availability" className="mentor-button mentor-button-secondary">
                  {action}
                </Link>
              </div>
            ) : title === 'Información del perfil' ? (
              <div className="active-panel-option-action">
                <Link href="/mentorship/profile/information" className="mentor-button mentor-button-secondary">
                  {action}
                </Link>
              </div>
            ) : (
              <div className="active-panel-option-action">
                <SecondaryButton disabled>{action}</SecondaryButton>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
