import { BadRequestException } from '@nestjs/common';
import { ArchivoRespaldoPipe, TAMANIO_MAXIMO_BYTES } from './archivo-respaldo.pipe';

const JPG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const PDF = [0x25, 0x50, 0x44, 0x46];

function archivo(mimetype: string, originalname: string, bytes: number[], size = bytes.length): Express.Multer.File {
  return { mimetype, originalname, buffer: Buffer.from(bytes), size } as Express.Multer.File;
}

describe('ArchivoRespaldoPipe (solo JPG)', () => {
  const pipe = new ArchivoRespaldoPipe();

  it('acepta un JPG (.jpg o .jpeg)', () => {
    const a = archivo('image/jpeg', 'titulo.jpg', JPG);
    const b = archivo('image/jpeg', 'TITULO.JPEG', JPG);
    expect(pipe.transform(a)).toBe(a);
    expect(pipe.transform(b)).toBe(b);
  });

  it('sin archivo no falla (sin respaldo)', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it.each([
    ['PNG', archivo('image/png', 'titulo.png', PNG)],
    ['PDF', archivo('application/pdf', 'titulo.pdf', PDF)],
  ])('rechaza un %s con "Solo JPG"', (_nombre, a) => {
    expect(() => pipe.transform(a)).toThrow(BadRequestException);
    expect(() => pipe.transform(a)).toThrow('Formato no permitido. Solo JPG');
  });

  it('rechaza un PNG renombrado como .jpg (se mira el contenido)', () => {
    expect(() => pipe.transform(archivo('image/jpeg', 'falso.jpg', PNG))).toThrow(BadRequestException);
  });

  it('rechaza un JPG de más de 5 MB', () => {
    expect(() => pipe.transform(archivo('image/jpeg', 'grande.jpg', JPG, TAMANIO_MAXIMO_BYTES + 1))).toThrow(
      'El archivo no puede superar 5 MB',
    );
  });
});
