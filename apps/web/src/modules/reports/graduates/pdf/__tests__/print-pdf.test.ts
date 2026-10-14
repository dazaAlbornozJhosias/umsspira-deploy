import { disposePrintFrame, printPdf } from '../utils/print-pdf';

describe('printPdf', () => {
  const revokeObjectURL = jest.fn();
  let urlCount = 0;

  beforeEach(() => {
    urlCount = 0;
    revokeObjectURL.mockClear();
    URL.createObjectURL = jest.fn(() => `blob:reporte-${++urlCount}`);
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => disposePrintFrame());

  const file = new Blob(['%PDF-1.3'], { type: 'application/pdf' });

  it('carga el PDF en un iframe oculto y abre la impresión cuando termina de cargar', () => {
    printPdf(file);

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('src')).toBe('blob:reporte-1');
    expect(iframe).toHaveAttribute('aria-hidden', 'true');

    const print = jest.fn();
    Object.defineProperty(iframe, 'contentWindow', { value: { focus: jest.fn(), print } });
    iframe.onload?.(new Event('load'));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it('usa un solo iframe aunque se pulse Imprimir varias veces', () => {
    printPdf(file);
    printPdf(file);
    printPdf(file);

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('si el navegador no deja imprimir desde el iframe, no rompe la pantalla', () => {
    printPdf(file);
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentWindow', {
      value: {
        focus: jest.fn(),
        print: () => {
          throw new Error('bloqueado');
        },
      },
    });

    expect(() => iframe.onload?.(new Event('load'))).not.toThrow();
  });

  it('al cerrar la vista previa quita el iframe y libera el archivo', () => {
    printPdf(file);

    disposePrintFrame();

    expect(document.querySelector('iframe')).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reporte-1');
  });
});
