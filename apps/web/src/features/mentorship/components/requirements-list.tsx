import { CheckIcon, ClockIcon, ListChecksIcon } from 'lucide-react';
import type { Requirements } from '@umsspira/shared-types';
import { activationConditions, getActivationEligibility } from '../model/activation-conditions';

export function RequirementsList({ requirements }: { requirements: Requirements | null }) {
  const eligibility = requirements ? getActivationEligibility(requirements) : null;
  return (
    <section className="inactive-requirements" aria-labelledby="requirements-title">
      <div className="inactive-section-heading">
        <h3 id="requirements-title"><ListChecksIcon className="icon" aria-hidden="true" />Requisitos para la activación</h3>
        <span className={eligibility?.eligible ? 'requirements-met' : undefined}>{eligibility ? `${eligibility.metCount} de ${eligibility.total} requisitos cumplidos` : 'Requisitos por consultar'}</span>
      </div>
      <p className="inactive-requirements-intro">Para habilitar tu rol como mentor, el sistema verifica automáticamente los siguientes requisitos:</p>
      <ol className="inactive-requirements-list">{activationConditions.map((condition, index) => {
        const met = requirements?.[condition.id];
        const Icon = condition.icon;
        return (
          <li key={condition.id}>
            <span className="inactive-requirement-icon" aria-hidden="true"><Icon className="icon" /></span>
            <div><h4>{index + 1}. {condition.title}</h4><p>{met === undefined ? 'Se verificará al consultar tu perfil.' : met ? condition.metDescription : condition.pendingDescription}</p></div>
            <span className={`inactive-requirement-status${met ? ' requirements-met' : ''}`}>
              {met ? <CheckIcon className="icon" aria-hidden="true" /> : <ClockIcon className="icon" aria-hidden="true" />}
              {met === undefined ? 'Por consultar' : met ? condition.metStatus : condition.pendingStatus}
            </span>
          </li>
        );
      })}</ol>
    </section>
  );
}
