import { sanitizeGraduateSearchInput } from './graduate-search-input';

describe('sanitizeGraduateSearchInput (Bug 4)', () => {
  it('colapsa espacios repetidos entre palabras', () => {
    expect(sanitizeGraduateSearchInput('Mariana    Elena')).toBe('Mariana Elena');
  });

  it('quita los espacios iniciales', () => {
    expect(sanitizeGraduateSearchInput('   Ana')).toBe('Ana');
  });

  it('conserva un espacio final para seguir escribiendo', () => {
    expect(sanitizeGraduateSearchInput('Mariana ')).toBe('Mariana ');
  });
});
