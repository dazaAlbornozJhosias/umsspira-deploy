import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { AcordeonPerfil } from '@/modules/profile/completar/acordeon-perfil';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import ProfileSummary from '@/modules/profile/ver/profile-summary';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Prueba punta a punta de la HU-06 (T6.7): pantallas reales, estado compartido y servicio real;
// solo se simula la red con las respuestas del backend (GET /perfil y PUT /perfil/descripcion-profesional)
const base = { idTitulado: '9bab2c02-d99b-4e06-a16c-ba5ee762654e', fechaCreacion: '2026-10-01' };
const PERFIL = {
  formacionAcademica: {
    registros: [{ ...base, id: 'f-1', institucion: 'UMSS', titulo: 'Ingeniería de Sistemas', grado: 'Licenciatura', anioEgreso: 2018 }],
  },
  experienciaLaboral: {
    registros: [{ ...base, id: 'e-1', empresa: 'Jalasoft', cargo: 'Dev', fechaInicio: '2023-08-01', fechaFin: null }],
  },
  certificaciones: {
    registros: [{ ...base, id: 'c-1', nombre: 'AWS', entidadEmisora: 'Amazon', grado: 'Profesional', anioEmision: 2022, respaldo: { tieneRespaldo: false } }],
  },
  descripcionProfesional: '',
};

const fetchMock = jest.fn();
let falloAlGuardar = false;
let descripcionGuardada = '';

function respuesta(status: number, cuerpo: unknown) {
  const ok = status >= 200 && status < 300;
  return { ok, status, json: async () => (ok ? { data: cuerpo } : cuerpo) };
}

function backend(url: string, opciones: RequestInit = {}) {
  if (url.endsWith('/api/v1/perfil') && !opciones.method) return respuesta(200, { ...PERFIL, descripcionProfesional: descripcionGuardada });
  if (url.endsWith('/api/v1/perfil/descripcion-profesional') && opciones.method === 'PUT') {
    if (falloAlGuardar) return respuesta(500, { statusCode: 500, message: 'No se pudo guardar la descripción' });
    const { descripcionProfesional } = JSON.parse(String(opciones.body));
    return respuesta(200, { descripcionProfesional, fechaActualizacion: '2026-10-24T12:00:00.000Z' });
  }
  return respuesta(404, { statusCode: 404, message: 'No encontrado' });
}

function renderPerfil() {
  render(
    <ProfileStoreProvider>
      <AcordeonPerfil returnTo="/profile" seccionInicial="descripcion-profesional" />
      <ProfileSummary />
    </ProfileStoreProvider>,
  );
}

function indicador() {
  return screen.getByRole('region', { name: 'Completitud del perfil' });
}

describe('HU-06 de punta a punta: descripción profesional y completitud (T6.7)', () => {
  beforeEach(() => {
    falloAlGuardar = false;
    descripcionGuardada = '';
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, opciones?: RequestInit) => backend(url, opciones));
    global.fetch = fetchMock;
    setAccessToken('test-token');
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
    clearAccessToken();
  });

  it('sin descripción el perfil está al 75%, el acceso directo lleva a la sección y al guardar llega al 100%', async () => {
    renderPerfil();

    // 1) El resumen carga el perfil real y marca la descripción como faltante
    expect(await within(await screen.findByRole('region', { name: 'Completitud del perfil' })).findByText('75%')).toBeInTheDocument();
    expect(within(indicador()).getByRole('link', { name: 'Completar Descripción' })).toHaveAttribute(
      'href',
      '/profile/completar?seccion=descripcion-profesional&returnTo=%2Fprofile',
    );
    expect(screen.getByText('3 de 4 secciones completas')).toBeInTheDocument();

    // 2) La sección del acceso directo llega abierta; se escribe y se guarda
    const cuadro = screen.getByRole('textbox', { name: 'Descripción profesional' });
    fireEvent.change(cuadro, { target: { value: '  Ingeniero de sistemas con foco en datos  ' } });
    expect(screen.getByText('43/5000 caracteres')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    // 3) La API recibe el texto del egresado con sesión y la pantalla confirma
    expect(await screen.findByText('Descripción guardada')).toBeInTheDocument();
    const put = fetchMock.mock.calls.find(([, opciones]) => opciones?.method === 'PUT');
    expect(put?.[0]).toMatch(/\/api\/v1\/perfil\/descripcion-profesional$/);
    expect(JSON.parse(put?.[1].body)).toEqual({ descripcionProfesional: 'Ingeniero de sistemas con foco en datos' });

    // 4) El resumen muestra la descripción y el indicador queda completo; «Volver» regresa al resumen
    expect(screen.getByText('Ingeniero de sistemas con foco en datos', { selector: 'p' })).toBeInTheDocument();
    expect(within(indicador()).getByText('100%')).toBeInTheDocument();
    expect(within(indicador()).getByText('Tu perfil está completo')).toBeInTheDocument();
    expect(screen.getByText('4 de 4 secciones completas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/profile');
  });

  it('si el guardado falla se ve el error, el texto se conserva y el perfil sigue al 75%', async () => {
    falloAlGuardar = true;
    renderPerfil();
    await within(await screen.findByRole('region', { name: 'Completitud del perfil' })).findByText('75%');

    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción profesional' }), { target: { value: 'Texto importante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('No se pudo guardar la descripción')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Descripción profesional' })).toHaveValue('Texto importante');
    expect(screen.queryByText('Descripción guardada')).not.toBeInTheDocument();
    expect(within(indicador()).getByText('75%')).toBeInTheDocument();
  });

  it('una descripción ya guardada aparece en el cuadro y en el resumen, con el perfil al 100%', async () => {
    descripcionGuardada = 'Analista de datos con experiencia en BI';
    renderPerfil();

    expect(await within(await screen.findByRole('region', { name: 'Completitud del perfil' })).findByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Descripción profesional' })).toHaveValue(descripcionGuardada);
    expect(screen.getByText(descripcionGuardada, { selector: 'p' })).toBeInTheDocument();
  });
});