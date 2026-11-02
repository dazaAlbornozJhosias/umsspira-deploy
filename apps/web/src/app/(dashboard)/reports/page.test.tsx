import { fireEvent, render, screen } from '@testing-library/react';
import ReportsPage from './page';

const mockGraduates = [
  {
    id: '1',
    registrationNumber: '#REG-2025-0001',
    fullName: 'Villarroel Antezana, Ana Gabriela',
    sisCode: '201702290',
    phone: '70000000',
    email: 'ana@example.com',
    admissionDate: '01/02/2020',
    degreeDate: '01/12/2025',
    studyDuration: '5 años',
    reviewDate: '25/10/2026',
    rejectionReason: null,
    status: 'VERIFICADO',
  },
  {
    id: '2',
    registrationNumber: '#REG-2025-0002',
    fullName: 'Ejemplo, Luis',
    sisCode: '202000013',
    phone: '70000000',
    email: 'luis@example.com',
    admissionDate: '01/02/2020',
    degreeDate: '01/12/2025',
    studyDuration: '5 años',
    reviewDate: '25/10/2026',
    rejectionReason: 'Falta documento legible',
    status: 'OBSERVADO',
  },
];

let mockIndicatorsError: string | null = null;
let mockGraduatesError: string | null = null;

jest.mock('../../../modules/reports/hooks/use-dashboard-indicators', () => ({
  useDashboardIndicators: () => ({
    data: {
      totalGraduates: 4,
      verifiedGraduates: 1,
      observedGraduates: 1,
      activeMentors: 1,
    },
    loading: false,
    error: mockIndicatorsError,
  }),
}));

jest.mock('../../../modules/reports/hooks/use-graduates', () => ({
  useGraduates: () => ({
    data: mockGraduatesError ? [] : mockGraduates,
    loading: false,
    error: mockGraduatesError,
  }),
}));

jest.mock('../../../modules/reports/graduates/pdf', () => ({
  GraduatesReportExport: ({ renderTrigger }: { renderTrigger: (props: { exportPdf: () => void; isGenerating: boolean }) => React.ReactNode }) =>
    renderTrigger({ exportPdf: jest.fn(), isGenerating: false }),
}));

jest.mock('../../../modules/reports/graduates/csv/graduate-csv-export', () => ({
  GraduateCsvExport: () => <button type="button">Exportar CSV</button>,
}));

