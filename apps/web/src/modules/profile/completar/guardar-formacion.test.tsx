import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import type { ProfileRecords } from '@/modules/profile/types/profile-record';

import { AcordeonPerfil } from './acordeon-perfil';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// jsdom no trae fetch: se simula con la forma mínima que usa apiFetch
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown) {
  fetchMock.mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
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
  fireEvent.change(screen.getByLabelText('Grado', { selector: '#grado' }), { target: { value: 'Licenciatura' } });
  fireEvent.click(screen.getByRole('button', { name: /agregar formación/i }));
}

describe('Completar perfil · guardar formación académica en la API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
    delete global.fetch;
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

describe('Completar perfil · contador de errores (HU-02, AC 6)', () => {
  it('muestra en el encabezado cuántos errores hay sin corregir, también con la sección cerrada', async () => {
    abrirFormacion();
    const anioSiguiente = String(new Date().getFullYear() + 1);
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: 'UMSS' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ingeniería de Sistemas' } });
    fireEvent.change(screen.getByLabelText('Año de egreso'), { target: { value: anioSiguiente } });
    fireEvent.change(screen.getByLabelText('Grado', { selector: '#grado' }), { target: { value: 'Licenciatura' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar formación/i }));

    const encabezado = screen.getByRole('button', { name: /formación académica/i });
    expect(await screen.findByText('1 error')).toBeInTheDocument();
    expect(encabezado).toHaveTextContent('1 error');

    // Al cerrar la sección el contador se mantiene
    fireEvent.click(encabezado);
    expect(screen.getByRole('button', { name: /formación académica/i })).toHaveTextContent('1 error');

    // Al corregir el año, el contador desaparece
    fireEvent.click(screen.getByRole('button', { name: /formación académica/i }));
    fireEvent.change(screen.getByLabelText('Año de egreso'), { target: { value: '2018' } });
    await waitFor(() => expect(screen.queryByText('1 error')).not.toBeInTheDocument());
  });
});
