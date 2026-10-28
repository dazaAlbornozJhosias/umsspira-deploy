import { formatearTamanio } from './format-file-size';

describe('formatearTamanio', () => {
  it('muestra bytes, KB y MB con coma decimal', () => {
    expect(formatearTamanio(500)).toBe('500 B');
    expect(formatearTamanio(1536)).toBe('1,5 KB');
    expect(formatearTamanio(5 * 1024 * 1024)).toBe('5,0 MB');
  });
});