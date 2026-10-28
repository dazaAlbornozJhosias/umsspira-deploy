export function formatAvailableEventsCount(count: number): string {
  return count === 1
    ? '1 evento disponible'
    : `${count} eventos disponibles`;
}

export function formatPeopleCount(count: number): string {
  return count === 1 ? '1 persona' : `${count} personas`;
}
