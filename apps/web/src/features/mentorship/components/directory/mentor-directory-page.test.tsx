import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MentorDirectoryPage } from './mentor-directory-page';
import { MentorDirectoryFilters } from './mentor-directory-filters';
import { getMentorDirectory } from '../../services/mentor-directory-api';
import { SessionError } from '@/shared/services/auth-session';
import type { DirectoryMentor, DirectoryPage } from '../../model/mentor-directory';

jest.mock('../../services/mentor-directory-api');
const load = jest.mocked(getMentorDirectory);
const catalog = [
  { id: 'software', name: 'Desarrollo de Software', description: '', topics: [{ id: 'api', name: 'APIs REST' }] },
  { id: 'data', name: 'Bases de Datos', description: '', topics: [{ id: 'sql', name: 'PostgreSQL' }] },
];
const mentor = (id: string): DirectoryMentor => ({ id, name: `Mentor ${id}`, photoUrl: null,
  description: 'Experiencia compartida con la comunidad.', availability: 'AVAILABLE', areas: [{ id: 'software', name: 'Desarrollo de Software' }],
});
const page = (ids = ['1'], total = ids.length): DirectoryPage => ({ mentors: ids.map(mentor), total, catalog, interestsSupported: false });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => { jest.resetAllMocks(); load.mockResolvedValue(page()); });

it('conserva la estructura de carga y después muestra datos públicos y enlaces', async () => {
  const pending = deferred<DirectoryPage>(); load.mockReturnValue(pending.promise);
  render(<MentorDirectoryPage />);
  expect(screen.getByRole('status')).toHaveTextContent('Buscando mentores...');
  expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeDisabled();
  expect(document.querySelectorAll('.directory-skeleton')).toHaveLength(6);
  await act(async () => pending.resolve(page()));
  expect(await screen.findByRole('article')).toHaveTextContent('Mentor 1');
  expect(screen.getByRole('link', { name: 'Ver perfil de Mentor 1' })).toHaveAttribute('href', '/mentorship/mentors/1');
  expect(screen.getByRole('link', { name: 'Explorar mentores' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('status')).toHaveTextContent('1 mentor encontrado');
});

it('muestra el vacío global sin confundirlo con una búsqueda sin coincidencias', async () => {
  load.mockResolvedValue(page([], 0)); render(<MentorDirectoryPage />);
  expect(await screen.findByText('Todavía no hay mentores disponibles')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver a Mentorías' })).toHaveAttribute('href', '/mentorship');
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});

it('reintenta una consulta fallida sin recargar la página', async () => {
  load.mockRejectedValueOnce(new Error('Servicio no disponible'));
  render(<MentorDirectoryPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el directorio de mentores');
  expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un problema al consultar los mentores. Revisa tu conexión e inténtalo nuevamente.');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Mentor 1')).toBeInTheDocument();
});

it('añade páginas sin duplicados, conserva las tarjetas durante la carga y oculta el botón al terminar', async () => {
  const pending = deferred<DirectoryPage>();
  load.mockResolvedValueOnce(page(['1', '2', '3', '4', '5', '6'], 8)).mockReturnValueOnce(pending.promise);
  render(<MentorDirectoryPage />); await screen.findByText('Mentor 1');
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más mentores' }));
  expect(screen.getAllByRole('article')).toHaveLength(6);
  expect(document.querySelectorAll('.directory-skeleton')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Cargando mentores...' })).toBeDisabled();
  await act(async () => pending.resolve(page(['6', '7', '8'], 8)));
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect(screen.queryByRole('button', { name: 'Cargar más mentores' })).not.toBeInTheDocument();
  expect(screen.getByText('Ya viste todos los mentores disponibles.')).toBeInTheDocument();
  expect(load).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 6 }), expect.any(AbortSignal));
});

it('permite reintentar una página adicional sin perder lo ya cargado', async () => {
  load.mockResolvedValueOnce(page(['1', '2', '3', '4', '5', '6'], 7))
    .mockRejectedValueOnce(new Error('Conexión interrumpida')).mockResolvedValueOnce(page(['7'], 7));
  render(<MentorDirectoryPage />); await screen.findByText('Mentor 1');
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más mentores' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Conexión interrumpida');
  expect(screen.getAllByRole('article')).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar cargar más mentores' }));
  await screen.findByText('Mentor 7');
  expect(load.mock.calls[2][0].offset).toBe(6);
});

it('aplica filtros explícitamente, reinicia la paginación y permite limpiar una búsqueda vacía', async () => {
  load.mockResolvedValueOnce(page()).mockResolvedValueOnce(page([], 0)).mockResolvedValueOnce(page());
  render(<MentorDirectoryPage />); await screen.findByText('Mentor 1');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bases de Datos' }));
  expect(load).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(await screen.findByText('No encontramos mentores con estos filtros')).toBeInTheDocument();
  expect(screen.queryByText('Todavía no hay mentores disponibles')).not.toBeInTheDocument();
  expect(load).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0, areaIds: ['data'] }), expect.any(AbortSignal));
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);
  await screen.findByText('Mentor 1');
  expect(screen.getByRole('checkbox', { name: 'Bases de Datos' })).not.toBeChecked();
});

