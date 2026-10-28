// Tamaño legible de un archivo: 1536 -> "1,5 KB"; 5 MB -> "5,0 MB"
export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1).replace('.', ',')} KB`;
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
}