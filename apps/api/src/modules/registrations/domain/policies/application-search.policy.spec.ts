import { MAX_SEARCH_TERMS, searchTerms } from './application-search.policy';

describe('searchTerms', () => {
  it('recorta y colapsa espacios dobles y espacios no separables', () => {
    expect(searchTerms('  Alejandro  \u00a0 Rojas   Torrico  ')).toEqual(['Alejandro', 'Rojas', 'Torrico']);
  });

  it('separa tabulaciones y saltos de linea', () => {
    expect(searchTerms('Alejandro\tRojas\nTorrico')).toEqual(['Alejandro', 'Rojas', 'Torrico']);
  });

  it('elimina palabras repetidas sin distinguir mayusculas', () => {
    expect(searchTerms('Rojas rojas ALEJANDRO Alejandro')).toEqual(['Rojas', 'ALEJANDRO']);
  });

  it('limita la busqueda a seis palabras distintas', () => {
    expect(MAX_SEARCH_TERMS).toBe(6);
    expect(searchTerms('uno dos tres cuatro cinco seis siete ocho')).toEqual([
      'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    ]);
  });

  it('devuelve un arreglo vacio si solo hay espacios', () => {
    expect(searchTerms('  \t\u00a0\n  ')).toEqual([]);
    expect(searchTerms('')).toEqual([]);
  });
});
