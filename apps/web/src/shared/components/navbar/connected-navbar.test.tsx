import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConnectedNavbar } from './connected-navbar';
import { getSessionToken, clearSession } from '@/modules/auth/frontend/services/session';
import { getAccessToken, clearAccessToken } from '@/shared/services/auth-session';
import { clearToken, getToken } from '@/shared/services/api-client';
import { authStore } from '@/modules/auth/frontend/store';
import type { NavbarProps } from './types';

const push = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => '/portal/institucional', useRouter: () => ({ push, refresh }) }));
jest.mock('@/modules/auth/frontend/services/session', () => ({ getSessionToken: jest.fn(), clearSession: jest.fn() }));
jest.mock('@/shared/services/auth-session', () => ({ getAccessToken: jest.fn(), clearAccessToken: jest.fn() }));
jest.mock('@/shared/services/api-client', () => ({ getToken: jest.fn(), clearToken: jest.fn() }));
jest.mock('@/modules/auth/frontend/store', () => ({ useAuthStore: () => ({ accessToken: null }), authStore: { reset: jest.fn() } }));
jest.mock('./navbar', () => ({ Navbar: ({ session, onLogout }: NavbarProps) => <header><span>{session ? `${session.name}: ${session.role}` : 'Visitante'}</span><button onClick={onLogout}>Cerrar sesión</button></header> }));

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
  jest.mocked(getSessionToken).mockReturnValue(null);
  jest.mocked(getAccessToken).mockReturnValue(null);
  jest.mocked(getToken).mockReturnValue(null);
});

it('no consulta la API ni toma el rol simulado del laboratorio cuando no hay token real', () => {
  sessionStorage.setItem('umsspira.navbar-laboratorio.rol', 'administrador');
  render(<ConnectedNavbar />);
  expect(screen.getByText('Visitante')).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
  sessionStorage.clear();
});

it('restaura el rol de empresa validado por la API y envía el token de la cookie', async () => {
  jest.mocked(getSessionToken).mockReturnValue('token-real');
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { email: 'talento@ejemplo.com', role: 'empresa' } }) });
  render(<ConnectedNavbar />);
  expect(await screen.findByText('talento: empresa')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/auth/me'), expect.objectContaining({ headers: { Authorization: 'Bearer token-real' } }));
});

it('permanece como visitante si la API rechaza el token', async () => {
  jest.mocked(getSessionToken).mockReturnValue('token-rechazado');
  fetchMock.mockResolvedValue({ ok: false });
  render(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('Visitante')).toBeInTheDocument();
});

it('no presenta como autenticado un rol desconocido devuelto por la API', async () => {
  jest.mocked(getToken).mockReturnValue('token-legacy');
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { email: 'otra@ejemplo.com', role: 'desconocido' } }) });
  render(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('Visitante')).toBeInTheDocument();
});

it('limpia las tres fuentes de sesión antes de regresar al login', () => {
  render(<ConnectedNavbar />);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(clearSession).toHaveBeenCalled();
  expect(clearAccessToken).toHaveBeenCalled();
  expect(clearToken).toHaveBeenCalled();
  expect(authStore.reset).toHaveBeenCalled();
  expect(push).toHaveBeenCalledWith('/login');
  expect(refresh).toHaveBeenCalled();
});
