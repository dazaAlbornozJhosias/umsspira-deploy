import { BadRequestException } from '@nestjs/common';
import { FileValidatorService } from './file-validator.service';
import { DOCUMENT_MESSAGES, MAX_DOCUMENT_SIZE_BYTES } from '../contracts/document.constants';
import { UploadedDocumentFile } from '../contracts/uploaded-document-file';

const PDF_BYTES = Buffer.from('%PDF-1.7\n%contenido de prueba', 'latin1');
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const JPG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function buildFile(originalname: string, buffer: Buffer, size = buffer.length): UploadedDocumentFile {
  return { originalname, buffer, size, mimetype: 'application/octet-stream' };
}

describe('FileValidatorService', () => {
  const validator = new FileValidatorService();

  function expectRejected(file: UploadedDocumentFile) {
    try {
      validator.validate(file);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: DOCUMENT_MESSAGES.invalidFile,
        errors: [{ field: 'archivo', message: DOCUMENT_MESSAGES.invalidFile }],
      });
      return;
    }
    throw new Error('Se esperaba que el archivo fuera rechazado');
  }

  it.each([
    ['titulo.pdf', PDF_BYTES, 'application/pdf', 'pdf'],
    ['diploma.PNG', PNG_BYTES, 'image/png', 'png'],
    ['certificado.jpg', JPG_BYTES, 'image/jpeg', 'jpg'],
    ['certificado.jpeg', JPG_BYTES, 'image/jpeg', 'jpg'],
  ])('acepta %s por su contenido real', (name, bytes, mimeType, extension) => {
    expect(validator.validate(buildFile(name, bytes))).toEqual({ mimeType, extension });
  });

  it('acepta un archivo de exactamente 5 MB', () => {
    expect(validator.validate(buildFile('titulo.pdf', PDF_BYTES, MAX_DOCUMENT_SIZE_BYTES)).extension).toBe('pdf');
  });

  it('rechaza un archivo de mas de 5 MB (CA-03.3)', () => {
    expectRejected(buildFile('titulo.pdf', PDF_BYTES, MAX_DOCUMENT_SIZE_BYTES + 1));
  });

  it('rechaza un archivo vacio', () => {
    expectRejected(buildFile('titulo.pdf', Buffer.alloc(0)));
  });

  it('rechaza una extension no permitida aunque el contenido sea PDF', () => {
    expectRejected(buildFile('titulo.docx', PDF_BYTES));
  });

  it('rechaza un archivo sin extension', () => {
    expectRejected(buildFile('titulo', PDF_BYTES));
  });

  it('rechaza un archivo renombrado a .pdf cuyo contenido real no es PDF (CA-03.3)', () => {
    expectRejected(buildFile('virus.pdf', Buffer.from('MZ ejecutable disfrazado', 'latin1')));
  });

  it('rechaza una imagen PNG renombrada como .jpg', () => {
    expectRejected(buildFile('foto.jpg', PNG_BYTES));
  });
});
