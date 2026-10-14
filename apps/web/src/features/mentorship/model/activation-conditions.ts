import { BadgeCheckIcon, type LucideIcon } from 'lucide-react';
import type { ConditionId, Requirements } from '@umsspira/shared-types';

interface ActivationCondition {
  id: ConditionId;
  icon: LucideIcon;
  title: string;
  metDescription: string;
  pendingDescription: string;
  metStatus: string;
  pendingStatus: string;
}

export const activationConditions = [
  {
    id: 'egresado',
    icon: BadgeCheckIcon,
    title: 'Condición de titulado aprobado',
    metDescription: 'Tu condición de titulado está aprobada en la plataforma.',
    pendingDescription: 'Tu condición de titulado aún está pendiente de aprobación.',
    metStatus: 'Aprobado',
    pendingStatus: 'Pendiente de aprobación',
  },
] satisfies ActivationCondition[];

export function getActivationEligibility(requirements: Requirements) {
  const pending = activationConditions.filter(condition => !requirements[condition.id]);
  return {
    total: activationConditions.length,
    metCount: activationConditions.length - pending.length,
    eligible: pending.length === 0,
    pending,
  };
}
