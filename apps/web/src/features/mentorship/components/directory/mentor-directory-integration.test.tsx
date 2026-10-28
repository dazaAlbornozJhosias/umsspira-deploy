import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MentorDirectoryResponse } from '@umsspira/shared-types';
import { setAccessToken, clearAccessToken } from '@/shared/services/auth-session';
import { MentorDirectoryPage } from './mentor-directory-page';

const catalog: MentorDirectoryResponse['catalog'] = [
  { area: { id: 'software', nombre: 'Software' }, intereses: [{ id: 'api', nombre: 'APIs REST' }] },
  { area: { id: 'data', nombre: 'Datos' }, intereses: [{ id: 'sql', nombre: 'PostgreSQL' }] },
];
const rows: MentorDirectoryResponse['data'] = Array.from({ length: 8 }, (_, index) => {
  const group = catalog[index < 6 ? 0 : 1];
  return {
    id: `mentor-${index + 1}`, nombre: `Mentor ${index + 1}`, descripcion: 'Orientación profesional',
    foto_perfil: null, esta_activo: true, availabilityStatus: 'AVAILABLE',
    cargo: 'Desarrollador', empresa: 'Empresa de prueba', areas: [group.area],
    intereses: group.intereses.map(interest => ({ ...interest, area: group.area })),
  };
});
const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  setAccessToken('integration-test-token');
  global.fetch = fetchMock;
  fetchMock.mockReset().mockImplementation(async (input: string) => {
    const url = new URL(input, 'http://localhost:3001');
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? rows.length);
    const body: MentorDirectoryResponse = { data: rows.slice(offset, offset + limit), total: rows.length, catalog };
    return { ok: true, status: 200, json: async () => body };
  });
});
afterEach(() => { clearAccessToken(); global.fetch = originalFetch; });

it('conecta la pantalla con el cliente HTTP: páginas del servidor, filtros globales y enlace al perfil', async () => {
  render(<MentorDirectoryPage />);
  await screen.findByRole('link', { name: 'Ver perfil de Mentor 1' });
  expect(screen.getAllByRole('article')).toHaveLength(6);
  expect(screen.getByText('Mostrando 6 de 8 mentores')).toBeInTheDocument();
  expect(screen.getAllByText('Desarrollador | Empresa de prueba')).toHaveLength(6);

  fireEvent.click(screen.getByRole('button', { name: 'Cargar más mentores' }));
  await screen.findByRole('link', { name: 'Ver perfil de Mentor 8' });
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/mentorship/profiles?offset=6&limit=6', expect.anything());

  fireEvent.click(screen.getByRole('checkbox', { name: 'Datos' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'PostgreSQL' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 mentores encontrados'));
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(screen.queryByText('Mentor 1')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver perfil de Mentor 8' })).toHaveAttribute('href', '/mentorship/mentors/mentor-8');
  expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/mentorship/profiles', expect.objectContaining({
    method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer integration-test-token' }),
  }));

  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  await screen.findByRole('link', { name: 'Ver perfil de Mentor 1' });
  expect(screen.getByText('Mostrando 6 de 8 mentores')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/mentorship/profiles?offset=0&limit=6', expect.anything());
});
