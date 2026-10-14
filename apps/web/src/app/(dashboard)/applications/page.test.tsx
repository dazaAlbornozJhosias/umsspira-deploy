import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApplicationsPage from './page';
import { fetchApplicationsBoard } from '@/modules/applications/frontend/services/applications-board.service';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

jest.mock('@/modules/applications/frontend/services/applications-board.service', () => ({
  fetchApplicationsBoard: jest.fn(),
  fetchApplicationDetail: jest.fn(),
  fetchDocumentUrl: jest.fn(),
}));

const mockedFetchBoard = fetchApplicationsBoard as jest.Mock;

const boardPage = {
  items: [
    {
      id: 's-1', code: 'EGR-2025-ABCDEF', fullName: 'Alejandro Rojas', email: 'a@x.com',
      ci: '6849201', issuedIn: '', sisCode: '201804921', career: 'Ingeniería de Sistemas',
      careerId: 'c-1', status: 'PENDING', submittedAt: new Date(Date.now() - 54 * 3_600_000).toISOString(),
    },
  ],
  total: 1, page: 1, pageSize: 15,
};

describe('ApplicationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('muestra la bandeja con el total y la alerta de +48 horas (CA-04.1)', async () => {
    mockedFetchBoard.mockResolvedValue({ ok: true, data: boardPage });
    render(<ApplicationsPage />);

    expect(await screen.findByText('Bandeja de Solicitudes')).toBeInTheDocument();
    expect(screen.getByText('1 en total')).toBeInTheDocument();
    expect(screen.getByText('Alejandro Rojas')).toBeInTheDocument();
    expect(screen.getByText('Alerta >48h')).toBeInTheDocument();
  });

  it('filtra por texto y muestra el estado vacío con opción de limpiar (CA-04.2)', async () => {
    mockedFetchBoard.mockResolvedValue({ ok: true, data: { ...boardPage, items: [], total: 0 } });
    render(<ApplicationsPage />);
    await screen.findByText('Bandeja de Solicitudes');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'sin-coincidencias' } });

    await waitFor(() => expect(mockedFetchBoard).toHaveBeenCalledWith(expect.objectContaining({ search: 'sin-coincidencias', page: 1 })));
    expect(await screen.findByText('No hay solicitudes que coincidan con los filtros.')).toBeInTheDocument();
  });

  it('pide iniciar sesión cuando la API responde 401', async () => {
    mockedFetchBoard.mockResolvedValue({ ok: false, status: 401, needsLogin: true, message: 'No autorizado' });
    render(<ApplicationsPage />);

    expect(await screen.findByRole('link', { name: 'Ir al inicio de sesión' })).toBeInTheDocument();
  });

  it('abre el expediente al seleccionar una fila (CA-04.3)', async () => {
    mockedFetchBoard.mockResolvedValue({ ok: true, data: boardPage });
    const { fetchApplicationDetail, fetchDocumentUrl } = jest.requireMock(
      '@/modules/applications/frontend/services/applications-board.service',
    ) as { fetchApplicationDetail: jest.Mock; fetchDocumentUrl: jest.Mock };
    fetchApplicationDetail.mockResolvedValue({
      ok: true,
      data: {
        id: 's-1', code: 'EGR-2025-ABCDEF', fullName: 'Alejandro Rojas', email: 'a@x.com',
        ci: '6849201', issuedIn: '', sisCode: '201804921', career: 'Ingeniería de Sistemas',
        careerId: 'c-1', status: 'PENDING', submittedAt: new Date().toISOString(),
        firstName: 'Alejandro', lastName: 'Rojas', phone: '', graduationYear: 2020,
        documentName: 'titulo.pdf', documentPath: 'solicitudes/x/y.pdf', documentFormat: 'PDF',
      },
    });
    fetchDocumentUrl.mockResolvedValue({ ok: true, data: { url: 'https://firmada.local/d.pdf', expiresIn: 300 } });
    render(<ApplicationsPage />);

    fireEvent.click(await screen.findByText('Alejandro Rojas'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Abrir documento en otra pestaña' })).toHaveAttribute(
      'href',
      'https://firmada.local/d.pdf',
    );
  });
});
