import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MentorSavedAreas } from './mentor-saved-areas';
import { getMentorAreas } from '../services/mentor-areas-api';
jest.mock('../services/mentor-areas-api');
const getAreas = jest.mocked(getMentorAreas);
beforeEach(() => jest.resetAllMocks());
it('muestra únicamente las áreas guardadas en el perfil', async () => {
  getAreas.mockResolvedValue({ areas: [{ id: '1', nombre: 'Frontend', descripcion: null }, { id: '2', nombre: 'DevOps', descripcion: null }], selectedIds: ['2'] });
  render(<MentorSavedAreas />);
  expect(await screen.findByText('DevOps')).toBeInTheDocument(); expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
});
it('permite reintentar sin inventar áreas después de un error', async () => {
  getAreas.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({ areas: [], selectedIds: [] });
  render(<MentorSavedAreas />); fireEvent.click(await screen.findByRole('button', { name: 'Reintentar consulta de áreas' }));
  expect(await screen.findByText('Aún no tienes áreas técnicas guardadas.')).toBeInTheDocument();
});
