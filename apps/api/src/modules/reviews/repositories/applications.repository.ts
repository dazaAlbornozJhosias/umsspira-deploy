import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../../shared/lib/supabase';
import {
  applicationCode,
  normalizeStatus,
  statusVariants,
  type ApplicationDetail,
  type ApplicationListItem,
} from '../contracts/application.contract';
import type { ApplicationStatus } from '@umsspira/shared-types';

export const OVERDUE_HOURS = 48;

export interface ListApplicationsFilter {
  career?: string;
  status?: ApplicationStatus;
  search?: string;
  age?: 'within48' | 'over48';
}

interface CareerRow {
  id: string;
  nombre: string;
}

interface DetailRow {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  extension_ci: string | null;
  email: string;
  telefono: string;
  cod_sis: number | string | null;
  anio_egreso: number | null;
  id_carrera: string | null;
}

interface ApplicationRow {
  id: string;
  estado: string;
  fecha_creacion: string;
  id_detalle_solicitud: string | null;
}

/**
 * Lectura de la bandeja (CA-04.1 y CA-04.2).
 * Une en memoria solicitud + detalle + carrera para no depender de los nombres
 * de las llaves foraneas en PostgREST. Con el volumen del sprint (cientos de
 * filas y columnas livianas) responde muy por debajo de los 300 ms.
 */
