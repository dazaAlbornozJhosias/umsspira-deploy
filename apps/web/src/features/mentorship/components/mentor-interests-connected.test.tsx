import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MentorInterestsConnected } from './mentor-interests-connected';
import { getMentorProfile } from '../services/mentorship-api';
import { getMentorInterests, saveMentorInterests } from '../services/mentor-interests-api';

jest.mock('../services/mentorship-api');
jest.mock('../services/mentor-interests-api');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const getProfile = jest.mocked(getMentorProfile);
const getInterests = jest.mocked(getMentorInterests);
const save = jest.mocked(saveMentorInterests);
const state = {
  catalog: [{ id: 'root', name: 'Backend real', description: '', topics: [{ id: 'rest', name: 'REST real' }] }],
  configuration: { areaIds: ['root'], topicIds: [] },
};

beforeEach(() => {
  jest.resetAllMocks();
  getProfile.mockResolvedValue({ isActive: true, requirements: { egresado: true } });
  getInterests.mockResolvedValue(state);
  save.mockImplementation(async next => next);
});

it('carga el catálogo real y guarda solo tras confirmar', async () => {
  render(<MentorInterestsConnected />);
  expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  fireEvent.click(await screen.findByRole('button', { name: 'REST real' }));
  expect(screen.getByRole('button', { name: 'Quitar área' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Intereses guardados correctamente');
  expect(save).toHaveBeenCalledWith({ areaIds: ['root'], topicIds: ['rest'] });
  expect(screen.queryByText(/Vista de prueba/)).not.toBeInTheDocument();
});

it('muestra un fallo de carga y permite reintentar sin inventar un catálogo', async () => {
  getInterests.mockRejectedValueOnce(new Error('Backend no disponible'));
  render(<MentorInterestsConnected />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Backend no disponible');
  expect(screen.queryByRole('button', { name: 'REST real' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByRole('button', { name: 'REST real' });
});

it('bloquea la edición si el mentor no está activo', async () => {
  getProfile.mockResolvedValue({ isActive: false, requirements: { egresado: true } });
  render(<MentorInterestsConnected />);
  await screen.findByRole('link', { name: 'Revisar mi participación' });
  expect(screen.queryByRole('button', { name: 'REST real' })).not.toBeInTheDocument();
});

it('muestra un aviso cuando el área real no tiene tópicos en el catálogo', async () => {
  getInterests.mockResolvedValue({ ...state, catalog: [{ ...state.catalog[0], topics: [] }] });
  render(<MentorInterestsConnected />);
  await screen.findByText('Esta área todavía no tiene tópicos disponibles en el catálogo.');
  expect(screen.queryByRole('button', { name: 'REST real' })).not.toBeInTheDocument();
});

it('conserva el borrador y no muestra éxito si el guardado falla', async () => {
  save.mockRejectedValueOnce(new Error('No se pudo guardar'));
  render(<MentorInterestsConnected />);
  fireEvent.click(await screen.findByRole('button', { name: 'REST real' }));
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
  expect(screen.getByRole('button', { name: 'REST real' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('Intereses guardados correctamente')).not.toBeInTheDocument();
});
