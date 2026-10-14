import '@testing-library/jest-dom';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MentorInterests } from './mentor-interests';
import { type InterestArea, type InterestConfiguration } from '../model/mentor-interests';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const catalog: InterestArea[] = [
  { id: 'web', name: 'Web', description: 'Desarrollo web', topics: [{ id: 'react', name: 'React' }, { id: 'rest', name: 'APIs REST' }] },
  { id: 'datos', name: 'Bases de datos', description: 'Consultas', topics: [{ id: 'pg', name: 'PostgreSQL' }] },
];
const initialConfiguration: InterestConfiguration = { areaIds: ['web'], topicIds: ['react'] };
let onSave: jest.Mock;
beforeEach(() => { push.mockReset(); onSave = jest.fn(async config => config); });
function setup() { render(<MentorInterests catalog={catalog} initialConfiguration={initialConfiguration} onSave={onSave} />); }
function add() { fireEvent.click(screen.getByRole('button', { name: 'APIs REST' })); }
function openSave() { fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ })); }

it('bloquea tópicos de áreas no seleccionadas y permite cambiar las áreas', () => {
  setup();
  expect(screen.getByRole('button', { name: 'PostgreSQL' })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Guardar configuración/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Activar esta área técnica' }));
  expect(push).toHaveBeenCalledWith('/mentorship/profile/areas');
});

it('guarda solo después de confirmar y muestra el resultado', async () => {
  setup(); add(); openSave();
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toHaveTextContent('APIs REST');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText(/Intereses guardados correctamente/);
  expect(onSave).toHaveBeenCalledWith({ areaIds: ['web'], topicIds: ['react', 'rest'] });
  expect(screen.getByRole('button', { name: /Guardar configuración/ })).toBeDisabled();
});

it('mantiene el borrador y permite reintentar cuando falla el guardado', async () => {
  onSave.mockRejectedValueOnce(new Error('Error de conexión'));
  setup(); add(); openSave();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Error de conexión');
  expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText(/Intereses guardados correctamente/);
});

it('descarta y restaura la última configuración guardada', () => {
  setup(); add();
  fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Descartar cambios' }));
  expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'false');
  expect(onSave).not.toHaveBeenCalled();
});

it('confirma la eliminación de un área y sus tópicos sin guardar automáticamente', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar área' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('React');
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('button', { name: 'React' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar área' }));
  fireEvent.click(screen.getByRole('button', { name: 'Quitar de todos modos' }));
  expect(screen.getByRole('button', { name: 'React' })).toBeDisabled();
  expect(onSave).not.toHaveBeenCalled();
  openSave();
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Se quitarán (1): React');
});

it('confirma el descarte antes de navegar con cambios pendientes', () => {
  setup(); add();
  fireEvent.click(screen.getByRole('button', { name: 'Volver a Áreas técnicas' }));
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
  expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Volver a Áreas técnicas' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Descartar cambios' }));
  expect(push).toHaveBeenCalledWith('/mentorship/profile/areas');
});

it('espera el resultado del servidor antes de mostrar éxito', async () => {
  let resolve!: (value: InterestConfiguration) => void;
  onSave.mockReturnValue(new Promise(done => { resolve = done; }));
  setup(); add(); openSave();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(screen.queryByText(/Intereses guardados correctamente/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  resolve(initialConfiguration);
  await waitFor(() => expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'false'));
  expect(onSave).toHaveBeenCalledTimes(1);
});

it('protege los enlaces del breadcrumb cuando hay cambios sin guardar', () => {
  render(<div className="interests-page"><a className="breadcrumb-link" href="/mentorship">Mentorías</a><MentorInterests catalog={catalog} initialConfiguration={initialConfiguration} onSave={onSave} /></div>);
  add();
  fireEvent.click(screen.getByRole('link', { name: 'Mentorías' }));
  expect(push).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Descartar');
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Descartar cambios' }));
  expect(push).toHaveBeenCalledWith('/mentorship');
});
