import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GraduateCsvExport } from './graduate-csv-export';
import { setAccessToken, clearAccessToken } from '@/shared/services/auth-session';

const fetchMock = jest.fn();
const createObjectUrlMock = jest.fn(() => 'blob:graduate-csv');
const revokeObjectUrlMock = jest.fn();
const anchorClickMock = jest.fn();

function successfulResponse(
  filename = 'nomina-egresados-observados-07102026.csv',
) {
  return {
    ok: true,
    blob: jest.fn().mockResolvedValue(new Blob(['csv'], { type: 'text/csv' })),
    body: null,
    headers: {
      get: jest.fn((name: string) => {
        if (name.toLowerCase() === 'content-disposition') {
          return `attachment; filename="${filename}"`;
        }

        if (name.toLowerCase() === 'content-type') {
          return 'text/csv';
        }

        return null;
      }),
    },
  };
}

beforeAll(() => {
  Object.defineProperty(global, 'fetch', {
    writable: true,
    value: fetchMock,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: createObjectUrlMock,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: revokeObjectUrlMock,
  });
  jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(anchorClickMock);
});

beforeEach(() => {
  fetchMock.mockReset();
  setAccessToken('admin-token');
  createObjectUrlMock.mockClear();
  revokeObjectUrlMock.mockClear();
  anchorClickMock.mockClear();
});

afterEach(() => clearAccessToken());

afterAll(() => {
  jest.restoreAllMocks();
});

test('muestra la cantidad de titulados verificados cuando ese filtro está activo', () => {
  render(
    <GraduateCsvExport
      totalRecords={72}
      filters={{ status: 'VERIFICADO' }}
      onPdfExport={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

  expect(screen.getByRole('menuitem', { name: /csv/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /pdf/i })).toBeInTheDocument();
  expect(
    screen.getByText('72 titulados verificados serán exportados.'),
  ).toBeInTheDocument();
});

test('muestra nombre de archivo y botón Confirmar .csv en el modal', () => {
  render(
    <GraduateCsvExport
      totalRecords={18}
      filters={{ status: 'OBSERVADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Se exportarán 18 titulados observados con los filtros activos.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/^nomina-egresados-observados-\d{8}\.csv$/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /confirmar \.csv/i }),
  ).toBeInTheDocument();
});

test('muestra barra y porcentaje mientras se procesa la descarga', async () => {
  let resolveFetch: (value: unknown) => void = () => undefined;

  fetchMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
  );

  render(
    <GraduateCsvExport
      totalRecords={1}
      filters={{ status: 'VERIFICADO' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar \.csv/i }));

  const progressbar = await screen.findByRole('progressbar', {
    name: /progreso de descarga csv/i,
  });

  expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  expect(screen.getByText('0%')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /confirmar \.csv/i }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: /confirmar \.csv/i }),
  ).toHaveTextContent('Confirmar .csv');
  expect(screen.queryByText('Generando...')).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  resolveFetch(
    successfulResponse('nomina-egresados-verificados-07102026.csv'),
  );

  expect(
    await screen.findByText('Archivo CSV descargado'),
  ).toBeInTheDocument();
});

