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
    expect(screen.getByText('ABCDEF12')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez Rojas')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
    expect(screen.getByText('ju****z@gmail.com')).toBeInTheDocument();
    expect(screen.getByText(/titulo.pdf/)).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('va al inicio con el botón principal y cierra con la X', () => {
    render(<SubmissionSuccessModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(props.onGoHome).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
