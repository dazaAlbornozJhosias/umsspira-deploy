import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GraduatesReportRepository } from './graduates-report.repository';
import {
  GraduateReportRow,
  GraduatesReportResponse,
  GraduateStatus,
} from './types/graduates-report.types';
import { ApplicationRow } from './types/report-source.types';
import { calculateCareerDuration, formatDate } from './utils/calculate-career-duration';

// En la API el estado va en inglés; en la base de datos, en español.
const DB_STATUS: Record<GraduateStatus, string> = {
  verified: 'verificado',
  observed: 'observado',
};

const STATUS_LABEL: Record<GraduateStatus, string> = {
  verified: 'verificados',
  observed: 'observados',
};

@Injectable()
export class GraduatesReportService {
  constructor(private readonly repository: GraduatesReportRepository) {}

  async getGraduatesReport(
    status: GraduateStatus,
    careerId?: string,
  ): Promise<GraduatesReportResponse> {
    if (!careerId && !this.repository.isUsingMock()) {
      throw new BadRequestException('Falta el careerId de la carrera del administrador');
    }

    const dbStatus = DB_STATUS[status];
    const source = await this.repository.findApplicationsByStatus(dbStatus, careerId);
    const career = careerId ?? source.carrera.id;

    const applications = source.solicitudes.filter(
      (row) => row.estado === dbStatus && row.detalle_solicitud?.id_carrera === career,
    );
    // Los datos de prueba ya vienen en el orden de la tabla de /reports, así el PDF muestra las filas
    // en el mismo orden que la lista; los de la base de datos se ordenan por fecha y apellido.
    if (!this.repository.isUsingMock()) {
      applications.sort(compareApplications);
    }

    if (applications.length === 0) {
      throw new NotFoundException(`No hay titulados ${STATUS_LABEL[status]} para exportar`);
    }

    const graduates = applications.map((row, index) => toReportRow(row, index + 1));
    return {
      careerName: source.carrera.nombre,
      status,
      total: graduates.length,
      generatedAt: new Date().toISOString(),
      graduates,
    };
  }
}

// Supabase devuelve la relación uno a muchos como lista; los datos de prueba, como objeto.
function getStatusDate(row: ApplicationRow): string | null {
  const dictamen = row.dictamen as unknown;
  if (Array.isArray(dictamen)) return dictamen[0]?.fecha_creacion ?? null;
  return (dictamen as ApplicationRow['dictamen'])?.fecha_creacion ?? null;
}

// Orden de la lista: fecha de verificación u observación y, a igual fecha, apellido.
function compareApplications(a: ApplicationRow, b: ApplicationRow): number {
  const byDate = (getStatusDate(a) ?? '').localeCompare(getStatusDate(b) ?? '');
  if (byDate !== 0) return byDate;
  return a.detalle_solicitud.apellido.localeCompare(b.detalle_solicitud.apellido, 'es', {
    sensitivity: 'base',
  });
}

function toReportRow(row: ApplicationRow, number: number): GraduateReportRow {
  const detail = row.detalle_solicitud;
  return {
    number,
    fullName: `${detail.apellido}, ${detail.nombre}`,
    sisCode: String(detail.cod_sis),
    phone: detail.telefono ?? '—',
    email: detail.email,
    admissionDate: formatDate(detail.fecha_ingreso),
    graduationDate: formatDate(detail.fecha_titulacion),
    careerDuration: detail.duracion_carrera ?? calculateCareerDuration(detail.fecha_ingreso, detail.fecha_titulacion),
    statusDate: formatDate(getStatusDate(row)),
  };
}
