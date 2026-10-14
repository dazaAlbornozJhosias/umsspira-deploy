import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode, useEffect, useRef } from 'react';
import { GraduatesReportExport } from '../index';
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
jest.mock('../lib/pdf-worker', () => ({}));
jest.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess }: { children: ReactNode; onLoadSuccess: (pdf: { numPages: number }) => void }) => {
    const hasLoaded = useRef(false);
    useEffect(() => {
      if (hasLoaded.current) return;
      hasLoaded.current = true;
      onLoadSuccess({ numPages: 3 });
    });
    return <div>{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => <div>Página {pageNumber}</div>,
}), { virtual: true });

const fetchMock = fetchGraduatesReportPdf as jest.MockedFunction<typeof fetchGraduatesReportPdf>;
const pdf: ReportPdfFile = {
  file: new Blob(['%PDF-1.3'], { type: 'application/pdf' }),
  fileName: 'reporte-titulados-verificados-20261001.pdf',
};

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
  window.scrollTo = jest.fn();
});

function openMenuAndExport(option: RegExp = /pdf/i) {
  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: option }));
}

describe('GraduatesReportExport', () => {
  beforeEach(() => fetchMock.mockReset());

  it('exporta el estado del filtro, muestra la vista previa y al cerrar vuelve al inicio de la lista', async () => {
    fetchMock.mockResolvedValue(pdf);
    const onBackToListStart = jest.fn();
    render(<GraduatesReportExport status="verified" careerId="carrera-1" onBackToListStart={onBackToListStart} />);

    openMenuAndExport();

    expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith('verified', 'carrera-1', expect.any(AbortSignal));
    expect(await screen.findByRole('dialog')).toHaveTextContent(pdf.fileName);

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onBackToListStart).toHaveBeenCalledTimes(1);
    const exportButton = screen.getByRole('button', { name: /exportar/i });
    expect(exportButton).toBeEnabled();
    expect(exportButton).toHaveFocus();
  });

  it('sin estado deja elegir entre verificados y observados', async () => {
    fetchMock.mockResolvedValue(pdf);
    render(<GraduatesReportExport />);

    openMenuAndExport(/pdf de observados/i);

    expect(fetchMock).toHaveBeenCalledWith('observed', undefined, expect.any(AbortSignal));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('sin titulados muestra la alerta y Entendido devuelve el foco al botón', async () => {
    fetchMock.mockRejectedValue(new EmptyReportException('No hay titulados observados para exportar'));
    render(<GraduatesReportExport status="observed" />);

    openMenuAndExport();

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('No hay titulados observados para exportar');
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toHaveFocus();
  });

  it('si falla la generación muestra el aviso y deja volver a intentar', async () => {
    fetchMock.mockRejectedValue(new ReportGenerationException());
    render(<GraduatesReportExport status="verified" />);

    openMenuAndExport();

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'No se pudo generar el reporte PDF. Intente nuevamente.',
    );
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(screen.getByRole('button', { name: /exportar/i })).toBeEnabled();
  });

  it('si cambia el filtro mientras genera, descarta ese PDF', async () => {
    let resolve!: (value: ReportPdfFile) => void;
    fetchMock.mockImplementation(() => new Promise<ReportPdfFile>((onResolve) => (resolve = onResolve)));
    const { rerender } = render(<GraduatesReportExport status="verified" />);

    openMenuAndExport();
    expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled();

    rerender(<GraduatesReportExport status="observed" />);
    resolve(pdf);

    await waitFor(() => expect(screen.getByRole('button', { name: /exportar/i })).toBeEnabled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('acepta otro botón (menú de la HU5) y mantiene la vista previa', async () => {
    fetchMock.mockResolvedValue(pdf);
    render(
      <GraduatesReportExport
        renderTrigger={({ exportPdf, isGenerating }) => (
          <button type="button" disabled={isGenerating} onClick={() => exportPdf('verified')}>
            PDF desde otro menú
          </button>
        )}
      />,
    );

    expect(screen.queryByRole('button', { name: /^exportar$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /pdf desde otro menú/i }));

    expect(fetchMock).toHaveBeenCalledWith('verified', undefined, expect.any(AbortSignal));
    expect(await screen.findByRole('dialog')).toHaveTextContent(pdf.fileName);
  });
});
