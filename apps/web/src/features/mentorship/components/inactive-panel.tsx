import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, GraduationCapIcon, LockIcon, ShieldCheckIcon, BrainCogIcon, MessagesSquareIcon, CalendarDaysIcon } from 'lucide-react';
import type { Requirements } from '@umsspira/shared-types';
import { getActivationEligibility } from '../model/activation-conditions';
import { ApprovedChip } from './approved-chip';
import { StatusBadge } from './status-badge';
import { PrimaryButton } from './mentor-button';
import { RequirementsList } from './requirements-list';
import { MentorConfiguration } from './mentor-configuration';
import { MentorAreasEditor } from './mentor-areas-editor';

const previews = [
  { title: 'Configura tus áreas', description: 'Define las áreas técnicas en las que puedes brindar orientación.', icon: BrainCogIcon },
  { title: 'Define tus intereses', description: 'Selecciona los temas específicos sobre los que deseas orientar.', icon: MessagesSquareIcon },
  { title: 'Configura tu disponibilidad', description: 'Indica cuándo puedes participar en mentorías.', icon: CalendarDaysIcon },
];

interface InactivePanelProps {
  requirements: Requirements | null;
  activating: boolean;
  onActivate: () => void;
}

export function InactivePanel({ requirements, activating, onActivate }: InactivePanelProps) {
  const eligibility = requirements ? getActivationEligibility(requirements) : null;
  const eligible = eligibility?.eligible ?? false;

  return (
    <section aria-labelledby="inactive-title" className="mentor-card active-panel-card inactive-panel">
      <div className="active-panel-content">
        <div className="active-panel-topbar">
          {requirements ? <><StatusBadge variant="inactive">Inactivo</StatusBadge><ApprovedChip approved={requirements.egresado} /></> : <span>Participación por consultar</span>}
        </div>
        <div className="active-panel-hero">
          <span aria-hidden="true" className="active-panel-hero-icon">{eligible ? <GraduationCapIcon /> : <LockIcon />}</span>
          <h2 id="inactive-title" className="mentor-card-title active-panel-title">{!requirements ? 'Tu participación como mentor' : eligible ? 'Tu participación como mentor está inactiva' : 'Aún no puedes activar tu participación como mentor'}</h2>
          <p className="mentor-card-description active-panel-intro">{!requirements ? 'Consulta tu participación y configura cómo deseas contribuir en la red de mentorías.' : eligible ? 'Activa tu participación para comenzar a configurar cómo deseas contribuir en la red de mentorías.' : 'Revisa los requisitos pendientes. La activación se habilitará cuando todos estén cumplidos.'}</p>
        </div>
        <RequirementsList requirements={requirements} />
        {!requirements && <MentorConfiguration />}
        <section className="inactive-preview" aria-labelledby="activation-preview-title">
          <div className="inactive-section-heading"><h3 id="activation-preview-title">¿Qué ocurre al activar tu participación?</h3><span>Informativo · Próximamente</span></div>
          <div className="inactive-preview-grid">{previews.map(({ title, description, icon: Icon }) => (
            <article className="mentor-card inactive-preview-card" key={title}>
              <span className="mentor-card-icon" aria-hidden="true"><Icon className="icon-lg" /></span>
              <h4 className="mentor-card-title">{title}</h4><p className="mentor-card-description">{description}</p>
              {title === 'Configura tus áreas' && <MentorAreasEditor />}
            </article>
          ))}</div>
        </section>
        <div className="inactive-notice">
          <ShieldCheckIcon aria-hidden="true" />
          <div><p><strong>{!requirements ? 'Esperando información de tu perfil' : eligible ? 'Requisitos cumplidos' : 'Activación no disponible por ahora'}</strong></p>
            <p>{!requirements ? 'Para activar tu participación necesitamos consultar tu estado y verificar tus requisitos.' : eligible ? 'Puedes habilitar tu participación cuando lo desees. Activar tu rol de mentor no crea una cuenta nueva ni modifica tu condición de titulado.' : 'Tu perfil no será visible como mentor mientras no cumplas los requisitos.'}</p>
          </div>
        </div>
      </div>
      <div className="active-panel-footer inactive-footer">
        <Link href="/mentorship" className="inactive-back"><ArrowLeftIcon className="icon" aria-hidden="true" />Volver a Mentorías</Link>
        <div className="inactive-actions">
          <span className={eligible ? 'requirements-met' : undefined}>{eligibility ? `Requisitos cumplidos (${eligibility.metCount}/${eligibility.total})` : 'Requisitos por consultar'}</span>
          <PrimaryButton disabled={!eligible} loading={activating} loadingLabel="Activando…" iconRight={eligible ? ArrowRightIcon : LockIcon} onClick={() => { if (eligible) onActivate(); }} aria-describedby={!eligible ? 'activation-locked-note' : undefined}>Activar como mentor</PrimaryButton>
          {!eligible && <p id="activation-locked-note">{eligibility ? `Pendiente: ${eligibility.pending.map(condition => condition.title).join(', ')}.` : 'Consulta tu perfil antes de activar tu participación.'}</p>}
        </div>
      </div>
    </section>
  );
}
