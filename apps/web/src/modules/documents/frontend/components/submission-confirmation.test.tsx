import { render, screen } from '@testing-library/react';
import { SubmissionConfirmation } from './submission-confirmation';

const props = {
  submittedAt: '2026-10-01T15:30:00Z',
  documentType: 'national-title' as const,
  fullName: 'Juan Pérez Rojas',
  idNumber: '1234567',
  email: 'juanperez@gmail.com',
};

describe('SubmissionConfirmation', () => {
  it('muestra los datos de la solicitud', () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByRole('region', { name: 'Resumen de la solicitud' })).toBeTruthy();
    expect(screen.getByText('Título en Provisión Nacional')).toBeTruthy();
    expect(screen.getByText('Juan Pérez Rojas')).toBeTruthy();
    expect(screen.getByText('1234567')).toBeTruthy();
  });

  it('muestra el correo enmascarado y no el completo', () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText('ju****z@gmail.com')).toBeTruthy();
    expect(screen.queryByText('juanperez@gmail.com')).toBeNull();
  });

  it('informa el plazo de respuesta de 48 horas', () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText(/48 horas/)).toBeTruthy();
  });

  it('no falla y avisa cuando la fecha de envío es inválida', () => {
    render(<SubmissionConfirmation {...props} submittedAt="no-es-una-fecha" />);
    expect(screen.getByText('Fecha no disponible')).toBeTruthy();
  });

  it('no expone el código interno TIT ni la etiqueta N/A (CA-07.6)', () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.queryByText('Código de trámite')).toBeNull();
    expect(screen.queryByText('N/A')).toBeNull();
  });

  it('muestra archivo adjunto y estado cuando se reciben', () => {
    render(
      <SubmissionConfirmation
        {...props}
        fileName="titulo.pdf"
        fileSizeLabel="2.0 KB"
        status="Pendiente"
      />,
    );
    expect(screen.getByText('titulo.pdf (2.0 KB)')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
  });

  it('omite las filas opcionales cuando no se reciben', () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.queryByText('Documento adjunto')).toBeNull();
    expect(screen.queryByText('Estado del proceso')).toBeNull();
  });

  it('presenta los datos en el orden del mockup', () => {
    const { container } = render(
      <SubmissionConfirmation
        {...props}
        fileName="titulo.pdf"
        fileSizeLabel="2.0 KB"
        status="Pendiente"
      />,
    );
    const labels = Array.from(container.querySelectorAll('dt')).map((term) => term.textContent);
    expect(labels).toEqual([
      'Postulante',
      'C.I.',
      'Correo',
      'Documento adjunto',
      'Tipo de documento',
      'Fecha y hora',
      'Estado del proceso',
    ]);
  });
});