test('mantiene visible la barra aun cuando el CSV responde inmediatamente', async () => {
  fetchMock.mockResolvedValue(
    successfulResponse('nomina-egresados-verificados-07102026.csv'),
  );

  render(
    <GraduateCsvExport
      totalRecords={72}
      filters={{ status: 'VERIFICADO' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar \.csv/i }));

  expect(
    screen.getByRole('progressbar', {
      name: /progreso de descarga csv/i,
    }),
  ).toHaveAttribute('aria-valuenow', '0');
  expect(screen.getByText('0%')).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  expect(
    await screen.findByText('Archivo CSV descargado'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('nomina-egresados-verificados-07102026.csv'),
  ).toBeInTheDocument();
});

test('conserva estado y búsqueda, descarga el CSV y notifica el nombre final', async () => {
  fetchMock.mockResolvedValue(successfulResponse());

  render(
    <GraduateCsvExport
      totalRecords={1}
      filters={{ status: 'OBSERVADO', search: 'quispe' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar \.csv/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/reports/graduates/csv?status=OBSERVADA&search=quispe',
      { method: 'GET', headers: { Authorization: 'Bearer admin-token' } },
    );
  });

  expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
  expect(anchorClickMock).toHaveBeenCalledTimes(1);
  expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:graduate-csv');
  expect(
    await screen.findByText('Archivo CSV descargado'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('nomina-egresados-observados-07102026.csv'),
  ).toBeInTheDocument();

  const successNotification = screen.getByRole('status');
  expect(successNotification).toHaveClass('fixed', 'right-4', 'top-4');
  expect(
    screen.queryByText('La nómina CSV fue generada correctamente.'),
  ).not.toBeInTheDocument();
});

test('TODOS omite el filtro de estado al exportar', async () => {
  fetchMock.mockResolvedValue(
    successfulResponse('nomina-egresados-07102026.csv'),
  );

  render(
    <GraduateCsvExport
      totalRecords={90}
      filters={{ status: 'TODOS' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar \.csv/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/reports/graduates/csv?',
      { method: 'GET', headers: { Authorization: 'Bearer admin-token' } },
    );
  });
});

test('criterio 19 muestra el mensaje exacto si no hay egresados verificados', () => {
  render(
    <GraduateCsvExport
      totalRecords={0}
      filters={{ status: 'VERIFICADO', search: 'QA-SIN-RESULTADOS-999' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(
    'No hay egresados verificados para exportar',
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('no llama al backend cuando no existen egresados observados', () => {
  render(
    <GraduateCsvExport
      totalRecords={0}
      filters={{ status: 'OBSERVADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(
    'No hay egresados observados para exportar',
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('un fallo de red no expone Failed to fetch y muestra el mensaje esperado', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

  render(
    <GraduateCsvExport
      totalRecords={72}
      filters={{ status: 'VERIFICADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar \.csv/i }));

  expect(
    await screen.findByText(
      'No se pudo generar el archivo CSV. Intente nuevamente.',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
  expect(screen.getByText('No se descargó ningún archivo.')).toBeInTheDocument();

  const errorNotification = screen.getByRole('alert');
  expect(errorNotification).toHaveClass(
    'fixed',
    'right-4',
    'top-4',
    'bg-[#FFF4F0]',
  );
  expect(anchorClickMock).not.toHaveBeenCalled();

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /confirmar \.csv/i }),
    ).not.toBeDisabled();
  });
});

test('delega la opción PDF al flujo de HU4 cuando está disponible', () => {
  const onPdfExport = jest.fn();
  render(
    <GraduateCsvExport
      totalRecords={72}
      filters={{ status: 'VERIFICADO' }}
      onPdfExport={onPdfExport}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /pdf/i }));

  expect(onPdfExport).toHaveBeenCalledTimes(1);
});

test('mientras se genera el PDF muestra «Generando...» y deshabilita el botón Exportar', () => {
  render(
    <GraduateCsvExport
      totalRecords={12}
      filters={{ status: 'VERIFICADO' }}
      onPdfExport={jest.fn()}
      isPdfGenerating
    />,
  );

  const button = screen.getByRole('button', { name: /generando/i });
  expect(button).toBeDisabled();
  expect(screen.queryByRole('button', { name: /^exportar/i })).not.toBeInTheDocument();
});

test('sin estado seleccionado (TODOS) la opción PDF queda deshabilitada', () => {
  render(<GraduateCsvExport totalRecords={90} filters={{ status: 'TODOS' }} />);

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

  expect(screen.getByRole('menuitem', { name: /pdf/i })).toBeDisabled();
  expect(screen.getByText('Seleccione Verificados u Observados')).toBeInTheDocument();
});
