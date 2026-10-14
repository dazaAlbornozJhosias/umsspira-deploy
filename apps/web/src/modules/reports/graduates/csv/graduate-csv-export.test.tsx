import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GraduateCsvExport } from './graduate-csv-export';

const fetchMock = jest.fn();
const createObjectUrlMock = jest.fn(() => 'blob:graduate-csv');
const revokeObjectUrlMock = jest.fn();
const anchorClickMock = jest.fn();

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
  createObjectUrlMock.mockClear();
  revokeObjectUrlMock.mockClear();
  anchorClickMock.mockClear();
});

afterAll(() => {
  jest.restoreAllMocks();
});

test('muestra la cantidad de titulados verificados cuando ese filtro está activo', () => {
  render(
    <GraduateCsvExport
      totalRecords={15}
      filters={{ status: 'VERIFICADO' }}
      onPdfExport={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

  expect(screen.getByRole('menuitem', { name: /csv/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /pdf/i })).toBeInTheDocument();
  expect(
    screen.getByText('15 titulados verificados serán exportados.'),
  ).toBeInTheDocument();
});

test('muestra la cantidad de titulados observados cuando ese filtro está activo', () => {
  render(
    <GraduateCsvExport
      totalRecords={15}
      filters={{ status: 'OBSERVADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

  expect(
    screen.getByText('15 titulados observados serán exportados.'),
  ).toBeInTheDocument();
});

test('confirma, conserva estado y búsqueda y descarga el CSV', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    blob: jest.fn().mockResolvedValue(new Blob(['csv'], { type: 'text/csv' })),
    headers: {
      get: jest.fn((name: string) =>
        name.toLowerCase() === 'content-disposition'
          ? 'attachment; filename="nomina-egresados-observados-07102026.csv"'
          : null,
      ),
    },
  });

  render(
    <GraduateCsvExport
      totalRecords={1}
      filters={{ status: 'OBSERVADO', search: 'gomez' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Se exportarán 1 titulados observados con los filtros activos.',
    ),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /descargar csv/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/graduates-report/csv?status=OBSERVADO&search=gomez',
      { method: 'GET' },
    );
  });

  expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
  expect(anchorClickMock).toHaveBeenCalledTimes(1);
  expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:graduate-csv');
  expect(
    await screen.findByText('La nómina CSV fue generada correctamente.'),
  ).toBeInTheDocument();
});

test('TODOS se envía al backend para exportar la misma vista sin filtro de estado', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    blob: jest.fn().mockResolvedValue(new Blob(['csv'], { type: 'text/csv' })),
    headers: { get: jest.fn(() => null) },
  });

  render(
    <GraduateCsvExport
      totalRecords={30}
      filters={{ status: 'TODOS' }}
      apiBaseUrl="http://localhost:3000"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /descargar csv/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/graduates-report/csv?status=TODOS',
      { method: 'GET' },
    );
  });
});

test('no llama al backend cuando no existen titulados observados', () => {
  render(
    <GraduateCsvExport
      totalRecords={0}
      filters={{ status: 'OBSERVADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(
    'No hay titulados observados para exportar',
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('muestra el error de generación devuelto por la API y vuelve a habilitar la interfaz', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: jest.fn().mockResolvedValue({
      message: 'No se pudo generar el archivo CSV. Intente nuevamente.',
    }),
    headers: { get: jest.fn(() => null) },
  });

  render(
    <GraduateCsvExport
      totalRecords={10}
      filters={{ status: 'VERIFICADO' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /csv/i }));
  fireEvent.click(screen.getByRole('button', { name: /descargar csv/i }));

  expect(
    await screen.findByText(
      'No se pudo generar el archivo CSV. Intente nuevamente.',
    ),
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /descargar csv/i }),
    ).not.toBeDisabled();
  });
});

test('delega la opción PDF al flujo de HU4 cuando está disponible', () => {
  const onPdfExport = jest.fn();
  render(
    <GraduateCsvExport
      totalRecords={12}
      filters={{ status: 'VERIFICADO' }}
      onPdfExport={onPdfExport}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /pdf/i }));

  expect(onPdfExport).toHaveBeenCalledTimes(1);
});
