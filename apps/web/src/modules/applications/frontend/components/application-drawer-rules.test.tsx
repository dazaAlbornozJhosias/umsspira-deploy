import { fireEvent, render, screen } from '@testing-library/react';
import { ApplicationDrawer } from './application-drawer';
import { fetchApplicationDetail, fetchDocumentUrl } from '../services/applications-board.service';

jest.mock('../services/applications-board.service', () => ({
  fetchApplicationDetail: jest.fn(), fetchDocumentUrl: jest.fn(),
}));
jest.mock('./application-detail', () => ({
  ApplicationDetail: () => <p>Documento del expediente</p>,
  OVERDUE_HOURS: 48, hoursSince: () => 0, STATUS_LABEL: { PENDIENTE: 'Pendiente' },
}));
jest.mock('./observe-dialog', () => ({ ObserveDialog: ({ open }: { open: boolean }) => open ? <p>Formulario observar</p> : null }));
jest.mock('./approve-dialog', () => ({ ApproveDialog: () => null }));
jest.mock('./reject-dialog', () => ({ RejectDialog: () => null }));

describe('T-11.3 acciones del administrador', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchDocumentUrl as jest.Mock).mockResolvedValue({ ok: true, data: { url: 'https://example.com/file.pdf' } });
  });
  it.each([0, 1, 2, 3])('aplica el límite con %i observaciones', async (observations) => {
    (fetchApplicationDetail as jest.Mock).mockResolvedValue({ ok: true, data: {
      id: 'id', status: 'PENDIENTE', firstName: 'Ana', lastName: 'Perez',
      reviewSummary: { observations, maxObservations: 2, rejections: 0, maxRejections: 5,
        latestObservation: null, canObserve: observations < 2 },
    } });
    render(<ApplicationDrawer open applicationId="id" onClose={jest.fn()} />);
    const observe = await screen.findByRole('button', { name: 'Observar' });
    if (observations < 2) {
      expect(observe).toBeEnabled();
      fireEvent.click(observe);
      expect(screen.getByText('Formulario observar')).toBeInTheDocument();
    } else {
      expect(observe).toBeDisabled();
      fireEvent.click(observe);
      expect(screen.queryByText('Formulario observar')).not.toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeEnabled();
  });
});
