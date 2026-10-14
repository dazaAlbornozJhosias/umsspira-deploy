import {
  BadRequestException,
  ConflictException,
  GoneException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { redisClient } from '../../../shared/lib/redis';
import { RegistrationsRepository } from '../repositories/registrations.repository';
import { CreateRegistrationDataDto } from '../contracts/dto';
import { DuplicatesService } from './duplicates.service';
import {
  DATA_SOURCE_UNAVAILABLE_MESSAGE,
  EXPIRED_MESSAGE,
  RegistrationsService,
  SESSION_TTL_SECONDS,
} from './registrations.service';

jest.mock('../../../shared/lib/redis', () => ({
  redisClient: { set: jest.fn(), get: jest.fn(), ttl: jest.fn() },
}));

const mockedRedis = redisClient as unknown as {
  set: jest.Mock;
  get: jest.Mock;
  ttl: jest.Mock;
};

const CAREER_ID = '11111111-1111-4111-8111-111111111111';

function buildDto(overrides: Partial<CreateRegistrationDataDto> = {}): CreateRegistrationDataDto {
  return {
    nombres: 'Juan',
    apellidos: 'Perez',
    ci: '1234567',
    complementoCi: undefined,
    expedidoEn: 'CB',
    correo: 'Juan.Perez@Example.com',
    telefono: '71234567',
    carreraId: CAREER_ID,
    anioEgreso: 2020,
    codigoSis: '201900001',
    ...overrides,
  };
}

describe('RegistrationsService', () => {
  let repository: { listCareers: jest.Mock };
  let duplicatesService: { assertNoActiveApplication: jest.Mock };
  let service: RegistrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      listCareers: jest.fn().mockResolvedValue([{ id: CAREER_ID, nombre: 'Ingeniería de Sistemas' }]),
    };
    duplicatesService = { assertNoActiveApplication: jest.fn().mockResolvedValue(undefined) };
    service = new RegistrationsService(
      repository as unknown as RegistrationsRepository,
      duplicatesService as unknown as DuplicatesService,
    );
    mockedRedis.set.mockResolvedValue('OK');
  });

  describe('createRegistrationSession', () => {
    it('guarda los datos en Redis por 2 horas y devuelve el token (CA-01.1)', async () => {
      const result = await service.createRegistrationSession(buildDto());

      expect(result.expiresInSeconds).toBe(SESSION_TTL_SECONDS);
      expect(result.sessionToken).toMatch(/^[0-9a-f-]{36}$/);

      const [key, value, mode, ttl] = mockedRedis.set.mock.calls[0];
      expect(key).toBe(`registration-session:${result.sessionToken}`);
      expect(mode).toBe('EX');
      expect(ttl).toBe(2 * 60 * 60);
      expect(JSON.parse(value)).toMatchObject({
        correo: 'juan.perez@example.com',
        complementoCi: '',
        isEmailVerified: false,
      });
    });

    it('verifica duplicados con el correo en minusculas', async () => {
      await service.createRegistrationSession(buildDto({ complementoCi: '1A' }));

      expect(duplicatesService.assertNoActiveApplication).toHaveBeenCalledWith({
        ci: '1234567',
        complementoCi: '1A',
        expedidoEn: 'CB',
        correo: 'juan.perez@example.com',
        codigoSis: '201900001',
      });
    });

    it('rechaza una carrera que no existe en el catalogo', async () => {
      const promise = service.createRegistrationSession(buildDto({ carreraId: 'carrera-inventada' }));

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await promise.catch((error: BadRequestException) => {
        expect(error.getResponse()).toMatchObject({
          errors: [{ field: 'carreraId', message: 'Carrera no válida' }],
        });
      });
      expect(duplicatesService.assertNoActiveApplication).not.toHaveBeenCalled();
      expect(mockedRedis.set).not.toHaveBeenCalled();
    });

    it('propaga el conflicto de duplicado sin guardar en Redis (CA-01.4)', async () => {
      duplicatesService.assertNoActiveApplication.mockRejectedValue(
        new ConflictException({ statusCode: 409, field: 'ci' }),
      );

      await expect(service.createRegistrationSession(buildDto())).rejects.toBeInstanceOf(ConflictException);
      expect(mockedRedis.set).not.toHaveBeenCalled();
    });

    it('responde 503 cuando la base de datos no esta disponible', async () => {
      repository.listCareers.mockRejectedValue(new Error('Faltan las variables de entorno SUPABASE_URL'));

      const promise = service.createRegistrationSession(buildDto());

      await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(promise).rejects.toThrow(DATA_SOURCE_UNAVAILABLE_MESSAGE);
    });

    it('responde 503 cuando Redis no esta disponible', async () => {
      mockedRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.createRegistrationSession(buildDto())).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('getRegistrationSession', () => {
    it('devuelve el tiempo restante cuando la sesion sigue vigente', async () => {
      mockedRedis.get.mockResolvedValue('{"correo":"a@b.com"}');
      mockedRedis.ttl.mockResolvedValue(3600);

      await expect(service.getRegistrationSession('token-1')).resolves.toEqual({
        sessionToken: 'token-1',
        expiresInSeconds: 3600,
      });
    });

    it('responde 410 cuando pasaron mas de 2 horas (CA-01.6)', async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedRedis.ttl.mockResolvedValue(-2);

      const promise = service.getRegistrationSession('token-vencido');

      await expect(promise).rejects.toBeInstanceOf(GoneException);
      await expect(promise).rejects.toThrow(EXPIRED_MESSAGE);
    });
  });

  describe('listCareers', () => {
    it('responde 503 si no se puede leer el catalogo de carreras', async () => {
      repository.listCareers.mockRejectedValue(new Error('fetch failed'));

      await expect(service.listCareers()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
