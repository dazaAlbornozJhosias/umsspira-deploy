// PDF de ejemplo (apps/web/public/respaldos/respaldo.pdf): es el archivo propio de los registros de prueba.
// Los respaldos que adjunta el usuario abren su propio archivo (backupUrl de cada registro).
export const SAMPLE_BACKUP_URL = '/respaldos/respaldo.pdf';

// Dirección local del archivo que el usuario acaba de elegir, para abrir su propio respaldo (E2.2)
export function urlDeArchivo(archivo: File | null | undefined): string | undefined {
  if (!archivo || typeof URL.createObjectURL !== 'function') return undefined;
  return URL.createObjectURL(archivo);
}
