import { fireEvent, render, screen } from '@testing-library/react';
import { GraduatesStatusFilter } from './graduates-status-filter';

test('muestra las etiquetas de estado definidas por el mockup', () => {
  render(
    <GraduatesStatusFilter
      selectedStatus="TODOS"
      onStatusChange={jest.fn()}
    />,
  );

  expect(
    screen.getByRole('option', { name: 'Todos los estados' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Verificado' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Observado' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: 'Titulados verificados' }),
  ).not.toBeInTheDocument();
});

test('notifica el nuevo estado seleccionado', () => {
  const onStatusChange = jest.fn();

  render(
    <GraduatesStatusFilter
      selectedStatus="TODOS"
      onStatusChange={onStatusChange}
    />,
  );

  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'VERIFICADO' },
  });

  expect(onStatusChange).toHaveBeenCalledWith('VERIFICADO');
});
