import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { JobPostingRepository } from '../../application/ports/job-posting-repository.port';
import type { CreateJobPostingInput } from '../../application/contracts/create-job-posting.input';
import { jobPostingSelect, toJobPosting } from '../translators/job-posting.translator';

@Injectable()
export class PrismaJobPostingRepository implements JobPostingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, input: CreateJobPostingInput, now: Date) {
    try {
      const record = await this.prisma.vacante.create({
        data: {
          empresa: { connect: { id: input.empresaId, id_usuario: ownerId } },
          titulo: input.titulo,
          modalidad: input.modalidad,
          nivel_experiencia: input.nivelExperiencia,
          descripcion_tecnica: input.descripcionTecnica,
          estado: 'PUBLICADO',
          created_at: now,
        },
        select: jobPostingSelect,
      });
      return toJobPosting(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