it('ignora páginas obsoletas cuando se aplican otros filtros', async () => {
  const pending = deferred<DirectoryPage>();
  load.mockResolvedValueOnce(page(['1', '2', '3', '4', '5', '6'], 8)).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(page(['nuevo']));
  render(<MentorDirectoryPage />); await screen.findByText('Mentor 1');
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más mentores' }));
  const obsolete = load.mock.calls[1][1];
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bases de Datos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await screen.findByText('Mentor nuevo');
  expect(obsolete?.aborted).toBe(true);
  await act(async () => pending.resolve(page(['obsoleto'])));
  expect(screen.queryByText('Mentor obsoleto')).not.toBeInTheDocument();
});

it('agrupa intereses y elimina selecciones incompatibles antes de aplicar', () => {
  const onApply = jest.fn();
  render(<MentorDirectoryFilters catalog={catalog} applied={{ areaIds: [], topicIds: [] }} interestsSupported disabled={false} onApply={onApply} />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'PostgreSQL' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Desarrollo de Software' }));
  expect(screen.queryByRole('checkbox', { name: 'PostgreSQL' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'APIs REST' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(onApply).toHaveBeenCalledWith({ areaIds: ['software'], topicIds: ['api'] });
});

it('aborta la consulta al salir del directorio', async () => {
  load.mockReturnValue(new Promise(() => {}));
  const view = render(<MentorDirectoryPage />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  const signal = load.mock.calls[0][1]; view.unmount();
  expect(signal?.aborted).toBe(true);
});

it('expande las categorías restantes de intereses sin consultar ni modificar registros', () => {
  const groups = ['Desarrollo de Software', 'Bases de Datos', 'Ciberseguridad', 'Ciencia de Datos', 'Redes de Computadoras', 'DevOps', 'Gestión de Proyectos TI']
    .map((name, index) => ({ id: String(index), name, description: '', topics: [{ id: `topic-${index}`, name: `Interés ${name}` }] }));
  const onApply = jest.fn();
  render(<MentorDirectoryFilters catalog={groups} applied={{ areaIds: [], topicIds: [] }} interestsSupported disabled={false} onApply={onApply} />);
  expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeDisabled();
  expect(screen.queryByRole('checkbox', { name: 'Interés Ciencia de Datos' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más intereses' }));
  for (const name of ['Ciencia de Datos', 'Redes de Computadoras', 'DevOps', 'Gestión de Proyectos TI']) {
    expect(screen.getByRole('checkbox', { name: `Interés ${name}` })).toBeInTheDocument();
  }
  expect(screen.queryByRole('button', { name: 'Cargar más intereses' })).not.toBeInTheDocument();
  expect(onApply).not.toHaveBeenCalled();
});

it('orienta al inicio de sesión cuando expira el acceso sin confundirlo con vacío', async () => {
  load.mockRejectedValue(new SessionError(401, 'Inicia sesión para continuar'));
  render(<MentorDirectoryPage />);
  expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  expect(screen.queryByText('Todavía no hay mentores disponibles')).not.toBeInTheDocument();
});

it('mantiene la pantalla consultiva sin acciones de edición ni ordenamiento avanzado', async () => {
  render(<MentorDirectoryPage />); await screen.findByRole('article');
  expect(screen.queryByRole('combobox', { name: /Ordenar por/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /editar|eliminar|crear|publicar/i })).not.toBeInTheDocument();
});

it('CA-06 y CA-07 (Tarea 105): muestra únicamente los mentores que coinciden con los filtros aplicados', async () => {
  const mentorSoftware: DirectoryMentor = {
    id: 'm-soft',
    name: 'Carlos Software',
    description: 'Mentor en desarrollo web y apis',
    photoUrl: null,
    availability: 'AVAILABLE',
    areas: [{ id: 'software', name: 'Desarrollo de Software' }],
    interests: [{ id: 'api', name: 'APIs REST', areaId: 'software' }],
  };
  const mentorData: DirectoryMentor = {
    id: 'm-data',
    name: 'Diana Datos',
    description: 'Mentora en SQL y bases de datos',
    photoUrl: null,
    availability: 'AVAILABLE',
    areas: [{ id: 'data', name: 'Bases de Datos' }],
    interests: [{ id: 'sql', name: 'PostgreSQL', areaId: 'data' }],
  };

  load.mockResolvedValueOnce({
    mentors: [mentorSoftware, mentorData],
    total: 2,
    catalog,
    interestsSupported: true,
  });

  render(<MentorDirectoryPage />);
  await screen.findByText('Carlos Software');
  expect(screen.getByText('Diana Datos')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('2 mentores encontrados');

  // Aplicar filtro por Bases de Datos (solo Diana coincide)
  load.mockResolvedValueOnce({
    mentors: [mentorData],
    total: 1,
    catalog,
    interestsSupported: true,
  });

  fireEvent.click(screen.getByRole('checkbox', { name: 'Bases de Datos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

  await waitFor(() => {
    expect(screen.getByText('Diana Datos')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Software')).not.toBeInTheDocument();
  });
  expect(screen.getByRole('status')).toHaveTextContent('1 mentor encontrado');

  // Limpiar filtros (CA-06)
  load.mockResolvedValueOnce({
    mentors: [mentorSoftware, mentorData],
    total: 2,
    catalog,
    interestsSupported: true,
  });

  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

  await waitFor(() => {
    expect(screen.getByText('Carlos Software')).toBeInTheDocument();
    expect(screen.getByText('Diana Datos')).toBeInTheDocument();
  });
  expect(screen.getByRole('status')).toHaveTextContent('2 mentores encontrados');
});
