import {
  DEFAULT_PAGE_SIZE,
  EMPTY_URL_STATE,
  changeFilters,
  changePage,
  changePageSize,
  clampPage,
  parseApplicationsUrl,
  toApplicationsParams,
  totalPagesFor,
} from './application-query';

describe('estado de paginación en la URL', () => {
  it('usa valores predeterminados cuando la URL no tiene parámetros', () => {
    expect(parseApplicationsUrl(new URLSearchParams())).toEqual(EMPTY_URL_STATE);
  });

  it('lee página, tamaño y filtros de la URL', () => {
    expect(parseApplicationsUrl(
      new URLSearchParams('page=3&size=25&q=ana&career=Sistemas&status=PENDIENTE'),
    )).toEqual({
      page: 3,
      pageSize: 25,
      search: 'ana',
      career: 'Sistemas',
      status: 'PENDIENTE',
    });
  });

  it('usa valores predeterminados para página, tamaño y estado inválidos', () => {
    const state = parseApplicationsUrl(new URLSearchParams('page=0&size=100&status=unknown'));
    expect(state).toEqual(EMPTY_URL_STATE);
    expect(parseApplicationsUrl(new URLSearchParams('size=10')).pageSize).toBe(10);
    expect(parseApplicationsUrl(new URLSearchParams('size=15')).pageSize).toBe(15);
    expect(parseApplicationsUrl(new URLSearchParams('size=50')).pageSize).toBe(50);
    expect(DEFAULT_PAGE_SIZE).toBe(15);
  });

  it('omite valores predeterminados y conserva los filtros al serializar', () => {
    expect(toApplicationsParams(EMPTY_URL_STATE).toString()).toBe('');
    const state = {
      ...EMPTY_URL_STATE,
      page: 2,
      pageSize: 50,
      search: 'ana',
      career: 'Sistemas',
      status: 'APROBADA' as const,
    };
    const params = toApplicationsParams(state);
    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('50');
    expect(parseApplicationsUrl(params)).toEqual(state);
  });

  it('reinicia la página al cambiar tamaño o filtros y conserva los demás valores', () => {
    const state = {
      ...EMPTY_URL_STATE,
      page: 3,
      search: 'ana',
      career: 'Sistemas',
      status: 'PENDIENTE' as const,
    };
    expect(changePageSize(state, 25)).toEqual({ ...state, page: 1, pageSize: 25 });
    expect(changeFilters(state, { status: 'APROBADA' })).toEqual({
      ...state,
      page: 1,
      status: 'APROBADA',
    });
  });

  it('conserva filtros al cambiar de página y limita una página fuera de rango', () => {
    const state = { ...EMPTY_URL_STATE, page: 3, pageSize: 10, search: 'ana' };
    expect(changePage(state, 4)).toEqual({ ...state, page: 4 });
    expect(changePage(state, 0).page).toBe(1);
    expect(totalPagesFor(142, 10)).toBe(15);
    expect(totalPagesFor(0, 15)).toBe(1);
    expect(clampPage({ ...state, page: 99 }, 142).page).toBe(15);
  });
});
