import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { query } from '../../shared/lib/database';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';

export interface JobPostingRow {
  id: string;
  titulo: string;
  modalidad: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';
  nivelExperiencia: string;
  descripcionTecnica: string;
  estado: 'PUBLICADO' | 'CERRADO';
  fechaCreacion: string;
  empresaId: string;
}

@Injectable()
export class JobPostingsService {
  async create(
    empresaId: string,
    dto: CreateJobPostingDto,
  ): Promise<JobPostingRow> {
    try {
      const rows = await query<JobPostingRow>(
        `
          INSERT INTO vacante (
            id_empresa,
            titulo,
            modalidad,
            nivel_experiencia,
            descripcion_tecnica,
            estado,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, 'PUBLICADO', NOW())
          RETURNING
            id,
            titulo,
            modalidad,
            nivel_experiencia AS "nivelExperiencia",
            descripcion_tecnica AS "descripcionTecnica",
            estado,
            created_at AS "fechaCreacion",
            id_empresa AS "empresaId"
        `,
        [
          empresaId,
          dto.titulo,
          dto.modalidad,
          dto.nivelExperiencia,
          dto.descripcionTecnica,
        ],
      );

      if (rows.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo publicar la vacante',
        );
      }

      return rows[0];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocurrió un error al publicar la vacante',
      );
    }
  }
}