@Injectable()
export class ApplicationsRepository {
  async listCareers(): Promise<CareerRow[]> {
    const { data, error } = await getSupabaseClient().from('carrera').select('id, nombre');
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id as string, nombre: row.nombre as string }));
  }

  async listApplications(filter: ListApplicationsFilter): Promise<ApplicationListItem[]> {
    const client = getSupabaseClient();

    const careers = await this.listCareers();
    const careerById = new Map(careers.map((career) => [career.id, career.nombre]));
    let allowedCareerIds: Set<string> | null = null;
    if (filter.career) {
      const wanted = filter.career.trim().toLowerCase();
      allowedCareerIds = new Set(
        careers.filter((career) => career.nombre.toLowerCase().includes(wanted)).map((career) => career.id),
      );
      if (allowedCareerIds.size === 0) return [];
    }

    const { data: details, error: detailsError } = await client
      .from('detalle_solicitud')
      .select('id, nombre, apellido, ci, extension_ci, email, telefono, cod_sis, anio_egreso, id_carrera');
    if (detailsError) throw detailsError;

    const { data: applications, error: applicationsError } = await client
      .from('solicitud')
      .select('id, estado, fecha_creacion, id_detalle_solicitud');
    if (applicationsError) throw applicationsError;

    const detailById = new Map<string, DetailRow>(
      ((details ?? []) as DetailRow[]).map((detail) => [detail.id, detail]),
    );

    const now = Date.now();
    const search = (filter.search ?? '').trim().toLowerCase();
    const searchDigits = search.replace(/\D/g, '');
    const items: ApplicationListItem[] = [];

    for (const row of (applications ?? []) as ApplicationRow[]) {
      const status = normalizeStatus(row.estado);
      if (filter.status && status !== filter.status) continue;

      const detail = (row.id_detalle_solicitud && detailById.get(row.id_detalle_solicitud)) || null;
      if (!detail) continue;
      if (allowedCareerIds && !(detail.id_carrera && allowedCareerIds.has(detail.id_carrera))) continue;

      if (search) {
        const haystack = `${detail.nombre ?? ''} ${detail.apellido ?? ''} ${detail.ci ?? ''} ${detail.email ?? ''}`.toLowerCase();
        const matchesText = haystack.includes(search);
        const matchesSis =
          searchDigits.length > 0 && String(detail.cod_sis ?? '').replace(/\D/g, '').includes(searchDigits);
        if (!matchesText && !matchesSis) continue;
      }

      if (filter.age) {
        const hours = (now - new Date(row.fecha_creacion).getTime()) / 3_600_000;
        const overdue = status === 'PENDING' && hours > OVERDUE_HOURS;
        if (filter.age === 'over48' && !overdue) continue;
        if (filter.age === 'within48' && overdue) continue;
      }

      const fullName = `${detail.nombre ?? ''} ${detail.apellido ?? ''}`.trim();
      items.push({
        id: row.id,
        code: applicationCode(row.id, row.fecha_creacion),
        fullName,
        email: detail.email ?? '',
        ci: detail.ci ?? '',
        issuedIn: detail.extension_ci ?? '',
        sisCode: String(detail.cod_sis ?? ''),
        career: (detail.id_carrera && careerById.get(detail.id_carrera)) || '',
        careerId: detail.id_carrera,
        status,
        submittedAt: row.fecha_creacion,
      });
    }

    // CA-04.1: pendientes primero (las mas antiguas arriba), luego el resto (recientes arriba).
    return items.sort((a, b) => {
      const aPending = a.status === 'PENDING';
      const bPending = b.status === 'PENDING';
      if (aPending !== bPending) return aPending ? -1 : 1;
      const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return aPending ? diff : -diff;
    });
  }

  async findApplicationById(id: string) {
    const client = getSupabaseClient();
    const { data: application, error: applicationError } = await client
      .from('solicitud')
      .select('id, estado, fecha_creacion, id_detalle_solicitud, id_documento_respaldo')
      .eq('id', id)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return null;

    const detailId = application.id_detalle_solicitud as string | null;
    const documentId = application.id_documento_respaldo as string | null;

    const { data: detail, error: detailError } = detailId
      ? await client
          .from('detalle_solicitud')
          .select('id, nombre, apellido, ci, extension_ci, email, telefono, cod_sis, anio_egreso, id_carrera')
          .eq('id', detailId)
          .maybeSingle()
      : { data: null, error: null };
    if (detailError) throw detailError;
    if (!detail) return null;

    const { data: document, error: documentError } = documentId
      ? await client
          .from('documento_respaldo')
          .select('id, ruta_storage, tamanio_mb, id_tipo_archivo')
          .eq('id', documentId)
          .maybeSingle()
      : { data: null, error: null };
    if (documentError) throw documentError;

    let careerName = '';
    if (detail.id_carrera) {
      const { data: career, error: careerError } = await client
        .from('carrera')
        .select('nombre')
        .eq('id', detail.id_carrera)
        .maybeSingle();
      if (careerError) throw careerError;
      careerName = (career?.nombre as string) ?? '';
    }

    let formatName = '';
    if (document?.id_tipo_archivo) {
      const { data: fileType, error: fileTypeError } = await client
        .from('tipo_archivo')
        .select('nombre')
        .eq('id', document.id_tipo_archivo as string)
        .maybeSingle();
      if (fileTypeError) throw fileTypeError;
      formatName = (fileType?.nombre as string) ?? '';
    }

    const detailRow = detail as DetailRow;
    const fullName = `${detailRow.nombre ?? ''} ${detailRow.apellido ?? ''}`.trim();
    const fileName = String((document?.ruta_storage as string) ?? '').split('/').pop() || '';

    const result: ApplicationDetail = {
      id: application.id as string,
      code: applicationCode(application.id as string, application.fecha_creacion as string),
      fullName,
      email: detailRow.email ?? '',
      ci: detailRow.ci ?? '',
      issuedIn: detailRow.extension_ci ?? '',
      sisCode: String(detailRow.cod_sis ?? ''),
      career: careerName,
      careerId: detailRow.id_carrera,
      status: normalizeStatus(application.estado),
      submittedAt: application.fecha_creacion as string,
      firstName: detailRow.nombre ?? '',
      lastName: detailRow.apellido ?? '',
      phone: detailRow.telefono ?? '',
      graduationYear: detailRow.anio_egreso,
      documentName: fileName,
      documentPath: (document?.ruta_storage as string) ?? null,
      documentFormat: formatName,
    };
    return result;
  }

  // URL firmada de 5 minutos para ver el documento desde el backoffice (CA-04.3).
  async createDocumentSignedUrl(path: string): Promise<{ url: string; expiresIn: number }> {
    const expiresIn = 5 * 60;
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documentos-respaldo';
    const { data, error } = await getSupabaseClient().storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return { url: data.signedUrl, expiresIn };
  }

  // Variantes de estado tal como estan escritas en la BD (para filtrar sin perder filas).
  statusFilterValues(status: ApplicationStatus): string[] {
    return statusVariants(status);
  }
}
