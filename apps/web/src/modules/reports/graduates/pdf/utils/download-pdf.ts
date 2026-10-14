// Descarga el mismo PDF de la vista previa con su nombre: reporte-titulados-ESTADO-AAAAMMDD.pdf
export function downloadPdf(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera más tarde: algunos navegadores (Safari) cancelan la descarga si se libera en el acto
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
