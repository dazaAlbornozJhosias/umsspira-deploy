import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ConfirmationContent } from './confirmation-content';
import { useRegistrationStore } from '@/modules/registration/frontend/store';

const CONFIRMATION = {
  estado: 'PENDING',
  fechaEnvio: '2026-10-24T10:45:00.000Z',
  nombreCompleto: 'Juan Carlos Pérez Mamani',
  ci: '6842109 CB',
  correoEnmascarado: 'ju****z@example.com',
  correo: 'juan.perez@example.com',
  plazoHoras: 48,
  tipoDocumento: 'titulo_provision_nacional' as const,
  nombreArchivo: 'titulo_academico.pdf',
};

describe('ConfirmationContent', () => {
  beforeEach(() => {
    localStorage.clear();
    useRegistrationStore.getState().reset();
  });

  it('muestra los datos de la solicitud entregada sin el código interno TIT (CA-07.6)', async () => {
    useRegistrationStore.getState().setConfirmation(CONFIRMATION);
    render(<ConfirmationContent />);

    expect(await screen.findByText('¡Solicitud enviada con éxito!')).toBeInTheDocument();
    expect(screen.getByText('Juan Carlos Pérez Mamani')).toBeInTheDocument();
    expect(screen.getByText('6842109 CB')).toBeInTheDocument();
    expect(screen.getByText('ju****z@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Código de trámite')).not.toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });

  it('avisa cuando no hay una entrega reciente en el navegador', async () => {
    render(<ConfirmationContent />);

    expect(await screen.findByText('No encontramos una solicitud reciente')).toBeInTheDocument();
  });
});
