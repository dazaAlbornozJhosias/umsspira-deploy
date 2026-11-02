/**
 * Task 4.4 · Bug 4: limpia lo que se escribe en el buscador de titulados.
 * Quita espacios al inicio y colapsa espacios repetidos; conserva un espacio
 * final para poder seguir escribiendo la siguiente palabra.
 */
export function sanitizeGraduateSearchInput(value: string): string {
  return value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
}
