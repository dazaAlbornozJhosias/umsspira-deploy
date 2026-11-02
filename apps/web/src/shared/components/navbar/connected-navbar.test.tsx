import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConnectedNavbar, resetConnectedNavbarCache } from './connected-navbar';
import { authenticatedFetch, revokeCurrentSession, SessionError } from '@/shared/services/auth-session';
import { clearSession } from '@/modules/auth/frontend/services/session';
import { authStore } from '@/modules/auth/frontend/store';
import type { NavbarProps } from './types';
import { SESSION_EXPIRED_EVENT } from '@/modules/auth/frontend/services/session-expired';

// --- Mocks ---
const push = jest.fn();
const replace = jest.fn();
const refresh = jest.fn();
const mockRouter = { push, replace, refresh };
let mockPathname = '/mentorship/directory';

jest.mock('next/navigation', () => ({ 
  usePathname: () => mockPathname, 
  useRouter: () => mockRouter 
}));

jest.mock('@/modules/auth/frontend/services/session', () => ({ 
  getSessionToken: jest.fn(), 
  clearSession: jest.fn() 
}));

jest.mock('@/shared/services/auth-session', () => ({
  ...jest.requireActual('@/shared/services/auth-session'),
  authenticatedFetch: jest.fn(),
  revokeCurrentSession: jest.fn(),
}));
jest.mock('@/shared/services/api-client', () => ({ getToken: jest.fn(), clearToken: jest.fn() }));
jest.mock('@/modules/auth/frontend/store', () => ({ useAuthStore: () => ({ accessToken: null }), authStore: { reset: jest.fn() } }));
jest.mock('./navbar', () => ({ Navbar: ({ session, onLogout }: NavbarProps) => <header>
  <span>{session ? `${session.name}: ${session.role}` : 'Visitante'}</span>
  {!session && <><span>Iniciar sesión</span><span>Registro</span></>}
  <button onClick={onLogout}>Cerrar sesión</button>
</header> }));

const fetchMock = jest.mocked(authenticatedFetch);
const expiredListener = jest.fn();
window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);

beforeEach(() => {
  resetConnectedNavbarCache();
  window.localStorage.clear();
  mockPathname = '/mentorship/directory';
  jest.clearAllMocks();
  sessionStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new SessionError(401, 'Inicia sesión'));
  jest.mocked(revokeCurrentSession).mockResolvedValue(undefined);
});

// --- Tests ---

it('permanece como visitante sin una sesión real e ignora el rol del laboratorio', async () => {
  sessionStorage.setItem('umsspira.navbar-laboratorio.rol', 'administrador');
  render(<ConnectedNavbar />);
  expect(screen.getByText('Visitante')).toBeInTheDocument();
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  sessionStorage.clear();
});

it('restaura el rol de empresa validado mediante el cliente autenticado', async () => {
  fetchMock.mockResolvedValue({ 
    ok: true, 
    json: async () => ({ data: { email: 'talento@ejemplo.com', role: 'empresa' } }) 
  } as Response);
  
  render(<ConnectedNavbar />);
  expect(await screen.findByText('talento: empresa')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({ cache: 'no-store' }));
});

it('conserva la sesión visual ante error de red y reintenta al volver online', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { email: 'talento@ejemplo.com', role: 'empresa' } }) } as Response);
  const view = render(<ConnectedNavbar />);
  expect(await screen.findByText('talento: empresa')).toBeInTheDocument();

  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  mockPathname = '/companies';
  view.rerender(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(screen.getByText('talento: empresa')).toBeInTheDocument();

  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { email: 'actualizada@ejemplo.com', role: 'empresa' } }) } as Response);
  fireEvent(window, new Event('online'));
  expect(await screen.findByText('actualizada: empresa')).toBeInTheDocument();
});

it('conserva el fallback visual de sesión ante errores transitorios en cualquier módulo', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { email: 'talento@ejemplo.com', role: 'empresa' } }) } as Response);
  const view = render(<ConnectedNavbar />);
  expect(await screen.findByText('talento: empresa')).toBeInTheDocument();

  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  mockPathname = '/companies';
  view.rerender(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(screen.getByText('talento: empresa')).toBeInTheDocument();

  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  mockPathname = '/mentorship/directory';
  view.rerender(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(screen.getByText('talento: empresa')).toBeInTheDocument();
});

it('limpia la sesión visual y muestra acciones públicas ante un 401 explícito', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { email: 'talento@ejemplo.com', role: 'empresa' } }) } as Response);
  const view = render(<ConnectedNavbar />);
  expect(await screen.findByText('talento: empresa')).toBeInTheDocument();

  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 } as Response);
  mockPathname = '/companies';
  view.rerender(<ConnectedNavbar />);
  await waitFor(() => expect(clearSession).toHaveBeenCalled());
  expect(await screen.findByText('Visitante')).toBeInTheDocument();
  expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  expect(screen.getByText('Registro')).toBeInTheDocument();
  expect(sessionStorage.getItem('umsspira.navbar.display-session')).toBeNull();
});

it('permanece como visitante si la API rechaza el token', async () => {
  fetchMock.mockResolvedValue({ ok: false } as Response);
  render(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('Visitante')).toBeInTheDocument();
});

it('no presenta como autenticado un rol desconocido devuelto por la API', async () => {
  fetchMock.mockResolvedValue({ 
    ok: true, 
    json: async () => ({ data: { email: 'otra@ejemplo.com', role: 'desconocido' } }) 
  } as Response);
  
  render(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('Visitante')).toBeInTheDocument();
});