describe('HU-004 / T4.2 QA Bug 3: Restablecimiento de filtros al salir y volver', () => {
  const REPORTS_LIST_STATE_KEY = 'umsspira:reports-liststate';
  const REPORTS_ACTIVE_TAB_KEY = 'umsspira:reports-active-tab';

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('elimina filtros residuales heredados de versiones anteriores en localStorage al montar', () => {
    window.localStorage.setItem(
      REPORTS_LIST_STATE_KEY,
      JSON.stringify({ status: 'OBSERVADO', search: 'Luis' }),
    );

    render(<ReportsPage />);

    expect(window.localStorage.getItem(REPORTS_LIST_STATE_KEY)).toBeNull();
  });

  it('restablece búsqueda y estado a los valores por defecto tras desmontar y volver a montar la página', () => {
    // 1. Primer montaje: el usuario navega a /reports y cambia a la pestaña "Titulados"
    const { unmount } = render(<ReportsPage />);

    const tabTitulados = screen.getByRole('button', { name: 'Titulados' });
    fireEvent.click(tabTitulados);

    // Verificamos que ambos graduados son visibles inicialmente (en tabla o tarjeta)
    expect(screen.getAllByText('Villarroel Antezana, Ana Gabriela').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ejemplo, Luis').length).toBeGreaterThan(0);

    // 2. El usuario aplica filtros (estado OBSERVADO y búsqueda "Luis")
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'OBSERVADO' } });

    const searchInput = screen.getByPlaceholderText('Buscar por código SIS o nombre del titulado...');
    fireEvent.change(searchInput, { target: { value: 'Luis' } });

    // La tabla ahora solo muestra al observado
    expect(screen.queryByText('Villarroel Antezana, Ana Gabriela')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ejemplo, Luis').length).toBeGreaterThan(0);
    expect((searchInput as HTMLInputElement).value).toBe('Luis');
    expect((statusSelect as HTMLSelectElement).value).toBe('OBSERVADO');

    // 3. El usuario sale de /reports (se desmonta el componente al navegar a otra ruta)
    unmount();

    // 4. El usuario regresa a /reports (se vuelve a montar el componente)
    render(<ReportsPage />);

    // Cambiamos nuevamente a la pestaña Titulados para inspeccionar los controles
    const tabTituladosRemount = screen.getByRole('button', { name: 'Titulados' });
    fireEvent.click(tabTituladosRemount);

    const searchInputRemount = screen.getByPlaceholderText('Buscar por código SIS o nombre del titulado...');
    const statusSelectRemount = screen.getByRole('combobox');

    // Criterio Bug 3: Los filtros inician en sus valores por defecto (vacío y TODOS)
    expect((searchInputRemount as HTMLInputElement).value).toBe('');
    expect((statusSelectRemount as HTMLSelectElement).value).toBe('TODOS');

    // Y ambos graduados vuelven a ser visibles
    expect(screen.getAllByText('Villarroel Antezana, Ana Gabriela').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ejemplo, Luis').length).toBeGreaterThan(0);

    // No se guardó ningún estado persistente de filtros en localStorage
    expect(window.localStorage.getItem(REPORTS_LIST_STATE_KEY)).toBeNull();
  });

  it('permite limpiar los filtros manualmente con el botón de restablecimiento', () => {
    render(<ReportsPage />);

    const tabTitulados = screen.getByRole('button', { name: 'Titulados' });
    fireEvent.click(tabTitulados);

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'OBSERVADO' } });

    const searchInput = screen.getByPlaceholderText('Buscar por código SIS o nombre del titulado...');
    fireEvent.change(searchInput, { target: { value: 'Luis' } });

    expect((searchInput as HTMLInputElement).value).toBe('Luis');
    expect((statusSelect as HTMLSelectElement).value).toBe('OBSERVADO');

    // Clic en el botón "Limpiar filtros"
    const resetButton = screen.getByRole('button', { name: 'Limpiar filtros' });
    fireEvent.click(resetButton);

    expect((searchInput as HTMLInputElement).value).toBe('');
    expect((statusSelect as HTMLSelectElement).value).toBe('TODOS');
    expect(screen.getAllByText('Villarroel Antezana, Ana Gabriela').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ejemplo, Luis').length).toBeGreaterThan(0);
  });

  it('conserva la pestaña activa seleccionada entre montajes sin afectar el reseteo de filtros', () => {
    window.localStorage.setItem(REPORTS_ACTIVE_TAB_KEY, 'graduates');

    render(<ReportsPage />);

    // Se monta directamente en la pestaña Titulados
    expect(screen.getByPlaceholderText('Buscar por código SIS o nombre del titulado...')).toBeInTheDocument();
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('TODOS');
  });
});

describe('HU-004 CA-08: error al conectar con la base de datos en reportería', () => {
  const BANNER = 'No se pudo conectar con el servidor. Verifique su conexión o intente más tarde';

  beforeEach(() => window.localStorage.clear());

  afterEach(() => {
    mockIndicatorsError = null;
    mockGraduatesError = null;
    window.localStorage.clear();
  });

  it('el dashboard muestra el banner de conexión en lugar de los indicadores', () => {
    mockIndicatorsError = 'No se pudieron cargar los indicadores';
    render(<ReportsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(BANNER);
    expect(screen.queryByText('Titulados registrados')).toBeNull();
  });

  it('la pestaña Titulados muestra el banner y no una lista vacía', () => {
    mockGraduatesError = 'No se pudo cargar el padrón de titulados';
    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Titulados' }));
    expect(screen.getByRole('alert')).toHaveTextContent(BANNER);
    expect(screen.queryByPlaceholderText('Buscar por código SIS o nombre del titulado...')).toBeNull();
  });
});
