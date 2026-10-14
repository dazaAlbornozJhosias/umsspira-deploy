let printFrame: HTMLIFrameElement | null = null;
let printUrl: string | null = null;

// Quita el iframe de impresión y libera el archivo. La vista previa lo llama al cerrarse.
export function disposePrintFrame(): void {
  printFrame?.remove();
  if (printUrl) URL.revokeObjectURL(printUrl);
  printFrame = null;
  printUrl = null;
}

// Abre la ventana de impresión del navegador con todas las páginas del PDF.
// Usa un iframe oculto con el mismo archivo de la vista previa.
export function printPdf(file: Blob): void {
  // Un solo iframe aunque se pulse Imprimir varias veces
  disposePrintFrame();

  const url = URL.createObjectURL(file);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // El navegador no permite imprimir desde el iframe: queda la opción Descargar
    }
  };

  document.body.appendChild(iframe);
  printFrame = iframe;
  printUrl = url;
}