it('revoca la sesión y limpia el estado antes de regresar al login', async () => {
  render(<ConnectedNavbar />);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  
  expect(revokeCurrentSession).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(clearSession).toHaveBeenCalled());
  expect(authStore.reset).toHaveBeenCalled();
  expect(push).toHaveBeenCalledWith('/login');
  expect(refresh).toHaveBeenCalled();
});

it('HU-004: un administrador cierra sesión y vuelve a la bienvenida', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ data: { email: 'admin@umss.edu.bo', role: 'administrador' } }),
  } as Response);
  
  render(<ConnectedNavbar />);
  expect(await screen.findByText('admin: administrador')).toBeInTheDocument();
  
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  
  expect(revokeCurrentSession).toHaveBeenCalledTimes(1);
  expect(clearSession).toHaveBeenCalled();
  expect(authStore.reset).toHaveBeenCalled();
});

it('HU-004 CA-07: el administrador vuelve a la bienvenida aunque /me responda 401 durante el cierre', async () => {
  mockPathname = '/reports';
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { email: 'admin@umss.edu.bo', role: 'administrador' } }),
  } as Response);
  let finishRevoke: () => void = () => undefined;
  jest.mocked(revokeCurrentSession).mockReturnValue(new Promise<void>((resolve) => { finishRevoke = resolve; }));
  render(<ConnectedNavbar />);
  expect(await screen.findByText('admin: administrador')).toBeInTheDocument();

  fetchMock.mockResolvedValue({ ok: false, status: 401 } as Response);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  fireEvent.focus(window);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  finishRevoke();

  await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  expect(replace).not.toHaveBeenCalled();
  expect(expiredListener).not.toHaveBeenCalled();
});

it('HU-004 CA-06: HTTP 401 en reportería borra el estado React y abre la alerta de sesión expirada', async () => {
  mockPathname = '/reports';
  fetchMock.mockResolvedValue({ ok: false, status: 401 } as Response);
  render(<ConnectedNavbar />);

  await waitFor(() => expect(clearSession).toHaveBeenCalledTimes(1));
  expect(authStore.reset).toHaveBeenCalled();
  expect(expiredListener).toHaveBeenCalledTimes(1);
});

it('HU-004 CA-06: al fallar la renovación con 401 también limpia la sesión y avisa', async () => {
  mockPathname = '/reports/encuestas';
  fetchMock.mockRejectedValue(new SessionError(401, 'Sesión expirada'));
  render(<ConnectedNavbar />);

  await waitFor(() => expect(clearSession).toHaveBeenCalledTimes(1));
  expect(authStore.reset).toHaveBeenCalled();
  expect(expiredListener).toHaveBeenCalledTimes(1);
});

it('HU-004: la página institucional pública no redirige por un 401 sin sesión', async () => {
  mockPathname = '/portal/institucional';
  fetchMock.mockRejectedValue(new SessionError(401, 'Sin sesión'));
  render(<ConnectedNavbar />);

  await waitFor(() => expect(clearSession).toHaveBeenCalledTimes(1));
  expect(authStore.reset).toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  expect(expiredListener).not.toHaveBeenCalled();
});

it('elimina todos los borradores al cerrar sesión desde la navbar', async () => {
  window.localStorage.setItem('umsspira:survey-draft:usuario-1', '{"workCondition":"works"}');
  window.localStorage.setItem('umsspira:survey-draft:usuario-2', '{"workCondition":"not-works"}');
  window.localStorage.setItem('configuracion-visual', 'preservada');

  render(<ConnectedNavbar />);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

  await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  expect(window.localStorage.getItem('umsspira:survey-draft:usuario-1')).toBeNull();
  expect(window.localStorage.getItem('umsspira:survey-draft:usuario-2')).toBeNull();
  expect(window.localStorage.getItem('configuracion-visual')).toBe('preservada');
});

it('mantiene el borrador cuando falla el logout desde la navbar', async () => {
  window.localStorage.setItem('umsspira:survey-draft:usuario-1', '{"workCondition":"works"}');
  jest.mocked(revokeCurrentSession).mockRejectedValueOnce(new Error('Sin conexión'));

  render(<ConnectedNavbar />);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar la sesión');
  expect(window.localStorage.getItem('umsspira:survey-draft:usuario-1')).not.toBeNull();
});

it('la portada institucional siempre muestra la barra de visitante, aunque haya sesión', async () => {
  mockPathname = '/portal/institucional';
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { email: 'ana@umss.edu', role: 'titulado' } }) } as Response);
  render(<ConnectedNavbar />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('Visitante')).toBeInTheDocument();
});

it('conserva la sesión al cambiar de página: no vuelve a mostrar la barra de visitante', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { email: 'ana@umss.edu', role: 'titulado' } }) } as Response);
  const first = render(<ConnectedNavbar />);
  expect(await screen.findByText('ana: titulado')).toBeInTheDocument();
  first.unmount();

  // Nueva página: el componente se monta de nuevo y la sesión ya se conoce desde el primer instante.
  mockPathname = '/profile/records';
  render(<ConnectedNavbar />);
  expect(screen.getByText('ana: titulado')).toBeInTheDocument();
  expect(screen.queryByText('Visitante')).not.toBeInTheDocument();
});