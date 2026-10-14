import { BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '../../../shared/lib/supabase';
import { RegistrationsRepository } from './registrations.repository';

jest.mock('../../../shared/lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockedGetClient = getSupabaseClient as jest.Mock;

const baseData = {
  idCarrera: '11111111-1111-4111-8111-111111111111',
  nombre: 'Juan',
  apellido: 'Perez',
  telefono: '71234567',
  email: 'juan@example.com',
  fechaTitulacion: null,
  fechaIngreso: null,
  ci: '1234567',
  extensionCi: '',
  expedidoEn: 'CB',
  anioEgreso: 2020,
  codigoSis: '201900001',
  deseaMentor: false,
  tipoDocumento: 'titulo_provision_nacional',
  mimeType: 'application/pdf',
  tamanioMb: 1,
  rutaStorage: 'solicitudes/x/y.pdf',
};

function mockClient(tiposArchivo: { id: string; nombre: string }[]) {
  const rpc = jest.fn().mockResolvedValue({
    data: { ok: true, id_solicitud: 'solicitud-1', estado: 'Pendiente' },
    error: null,
  });
  mockedGetClient.mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: tiposArchivo, error: null }),
    }),
    rpc,
  });
  return rpc;
}

describe('RegistrationsRepository.submitRegistration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resuelve el formato real (PDF) en el catalogo tipo_archivo', async () => {
    const rpc = mockClient([
      { id: 'tipo-pdf', nombre: 'PDF' },
      { id: 'tipo-png', nombre: 'PNG' },
    ]);
    const repository = new RegistrationsRepository();

    const result = await repository.submitRegistration(baseData);

    expect(rpc).toHaveBeenCalledWith(
      'fun_registrar_solicitud',
      expect.objectContaining({ p_id_tipo_archivo: 'tipo-pdf' }),
    );
    expect(result).toEqual({ ok: true, id_solicitud: 'solicitud-1', estado: 'Pendiente' });
  });

  it('resuelve JPG para imagenes jpeg sin importar mayusculas', async () => {
    const rpc = mockClient([{ id: 'tipo-jpg', nombre: 'jpg' }]);
    const repository = new RegistrationsRepository();

    await repository.submitRegistration({ ...baseData, mimeType: 'IMAGE/JPEG' });

    expect(rpc).toHaveBeenCalledWith(
      'fun_registrar_solicitud',
      expect.objectContaining({ p_id_tipo_archivo: 'tipo-jpg' }),
    );
  });

  it('rechaza un formato sin fila en el catalogo', async () => {
    mockClient([]);
    const repository = new RegistrationsRepository();

    await expect(repository.submitRegistration(baseData)).rejects.toThrow(BadRequestException);
    await repository
      .submitRegistration(baseData)
      .catch((error: BadRequestException) =>
        expect(error.getResponse()).toMatchObject({ message: 'No existe el formato de archivo: PDF' }),
      );
  });

  it('conserva la busqueda anterior cuando no llega el formato (compatibilidad)', async () => {
    const rpc = mockClient([{ id: 'tipo-doc', nombre: 'Título en Provisión Nacional' }]);
    const repository = new RegistrationsRepository();

    await repository.submitRegistration({ ...baseData, mimeType: null });

    expect(rpc).toHaveBeenCalledWith(
      'fun_registrar_solicitud',
      expect.objectContaining({ p_id_tipo_archivo: 'tipo-doc' }),
    );
  });
});
