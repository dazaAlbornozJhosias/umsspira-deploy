// Navegación completa: limpia la memoria de Next y reemplaza la entrada actual del historial
export function hardRedirect(path: string): void {
  window.location.replace(path);
}