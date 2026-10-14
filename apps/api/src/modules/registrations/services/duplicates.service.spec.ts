import { ConflictException } from '@nestjs/common';
import { DuplicatesService, DUPLICATE_MESSAGES } from './duplicates.service';
import { RegistrationsRepository } from '../repositories/registrations.repository';

describe('DuplicatesService', () => {
  const input = {
    ci: '1234567',
    complementoCi: '',
    expedidoEn: 'CB',
    correo: 'titulado@example.com',
    codigoSis: '201900001',
  };

  let repository: jest.Mocked<
    Pick<
      RegistrationsRepository,
      'findActiveApplicationByIdentity' | 'findActiveApplicationByEmail' | 'findActiveApplicationBySisCode'
    >
  >;
  let service: DuplicatesService;

  beforeEach(() => {
    repository = {
      findActiveApplicationByIdentity: jest.fn().mockResolvedValue(null),
      findActiveApplicationByEmail: jest.fn().mockResolvedValue(null),
      findActiveApplicationBySisCode: jest.fn().mockResolvedValue(null),
    };
    service = new DuplicatesService(repository as unknown as RegistrationsRepository);
  });

  async function getConflict(): Promise<ConflictException> {
    try {
      await service.assertNoActiveApplication(input);
    } catch (error) {
      return error as ConflictException;
    }
    throw new Error('Se esperaba un ConflictException');
  }

  it('permite continuar cuando no existe ninguna solicitud activa', async () => {
    await expect(service.assertNoActiveApplication(input)).resolves.toBeUndefined();
    expect(repository.findActiveApplicationByIdentity).toHaveBeenCalledWith('1234567', '', 'CB');
    expect(repository.findActiveApplicationByEmail).toHaveBeenCalledWith('titulado@example.com');
    expect(repository.findActiveApplicationBySisCode).toHaveBeenCalledWith('201900001');
  });

  it('bloquea un C.I. duplicado e indica solo el campo ci', async () => {
    repository.findActiveApplicationByIdentity.mockResolvedValue({ id: 's1', estado: 'pendiente' });

    const conflict = await getConflict();

    expect(conflict).toBeInstanceOf(ConflictException);
    expect(conflict.getResponse()).toMatchObject({
      statusCode: 409,
      field: 'ci',
      message: DUPLICATE_MESSAGES.ci,
      errors: [{ field: 'ci', message: DUPLICATE_MESSAGES.ci }],
    });
    expect(repository.findActiveApplicationByEmail).not.toHaveBeenCalled();
  });

  it('bloquea un correo duplicado e indica solo el campo correo', async () => {
    repository.findActiveApplicationByEmail.mockResolvedValue({ id: 's2', estado: 'observado' });

    const conflict = await getConflict();

    expect(conflict.getResponse()).toMatchObject({ field: 'correo', message: DUPLICATE_MESSAGES.correo });
    expect(repository.findActiveApplicationBySisCode).not.toHaveBeenCalled();
  });

  it('bloquea un Codigo SIS duplicado e indica solo el campo codigoSis', async () => {
    repository.findActiveApplicationBySisCode.mockResolvedValue({ id: 's3', estado: 'aprobado' });

    const conflict = await getConflict();

    expect(conflict.getResponse()).toMatchObject({ field: 'codigoSis', message: DUPLICATE_MESSAGES.codigoSis });
  });
});
