import { act, renderHook } from '@testing-library/react';
import { usePdfExport } from '../hooks/use-pdf-export';
import {
  EmptyReportException,
  fetchGraduatesReportPdf,
  ReportGenerationException,
} from '../services/graduates-report-service';
import { ReportPdfFile } from '../types/graduates-report.types';

jest.mock('../services/graduates-report-service', () => {
  const actual = jest.requireActual('../services/graduates-report-service');
  return { ...actual, fetchGraduatesReportPdf: jest.fn() };
});

const fetchMock = fetchGraduatesReportPdf as jest.MockedFunction<typeof fetchGraduatesReportPdf>;
const pdf: ReportPdfFile = { file: new Blob(['%PDF']), fileName: 'reporte.pdf' };

// Pedido que queda esperando, como una API lenta; falla cuando se lo cancela
function mockPendingRequest() {
  let resolve!: (value: ReportPdfFile) => void;
  fetchMock.mockImplementation(
    (_status, _careerId, signal) =>
      new Promise<ReportPdfFile>((onResolve, onReject) => {
        resolve = onResolve;
        signal?.addEventListener('abort', () => onReject(new ReportGenerationException()));
      }),
  );
  return { resolve: (value: ReportPdfFile) => resolve(value) };
}

describe('usePdfExport', () => {
  beforeEach(() => fetchMock.mockReset());
  afterEach(() => jest.useRealTimers());

  it('queda en «Generando…» hasta que la vista previa termina de cargar', async () => {
    fetchMock.mockResolvedValue(pdf);
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));

    expect(result.current.state).toBe('preview');
    expect(result.current.report?.fileName).toBe('reporte.pdf');
    expect(result.current.isGenerating).toBe(true);

    act(() => result.current.markPreviewLoaded());
    expect(result.current.isGenerating).toBe(false);
  });

  it('sin titulados pasa a «empty» con el mensaje de la API', async () => {
    fetchMock.mockRejectedValue(new EmptyReportException('No hay titulados observados para exportar'));
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('observed'));

    expect(result.current.state).toBe('empty');
    expect(result.current.alertMessage).toBe('No hay titulados observados para exportar');
    expect(result.current.isGenerating).toBe(false);
  });

  it('si falla la generación pasa a «error» y el botón se vuelve a habilitar', async () => {
    fetchMock.mockRejectedValue(new ReportGenerationException());
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));

    expect(result.current.state).toBe('error');
    expect(result.current.alertMessage).toBe('No se pudo generar el reporte PDF. Intente nuevamente.');
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.report).toBeNull();
  });

  it('cerrar la alerta vuelve al estado inicial', async () => {
    fetchMock.mockRejectedValue(new ReportGenerationException());
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));
    act(() => result.current.closeAlert());

    expect(result.current.state).toBe('idle');
    expect(result.current.alertMessage).toBe('');
  });

  it('cerrar la vista previa vuelve al estado inicial y suelta el archivo', async () => {
    fetchMock.mockResolvedValue(pdf);
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));
    act(() => result.current.closePreview());

    expect(result.current.state).toBe('idle');
    expect(result.current.report).toBeNull();
    expect(result.current.isGenerating).toBe(false);
  });

  it('si la ventana de la vista previa no abre, muestra el aviso de falla', async () => {
    fetchMock.mockResolvedValue(pdf);
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));
    act(() => result.current.failPreview());

    expect(result.current.state).toBe('error');
    expect(result.current.alertMessage).toBe('No se pudo generar el reporte PDF. Intente nuevamente.');
    expect(result.current.report).toBeNull();
  });

  it('si la API no responde, corta el pedido y muestra el aviso de falla', async () => {
    jest.useFakeTimers();
    mockPendingRequest();
    const { result } = renderHook(() => usePdfExport());

    act(() => {
      result.current.startExport('verified');
    });
    expect(result.current.isGenerating).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.isGenerating).toBe(false);
  });

  it('cancelar descarta el pedido en curso sin mostrar alerta', async () => {
    const request = mockPendingRequest();
    const { result } = renderHook(() => usePdfExport());

    act(() => {
      result.current.startExport('verified');
    });
    act(() => result.current.cancelExport());
    await act(async () => request.resolve(pdf));

    expect(result.current.state).toBe('idle');
    expect(result.current.report).toBeNull();
    expect(result.current.alertMessage).toBe('');
  });

  it('cancelar sin pedido en curso no cierra la vista previa', async () => {
    fetchMock.mockResolvedValue(pdf);
    const { result } = renderHook(() => usePdfExport());

    await act(() => result.current.startExport('verified'));
    act(() => result.current.cancelExport());

    expect(result.current.state).toBe('preview');
  });
});
