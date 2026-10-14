import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MentorAreasPage } from './mentor-areas-page';
import { getMentorAreas, updateMentorAreas, MentorAreasError, type MentorArea } from '../services/mentor-areas-api';
import { clearAccessToken } from '@/shared/services/auth-session';

jest.mock('../services/mentor-areas-api', () => ({ ...jest.requireActual('../services/mentor-areas-api'), getMentorAreas: jest.fn(), updateMentorAreas: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
const push = jest.fn();
const replace = jest.fn();
const router = { push, replace };
jest.mock('next/navigation', () => ({ useRouter: () => router }));

const getAreas = jest.mocked(getMentorAreas);
const updateAreas = jest.mocked(updateMentorAreas);
const areas: MentorArea[] = [
  { id: '10000000-0000-4000-8000-000000000001', nombre: 'DevOps', descripcion: 'CI/CD y Docker.' },
  { id: '10000000-0000-4000-8000-000000000002', nombre: 'Bases de datos', descripcion: 'SQL y NoSQL.' },
  { id: '10000000-0000-4000-8000-000000000003', nombre: 'Ciberseguridad', descripcion: null },
  { id: '10000000-0000-4000-8000-000000000004', nombre: 'Arquitectura y diseño de software', descripcion: 'Patrones y microservicios.' },
  { id: '10000000-0000-4000-8000-000000000005', nombre: 'Desarrollo web', descripcion: 'Frontend y backend.' },
  { id: '10000000-0000-4000-8000-000000000006', nombre: 'Desarrollo móvil', descripcion: 'Android e iOS.' },
];

beforeEach(() => {
  jest.resetAllMocks();
  clearAccessToken();
  getAreas.mockResolvedValue({ areas, selectedIds: [] });
  updateAreas.mockImplementation(async selectedIds => ({ areas, selectedIds }));
});

it('muestra el catálogo ordenado alfabéticamente en la pantalla dedicada', async () => {
  render(<MentorAreasPage />);
  const list = await screen.findByRole('list', { name: 'Catálogo de áreas técnicas' });
  expect(within(list).getAllByRole('listitem').map(item => item.textContent)).toEqual([
    'Arquitectura y diseño de softwarePatrones y microservicios. Agregar',
    'Bases de datosSQL y NoSQL. Agregar',
    'Ciberseguridad Agregar',
    'Desarrollo móvilAndroid e iOS. Agregar',
    'Desarrollo webFrontend y backend. Agregar',
    'DevOpsCI/CD y Docker. Agregar',
  ]);
  expect(screen.getByRole('heading', { name: 'Áreas técnicas de especialidad' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Volver a Mi perfil/ })).toHaveAttribute('href', '/mentorship/profile');
});

it('selecciona y deselecciona cada área sin duplicarla', async () => {
  render(<MentorAreasPage />);
  const databases = await screen.findByRole('checkbox', { name: 'Bases de datos' });

  fireEvent.click(databases);
  expect(databases).toBeChecked();
  expect(screen.getByText('1 de 5 áreas seleccionadas')).toBeInTheDocument();
  fireEvent.click(databases);
  expect(databases).not.toBeChecked();
  expect(screen.getByText('0 de 5 áreas seleccionadas')).toBeInTheDocument();
});

it('limita la selección a cinco áreas y permite descartar cambios', async () => {
  render(<MentorAreasPage />);
  await screen.findByRole('list', { name: 'Catálogo de áreas técnicas' });
  const options = screen.getAllByRole('checkbox');
  options.slice(0, 5).forEach(option => fireEvent.click(option));
  expect(screen.getByText('5 de 5 áreas seleccionadas')).toBeInTheDocument();
  fireEvent.click(options[5]); expect(options[5]).not.toBeChecked(); expect(screen.getByRole('alert')).toHaveTextContent('Puedes seleccionar como máximo 5 áreas técnicas');

  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('link', { name: /Volver a Mi perfil/ })).toBeInTheDocument();
  expect(updateAreas).not.toHaveBeenCalled();
});

it('guarda las áreas elegidas y confirma el guardado', async () => {
  render(<MentorAreasPage />);
  const devops = await screen.findByRole('checkbox', { name: 'DevOps' });
  fireEvent.click(devops);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

  expect(updateAreas).toHaveBeenCalledWith([areas[0].id]);
  expect(await screen.findByRole('status')).toHaveTextContent('Áreas técnicas actualizadas correctamente');
});

it('sin sesión solicita autenticación y no ofrece usuarios ficticios', async () => {
  getAreas.mockRejectedValue(new Error('Inicia sesión para configurar tus áreas técnicas.'));
  render(<MentorAreasPage />);
  expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  expect(screen.queryByRole('button', { name: 'Entrar como mentor de prueba' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  expect(updateAreas).not.toHaveBeenCalled();
});

it('no inventa un catálogo si la API falla y permite reintentar', async () => {
  getAreas.mockRejectedValueOnce(new Error('No disponible'));
  render(<MentorAreasPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No disponible');
  expect(screen.queryByRole('list', { name: 'Catálogo de áreas técnicas' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByRole('checkbox', { name: 'DevOps' });
});

it('deshabilita guardar sin áreas y muestra el mínimo requerido', async () => {
  render(<MentorAreasPage />);
  await screen.findByRole('checkbox', { name: 'DevOps' });
  expect(screen.getByRole('alert')).toHaveTextContent('Debes seleccionar al menos un área técnica');
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

it('muestra el mensaje exacto para catálogo vacío', async () => {
  getAreas.mockResolvedValue({ areas: [], selectedIds: [] }); render(<MentorAreasPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No hay áreas técnicas disponibles. Contacta al administrador');
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

it('confirma el descarte al cancelar y restaura la selección guardada', async () => {
  getAreas.mockResolvedValue({ areas, selectedIds: [areas[0].id] }); render(<MentorAreasPage />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Bases de datos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Tienes cambios sin guardar. ¿Deseas descartarlos?');
  fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
  expect(screen.getByRole('checkbox', { name: 'Bases de datos' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));
  expect(screen.getByRole('checkbox', { name: 'Bases de datos' })).not.toBeChecked();
  expect(push).toHaveBeenCalledWith('/mentorship/profile'); expect(updateAreas).not.toHaveBeenCalled();
});

it('advierte sobre intereses y cancelar restaura las áreas sin guardar', async () => {
  getAreas.mockResolvedValue({ areas, selectedIds: [areas[0].id, areas[1].id], intereses: [{ id_area: areas[0].id, nombre: 'Docker' }] });
  render(<MentorAreasPage />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'DevOps' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Al quitar DevOps también se eliminarán los intereses: Docker');
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('checkbox', { name: 'DevOps' })).toBeChecked(); expect(updateAreas).not.toHaveBeenCalled();
});

it('si la API aún no informa intereses pide confirmación general antes de quitar áreas', async () => {
  getAreas.mockResolvedValue({ areas, selectedIds: [areas[0].id, areas[1].id] }); render(<MentorAreasPage />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'DevOps' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(updateAreas).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  expect(await screen.findByText('Áreas técnicas actualizadas correctamente')).toBeInTheDocument();
});

it('bloquea la edición durante el guardado y no duplica solicitudes', async () => {
  let resolve!: (value: { areas: MentorArea[]; selectedIds: string[] }) => void;
  updateAreas.mockReturnValue(new Promise(done => { resolve = done; })); render(<MentorAreasPage />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'DevOps' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(screen.getByRole('checkbox', { name: 'DevOps' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Guardando…' })); expect(updateAreas).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ areas, selectedIds: [areas[0].id] }));
});

it('mantiene el borrador y permite reintentar un guardado fallido', async () => {
  updateAreas.mockRejectedValueOnce(new Error('Error de conexión')); render(<MentorAreasPage />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'DevOps' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Error de conexión');
  expect(screen.getByRole('checkbox', { name: 'DevOps' })).toBeChecked(); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText('Áreas técnicas actualizadas correctamente');
});

it('redirige al inicio si la API rechaza el rol con 403', async () => {
  jest.useFakeTimers();
  try {
    getAreas.mockRejectedValue(new MentorAreasError('No tienes permisos para acceder a esta sección', 403));
    render(<MentorAreasPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permisos para acceder a esta sección');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await act(async () => { jest.advanceTimersByTime(2000); }); expect(replace).toHaveBeenCalledWith('/');
  } finally { jest.useRealTimers(); }
});
