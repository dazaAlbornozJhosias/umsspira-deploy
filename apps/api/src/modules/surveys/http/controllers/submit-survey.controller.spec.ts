import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';
import { SubmitSurveyController } from './submit-survey.controller';

describe('SubmitSurveyController', () => {
  let controller: SubmitSurveyController;
  let repository: { save: jest.Mock };
  let prisma: {
    encuesta: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const actor: ActorContext = {
    id: 'actor-1',
    email: 'titulado@example.com',
    name: 'Titulado',
    role: 'titulado',
    permissions: [],
    scopes: {
      companyIds: [],
      graduateId: '123e4567-e89b-12d3-a456-426614174111',
      careerIds: [],
    },
    credentialVersion: 1,
  };

  const validBody = {
    id_encuesta: '123e4567-e89b-12d3-a456-426614174000',
    condicion_laboral: true,
    cargo: 'Analista',
    empresa: 'UMSS',
    area: 'Sistemas',
    modalidad: 'Remoto',
    salario_mensual: '3500',
    tiempo_insercion: '3',
  };

  beforeEach(() => {
    repository = { save: jest.fn() };
    prisma = {
      encuesta: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    controller = new SubmitSurveyController(
      prisma as unknown as PrismaService,
      repository as unknown as SurveyRepositoryPort,
    );
  });

  it('registra una respuesta nueva usando la identidad del titulado autenticado', async () => {
    prisma.encuesta.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    repository.save.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174222' });

    const response = await controller.submit(actor, validBody);

    expect(prisma.encuesta.findUnique).toHaveBeenCalledWith({
      where: { id: '123e4567-e89b-12d3-a456-426614174000' },
    });
    expect(repository.save).toHaveBeenCalledWith({
      idEncuesta: '123e4567-e89b-12d3-a456-426614174000',
      idTitulado: '123e4567-e89b-12d3-a456-426614174111',
      condicionLaboral: true,
      cargo: 'Analista',
      empresa: 'UMSS',
      area: 'Sistemas',
      modalidad: 'Remoto',
      salarioMensual: '3500',
      tiempoInsercion: '3',
    });
    expect(response).toEqual({ data: { id: '123e4567-e89b-12d3-a456-426614174222' } });
  });

  it('usa la encuesta más reciente cuando el cliente no envía id_encuesta', async () => {
    prisma.encuesta.findFirst.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    repository.save.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174222' });

    await controller.submit(actor, { condicion_laboral: false });

    expect(prisma.encuesta.findFirst).toHaveBeenCalledWith({ orderBy: { fecha_creacion: 'desc' } });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      idEncuesta: '123e4567-e89b-12d3-a456-426614174000',
      idTitulado: '123e4567-e89b-12d3-a456-426614174111',
      condicionLaboral: false,
    }));
  });

  it('convierte errores Prisma P2002 en conflicto HTTP 409', async () => {
    prisma.encuesta.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    repository.save.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate key value violates unique constraint', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );

    await expect(controller.submit(actor, validBody)).rejects.toBeInstanceOf(ConflictException);
  });

  it('mantiene el tratamiento normal de otros errores de Prisma', async () => {
    prisma.encuesta.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    repository.save.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('other prisma failure', {
        code: 'P2025',
        clientVersion: '7.10.1',
      }),
    );

    await expect(controller.submit(actor, validBody)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('requiere un titulado autenticado para registrar la respuesta', async () => {
    await expect(
      controller.submit(
        { ...actor, scopes: { ...actor.scopes, graduateId: null } },
        validBody,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
