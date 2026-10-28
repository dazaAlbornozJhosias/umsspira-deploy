import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

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

function abrirExperiencia() {
  const { container } = render(
    <ProfileStoreProvider initialRecords={SIN_REGISTROS}>
      <AcordeonPerfil />
    </ProfileStoreProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /experiencia laboral/i }));
  return container;
}

// Trabajo actual: sin fecha fin
function llenarYAgregar(container: HTMLElement) {
  const [inicio] = Array.from(container.querySelectorAll('input[type="date"]'));
  fireEvent.change(screen.getByPlaceholderText('Ej. Jalasoft'), { target: { value: 'Jalasoft' } });
  fireEvent.change(screen.getByPlaceholderText('Ej. Desarrollador Frontend'), { target: { value: 'Dev' } });
  fireEvent.change(inicio, { target: { value: '2023-08-01' } });
  fireEvent.click(screen.getByLabelText('Actualmente trabajo aquí'));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar experiencia' }));
}

describe('Completar perfil · guardar experiencia laboral en la API', () => {
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

  it('201: agrega la experiencia guardada sin enviar fechaFin y limpia el formulario', async () => {
    responder(201, {
      id: '5d2a7c3e-1b4f-4e8a-9c6d-2f7e8a9b0c1d',
      idTitulado: 'titulado-1',
      fechaCreacion: '2026-10-14',
      empresa: 'Jalasoft',
      cargo: 'Dev',
      fechaInicio: '2023-08-01',
      fechaFin: null,
    });
    const container = abrirExperiencia();

    llenarYAgregar(container);

    expect(await screen.findByText('Dev')).toBeInTheDocument();
    expect(screen.getByText(/Actualidad/)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('fechaFin');
    expect(screen.getByPlaceholderText('Ej. Jalasoft')).toHaveValue('');
  });

  it('400: muestra el mensaje del backend, no agrega y no limpia', async () => {
    const mensaje = 'La fecha de inicio no puede ser posterior a hoy';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });
    const container = abrirExperiencia();

    llenarYAgregar(container);

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(screen.queryByText(/Actualidad/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Jalasoft')).toHaveValue('Jalasoft');
  });
});
