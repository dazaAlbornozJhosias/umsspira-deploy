import { attachmentMetadata, MAX_ATTACHMENT_BYTES } from './attachment.policy';

describe('Adjuntos de chat', () => {
  it('valida la firma del documento y limpia rutas del nombre', () => {
    const bytes = new TextEncoder().encode('%PDF-1.4\nDocumento');
    expect(attachmentMetadata('../CV.pdf', bytes)).toEqual({
      name: 'CV.pdf',
      mime: 'application/pdf',
      size: bytes.length,
    });
  });
  it('rechaza archivos ejecutables renombrados, ZIP genéricos y archivos vacíos', () => {
    for (const [name, bytes] of [
      ['CV.pdf', new Uint8Array([0x4d, 0x5a])],
      ['CV.docx', new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
      ['CV.pdf', new Uint8Array()],
    ] as const) {
      expect(() => attachmentMetadata(name, bytes)).toThrow();
    }
  });
  it('rechaza documentos por encima de 10 MB', () => {
    const bytes = new Uint8Array(MAX_ATTACHMENT_BYTES + 1);
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(() => attachmentMetadata('CV.pdf', bytes)).toThrow();
  });
});
