import {
  APPLICATION_PAGE_SIZES,
  applicationTotalPages,
  DEFAULT_APPLICATION_PAGE_SIZE,
  isApplicationPageSize,
} from './application-pagination.policy';
 
describe('application-pagination.policy', () => {
  it('usa 15 filas por defecto, que es un tamaño permitido', () => {
    expect(DEFAULT_APPLICATION_PAGE_SIZE).toBe(15);
    expect(isApplicationPageSize(DEFAULT_APPLICATION_PAGE_SIZE)).toBe(true);
  });
 
  it.each(APPLICATION_PAGE_SIZES)('permite %i filas por página (CA-08.2)', (size) => {
    expect(isApplicationPageSize(size)).toBe(true);
  });
 
  it.each([0, 1, 5, 20, 99, 100])('rechaza %i filas por página', (size) => {
    expect(isApplicationPageSize(size)).toBe(false);
  });
 
  it.each([
    [0, 15, 1],
    [15, 15, 1],
    [16, 15, 2],
    [60, 25, 3],
    [51, 50, 2],
  ])('con %i resultados y %i filas hay %i páginas', (total, pageSize, expected) => {
    expect(applicationTotalPages(total, pageSize)).toBe(expected);
  });
});
 
