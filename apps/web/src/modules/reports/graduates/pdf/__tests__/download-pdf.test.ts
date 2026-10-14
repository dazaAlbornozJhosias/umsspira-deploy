import { downloadPdf } from '../utils/download-pdf';

describe('downloadPdf', () => {
  const createObjectURL = jest.fn(() => 'blob:reporte');
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('descarga el archivo con su nombre y no deja el enlace en la página', () => {
    let downloadedAs = '';
    let href = '';
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedAs = this.download;
      href = this.href;
    });
    const file = new Blob(['%PDF-1.3'], { type: 'application/pdf' });

    downloadPdf(file, 'reporte-titulados-verificados-20261001.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(downloadedAs).toBe('reporte-titulados-verificados-20261001.pdf');
    expect(href).toBe('blob:reporte');
    expect(document.querySelector('a')).toBeNull();
  });

  it('libera el archivo después, no en el acto', () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadPdf(new Blob(['%PDF-1.3']), 'reporte.pdf');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reporte');
  });
});
