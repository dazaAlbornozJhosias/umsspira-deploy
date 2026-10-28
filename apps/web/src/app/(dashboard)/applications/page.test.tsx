import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApplicationsPage from './page';
import { fetchApplicationsBoard } from '@/modules/applications/frontend/services/applications-board.service';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/applications',
  useSearchParams: () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const [search, setSearch] = React.useState(() => window.location.search);
    React.useEffect(() => {
      const updateSearch = () => setSearch(window.location.search);
      window.addEventListener('popstate', updateSearch);
      return () => window.removeEventListener('popstate', updateSearch);
    }, []);
    return new URLSearchParams(search);
  },
}));

const mockRouter = {
  replace: (url: string) => {
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
};

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
      careerId: 'c-1', status: 'PENDIENTE', submittedAt: new Date(Date.now() - 54 * 3_600_000).toISOString(),
    },
  ],
  total: 1, page: 1, pageSize: 15,
};

describe('ApplicationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/applications');
    // Reemplazar la línea 56 por:
(globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
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

  it('conserva la búsqueda aplicada al cambiar de carrera', async () => {
    mockedFetchBoard.mockResolvedValue({ ok: true, data: boardPage });
    
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
     ok: true,
     json: async () => ({ data: [{ id: 'c-1', nombre: 'Ingeniería de Sistemas' }] }),
     });
    render(<ApplicationsPage />);
    await screen.findByText('Bandeja de Solicitudes');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'Alejandro' } });
    await waitFor(() =>
      expect(mockedFetchBoard).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Alejandro', page: 1 }),
      ),
    );

    fireEvent.change(await screen.findByLabelText('Carrera'), {
      target: { value: 'Ingeniería de Sistemas' },
    });

    await waitFor(() =>
      expect(mockedFetchBoard).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Alejandro',
          career: 'Ingeniería de Sistemas',
          page: 1,
        }),
      ),
    );
  });

  it('sincroniza página, tamaño y filtros con la URL', async () => {
    window.history.replaceState(
      {},
      '',
      '/applications?page=3&size=10&q=ana&career=Sistemas&status=PENDIENTE',
    );
    mockedFetchBoard.mockImplementation(async (query: {
      page: number;
      pageSize: number;
      search?: string;
      career?: string;
      status?: string;
    }) => ({
      ok: true,
      data: { ...boardPage, total: 100, page: query.page, pageSize: query.pageSize },
    }));
    render(<ApplicationsPage />);

    await waitFor(() =>
      expect(mockedFetchBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          pageSize: 10,
          search: 'ana',
          career: 'Sistemas',
          status: 'PENDIENTE',
        }),
      ),
    );

    fireEvent.change(await screen.findByLabelText('Filas por página'), {
      target: { value: '25' },
    });

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get('page')).toBeNull();
      expect(params.get('size')).toBe('25');
      expect(params.get('q')).toBe('ana');
      expect(params.get('career')).toBe('Sistemas');
      expect(params.get('status')).toBe('PENDIENTE');
      expect(mockedFetchBoard).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 25,
          search: 'ana',
          career: 'Sistemas',
          status: 'PENDIENTE',
        }),
      );
    });
  });

  it('conserva búsqueda, carrera, estado y tamaño al cambiar de página', async () => {
    window.history.replaceState(
      {},
      '',
      '/applications?page=2&size=25&q=ana&career=Sistemas&status=PENDIENTE',
    );
    mockedFetchBoard.mockImplementation(async (query: {
      page: number;
      pageSize: number;
      search?: string;
      career?: string;
      status?: string;
    }) => ({
      ok: true,
      data: { ...boardPage, total: 100, page: query.page, pageSize: query.pageSize },
    }));
    render(<ApplicationsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Página siguiente' }));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get('page')).toBe('3');
      expect(params.get('size')).toBe('25');
      expect(params.get('q')).toBe('ana');
      expect(params.get('career')).toBe('Sistemas');
      expect(params.get('status')).toBe('PENDIENTE');
      expect(mockedFetchBoard).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 3,
          pageSize: 25,
          search: 'ana',
          career: 'Sistemas',
          status: 'PENDIENTE',
        }),
      );
    });
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
        careerId: 'c-1', status: 'PENDIENTE', submittedAt: new Date().toISOString(),
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