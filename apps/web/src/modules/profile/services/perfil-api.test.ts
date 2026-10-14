import { CURRENT_GRADUATE_ID } from '@/modules/profile/data/profile-records-data';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';
import { ApiError } from '@/shared/services/api-client';

import { crearExperiencia, crearFormacion, obtenerPerfil, type PerfilApi } from './perfil-api';

// jsdom no trae fetch: se simula con la forma mínima que usa apiFetch
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown) {
  fetchMock.mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
}

const base = { idTitulado: '9bab2c02-d99b-4e06-a16c-ba5ee762654e', fechaCreacion: '2026-10-01' };

const PERFIL_API: PerfilApi = {
  formacionAcademica: {
    registros: [
      { ...base, id: 'f-1', institucion: 'UMSS', titulo: 'Ingeniería de Sistemas', grado: 'Licenciatura', anioEgreso: 2018 },
    ],
  },
  experienciaLaboral: {
    registros: [
      { ...base, id: 'e-1', empresa: 'Jalasoft', cargo: 'Dev', fechaInicio: '2023-08-01', fechaFin: null },
    ],
  },
  certificaciones: {
    registros: [
      { ...base, id: 'c-1', nombre: 'AWS', entidadEmisora: 'Amazon', grado: 'Profesional', anioEmision: 2022, respaldo: { tieneRespaldo: true } },
      { ...base, id: 'c-2', nombre: 'PSM I', entidadEmisora: 'Scrum.org', grado: 'Asociado', anioEmision: 2021, respaldo: { tieneRespaldo: false } },
    ],
  },
};

describe('obtenerPerfil', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
  });

  it('consulta GET /api/v1/perfil', async () => {
    responder(200, PERFIL_API);

    await obtenerPerfil();

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil$/);
    expect(opciones.method).toBeUndefined();
  });

  it('convierte los registros de la API al formato del estado del perfil', async () => {
    responder(200, PERFIL_API);

    const registros = await obtenerPerfil();

    expect(registros.education).toEqual([
      {
        id: 'f-1',
        ownerId: CURRENT_GRADUATE_ID,
        institution: 'UMSS',
        title: 'Ingeniería de Sistemas',
        graduationYear: '2018',
        degree: 'Licenciatura',
      },
    ]);
    expect(registros.experience).toEqual([
      { id: 'e-1', ownerId: CURRENT_GRADUATE_ID, company: 'Jalasoft', position: 'Dev', startDate: '2023-08-01', endDate: '' },
    ]);
    expect((registros.certification as CertificationRecord[]).map((c) => [c.id, c.issueYear, c.backupFile])).toEqual([
      ['c-1', '2022', 'respaldo.jpg'],
      ['c-2', '2021', undefined],
    ]);
  });

  it('propaga el error de la API con su estado y mensaje', async () => {
    responder(403, { statusCode: 403, message: 'El usuario no es un titulado' });

    const error = await obtenerPerfil().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, message: 'El usuario no es un titulado' });
  });
});

describe('crearFormacion', () => {
  const formacion = { institucion: '  UMSS ', titulo: ' Ingeniería de Sistemas ', anioEgreso: '2018', grado: 'Licenciatura' };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
  });

  it('envía POST con el año como número y los textos sin espacios', async () => {
    responder(201, { ...base, id: 'f-1', institucion: 'UMSS', titulo: 'Ingeniería de Sistemas', grado: 'Licenciatura', anioEgreso: 2018 });

    await crearFormacion(formacion);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/formacion-academica$/);
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({
      institucion: 'UMSS',
      titulo: 'Ingeniería de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2018,
    });
  });

  it('201: devuelve el registro creado con su id real', async () => {
    responder(201, { ...base, id: 'f-1', institucion: 'UMSS', titulo: 'Ingeniería de Sistemas', grado: 'Licenciatura', anioEgreso: 2018 });

    await expect(crearFormacion(formacion)).resolves.toEqual({
      id: 'f-1',
      ownerId: CURRENT_GRADUATE_ID,
      institution: 'UMSS',
      title: 'Ingeniería de Sistemas',
      graduationYear: '2018',
      degree: 'Licenciatura',
    });
  });

  it('409: rechaza con el mensaje del backend', async () => {
    responder(409, { statusCode: 409, message: 'La formación académica ya se encuentra registrada.', error: 'La formación académica ya se encuentra registrada.' });

    await expect(crearFormacion(formacion)).rejects.toMatchObject({
      status: 409,
      message: 'La formación académica ya se encuentra registrada.',
    });
  });

  it('400: rechaza con los mensajes del backend', async () => {
    responder(400, { statusCode: 400, message: ['La institución es obligatoria'], error: 'La institución es obligatoria' });

    await expect(crearFormacion(formacion)).rejects.toMatchObject({ status: 400, message: 'La institución es obligatoria' });
  });
});

describe('crearExperiencia', () => {
  const experiencia = { empresa: ' Jalasoft ', cargo: ' Dev ', fechaInicio: '2023-08-01', fechaFin: '2024-01-31' };
  const creada = { ...base, id: 'e-1', empresa: 'Jalasoft', cargo: 'Dev', fechaInicio: '2023-08-01', fechaFin: '2024-01-31' };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
  });

  it('envía POST con las fechas y los textos sin espacios', async () => {
    responder(201, creada);

    await crearExperiencia(experiencia);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/experiencia-laboral$/);
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ empresa: 'Jalasoft', cargo: 'Dev', fechaInicio: '2023-08-01', fechaFin: '2024-01-31' });
  });

  it('no envía fechaFin cuando es "Actualmente trabajo aquí"', async () => {
    responder(201, { ...creada, fechaFin: null });

    await crearExperiencia({ ...experiencia, fechaFin: undefined });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('fechaFin');
  });

  it('201: devuelve el registro creado; fechaFin null queda como trabajo actual', async () => {
    responder(201, { ...creada, fechaFin: null });

    await expect(crearExperiencia({ ...experiencia, fechaFin: undefined })).resolves.toEqual({
      id: 'e-1',
      ownerId: CURRENT_GRADUATE_ID,
      company: 'Jalasoft',
      position: 'Dev',
      startDate: '2023-08-01',
      endDate: '',
    });
  });

  it('400: rechaza con el mensaje del backend', async () => {
    const mensaje = 'La fecha de inicio no puede ser posterior a hoy';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });

    await expect(crearExperiencia(experiencia)).rejects.toMatchObject({ status: 400, message: mensaje });
  });
});
