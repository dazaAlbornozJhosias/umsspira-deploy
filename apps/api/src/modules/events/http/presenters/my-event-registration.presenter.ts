import type { MyEventListItem } from '../../domain/policies/my-event-status.policy';

export function presentMyEventRegistration(item: MyEventListItem) {
  return {
    id: item.id,
    status: item.status,
    participationStatus: item.participationStatus,
    registeredAt: item.registeredAt.toISOString(),
    hasPass: item.hasPass,
    event: {
      id: item.event.id,
      title: item.event.title,
      startDate: item.event.startDate.toISOString(),
      endDate: item.event.endDate.toISOString(),
      location: item.event.location,
      status: item.event.status,
    },
  };
}