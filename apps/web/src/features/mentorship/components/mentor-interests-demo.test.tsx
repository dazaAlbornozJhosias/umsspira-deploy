import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MentorInterestsDemo } from './mentor-interests-demo';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

it('conecta las áreas de prueba con los intereses y conserva lo confirmado al volver', async () => {
  render(<MentorInterestsDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Modificar áreas técnicas' }));
  fireEvent.click(screen.getByLabelText('Bases de datos'));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar áreas de prueba' }));
  expect(screen.getByRole('button', { name: 'PostgreSQL' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Laravel' }));
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText(/Intereses guardados correctamente/);
  fireEvent.click(screen.getByRole('button', { name: 'Modificar áreas técnicas' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('button', { name: 'Laravel' })).toHaveAttribute('aria-pressed', 'true');
});

it('no muestra éxito si falla el guardado y permite reintentar', async () => {
  render(<MentorInterestsDemo />);
  fireEvent.click(screen.getByLabelText('Simular error al guardar'));
  fireEvent.click(screen.getByRole('button', { name: 'Laravel' }));
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar');
  expect(screen.queryByText(/Intereses guardados correctamente/)).not.toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Seguir editando' }));
  fireEvent.click(screen.getByLabelText('Simular error al guardar'));
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText(/Intereses guardados correctamente/);
});
