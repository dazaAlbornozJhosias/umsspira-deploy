export const APPLICATION_PAGE_SIZES = [10, 15, 25, 50] as const;
export const DEFAULT_APPLICATION_PAGE_SIZE = 15;
 
export function isApplicationPageSize(value: number): boolean {
  return (APPLICATION_PAGE_SIZES as readonly number[]).includes(value);
}
 
// Siempre hay al menos una página, aunque no existan resultados.
export function applicationTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
 
