import {
  EmptyReportException,
  fetchGraduatesReportPdf,
  getFileNameFromDisposition,
  ReportGenerationException,
} from '../services/graduates-report-service';

interface MockOptions {
  body?: unknown;
  disposition?: string;
  blobType?: string;
  jsonFails?: boolean;
}

function mockResponse(status: number, options: MockOptions = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'Content-Disposition' ? options.disposition ?? null : null) },
    blob: async () => new Blob(['%PDF-1.3'], { type: options.blobType ?? 'application/pdf' }),
    json: async () => {
      if (options.jsonFails) throw new SyntaxError('Unexpected token <');
      return options.body;
    },
  };
}

describe('graduates-report-service', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => jest.useRealTimers());

  it('pide el PDF del estado y devuelve el archivo con su nombre', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, { disposition: 'inline; filename="reporte-titulados-verificados-20261001.pdf"' }),
    );

    const result = await fetchGraduatesReportPdf('verified');

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/graduates-report/pdf?status=verified');
    expect(result.fileName).toBe('reporte-titulados-verificados-20261001.pdf');
    expect(result.file).toBeInstanceOf(Blob);
  });

  it('pide el PDF de la carrera del administrador cuando se indica', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { disposition: 'inline; filename="reporte.pdf"' }));

    await fetchGraduatesReportPdf('observed', 'c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3000/graduates-report/pdf?status=observed&careerId=c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d',
    );
  });

  it('pasa la señal para poder cancelar el pedido', async () => {
    fetchMock.mockResolvedValue(mockResponse(200));
    const controller = new AbortController();

    await fetchGraduatesReportPdf('verified', undefined, controller.signal);

    expect(fetchMock.mock.calls[0][1]).toEqual({ signal: controller.signal });
  });

  it('con 404 lanza EmptyReportException con el mensaje de la API', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(404, { body: { message: 'No hay titulados observados para exportar' } }),
    );

    const request = fetchGraduatesReportPdf('observed');

    await expect(request).rejects.toBeInstanceOf(EmptyReportException);
    await expect(request).rejects.toThrow('No hay titulados observados para exportar');
  });

  it('un 404 porque la ruta no existe es una falla, no «sin titulados»', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(404, { body: { message: 'Cannot GET /graduates-report/pdf?status=verified' } }),
    );

    const request = fetchGraduatesReportPdf('verified');

    await expect(request).rejects.toBeInstanceOf(ReportGenerationException);
    await expect(request).rejects.toThrow('No se pudo generar el reporte PDF. Intente nuevamente.');
  });

  it('un 404 que no viene de la API (sin mensaje) es una falla', async () => {
    fetchMock.mockResolvedValue(mockResponse(404, { jsonFails: true }));

    await expect(fetchGraduatesReportPdf('verified')).rejects.toBeInstanceOf(ReportGenerationException);
  });

  it('con 500 lanza ReportGenerationException', async () => {
    fetchMock.mockResolvedValue(mockResponse(500, { body: { message: 'Error' } }));

    await expect(fetchGraduatesReportPdf('verified')).rejects.toBeInstanceOf(ReportGenerationException);
  });

  it('si la respuesta no es un PDF lanza ReportGenerationException', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { blobType: 'text/html' }));

    await expect(fetchGraduatesReportPdf('verified')).rejects.toBeInstanceOf(ReportGenerationException);
  });

  it('sin conexión lanza ReportGenerationException', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchGraduatesReportPdf('verified')).rejects.toThrow(
      'No se pudo generar el reporte PDF. Intente nuevamente.',
    );
  });

  it('lee el nombre del archivo aunque llegue sin comillas', () => {
    expect(getFileNameFromDisposition('attachment; filename=reporte.pdf', 'verified')).toBe('reporte.pdf');
  });

  it('si no llega el nombre, lo arma con el formato reporte-titulados-ESTADO-AAAAMMDD.pdf', () => {
    expect(getFileNameFromDisposition(null, 'observed')).toMatch(/^reporte-titulados-observados-\d{8}\.pdf$/);
  });

  it('el nombre armado usa la fecha de Bolivia, no la de UTC', () => {
    // 20:30 del 1 de octubre en Bolivia: en UTC ya es 2 de octubre
    jest.useFakeTimers().setSystemTime(new Date('2026-10-02T00:30:00Z'));

    expect(getFileNameFromDisposition(null, 'verified')).toBe('reporte-titulados-verificados-20261001.pdf');
  });
});
