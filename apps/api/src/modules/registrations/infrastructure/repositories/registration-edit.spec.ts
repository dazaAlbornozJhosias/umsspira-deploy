import { PrismaRegistrationRepository } from './prisma-registration.repository';
import { IssueRegistrationCodeUseCase } from '../../application/use-cases/issue-registration-code.use-case';
import { NodeRegistrationSecurity } from '../security/registration-security';
import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { RegistrationData } from '../../domain/entities/registration';

const original: RegistrationData = {
  nombres: 'Ana',
  apellidos: 'Perez',
  ci: '12345678',
  complementoCi: '',
  expedidoEn: 'CB',
  correo: 'ana@example.com',
  telefono: '77777777',
  carreraId: 'career',
  anioEgreso: 2025,
  codigoSis: '202012345',
};

describe('Edición del borrador y reverificación', () => {
  function setup() {
    const row = {
      id: 'draft',
      datos: { ...original },
      correo_verificado: true,
      expira_en: new Date(Date.now() + 7200000),
      id_solicitud: null as string | null,
      codigo_hash: 'old',
      codigo_expira_en: new Date(),
      codigo_enviado_en: new Date(),
      codigo_intentos: 3,
    };
    const file = {
      id: 'file',
      id_borrador: 'draft',
      tipo_documento: 'diploma_academico',
      nombre: 'titulo.pdf',
      mime: 'application/pdf',
      contenido: new Uint8Array([37, 80, 68, 70]),
      size_bytes: 4,
    };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ total: 0 }]),
      $executeRaw: jest.fn(),
      carrera: { findUnique: jest.fn().mockResolvedValue({ id: 'career' }) },
      solicitud: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'application' }),
      },
      detalleSolicitud: { create: jest.fn().mockResolvedValue({ id: 'detail' }) },
      documentoRespaldo: { create: jest.fn().mockResolvedValue({ id: 'document' }) },
      usuario: { findFirst: jest.fn().mockResolvedValue(null) },
      titulado: { findFirst: jest.fn().mockResolvedValue(null) },
      borradorRegistro: {
        findUnique: jest.fn().mockImplementation(async () => row),
        update: jest.fn().mockImplementation(async ({ data }) => Object.assign(row, data)),
      },
      archivoRegistro: { findUnique: jest.fn().mockResolvedValue(file) },
      correoPendiente: { create: jest.fn() },
    };
    const prisma = { ...tx, $transaction: async (run: (value: typeof tx) => unknown) => run(tx) };
    return {
      row,
      tx,
      file,
      repository: new PrismaRegistrationRepository(prisma as unknown as PrismaService),
    };
  }

  it('guarda los datos editados en el borrador que consume submit y conserva el archivo', async () => {
    const { repository, row, file, tx } = setup();
    await repository.updateDraft('token', { ...original, nombres: 'Maria', telefono: '71111111' });
    expect(row.datos).toMatchObject({ nombres: 'Maria', telefono: '71111111' });
    expect(row.correo_verificado).toBe(true);
    expect(await repository.draftDocument('token')).toMatchObject({
      id: file.id,
      bytes: file.contenido,
    });
    await repository.submit('token', {
      sessionToken: 'token',
      deseaMentor: false,
      rutaStorage: file.id,
      tipoDocumento: file.tipo_documento,
      sizeBytes: file.size_bytes,
      mimeType: file.mime,
    });
    expect(tx.detalleSolicitud.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nombre: 'Maria', telefono: '71111111' }),
    });
  });

  it('invalida el OTP previo, envía al nuevo correo y permite cancelar el cambio', async () => {
    const { repository, row, tx } = setup();
    const next = { ...original, correo: 'nuevo@example.com' };
    await repository.updateDraft('token', next);
    expect(row.correo_verificado).toBe(false);
    expect(row.codigo_hash).toBeNull();
    const security = {
      hash: jest.fn().mockReturnValue('hash'),
      code: () => '123456',
      seal: jest.fn().mockReturnValue('encrypted'),
    };
    await new IssueRegistrationCodeUseCase(
      repository,
      security as unknown as NodeRegistrationSecurity,
    ).execute('token', next.correo);
    expect(security.seal).toHaveBeenCalledWith(expect.objectContaining({ to: next.correo }));
    expect(tx.correoPendiente.create).toHaveBeenCalledTimes(1);
    await expect(repository.verifyCode('token', 'nope', next.correo)).resolves.toBe('incorrect');
    await expect(repository.verifyCode('token', 'hash', next.correo)).resolves.toBe('verified');
    expect(row.correo_verificado).toBe(true);
  });

  it('restaura únicamente el correo previamente verificado al cancelar', async () => {
    const { repository, row } = setup();
    await repository.updateDraft('token', { ...original, correo: 'nuevo@example.com' });
    await repository.updateDraft('token', original);
    expect(row.correo_verificado).toBe(true);
    expect(row.codigo_hash).toBeNull();
  });

  it('rechaza verificar desde una pestaña cuyo correo ya cambió', async () => {
    const { repository } = setup();
    await expect(repository.verifyCode('token', 'hash', 'otro@example.com')).rejects.toThrow(
      'El correo cambió',
    );
  });

  it.each(['expired', 'submitted'])(
    'bloquea edición y lectura del documento de un borrador %s',
    async (state) => {
      const { repository, row } = setup();
      if (state === 'expired') {
        row.expira_en = new Date(0);
      } else {
        row.id_solicitud = 'submitted';
      }
      await expect(repository.updateDraft('token', original)).rejects.toThrow('El registro venció');
      await expect(repository.draftDocument('token')).rejects.toThrow('El registro venció');
    },
  );

  it('rechaza datos duplicados sin guardar la edición', async () => {
    const { repository, tx } = setup();
    tx.usuario.findFirst.mockResolvedValue({ usuario_id: 'existing' });
    await expect(repository.updateDraft('token', original)).rejects.toThrow('Ya existe');
    expect(tx.borradorRegistro.update).not.toHaveBeenCalled();
  });
});
