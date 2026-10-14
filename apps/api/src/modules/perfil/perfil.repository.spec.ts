import { query } from '../../shared/lib/database';
import { PerfilRepository } from './perfil.repository';

jest.mock('../../shared/lib/database', () => ({ query: jest.fn() }));

const queryMock = query as jest.MockedFunction<typeof query>;

describe('PerfilRepository', () => {
  const repositorio = new PerfilRepository();

  beforeEach(() => queryMock.mockReset());

  it('inserta una formación académica con el titulado y devuelve el registro en camelCase', async () => {
    queryMock.mockResolvedValue([
      {
        id: 'f1',
        id_titulado: 't1',
        institucion: 'UMSS',
        titulo: 'Ing. de Sistemas',
        grado: 'Licenciatura',
        anio_egreso: 2024,
        fecha_creacion: new Date('2026-10-06T10:00:00Z'),
      },
    ]);

    const registro = await repositorio.insertar('formacion-academica', 't1', {
      institucion: 'UMSS',
      titulo: 'Ing. de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2024,
    });

    const [sql, parametros] = queryMock.mock.calls[0];
    expect(sql).toBe(
      'INSERT INTO formacion_academica (id_titulado, institucion, titulo, grado, anio_egreso, fecha_creacion) ' +
        'VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
    );
    expect(parametros).toEqual(['t1', 'UMSS', 'Ing. de Sistemas', 'Licenciatura', 2024]);
    expect(registro).toEqual({
      id: 'f1',
      idTitulado: 't1',
      fechaCreacion: '2026-10-06',
      institucion: 'UMSS',
      titulo: 'Ing. de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2024,
    });
  });

  it('lista los registros del titulado del más reciente al más antiguo', async () => {
    queryMock.mockResolvedValue([]);

    await repositorio.listar('experiencia-laboral', 't1');

    const [sql, parametros] = queryMock.mock.calls[0];
    expect(sql).toContain('FROM experiencia_laboral WHERE id_titulado = $1');
    expect(sql).toContain('ORDER BY fecha_creacion DESC');
    expect(parametros).toEqual(['t1']);
  });

  it('devuelve null si el registro no existe', async () => {
    queryMock.mockResolvedValue([]);

    expect(await repositorio.obtenerPorId('certificaciones', 'no-existe')).toBeNull();
  });
  it('devuelve nombre completo y carrera del titulado', async () => {
    queryMock.mockResolvedValue([{ nombre: 'María Rojas', carrera: 'Ingeniería de Sistemas' }]);

    const datos = await repositorio.obtenerDatosTitulado('t1');

    const [sql, parametros] = queryMock.mock.calls[0];
    expect(sql).toContain('FROM titulado t LEFT JOIN carrera c');
    expect(parametros).toEqual(['t1']);
    expect(datos).toEqual({ nombre: 'María Rojas', carrera: 'Ingeniería de Sistemas', promocion: null });
  });

  it('devuelve null si el titulado no existe', async () => {
    queryMock.mockResolvedValue([]);

    expect(await repositorio.obtenerDatosTitulado('no-existe')).toBeNull();
  });

  it('lista los respaldos de varias certificaciones en una sola consulta', async () => {
    queryMock.mockResolvedValue([
      { id: 'r1', id_certificacion: 'c1', tipo: 'FOTO', archivo_key: 't1/c1/a.jpg', fecha_subida: null },
    ]);

    const respaldos = await repositorio.listarRespaldos(['c1', 'c2']);

    const [sql, parametros] = queryMock.mock.calls[0];
    expect(sql).toContain('WHERE id_certificacion = ANY($1::uuid[])');
    expect(parametros).toEqual([['c1', 'c2']]);
    expect(respaldos).toEqual([
      { id: 'r1', idCertificacion: 'c1', tipo: 'FOTO', archivoKey: 't1/c1/a.jpg', fechaSubida: null },
    ]);
  });
});
