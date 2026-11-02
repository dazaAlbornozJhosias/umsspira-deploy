import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Inject,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common';

import { z } from 'zod';

import { submitSurveySchema } from '../schemas/surveys.schemas';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import { SURVEY_REPOSITORY_PORT } from '../../infrastructure/providers/surveys.providers';
import type { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';

@Controller('surveys')
export class SubmitSurveyController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SURVEY_REPOSITORY_PORT)
    private readonly repository: SurveyRepositoryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('titulado')
  async submit(@CurrentActor() actor: ActorContext, @Body() body: unknown) {
    const result = submitSurveySchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Datos de encuesta invalidos',
        errors: z.flattenError(result.error),
      });
    }

    const tituladoId = actor.scopes.graduateId;
    if (!tituladoId) {
      throw new NotFoundException('Perfil de titulado no encontrado');
    }

    const survey = result.data.id_encuesta
      ? await this.prisma.encuesta.findUnique({ where: { id: result.data.id_encuesta } })
      : await this.prisma.encuesta.findFirst({ orderBy: { fecha_creacion: 'desc' } });
    if (!survey) {
      throw new NotFoundException('No existe una encuesta disponible');
    }

    try {
      const saved = await this.repository.save({
        idEncuesta: survey.id,
        idTitulado: tituladoId,
        condicionLaboral: result.data.condicion_laboral,
        cargo: result.data.cargo,
        empresa: result.data.empresa,
        area: result.data.area,
        modalidad: result.data.modalidad,
        salarioMensual: result.data.salario_mensual,
        tiempoInsercion: result.data.tiempo_insercion,
      });
      return { data: { id: saved.id } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('La encuesta ya fue enviada');
      }
      throw new InternalServerErrorException('No se pudo guardar la encuesta');
    }
  }
}
