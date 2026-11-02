import { Injectable } from '@nestjs/common';
import {
  type ProfileTextReaderPort,
  type ProfileTextSources,
} from '../../application/ports/profile-text-reader.port';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';

/**
 * Lee los textos del perfil desde las cuatro fuentes definidas por el radar.
 * No reutiliza el módulo de perfil para no acoplar los dos contextos.
 */
@Injectable()
export class PrismaProfileTextReaderAdapter implements ProfileTextReaderPort {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileTexts(tituladoId: string): Promise<ProfileTextSources> {
    const [educations, experiences, certifications, profiles] = await Promise.all([
      this.prisma.formacionAcademica.findMany({
        where: { id_titulado: tituladoId },
        select: { titulo: true, institucion: true },
      }),
      this.prisma.experienciaLaboral.findMany({
        where: { id_titulado: tituladoId },
        select: { cargo: true, empresa: true },
      }),
      this.prisma.certificacion.findMany({
        where: { id_titulado: tituladoId },
        select: { nombre: true, entidad_emisora: true },
      }),
      this.prisma.perfilArea.findMany({
        where: { id_titulado: tituladoId },
        select: { descripcion_profesional: true },
      }),
    ]);

    const texts = [
      ...educations.flatMap(({ titulo, institucion }) => [titulo, institucion]),
      ...experiences.flatMap(({ cargo, empresa }) => [cargo, empresa]),
      ...certifications.flatMap(({ nombre, entidad_emisora }) => [nombre, entidad_emisora]),
      ...profiles.map(({ descripcion_profesional }) => descripcion_profesional),
    ]
      .filter((text): text is string => typeof text === 'string')
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    return {
      tituladoId,
      texts,
      hasLaborHistory: experiences.length > 0,
    };
  }
}
