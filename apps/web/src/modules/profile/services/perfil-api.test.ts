import { CURRENT_GRADUATE_ID } from '@/modules/profile/data/profile-records-data';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';
import { ApiError } from '@/shared/services/api-client';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

import {
  crearCertificacion,
  crearExperiencia,
  crearFormacion,
  enlaceDeDescarga,
  guardarDescripcion,
  obtenerPerfil,
  obtenerResumenPerfil,
  subirRespaldo,
  type PerfilApi,
} from './perfil-api';

// jsdom no trae fetch: se simula con la forma mínima que usa apiFetch
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown) {
  // La API responde { data } cuando todo sale bien y el error tal cual cuando falla
  const ok = status >= 200 && status < 300;
  fetchMock.mockResolvedValue({ ok, status, json: async () => (ok ? { data: cuerpo } : cuerpo) });
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
  descripcionProfesional: '',
};

describe('obtenerPerfil', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
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

  it('incluye la descripción profesional en el resumen del perfil', async () => {
    responder(200, { ...PERFIL_API, descripcionProfesional: '  Ingeniero de sistemas.  ' });

    const resumen = await obtenerResumenPerfil();

    expect(resumen.description).toBe('Ingeniero de sistemas.');
    expect(resumen.records.education).toHaveLength(1);
  });

  it('deja la descripción vacía si el egresado aún no la registró', async () => {
    responder(200, PERFIL_API);

    expect((await obtenerResumenPerfil()).description).toBe('');
  });

  it('propaga el error de la API con su estado y mensaje', async () => {
    responder(403, { statusCode: 403, message: 'El usuario no es un titulado' });

    const error = await obtenerPerfil().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, message: 'El usuario no es un titulado' });
  });
});

describe('guardarDescripcion', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
  });

  it('envía PUT a la descripción del egresado con sesión y devuelve la guardada', async () => {
    responder(200, { descripcionProfesional: 'Analista de datos', fechaActualizacion: '2026-10-24T12:00:00.000Z' });

    const guardada = await guardarDescripcion('Analista de datos');

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/descripcion-profesional$/);
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(opciones.body)).toEqual({ descripcionProfesional: 'Analista de datos' });
    expect(guardada).toBe('Analista de datos');
  });

  it('400: rechaza con el mensaje del backend', async () => {
    const mensaje = 'La descripción no puede superar 5000 caracteres';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });

    await expect(guardarDescripcion('a')).rejects.toMatchObject({ status: 400, message: mensaje });
  });
});

describe('crearFormacion', () => {
  const formacion = { institucion: '  UMSS ', titulo: ' Ingeniería de Sistemas ', anioEgreso: '2018', grado: 'Licenciatura' };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
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
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
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

describe('crearCertificacion', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
  });

  it('envía POST con el año numérico y sin grado vacío', async () => {
    responder(201, {
      ...base,
      id: 'c-9',
      nombre: 'AWS',
      entidadEmisora: 'Amazon Web Services',
      grado: 'Profesional',
      anioEmision: 2022,
    });

    const creada = await crearCertificacion({
      nombre: ' AWS ',
      entidadEmisora: 'Amazon Web Services ',
      anioEmision: '2022',
      grado: '',
      respaldo: null,
    });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/certificaciones$/);
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({
      nombre: 'AWS',
      entidadEmisora: 'Amazon Web Services',
      anioEmision: 2022,
    });
    expect(creada.id).toBe('c-9');
    expect(creada.degree).toBe('Profesional');
  });
});

describe('subirRespaldo', () => {
  // XMLHttpRequest mínimo para controlar la respuesta desde el test
  class XhrFalso {
    static instancia: XhrFalso;
    metodo = '';
    url = '';
    cabeceras: Record<string, string> = {};
    cuerpo: unknown;
    status = 0;
    responseText = '';
    upload: { onprogress?: (evento: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
    onload?: () => void;
    onerror?: () => void;
    constructor() {
      XhrFalso.instancia = this;
    }
    open(metodo: string, url: string) {
      this.metodo = metodo;
      this.url = url;
    }
    setRequestHeader(nombre: string, valor: string) {
      this.cabeceras[nombre] = valor;
    }
    send(cuerpo: unknown) {
      this.cuerpo = cuerpo;
    }
  }

  const xhrOriginal = global.XMLHttpRequest;
  const archivo = () => new File(['contenido'], 'respaldo.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    Object.assign(global, { XMLHttpRequest: XhrFalso });
    setAccessToken('test-token');
  });

  afterEach(() => {
    Object.assign(global, { XMLHttpRequest: xhrOriginal });
    clearAccessToken();
  });

  it('envía el archivo como multipart con el token y avisa el avance', async () => {
    const avances: number[] = [];
    const promesa = subirRespaldo('c-1', archivo(), (porcentaje) => avances.push(porcentaje));
    const xhr = XhrFalso.instancia;

    expect(xhr.metodo).toBe('POST');
    expect(xhr.url).toMatch(/\/api\/v1\/perfil\/certificaciones\/c-1\/respaldo$/);
    expect(xhr.cabeceras.Authorization).toBe('Bearer test-token');
    expect((xhr.cuerpo as FormData).get('archivo')).toBeInstanceOf(File);

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.status = 200;
    xhr.onload?.();

    await expect(promesa).resolves.toBeUndefined();
    expect(avances).toEqual([50, 100]);
  });

  it('rechaza con ApiError y el mensaje del backend', async () => {
    const promesa = subirRespaldo('c-1', archivo());
    const xhr = XhrFalso.instancia;
    xhr.status = 400;
    xhr.responseText = JSON.stringify({ error: { message: 'Formato no permitido' } });
    xhr.onload?.();

    await expect(promesa).rejects.toMatchObject({ status: 400, message: 'Formato no permitido' });
  });

  it('rechaza con ApiError(0) si no hay conexión', async () => {
    const promesa = subirRespaldo('c-1', archivo());
    XhrFalso.instancia.onerror?.();

    await expect(promesa).rejects.toMatchObject({ status: 0 });
  });
});

describe('enlaceDeDescarga', () => {
  it('agrega descargar=1 respetando los parámetros del enlace firmado', () => {
    expect(enlaceDeDescarga('/api/v1/perfil/respaldos/c-1/archivo?expira=1&firma=x')).toBe(
      '/api/v1/perfil/respaldos/c-1/archivo?expira=1&firma=x&descargar=1',
    );
    expect(enlaceDeDescarga('/archivo')).toBe('/archivo?descargar=1');
  });
});
