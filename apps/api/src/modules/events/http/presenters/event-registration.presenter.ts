import type { EventRegistration } from '../../domain/entities/event-registration';

export function presentEventRegistration(registration: EventRegistration) {
  return {
    id: registration.id,
    eventId: registration.eventId,
    status: registration.status,
    registeredAt: registration.registeredAt.toISOString(),
    currentCapacity: registration.currentCapacity,
  };
}
