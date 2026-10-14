import { getSupabaseClient } from '../../../shared/lib/supabase';
import { ApplicationsRepository } from './applications.repository';

jest.mock('../../../shared/lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockedGetClient = getSupabaseClient as jest.Mock;

const careers = [
  { id: 'carrera-1', nombre: 'Ingeniería de Sistemas' },
  { id: 'carrera-2', nombre: 'Ingeniería Informática' },
];

const details = [
  {
    id: 'detalle-1', nombre: 'Alejandro', apellido: 'Rojas Torrico', ci: '6849201',
    extension_ci: null, email: 'alejandro.rojas@gmail.com', telefono: '71234567',
    cod_sis: 201804921, anio_egreso: 2020, id_carrera: 'carrera-1',
  },
  {
    id: 'detalle-2', nombre: 'Carla', apellido: 'Montaño', ci: '7942105',
    extension_ci: null, email: 'c.montano@est.umss.edu', telefono: '76543210',
    cod_sis: 201701234, anio_egreso: 2019, id_carrera: 'carrera-1',
  },
];

const OLD_ISO = new Date(Date.now() - 54 * 3_600_000).toISOString();
const NEW_ISO = new Date(Date.now() - 5 * 3_600_000).toISOString();

const applications = [
  { id: '11111111-1111-4111-8111-111111111111', estado: 'Pendiente', fecha_creacion: OLD_ISO, id_detalle_solicitud: 'detalle-1' },
  { id: '22222222-2222-4222-8222-222222222222', estado: 'APPROVED', fecha_creacion: NEW_ISO, id_detalle_solicitud: 'detalle-2' },
];

function mockListTables() {
  const byTable: Record<string, { data: unknown; error: null }> = {
    carrera: { data: careers, error: null },
    detalle_solicitud: { data: details, error: null },
    solicitud: { data: applications, error: null },
  };
  mockedGetClient.mockReturnValue({
    from: jest.fn((table: string) => ({
      select: jest.fn().mockResolvedValue(byTable[table] ?? { data: [], error: null }),
    })),
  });
}

// Cadena con maybeSingle para las consultas por id del detalle.
function mockDetailTables() {
  const single = (row: unknown) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }) }),
    }),
  });
  const solicitud = {
    id: 'solicitud-1', estado: 'Pendiente', fecha_creacion: OLD_ISO,
    id_detalle_solicitud: 'detalle-1', id_documento_respaldo: 'documento-1',
  };
  mockedGetClient.mockReturnValue({
    from: jest.fn((table: string) => {
      if (table === 'solicitud') return single(solicitud);
      if (table === 'detalle_solicitud') return single(details[0]);
      if (table === 'documento_respaldo') {
        return single({ id: 'documento-1', ruta_storage: 'solicitudes/x/y.pdf', tamanio_mb: 2, id_tipo_archivo: 'tipo-1' });
      }
      if (table === 'carrera') return single({ nombre: 'Ingeniería de Sistemas' });
      if (table === 'tipo_archivo') return single({ nombre: 'PDF' });
      return single(null);
    }),
    storage: { from: jest.fn().mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://firmada.local/doc.pdf' }, error: null }),
    }) },
  });
}

describe('ApplicationsRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lista con código, nombre y estado normalizado, pendientes antiguos primero (CA-04.1)', async () => {
    mockListTables();
    const repository = new ApplicationsRepository();

    const items = await repository.listApplications({});

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: '11111111-1111-4111-8111-111111111111', fullName: 'Alejandro Rojas Torrico', status: 'PENDING' });
    expect(items[0].code).toMatch(/^TIT-\d{4}-[0-9A-F]{6}$/);
    expect(items[1].status).toBe('APPROVED');
  });

  it('filtra por estado, carrera y texto libre (CA-04.2)', async () => {
    mockListTables();
    const repository = new ApplicationsRepository();

    await expect(repository.listApplications({ status: 'PENDING' })).resolves.toHaveLength(1);
    await expect(repository.listApplications({ career: 'informática' })).resolves.toHaveLength(0);
    await expect(repository.listApplications({ search: 'carla' })).resolves.toHaveLength(1);
    await expect(repository.listApplications({ search: '201804921' })).resolves.toHaveLength(1);
    await expect(repository.listApplications({ age: 'over48' })).resolves.toHaveLength(1);
  });

  it('arma el expediente con documento y carrera (CA-04.3)', async () => {
    mockDetailTables();
    const repository = new ApplicationsRepository();

    const detail = await repository.findApplicationById('solicitud-1');

    expect(detail).toMatchObject({
      id: 'solicitud-1',
      fullName: 'Alejandro Rojas Torrico',
      email: 'alejandro.rojas@gmail.com',
      career: 'Ingeniería de Sistemas',
      status: 'PENDING',
      documentName: 'y.pdf',
      documentPath: 'solicitudes/x/y.pdf',
      documentFormat: 'PDF',
    });
  });

  it('devuelve null cuando la solicitud no existe', async () => {
    mockedGetClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }),
        }),
      }),
    });
    const repository = new ApplicationsRepository();

    await expect(repository.findApplicationById('inexistente')).resolves.toBeNull();
  });

  it('genera la URL firmada del documento con 5 minutos de vigencia (CA-04.3)', async () => {
    mockDetailTables();
    const repository = new ApplicationsRepository();

    const signed = await repository.createDocumentSignedUrl('solicitudes/x/y.pdf');

    expect(signed).toEqual({ url: 'https://firmada.local/doc.pdf', expiresIn: 300 });
  });
});
