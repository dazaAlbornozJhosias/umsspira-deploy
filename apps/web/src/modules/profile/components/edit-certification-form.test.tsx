import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { actualizarCertificacion, obtenerCertificacion, subirRespaldo } from '@/modules/profile/services/perfil-api';

import { ProfileStoreProvider, useProfileStore } from '@/modules/profile/state/profile-store';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';
import { ApiError } from '@/shared/services/api-client';

import { EditCertificationForm } from './edit-certification-form';

const push = jest.fn();
let routeId = 'cert-1';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: routeId }),
  useRouter: () => ({ push }),
}));

// La certificación llega del backend: se simula el servicio para no llamar a la API real
jest.mock('@/modules/profile/services/perfil-api', () => ({
  obtenerCertificacion: jest.fn(),
  actualizarCertificacion: jest.fn(),
  subirRespaldo: jest.fn(),
  obtenerPerfil: jest.fn(() => new Promise(() => {})),
  // El visor (HU-10) pide un enlace firmado; se responde con uno fijo
  obtenerEnlaceRespaldo: jest.fn().mockResolvedValue({ url: '/api/v1/perfil/respaldos/cert-1/archivo', expiraEn: '' }),
  enlaceDeDescarga: jest.requireActual('@/modules/profile/services/perfil-api').enlaceDeDescarga,
}));
const obtenerCertificacionMock = obtenerCertificacion as jest.MockedFunction<typeof obtenerCertificacion>;
const actualizarCertificacionMock = actualizarCertificacion as jest.MockedFunction<typeof actualizarCertificacion>;
const subirRespaldoMock = subirRespaldo as jest.MockedFunction<typeof subirRespaldo>;

const GUARDADA: CertificationRecord = {
  id: 'cert-1',
  ownerId: 'egresado-1',
  name: 'AWS Solutions Architect',
  issuer: 'Amazon Web Services',
  degree: 'Profesional',
  issueYear: '2022',
  backupFile: 'respaldo.jpg',
  backupVerified: false,
};

const SIN_RESPALDO: CertificationRecord = {
  ...GUARDADA,
  id: 'cert-3',
  name: 'Google Cloud Engineer',
  issuer: 'Google',
  backupFile: undefined,
};

function CertificationName({ id }: { id: string }) {
  const { records } = useProfileStore();
  const certification = (records.certification as CertificationRecord[]).find((record) => record.id === id);
  return (
    <>
      <p data-testid="nombre-guardado">{certification?.name}</p>
      <p data-testid="respaldo-guardado">{certification?.backupFile}</p>
    </>
  );
}

function jpg(nombre: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], nombre, { type: 'image/jpeg' });
}

// "Subir foto" es el primer input de archivo del respaldo
function elegirFoto(archivo: File) {
  const [inputFoto] = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
  fireEvent.change(inputFoto, { target: { files: [archivo] } });
}

function renderForm() {
  render(
    <ProfileStoreProvider>
      <EditCertificationForm />
      <CertificationName id={routeId} />
    </ProfileStoreProvider>,
  );
}

