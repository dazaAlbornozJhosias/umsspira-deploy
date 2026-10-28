import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { obtenerEnlaceRespaldo } from '@/modules/profile/services/perfil-api';

import { BackupViewerModal } from './backup-viewer-modal';

jest.mock('@/modules/profile/services/perfil-api', () => ({
  ...jest.requireActual('@/modules/profile/services/perfil-api'),
  obtenerEnlaceRespaldo: jest.fn(),
}));

const obtenerEnlaceMock = obtenerEnlaceRespaldo as jest.MockedFunction<typeof obtenerEnlaceRespaldo>;
const ENLACE = '/api/v1/perfil/respaldos/cert-1/archivo?expira=1700000300&firma=abc';

describe('BackupViewerModal', () => {
  beforeEach(() => {
    obtenerEnlaceMock.mockReset();
    obtenerEnlaceMock.mockResolvedValue({ url: ENLACE, expiraEn: '2026-10-23T23:05:00.000Z' });
  });

  it('muestra la foto real con el nombre de la certificación como título', async () => {
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS Solutions Architect" onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'AWS Solutions Architect' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Respaldo de AWS Solutions Architect' })).toHaveAttribute('src', ENLACE);
    expect(obtenerEnlaceMock).toHaveBeenCalledWith('cert-1');
  });

  it('pide un enlace nuevo cada vez que se abre', async () => {
    const { unmount } = render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);
    await screen.findByRole('img');
    unmount();

    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);
    await screen.findByRole('img');
    expect(obtenerEnlaceMock).toHaveBeenCalledTimes(2);
  });

  it('«Cerrar» avisa para cerrar el visor', async () => {
    const onClose = jest.fn();
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={onClose} />);
    await screen.findByRole('img');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('«Descargar» apunta al JPG original como adjunto', async () => {
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);

    expect(await screen.findByRole('link', { name: 'Descargar' })).toHaveAttribute('href', `${ENLACE}&descargar=1`);
  });

  it('Esc cierra el visor', async () => {
    const onClose = jest.fn();
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={onClose} />);
    await screen.findByRole('img');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clic fuera del cuadro cierra el visor, pero clic dentro no', async () => {
    const onClose = jest.fn();
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    await screen.findByRole('img');

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra «Cargando respaldo…» mientras llega el enlace', async () => {
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando respaldo…');
    await screen.findByRole('img');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('si falla el enlace muestra el error sin cerrar el visor', async () => {
    const onClose = jest.fn();
    obtenerEnlaceMock.mockRejectedValueOnce(new Error('sin conexión'));
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={onClose} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el respaldo. Revisa tu conexión e inténtalo de nuevo.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Descargar' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('si la foto no carga también muestra el error', async () => {
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);

    fireEvent.error(await screen.findByRole('img'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('«Reintentar» pide un enlace nuevo y muestra la foto', async () => {
    obtenerEnlaceMock.mockRejectedValueOnce(new Error('sin conexión'));
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Cargando respaldo…');
    expect(await screen.findByRole('img')).toHaveAttribute('src', ENLACE);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(obtenerEnlaceMock).toHaveBeenCalledTimes(2);
  });

  it('en celular la foto se ajusta sin deformarse y los botones quedan fijos abajo', async () => {
    render(<BackupViewerModal certificationId="cert-1" certificationName="AWS" onClose={jest.fn()} />);

    const image = await screen.findByRole('img');
    expect(image).toHaveClass('w-full', 'object-contain');
    // Los botones no se encogen aunque la foto sea muy alta
    expect(screen.getByRole('button', { name: 'Cerrar' }).parentElement).toHaveClass('shrink-0');
    expect(screen.getByRole('dialog')).toHaveClass('max-h-[calc(100dvh-2rem)]');
  });
});
