
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
 
import * as api from '@/modules/profile/services/perfil-api';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import type { CertificationRecord, ProfileRecords } from '@/modules/profile/types/profile-record';
import { ApiError } from '@/shared/services/api-client';
 
import { AcordeonPerfil } from './acordeon-perfil';
 
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
 
jest.mock('@/modules/profile/services/perfil-api', () => ({
  ...jest.requireActual('@/modules/profile/services/perfil-api'),
  crearCertificacion: jest.fn(),
  subirRespaldo: jest.fn(),
}));
 
const crearCertificacion = api.crearCertificacion as jest.Mock;
const subirRespaldo = api.subirRespaldo as jest.Mock;
 
const SIN_REGISTROS: ProfileRecords = { education: [], experience: [], certification: [] };
 
const CREADA: CertificationRecord = {
  id: 'cert-1',
  ownerId: 'titulado-1',
  name: 'AWS Cloud Practitioner',
  issuer: 'Amazon Web Services',
  issueYear: '2023',
  degree: 'Profesional',
  backupVerified: false,
};
 
function abrirCertificaciones(returnTo?: string) {
  render(
    <ProfileStoreProvider initialRecords={SIN_REGISTROS}>
      <AcordeonPerfil returnTo={returnTo} />
    </ProfileStoreProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /certificaciones/i }));
}
 
function llenarYAgregar() {
  fireEvent.change(screen.getByLabelText('Nombre de certificación'), { target: { value: 'AWS Cloud Practitioner' } });
  fireEvent.change(screen.getByLabelText('Entidad emisora'), { target: { value: 'Amazon Web Services' } });
  fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2023' } });
  const foto = new File(['contenido'], 'certificado.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Subir foto', { selector: 'input' }), { target: { files: [foto] } });
  fireEvent.click(screen.getByRole('button', { name: /agregar certificación/i }));
  return foto;
}
 
describe('Completar perfil · guardar certificación con respaldo (T8.4 y T8.6)', () => {
  beforeEach(() => {
    crearCertificacion.mockReset();
    subirRespaldo.mockReset();
  });
 
  it('crea la certificación, sube la foto y la agrega al resumen', async () => {
    crearCertificacion.mockResolvedValue(CREADA);
    subirRespaldo.mockResolvedValue(undefined);
    abrirCertificaciones();
 
    const foto = llenarYAgregar();
 
    await waitFor(() => expect(screen.getByLabelText('Nombre de certificación')).toHaveValue(''));
    expect(subirRespaldo).toHaveBeenCalledWith('cert-1', foto, expect.any(Function));
    expect(crearCertificacion).toHaveBeenCalledTimes(1);
  });
 
  it('si falla la creación, «Reintentar» vuelve a crearla (no había nada guardado)', async () => {
    crearCertificacion
      .mockRejectedValueOnce(new ApiError(500, 'Error interno'))
      .mockResolvedValueOnce(CREADA);
    subirRespaldo.mockResolvedValue(undefined);
    abrirCertificaciones();
    llenarYAgregar();
 
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
 
    await waitFor(() => expect(screen.getByLabelText('Nombre de certificación')).toHaveValue(''));
    expect(crearCertificacion).toHaveBeenCalledTimes(2);
    expect(subirRespaldo).toHaveBeenCalledTimes(1);
  });
 
  it('si solo falla la subida de la foto, «Reintentar» sube la foto sin crear otra certificación', async () => {
    crearCertificacion.mockResolvedValue(CREADA);
    subirRespaldo
      .mockRejectedValueOnce(new ApiError(0, 'No fue posible conectar con el servidor'))
      .mockResolvedValueOnce(undefined);
    abrirCertificaciones();
    const foto = llenarYAgregar();
 
    expect(await screen.findByText(/No se pudo guardar la certificación/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de certificación')).toHaveValue('AWS Cloud Practitioner');
 
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
 
    await waitFor(() => expect(screen.getByLabelText('Nombre de certificación')).toHaveValue(''));
    expect(crearCertificacion).toHaveBeenCalledTimes(1);
    expect(subirRespaldo).toHaveBeenCalledTimes(2);
    expect(subirRespaldo).toHaveBeenLastCalledWith('cert-1', foto, expect.any(Function));
  });
 
  it('al llegar desde Mi afinidad, suma la certificación a la lista y ofrece volver (T8.5)', async () => {
    crearCertificacion.mockResolvedValue(CREADA);
    subirRespaldo.mockResolvedValue(undefined);
    abrirCertificaciones('/afinidad');
 
    llenarYAgregar();
 
    expect(await screen.findByText('Certificación guardada')).toBeInTheDocument();
    expect(screen.getByText('AWS Cloud Practitioner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mi afinidad →' })).toHaveAttribute('href', '/afinidad');
  });
});
 
