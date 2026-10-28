import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import type { ProfileRecords } from '@/modules/profile/types/profile-record';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

import { AcordeonPerfil } from './acordeon-perfil';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// jsdom no trae fetch: se simula con la forma mínima que usa apiFetch
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown) {
  // La API responde { data } cuando todo sale bien y el error tal cual cuando falla
  const ok = status >= 200 && status < 300;
  fetchMock.mockResolvedValue({ ok, status, json: async () => (ok ? { data: cuerpo } : cuerpo) });
}

const SIN_REGISTROS: ProfileRecords = { education: [], experience: [], certification: [] };

function abrirFormacion() {
  render(
    <ProfileStoreProvider initialRecords={SIN_REGISTROS}>
      <AcordeonPerfil />
    </ProfileStoreProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /formación académica/i }));
}

function llenarYAgregar() {
  fireEvent.change(screen.getByLabelText('Institución'), { target: { value: 'UMSS' } });
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ingeniería de Sistemas' } });
  fireEvent.change(screen.getByLabelText('Año de egreso'), { target: { value: '2018' } });
  fireEvent.change(screen.getByLabelText('Grado'), { target: { value: 'Licenciatura' } });
  fireEvent.click(screen.getByRole('button', { name: /agregar formación/i }));
}

describe('Completar perfil · guardar formación académica en la API', () => {
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

  it('201: agrega la formación guardada y limpia el formulario', async () => {
    responder(201, {
      id: '0b6f1c1e-4f7a-4c55-9a52-1f6f0d3b2a10',
      idTitulado: 'titulado-1',
      fechaCreacion: '2026-10-14',
      institucion: 'UMSS',
      titulo: 'Ingeniería de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2018,
    });
    abrirFormacion();

    llenarYAgregar();

    expect(await screen.findByText('Formación registrada')).toBeInTheDocument();
    expect(screen.getByText('UMSS • 2018 • Licenciatura')).toBeInTheDocument();
    expect(screen.getByLabelText('Institución')).toHaveValue('');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('409: muestra el mensaje del backend, no agrega y no limpia', async () => {
    const mensaje = 'La formación académica ya se encuentra registrada.';
    responder(409, { statusCode: 409, message: mensaje, error: mensaje });
    abrirFormacion();

    llenarYAgregar();

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(screen.queryByText('Formación registrada')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Institución')).toHaveValue('UMSS');
  });

  it('400: muestra el mensaje del backend y no agrega', async () => {
    const mensaje = 'El título no puede superar los 150 caracteres';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });
    abrirFormacion();

    llenarYAgregar();

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(screen.queryByText('Formación registrada')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /agregar formación/i })).toBeEnabled());
  });
});