describe('EditCertificationForm', () => {
  beforeEach(() => {
    routeId = 'cert-1';
    push.mockClear();
    obtenerCertificacionMock.mockReset();
    obtenerCertificacionMock.mockResolvedValue(GUARDADA);
    actualizarCertificacionMock.mockReset();
    subirRespaldoMock.mockReset();
  });

  it('pide la certificación al backend y precarga sus datos y su respaldo', async () => {
    renderForm();
    expect(screen.getByText('Cargando certificación…')).toBeInTheDocument();

    expect(await screen.findByLabelText('Nombre de la certificación')).toHaveValue('AWS Solutions Architect');
    expect(obtenerCertificacionMock).toHaveBeenCalledWith('cert-1');
    expect(screen.getByLabelText('Entidad emisora')).toHaveValue('Amazon Web Services');
    expect(screen.getByLabelText('Año')).toHaveValue('2022');
    expect(screen.getByLabelText('Grado')).toHaveValue('Profesional');
    expect(screen.getByText('respaldo.jpg', { selector: 'a, span' })).toBeInTheDocument();
  });

  // Deploy personal: sin conexión (status 0) se edita la copia del navegador; el error se prueba con un 500
  it('si falla la carga muestra el error y "Reintentar" vuelve a pedirla', async () => {
    obtenerCertificacionMock.mockRejectedValueOnce(new ApiError(500, 'Error inesperado'));
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByLabelText('Nombre de la certificación')).toHaveValue('AWS Solutions Architect');
    expect(obtenerCertificacionMock).toHaveBeenCalledTimes(2);
  });

  it('envía el PUT del mismo registro, actualiza la lista y muestra "Registro actualizado"', async () => {
    actualizarCertificacionMock.mockResolvedValue({ ...GUARDADA, name: 'AWS Solutions Architect Pro' });
    renderForm();
    fireEvent.change(await screen.findByLabelText('Nombre de la certificación'), { target: { value: 'AWS Solutions Architect Pro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    expect(actualizarCertificacionMock).toHaveBeenCalledWith('cert-1', {
      nombre: 'AWS Solutions Architect Pro',
      entidadEmisora: 'Amazon Web Services',
      grado: 'Profesional',
      anioEmision: '2022',
    });
    expect(screen.getByTestId('nombre-guardado')).toHaveTextContent('AWS Solutions Architect Pro');
  });

  it('si el guardado falla muestra el error y no cambia el registro guardado', async () => {
    actualizarCertificacionMock.mockRejectedValue(new ApiError(0, 'No fue posible conectar con el servidor'));
    renderForm();
    fireEvent.change(await screen.findByLabelText('Nombre de la certificación'), { target: { value: 'Otro nombre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('No fue posible conectar con el servidor')).toBeInTheDocument();
    expect(screen.queryByText('Registro actualizado')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la certificación')).toHaveValue('Otro nombre');
    expect(screen.getByTestId('nombre-guardado')).toHaveTextContent('AWS Solutions Architect');
  });

  it('abre el visor del respaldo y al cerrarlo conserva lo escrito', async () => {
    renderForm();
    fireEvent.change(await screen.findByLabelText('Nombre de la certificación'), { target: { value: 'Nombre sin guardar' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ver respaldo' }));
    expect(await screen.findByRole('img', { name: 'Respaldo de AWS Solutions Architect' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la certificación')).toHaveValue('Nombre sin guardar');
  });

  it('quita solo la imagen del respaldo sin eliminar la certificación', async () => {
    renderForm();
    expect(await screen.findByText('respaldo.jpg', { selector: 'a, span' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar imagen' }));

    expect(screen.queryByText('respaldo.jpg', { selector: 'a, span' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la certificación')).toHaveValue('AWS Solutions Architect');
  });

  it('sin respaldo no ofrece «Ver respaldo»', async () => {
    obtenerCertificacionMock.mockResolvedValue(SIN_RESPALDO);
    routeId = 'cert-3';
    renderForm();

    expect(await screen.findByLabelText('Nombre de la certificación')).toHaveValue('Google Cloud Engineer');
    expect(screen.queryByRole('button', { name: 'Ver respaldo' })).not.toBeInTheDocument();
  });

  it('un archivo recién elegido no abre el visor hasta guardarse', async () => {
    obtenerCertificacionMock.mockResolvedValue(SIN_RESPALDO);
    routeId = 'cert-3';
    renderForm();
    await screen.findByLabelText('Nombre de la certificación');

    elegirFoto(jpg('google.jpg'));

    expect(screen.getByText('google.jpg')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver respaldo' })).not.toBeInTheDocument();
  });

  it('Cancelar vuelve a Gestionar registros sin guardar nada', async () => {
    renderForm();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(push).toHaveBeenCalledWith('/profile/records?seccion=certification');
    expect(actualizarCertificacionMock).not.toHaveBeenCalled();
  });

  it('avisa si la certificación no existe (404)', async () => {
    routeId = 'no-existe';
    obtenerCertificacionMock.mockRejectedValue(new ApiError(404, 'No encontrado'));
    renderForm();
    expect(await screen.findByText('No encontramos esta certificación')).toBeInTheDocument();
  });

  describe('cambio de respaldo (T9.4)', () => {
    it('sin foto nueva solo hace el PUT y no sube respaldo', async () => {
      actualizarCertificacionMock.mockResolvedValue(GUARDADA);
      renderForm();
      fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
      expect(subirRespaldoMock).not.toHaveBeenCalled();
    });

    it('primero hace el PUT, después sube la foto JPG y muestra el respaldo nuevo', async () => {
      const orden: string[] = [];
      actualizarCertificacionMock.mockImplementation(async () => {
        orden.push('put');
        return GUARDADA;
      });
      subirRespaldoMock.mockImplementation(async () => {
        orden.push('respaldo');
      });
      renderForm();
      await screen.findByLabelText('Nombre de la certificación');
      const foto = jpg('certificado-nuevo.jpg');
      elegirFoto(foto);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
      expect(orden).toEqual(['put', 'respaldo']);
      expect(subirRespaldoMock).toHaveBeenCalledWith('cert-1', foto);
      // El campo de respaldo muestra la foto nueva en lugar de la anterior
      expect(screen.getByText('certificado-nuevo.jpg', { selector: 'span' })).toBeInTheDocument();
      expect(screen.queryByText('respaldo.jpg')).not.toBeInTheDocument();
      expect(screen.getByTestId('respaldo-guardado')).toHaveTextContent('certificado-nuevo.jpg');
    });

    it('si la subida falla muestra el error y conserva el respaldo guardado y la foto elegida (CA-08)', async () => {
      actualizarCertificacionMock.mockResolvedValue(GUARDADA);
      subirRespaldoMock.mockRejectedValueOnce(new ApiError(0, 'No fue posible conectar con el servidor'));
      renderForm();
      await screen.findByLabelText('Nombre de la certificación');
      const foto = jpg('certificado-nuevo.jpg');
      elegirFoto(foto);
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(
        await screen.findByText('Los datos se guardaron, pero no se pudo subir el respaldo: No fue posible conectar con el servidor'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Registro actualizado')).not.toBeInTheDocument();
      expect(screen.getByTestId('respaldo-guardado')).toHaveTextContent('respaldo.jpg');
      expect(screen.getByText('certificado-nuevo.jpg')).toBeInTheDocument();

      // Al volver a guardar se reintenta con la misma foto
      subirRespaldoMock.mockResolvedValueOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
      expect(subirRespaldoMock).toHaveBeenLastCalledWith('cert-1', foto);
      expect(screen.getByTestId('respaldo-guardado')).toHaveTextContent('certificado-nuevo.jpg');
    });

    it('rechaza archivos que no son JPG o superan 5 MB sin subirlos', async () => {
      actualizarCertificacionMock.mockResolvedValue(GUARDADA);
      renderForm();
      await screen.findByLabelText('Nombre de la certificación');

      elegirFoto(new File(['%PDF'], 'certificado.pdf', { type: 'application/pdf' }));
      expect(screen.getByText('Formato no permitido. Solo JPG')).toBeInTheDocument();

      elegirFoto(jpg('enorme.jpg', 5 * 1024 * 1024 + 1));
      expect(screen.getByText('El archivo no puede superar 5 MB')).toBeInTheDocument();
      expect(screen.getByText('respaldo.jpg')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
      expect(subirRespaldoMock).not.toHaveBeenCalled();
    });
  });
});
