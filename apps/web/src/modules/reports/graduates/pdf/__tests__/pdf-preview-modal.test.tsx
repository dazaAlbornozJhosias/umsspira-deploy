import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode, useEffect, useRef } from 'react';
import { PdfPreviewModal } from '../components/pdf-preview-modal';
import { downloadPdf } from '../utils/download-pdf';
import { disposePrintFrame, printPdf } from '../utils/print-pdf';

// react-pdf dibuja con un worker del navegador; en las pruebas se simula un PDF de 7 páginas.
// Como el react-pdf real, avisa una sola vez que el documento cargó (o que no se pudo leer).
let mockViewer: 'ok' | 'loadError' | 'crash' = 'ok';

interface MockDocumentProps {
  children: ReactNode;
  onLoadSuccess: (pdf: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
}

jest.mock('../lib/pdf-worker', () => ({}));
jest.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError }: MockDocumentProps) => {
    const hasLoaded = useRef(false);
    if (mockViewer === 'crash') throw new TypeError('Promise.withResolvers is not a function');
    useEffect(() => {
      if (hasLoaded.current) return;
      hasLoaded.current = true;
      if (mockViewer === 'loadError') onLoadError(new Error('Setting up fake worker failed'));
      else onLoadSuccess({ numPages: 7 });
    });
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="pdf-page">Página {pageNumber}</div>,
}), { virtual: true });
jest.mock('../utils/download-pdf', () => ({ downloadPdf: jest.fn() }));
jest.mock('../utils/print-pdf', () => ({ printPdf: jest.fn(), disposePrintFrame: jest.fn() }));

// jsdom no trae ResizeObserver; se simula un área de 1000 x 700
beforeAll(() => {
  global.ResizeObserver = class {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ contentRect: { width: 1000, height: 700 } } as ResizeObserverEntry], this);
    }
    disconnect() {}
    unobserve() {}
  };
});

const file = new Blob(['%PDF-1.3'], { type: 'application/pdf' });
const fileName = 'reporte-titulados-verificados-20261001.pdf';

function renderModal() {
  const props = { onClose: jest.fn(), onLoaded: jest.fn() };
  const view = render(
    <>
      <button type="button">Detrás</button>
      <PdfPreviewModal file={file} fileName={fileName} {...props} />
    </>,
  );
  return { ...props, ...view };
}

describe('PdfPreviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewer = 'ok';
  });

  it('muestra el nombre del archivo, la página actual y el total, y avisa que cargó', () => {
    const { onLoaded } = renderModal();

    expect(screen.getByText(fileName)).toBeInTheDocument();
    expect(screen.getAllByText('1 / 7').length).toBeGreaterThan(0);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('cambia de página y desactiva las flechas en la primera y en la última', () => {
    renderModal();
    const [previous] = screen.getAllByRole('button', { name: 'Página anterior' });
    const [next] = screen.getAllByRole('button', { name: 'Página siguiente' });

    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(screen.getAllByText('2 / 7').length).toBeGreaterThan(0);
    expect(screen.getByTestId('pdf-page')).toHaveTextContent('Página 2');

    for (let i = 0; i < 5; i++) fireEvent.click(next);
    expect(screen.getAllByText('7 / 7').length).toBeGreaterThan(0);
    expect(next).toBeDisabled();
  });

  it('Descargar baja el mismo PDF con su nombre', () => {
    renderModal();

    fireEvent.click(screen.getAllByRole('button', { name: /descargar/i })[0]);

    expect(downloadPdf).toHaveBeenCalledWith(file, fileName);
  });

  it('Imprimir manda a imprimir el mismo PDF', () => {
    renderModal();

    fireEvent.click(screen.getAllByRole('button', { name: /imprimir/i })[0]);

    expect(printPdf).toHaveBeenCalledWith(file);
  });

  it('Cerrar cierra la vista previa sin descargar nada', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(downloadPdf).not.toHaveBeenCalled();
  });

  it('Esc también cierra la vista previa', () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el foco entra en Cerrar y Tab no sale hacia la página de atrás', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: /cerrar/i });
    const buttons = Array.from(dialog.querySelectorAll('button:not([disabled])'));

    expect(close).toHaveFocus();

    (buttons[buttons.length - 1] as HTMLElement).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(buttons[buttons.length - 1]).toHaveFocus();
  });

  it('mientras está abierta bloquea el desplazamiento de la página y al cerrarse lo devuelve', () => {
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe('hidden');
    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(disposePrintFrame).toHaveBeenCalledTimes(1);
  });

  it('si el PDF no se puede leer, la ventana sigue abierta para descargar o imprimir', () => {
    mockViewer = 'loadError';
    const { onLoaded } = renderModal();

    expect(screen.getByRole('status')).toHaveTextContent(
      'No se pudo mostrar la vista previa. Puede descargar o imprimir el reporte.',
    );
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /descargar/i })[0]);
    expect(downloadPdf).toHaveBeenCalledWith(file, fileName);
  });

  it('si el visor falla (navegador sin soporte), no tumba la pantalla', () => {
    mockViewer = 'crash';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { onLoaded } = renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No se pudo mostrar la vista previa');
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button', { name: /imprimir/i }).length).toBeGreaterThan(0);
    consoleError.mockRestore();
  });
});
