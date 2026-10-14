import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { GRADUATE_STATUSES, GraduateStatus } from '../types/graduates-report.types';

// Parámetros de consulta del reporte de titulados.
export class GraduatesReportQueryDto {
  @IsIn(GRADUATE_STATUSES, { message: 'El estado debe ser verified u observed' })
  status: GraduateStatus;

  // Temporal: cuando exista el login, la carrera se toma del token del administrador.
  @IsOptional()
  @IsUUID('4', { message: 'El careerId debe ser un UUID válido' })
  careerId?: string;
}
