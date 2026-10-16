import { rutaDeRegreso } from './return-to';

describe('rutaDeRegreso', () => {
  it('acepta rutas internas', () => {
    expect(rutaDeRegreso('/afinidad')).toBe('/afinidad');
  });

  it('rechaza destinos externos o vacíos', () => {
    for (const valor of [undefined, '', 'https://sitio.com', '//sitio.com', '/\\sitio.com']) {
      expect(rutaDeRegreso(valor)).toBeUndefined();
    }
  });
});
