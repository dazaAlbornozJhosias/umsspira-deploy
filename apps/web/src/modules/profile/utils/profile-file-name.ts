/** Fecha local en formato AAAA-MM-DD. */
export function formatExportDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Convierte el nombre a minúsculas, sin tildes y con guiones bajos: "Carlos Mendoza Ríos" -> "carlos_mendoza_rios". */
export function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Nombre del archivo exportado: perfil_[nombre_egresado]_[fecha_exportacion].json */
export function buildProfileFileName(name: string, date: Date): string {
  // Sin nombre registrado se usa "egresado" para no dejar el archivo como "perfil__fecha.json"
  return `perfil_${slugifyName(name) || 'egresado'}_${formatExportDate(date)}.json`;
}
