import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { SubmissionSuccessModal } from './submission-success-modal';

const props = {
  submission: { idSolicitud: 'abcdef12-3456-4789-8123-456789abcdef', estado: 'Pendiente', mensaje: 'ok' },
  submittedAt: '2026-10-08T04:30:00.000Z',
  documentType: 'titulo_provision_nacional' as const,
  fullName: 'Juan Pérez Rojas',
  idNumber: '1234567',
  email: 'juanperez@gmail.com',
  fileName: 'titulo.pdf',
  fileSizeBytes: 2048,
  onGoHome: jest.fn(),
  onClose: jest.fn(),
};

describe('SubmissionSuccessModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('muestra el resumen del envío con los datos reales (CA-03.2)', () => {
    render(<SubmissionSuccessModal {...props} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¡Solicitud enviada con éxito!')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez Rojas')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
    expect(screen.getByText('ju****z@gmail.com')).toBeInTheDocument();
    expect(screen.getByText(/titulo.pdf/)).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra el texto informativo completo del expediente', () => {
    render(<SubmissionSuccessModal {...props} />);

    expect(
      screen.getByText(
        'Su expediente ha sido ingresado al sistema institucional de validación académica.',
      ),
    ).toBeInTheDocument();
  });

  it('no expone el código interno TIT ni la etiqueta N/A en la confirmación pública (CA-07.6)', () => {
    render(<SubmissionSuccessModal {...props} />);

    expect(screen.queryByText('Código de trámite')).not.toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });

  it('muestra un único título de confirmación y el resumen en una sola tarjeta', () => {
    render(<SubmissionSuccessModal {...props} />);

    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Resumen de la solicitud' })).toHaveLength(1);
  });

  it('va al inicio con el botón principal y cierra con la X', () => {
    render(<SubmissionSuccessModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(props.onGoHome).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});