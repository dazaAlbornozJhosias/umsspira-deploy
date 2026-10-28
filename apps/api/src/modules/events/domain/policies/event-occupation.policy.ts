import type { EventOccupation } from '../entities/event-participants';

export function buildOccupation(
  maxCapacity: number,
  confirmed: number,
  cancelled: number,
): EventOccupation {
  return {
    maxCapacity,
    confirmed,
    cancelled,
    available: Math.max(maxCapacity - confirmed, 0),
    occupancyPercent: maxCapacity > 0 ? Math.round((confirmed / maxCapacity) * 100) : 0,
  };
}