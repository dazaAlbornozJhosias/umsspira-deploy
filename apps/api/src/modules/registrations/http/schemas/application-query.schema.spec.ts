import { applicationQuerySchema } from './registrations.schemas';
 
describe('applicationQuerySchema', () => {
  it('usa la página 1 y 15 filas por defecto', () => {
    const parsed = applicationQuerySchema.parse({});
 
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(15);
  });
 
  it.each(['10', '15', '25', '50'])('acepta %s filas por página como texto de la URL (CA-08.2)', (size) => {
    const parsed = applicationQuerySchema.parse({ pageSize: size });
 
    expect(parsed.pageSize).toBe(Number(size));
  });
 
  it.each(['0', '5', '20', '99', 'abc'])('rechaza %s filas por página', (size) => {
    expect(applicationQuerySchema.safeParse({ pageSize: size }).success).toBe(false);
  });
 
  it('rechaza una página menor a 1', () => {
    expect(applicationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });
 
  it('recorta los espacios de la búsqueda y de la carrera (CA-08.3)', () => {
    const parsed = applicationQuerySchema.parse({ search: '  rojas  ', career: ' Sistemas ' });
 
    expect(parsed.search).toBe('rojas');
    expect(parsed.career).toBe('Sistemas');
  });
 
  it('acepta solo los estados definidos', () => {
    expect(applicationQuerySchema.safeParse({ status: 'PENDIENTE' }).success).toBe(true);
    expect(applicationQuerySchema.safeParse({ status: 'pendiente' }).success).toBe(false);
  });
 
  it('rechaza parámetros desconocidos', () => {
    expect(applicationQuerySchema.safeParse({ unknown: 'x' }).success).toBe(false);
  });

  it.each(['last15', 'last30', 'semester1', 'semester2'])('acepta el periodo %s (CA-08.4)', (period) => {
    expect(applicationQuerySchema.safeParse({ period }).success).toBe(true);
  });
 
  it('rechaza un periodo desconocido', () => {
    expect(applicationQuerySchema.safeParse({ period: 'semana' }).success).toBe(false);
  });
 
  it('acepta un semestre con su año', () => {
    const parsed = applicationQuerySchema.parse({ period: 'semester1', year: '2026' });
 
    expect(parsed.year).toBe(2026);
  });
 
  it('rechaza el año cuando el periodo no es un semestre', () => {
    expect(applicationQuerySchema.safeParse({ period: 'last15', year: '2026' }).success).toBe(false);
  });
 
  it('acepta Desde y Hasta, o solo uno de ellos, con el periodo personalizado', () => {
    expect(applicationQuerySchema.safeParse({ period: 'custom', from: '2026-10-01', to: '2026-10-15' }).success).toBe(true);
    expect(applicationQuerySchema.safeParse({ period: 'custom', from: '2026-10-01' }).success).toBe(true);
    expect(applicationQuerySchema.safeParse({ period: 'custom', to: '2026-10-15' }).success).toBe(true);
  });
 
  it('rechaza el periodo personalizado sin fechas', () => {
    expect(applicationQuerySchema.safeParse({ period: 'custom' }).success).toBe(false);
  });
 
  it('rechaza Desde posterior a Hasta y fechas inválidas', () => {
    expect(applicationQuerySchema.safeParse({ period: 'custom', from: '2026-10-15', to: '2026-10-01' }).success).toBe(false);
    expect(applicationQuerySchema.safeParse({ period: 'custom', from: '2026-13-45' }).success).toBe(false);
  });
 
  it('rechaza Desde y Hasta cuando el periodo no es personalizado', () => {
    expect(applicationQuerySchema.safeParse({ period: 'last30', from: '2026-10-01' }).success).toBe(false);
    expect(applicationQuerySchema.safeParse({ from: '2026-10-01' }).success).toBe(false);
  });
 
  it('combina periodo, búsqueda, estado y tamaño de página', () => {
    const parsed = applicationQuerySchema.parse({
      period: 'last30',
      search: ' rojas ',
      status: 'PENDIENTE',
      pageSize: '25',
    });
 
    expect(parsed).toMatchObject({ period: 'last30', search: 'rojas', status: 'PENDIENTE', pageSize: 25 });
  });
});
 
