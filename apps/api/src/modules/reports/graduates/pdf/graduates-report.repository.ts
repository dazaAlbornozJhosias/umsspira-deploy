import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GRADUATES_REPORT_MOCK } from './mocks/graduates-report.mock';
import { ApplicationRow, ReportSourceData } from './types/report-source.types';

const DETAIL_COLUMNS =
  'nombre, apellido, cod_sis, telefono, email, fecha_ingreso, fecha_titulacion, id_carrera';

// Origen de los datos del reporte: la base de datos (Supabase) o los datos de prueba.
// Mientras Supabase no tenga solicitudes ni exista el login del administrador, se usan los datos de
// prueba (los mismos titulados de la tabla de /reports) aunque SUPABASE_URL esté configurado.
// Para leer la base de datos real: GRADUATES_REPORT_USE_MOCK=false (y SUPABASE_URL configurado).
@Injectable()
export class GraduatesReportRepository {
  private client: SupabaseClient | null = null;

  isUsingMock(): boolean {
    return process.env.GRADUATES_REPORT_USE_MOCK !== 'false' || !process.env.SUPABASE_URL;
  }

  async findApplicationsByStatus(dbStatus: string, careerId?: string): Promise<ReportSourceData> {
    if (this.isUsingMock()) {
      return this.findInMock(dbStatus, careerId);
    }
    const client = this.getClient();

    // solicitud -> detalle_solicitud (datos del titulado) y dictamen (fecha de verificación u observación)
    const { data, error } = await client
      .from('solicitud')
      .select(`estado, detalle_solicitud!inner(${DETAIL_COLUMNS}), dictamen(fecha_creacion)`)
      .eq('estado', dbStatus)
      .eq('detalle_solicitud.id_carrera', careerId);
    if (error) {
      throw new InternalServerErrorException('No se pudo consultar los titulados');
    }

    const { data: career, error: careerError } = await client
      .from('carrera')
      .select('id, nombre')
      .eq('id', careerId)
      .maybeSingle();
    if (careerError) {
      throw new InternalServerErrorException('No se pudo consultar la carrera');
    }

    return {
      carrera: career ?? { id: careerId, nombre: '' },
      solicitudes: (data ?? []) as unknown as ApplicationRow[],
    };
  }

  // Datos de prueba de una sola carrera, como la consulta real.
  // Sin careerId (todavía no hay login) se usa la primera carrera: Ingeniería de Sistemas.
  private findInMock(dbStatus: string, careerId?: string): ReportSourceData {
    const career = careerId
      ? GRADUATES_REPORT_MOCK.carreras.find((item) => item.id === careerId) ?? { id: careerId, nombre: '' }
      : GRADUATES_REPORT_MOCK.carreras[0];
    return {
      carrera: career,
      solicitudes: GRADUATES_REPORT_MOCK.solicitudes.filter(
        (row) => row.estado === dbStatus && row.detalle_solicitud.id_carrera === career.id,
      ),
    };
  }

  // Temporal: cuando DevOps complete apps/api/src/shared/lib/supabase.ts, usar ese cliente.
  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    }
    return this.client;
  }
}
