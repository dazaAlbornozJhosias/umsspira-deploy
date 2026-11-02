import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardIndicators } from './use-dashboard-indicators';
import { useGraduates } from './use-graduates';
import { getDashboardIndicators, getGraduates } from '../services/reports.service';
import { SessionError } from '@/shared/services/auth-session';
import { SESSION_EXPIRED_EVENT } from '@/modules/auth/frontend/services/session-expired';

jest.mock('../services/reports.service', () => ({
  getDashboardIndicators: jest.fn(),
  getGraduates: jest.fn(),
}));

const expiredListener = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);
});

afterEach(() => window.removeEventListener(SESSION_EXPIRED_EVENT, expiredListener));

describe('HU-004 CA-06: sesión caducada al consultar reportería', () => {
  it('los indicadores con HTTP 401 abren la alerta de sesión expirada', async () => {
    jest.mocked(getDashboardIndicators).mockRejectedValue(new SessionError(401, 'Su sesión ha expirado'));
    const { result } = renderHook(() => useDashboardIndicators());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(expiredListener).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('el padrón de titulados con HTTP 401 abre la alerta de sesión expirada', async () => {
    jest.mocked(getGraduates).mockRejectedValue(new SessionError(401, 'Su sesión ha expirado'));
    const { result } = renderHook(() => useGraduates());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(expiredListener).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });
});
