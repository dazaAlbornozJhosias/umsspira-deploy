import PdfPrinter from 'pdfmake';

// Se guarda un PDF real en PostgreSQL para probar la lectura documental sin Storage externo.
export async function demoDocument(fullName: string): Promise<Buffer> {
  const printer = new PdfPrinter({
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  });
  return new Promise((resolve, reject) => {
    const document = printer.createPdfKitDocument({
      defaultStyle: { font: 'Helvetica' },
      content: [
        { text: 'UMSSPIRA - Documento de demostración', bold: true, fontSize: 18 },
        { text: fullName, margin: [0, 24, 0, 12] },
        'Este archivo contiene datos ficticios para probar el backoffice documental.',
        'No acredita estudios ni tiene validez académica.',
      ],
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.end();
  });
}
