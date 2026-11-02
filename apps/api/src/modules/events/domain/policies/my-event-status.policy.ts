import type { MyEventRegistration } from '../entities/my-event-registration';

export type ParticipationStatus =
  | 'VIGENTE'
  | 'INSCRIPCION_CANCELADA'
  | 'EVENTO_CANCELADO'
  | 'FINALIZADO';

export type MyEventListItem = MyEventRegistration & {
  participationStatus: ParticipationStatus;
};

export function participationStatus(
  item: MyEventRegistration,
  now: Date,
): ParticipationStatus {
  if (item.event.status === 'CANCELADO') {
    return 'EVENTO_CANCELADO';
  }
  if (item.status === 'CANCELADA') {
    return 'INSCRIPCION_CANCELADA';
  }
  if (item.event.endDate <= now) {
    return 'FINALIZADO';
  }
  return 'VIGENTE';
}

export function withParticipationStatus(
  items: MyEventRegistration[],
  now: Date,
): MyEventListItem[] {
  return items
    .map((item) => ({ ...item, participationStatus: participationStatus(item, now) }))
    .sort((a, b) => a.event.startDate.getTime() - b.event.startDate.getTime());
}