import {
  fetchApplicationsBoard,
  fetchApplicationsMetrics,
  fetchApplicationDetail,
  fetchDocumentUrl,
} from './applications-board.service';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

describe('applications-board.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken('admin-token');
  });
  afterEach(() => clearAccessToken());

  it('pide la bandeja con paginación y filtros (CA-04.1 y CA-04.2)', async () => {
    const page = { items: [], total: 0, page: 1, pageSize: 15 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: page }) });

    const result = await fetchApplicationsBoard({ page: 2, pageSize: 15, career: 'Sistemas', status: 'PENDIENTE', search: '20180' });

    expect(result).toEqual({ ok: true, data: page });
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/v1/applications?');
    expect(url).toContain('page=2');
    expect(url).toContain('career=Sistemas');
    expect(url).toContain('status=PENDIENTE');
    expect(url).toContain('search=20180');
  });

  it('envía el periodo personalizado y la gestión del semestre al backend', async () => {
    const page = { items: [], total: 0, page: 1, pageSize: 15 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: page }) });

    await fetchApplicationsBoard({
      page: 1,
      pageSize: 15,
      period: 'custom',
      from: '2026-10-01',
      to: '2026-10-24',
    });
    await fetchApplicationsBoard({
      page: 1,
      pageSize: 15,
      period: 'semester2',
      year: 2026,
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('period=custom'),
      expect.anything(),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('period=semester2'),
      expect.anything(),
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('from=2026-10-01');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('to=2026-10-24');
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('year=2026');
  });

  it('marca needsLogin cuando falta la sesión de administrador', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    const result = await fetchApplicationsBoard({ page: 1, pageSize: 15 });

    expect(result).toEqual(expect.objectContaining({ ok: false, needsLogin: true }));
  });

  it('trae el expediente y la URL privada del documento (CA-04.3)', async () => {
    const detail = { id: 's-1', fullName: 'Ana Rojas' };
    const signed = { url: '/api/v1/applications/s-1/document/content', requiresAuthentication: true };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: detail }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: signed }) });

    await expect(fetchApplicationDetail('s-1')).resolves.toEqual({ ok: true, data: detail });
    await expect(fetchDocumentUrl('s-1')).resolves.toEqual({ ok: true, data: signed });
    const [detailUrl] = (global.fetch as jest.Mock).mock.calls[0];
    const [docUrl] = (global.fetch as jest.Mock).mock.calls[1];
    expect(detailUrl).toContain('/api/v1/applications/s-1');
    expect(docUrl).toContain('/api/v1/applications/s-1/document');
  });

  it('consulta los indicadores mediante el endpoint administrativo', async () => {
    const metrics = {
      receivedToday: 3,
      pending: 12,
      urgent: 2,
      resolvedToday: 4,
      generatedAt: '2026-10-24T12:00:00.000Z',
      timeZone: 'America/La_Paz',
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: metrics }) });

    await expect(fetchApplicationsMetrics()).resolves.toEqual({ ok: true, data: metrics });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/applications/metrics',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
      }),
    );
  });
});
