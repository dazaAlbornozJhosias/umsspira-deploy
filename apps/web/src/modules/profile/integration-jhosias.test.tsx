import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AcordeonPerfil } from './completar/acordeon-perfil';
import { FormularioCertificaciones } from './completar/certificaciones';
import { ProfileStoreProvider } from './state/profile-store';
import { obtenerResumenPerfil } from './services/perfil-api';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('./services/perfil-api', () => ({
  ...jest.requireActual('./services/perfil-api'),
  obtenerResumenPerfil: jest.fn(),
}));
const load = obtenerResumenPerfil as jest.MockedFunction<typeof obtenerResumenPerfil>;
const profile = { header: { id: 'titulado-qa', name: 'QA Real', career: 'Sistemas', graduationYear: null }, records: { education: [], experience: [], certification: [] }, description: '' };
beforeEach(() => load.mockReset());

it('oculta los formularios hasta que la API entrega el perfil del titulado', async () => {
  let resolve!: (value: typeof profile) => void;
  load.mockReturnValue(new Promise(done => { resolve = done; }));
  render(<ProfileStoreProvider><AcordeonPerfil /></ProfileStoreProvider>);
  expect(screen.getByRole('status')).toHaveTextContent('Cargando tu perfil');
  expect(screen.queryByText('Completar Perfil Profesional')).not.toBeInTheDocument();
  await act(async () => resolve(profile));
  expect(await screen.findByText('Completar Perfil Profesional')).toBeInTheDocument();
});

it('bloquea completar cuando falla la consulta y permite recuperarse con Reintentar', async () => {
  load.mockRejectedValueOnce(new Error('Conexión interrumpida')).mockResolvedValueOnce(profile);
  render(<ProfileStoreProvider><AcordeonPerfil /></ProfileStoreProvider>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Conexión interrumpida');
  expect(screen.queryByText('Completar Perfil Profesional')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Completar Perfil Profesional')).toBeInTheDocument();
  expect(load).toHaveBeenCalledTimes(2);
});

it('cuenta los cuatro campos inválidos de certificación y actualiza al corregir uno', async () => {
  const onErrors = jest.fn();
  const { container } = render(<FormularioCertificaciones certificaciones={[]} onAgregar={jest.fn()} onErroresChange={onErrors} />);
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(onErrors).toHaveBeenLastCalledWith(4));
  fireEvent.change(screen.getByLabelText('Nombre de certificación'), { target: { value: 'AWS' } });
  await waitFor(() => expect(onErrors).toHaveBeenLastCalledWith(3));
});
