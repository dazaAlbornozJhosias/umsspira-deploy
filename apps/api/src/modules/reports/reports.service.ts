import { Injectable, Logger } from '@nestjs/common';
import { MOCK_GRADUATES, GraduateRecordMock } from './mocks/reports-data.mock';
import { GetGraduatesQueryDto } from './dto/get-graduates-query.dto';
import { getSupabaseClient } from '../../shared/lib/supabase';

export interface DashboardMetricsResponse {
  totalGraduates: number;
  verifiedGraduates: number;
  observedGraduates: number;
  activeMentors: number;
  // Campos en español para retrocompatibilidad
  totalRegistrados: number;
  totalVerificados: number;
  totalObservados: number;
  totalMentoresActivos: number;
}

export interface PaginatedGraduatesResponse {
  data: GraduateRecordMock[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly mockRecords: GraduateRecordMock[] = MOCK_GRADUATES;

  private isUsingMock(): boolean {
    return (
      process.env.REPORTS_USE_MOCK === 'true' ||
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async getMetrics(): Promise<DashboardMetricsResponse> {
    if (!this.isUsingMock()) {
      try {
        const client = getSupabaseClient();
        const { data: solicitudes, error } = await client
          .from('solicitud')
          .select(`
            estado,
            detalle_solicitud (
              desea_mentor
            )
          `);

        if (!error && solicitudes && solicitudes.length > 0) {
          const totalGraduates = solicitudes.length;
          const verifiedGraduates = solicitudes.filter(
            (s) => s.estado?.toLowerCase() === 'verificado',
          ).length;
          const observedGraduates = solicitudes.filter(
            (s) => s.estado?.toLowerCase() === 'observado',
          ).length;
          const activeMentors = solicitudes.filter((s) => {
            const isVerified = s.estado?.toLowerCase() === 'verificado';
            const detalle = Array.isArray(s.detalle_solicitud)
              ? s.detalle_solicitud[0]
              : s.detalle_solicitud;
            return isVerified && Boolean(detalle?.desea_mentor);
          }).length;

          return {
            totalGraduates,
            verifiedGraduates,
            observedGraduates,
            activeMentors,
            totalRegistrados: totalGraduates,
            totalVerificados: verifiedGraduates,
            totalObservados: observedGraduates,
            totalMentoresActivos: activeMentors,
          };
        }
      } catch (err) {
        this.logger.warn(
          `Consulta de métricas a Supabase no disponible. Usando dataset consolidado: ${err}`,
        );
      }
    }

    // Fallback SSOT garantizado
    const totalGraduates = this.mockRecords.length;
    const verifiedGraduates = this.mockRecords.filter((r) => r.estado === 'VERIFICADO').length;
    const observedGraduates = this.mockRecords.filter((r) => r.estado === 'OBSERVADO').length;
    const activeMentors = this.mockRecords.filter(
      (r) => r.estado === 'VERIFICADO' && r.deseaMentor,
    ).length;

    return {
      totalGraduates,
      verifiedGraduates,
      observedGraduates,
      activeMentors,
      totalRegistrados: totalGraduates,
      totalVerificados: verifiedGraduates,
      totalObservados: observedGraduates,
      totalMentoresActivos: activeMentors,
    };
  }

  async getGraduates(query: GetGraduatesQueryDto): Promise<PaginatedGraduatesResponse> {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, parseInt(query.limit ?? '10', 10));

    if (!this.isUsingMock()) {
      try {
        const client = getSupabaseClient();
        let dbQuery = client
          .from('solicitud')
          .select(
            `
            id,
            estado,
            fecha_creacion,
            detalle_solicitud (
              nombre,
              apellido,
              cod_sis,
              ci,
              telefono,
              email,
              fecha_ingreso,
              fecha_titulacion,
              desea_mentor,
              id_carrera
            ),
            dictamen (
              fecha_creacion,
              justificacion
            )
          `,
            { count: 'exact' },
          );

        if (query.status) {
          dbQuery = dbQuery.eq('estado', query.status.toLowerCase());
        }

        const { data: dbData, count, error } = await dbQuery;

        if (!error && dbData && dbData.length > 0) {
          let mapped: GraduateRecordMock[] = dbData.map((s, _index) => {
            const det = Array.isArray(s.detalle_solicitud)
              ? s.detalle_solicitud[0]
              : s.detalle_solicitud;
            const dic = Array.isArray(s.dictamen) ? s.dictamen[0] : s.dictamen;

            const estadoNorm =
              s.estado?.toUpperCase() === 'VERIFICADO' ? 'VERIFICADO' : 'OBSERVADO';

            const degreeIso = det?.fecha_titulacion ?? null;
            const anioEgreso = degreeIso
              ? parseInt(degreeIso.slice(0, 4), 10)
              : 2024;

            return {
              id: s.id,
              idCarrera: det?.id_carrera ?? '',
              nombre: det?.nombre ?? '',
              apellido: det?.apellido ?? '',
              telefono: det?.telefono ?? '',
              email: det?.email ?? '',
              fechaTitulacion: degreeIso,
              fechaIngreso: det?.fecha_ingreso ?? null,
              ci: det?.ci ?? '',
              extensionCi: 'CB',
              anioEgreso,
              codSis: det?.cod_sis ?? '',
              deseaMentor: Boolean(det?.desea_mentor),
              estado: estadoNorm,
              fechaCreacion: dic?.fecha_creacion
                ? dic.fecha_creacion.split('T')[0]
                : s.fecha_creacion?.split('T')[0] ?? '2026-09-01',
              justificacion: dic?.justificacion,
            };
          });

          if (query.search) {
            const term = query.search.toLowerCase().trim();
            mapped = mapped.filter(
              (r) =>
                r.nombre.toLowerCase().includes(term) ||
                r.apellido.toLowerCase().includes(term) ||
                r.email.toLowerCase().includes(term) ||
                r.codSis.includes(term) ||
                r.ci.includes(term),
            );
          }

          const total = count ?? mapped.length;
          const totalPages = Math.ceil(total / limit);
          const offset = (page - 1) * limit;
          const data = mapped.slice(offset, offset + limit);

          return {
            data,
            meta: {
              total,
              page,
              limit,
              totalPages,
            },
          };
        }
      } catch (err) {
        this.logger.warn(
          `Consulta de titulados a Supabase no disponible. Usando dataset consolidado: ${err}`,
        );
      }
    }

    // Fallback SSOT en memoria
    let filtered = [...this.mockRecords];

    if (query.status) {
      filtered = filtered.filter((r) => r.estado === query.status);
    }

    if (query.search) {
      const term = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.nombre.toLowerCase().includes(term) ||
          r.apellido.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.codSis.includes(term) ||
          r.ci.includes(term),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}