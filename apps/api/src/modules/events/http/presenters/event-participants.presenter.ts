import type { EventParticipants } from '../../domain/entities/event-participants';

export function presentEventParticipants(result: EventParticipants) {
  return {
    eventId: result.eventId,
    eventTitle: result.eventTitle,
    occupation: result.occupation,
    participants: result.participants.map((participant) => ({
      registrationId: participant.registrationId,
      name: participant.name,
      status: participant.status,
      registeredAt: participant.registeredAt.toISOString(),
      passStatus: participant.passStatus,
    })),
  };
}