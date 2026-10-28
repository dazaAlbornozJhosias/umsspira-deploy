import type { Certificacion } from '@/modules/profile/completar/certificaciones';
import type { Experiencia } from '@/modules/profile/completar/experiencia-laboral';
import type { FormacionAcademica } from '@/modules/profile/completar/formacion-academica';
import { CURRENT_GRADUATE_ID } from '@/modules/profile/data/profile-records-data';
import type {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecords,
} from '@/modules/profile/types/profile-record';
import { ApiError, apiFetch } from '@/shared/services/api-client';
import { SAMPLE_BACKUP_URL } from '@/modules/profile/utils/backup-url';
import { apiUrl, readApiError } from '@/shared/services/api-contract';
import { ensureAccessToken, getAccessToken } from '@/shared/services/auth-session';

// Endpoints del perfil del backend (apps/api/src/modules/perfil)
export const PERFIL_URL = '/api/v1/perfil';

// Campos comunes de los registros que devuelve la API (perfil.mappers.ts del backend)
type RegistroApi = {
  id: string;
  idTitulado: string;
  fechaCreacion: string | null;
};

// Cuerpo de POST/PUT de formación académica (CrearFormacionAcademicaDto del backend)
type FormacionCuerpo = {
  institucion: string;
  titulo: string;
  grado: string;
  anioEgreso: number;
};

export type FormacionApi = RegistroApi & FormacionCuerpo;

// Cuerpo de POST/PUT de experiencia laboral (CrearExperienciaLaboralDto del backend)
type ExperienciaCuerpo = {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  // Sin fechaFin = trabajo actual
  fechaFin?: string;
};

export type ExperienciaApi = RegistroApi & Omit<ExperienciaCuerpo, 'fechaFin'> & {
  // null = trabajo actual
  fechaFin: string | null;
};

// Cuerpo de POST/PUT de certificaciones (certificationSchema del backend)
type CertificacionCuerpo = {
  nombre: string;
  entidadEmisora: string;
  anioEmision: number;
  // Sin grado el backend guarda «Profesional» (T8.7)
  grado?: string;
};

export type CertificacionApi = RegistroApi & Required<CertificacionCuerpo> & {
  // tieneRespaldo null = el backend todavía no sabe leer respaldos
  respaldo?: { tieneRespaldo: boolean | null };
};

// GET /api/v1/perfil (profile.presenter.ts del backend)
export type PerfilApi = {
  formacionAcademica: { registros: FormacionApi[] };
  experienciaLaboral: { registros: ExperienciaApi[] };
  certificaciones: { registros: CertificacionApi[] };
  // Descripción profesional guardada en perfil_area (T6.4); vacía = sin registrar
  descripcionProfesional: string;
};

// GET y PUT /api/v1/perfil/descripcion-profesional (T6.4)
export type DescripcionApi = {
  descripcionProfesional: string;
  fechaActualizacion: string | null;
};

// Resumen del perfil: registros de las 3 secciones y descripción profesional (vacía = sin registrar)
export type ResumenPerfil = {
  records: ProfileRecords;
  description: string;
};

// La API solo devuelve registros del titulado actual, así que todos son del egresado con sesión
export function aEducationRecord(formacion: FormacionApi): EducationRecord {
  return {
    id: formacion.id,
    ownerId: CURRENT_GRADUATE_ID,
    institution: formacion.institucion,
    title: formacion.titulo,
    graduationYear: String(formacion.anioEgreso),
    degree: formacion.grado,
  };
}

export function aExperienceRecord(experiencia: ExperienciaApi): ExperienceRecord {
  return {
    id: experiencia.id,
    ownerId: CURRENT_GRADUATE_ID,
    company: experiencia.empresa,
    position: experiencia.cargo,
    startDate: experiencia.fechaInicio,
    endDate: experiencia.fechaFin ?? '',
  };
}

// La API no devuelve el nombre del archivo de respaldo ni si fue validado: solo si existe
export function aCertificationRecord(certificacion: CertificacionApi): CertificationRecord {
  return {
    id: certificacion.id,
    ownerId: CURRENT_GRADUATE_ID,
    name: certificacion.nombre,
    issuer: certificacion.entidadEmisora,
    degree: certificacion.grado,
    issueYear: String(certificacion.anioEmision),
    backupFile: certificacion.respaldo?.tieneRespaldo ? 'respaldo.jpg' : undefined,
    backupVerified: false,
  };
}

// Demo sin backend ni login: si la API no responde (status 0) o no hay sesión (401) se guarda con los datos de prueba
async function conDatosDePrueba<T>(llamada: () => Promise<T>, local: () => T): Promise<T> {
  try {
    return await llamada();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 0 || error.status === 401)) return local();
    throw error;
  }
}

let siguienteIdLocal = 0;
function idLocal(seccion: string): string {
  siguienteIdLocal += 1;
  return `${seccion}-demo-${siguienteIdLocal}`;
}

function formacionLocal(id: string, formacion: FormacionAcademica): EducationRecord {
  const cuerpo = cuerpoFormacion(formacion);
  return aEducationRecord({ ...cuerpo, id, idTitulado: CURRENT_GRADUATE_ID, fechaCreacion: null });
}

function experienciaLocal(id: string, experiencia: Experiencia): ExperienceRecord {
  const cuerpo = cuerpoExperiencia(experiencia);
  return aExperienceRecord({ ...cuerpo, fechaFin: cuerpo.fechaFin ?? null, id, idTitulado: CURRENT_GRADUATE_ID, fechaCreacion: null });
}

function certificacionLocal(id: string, cuerpo: CertificacionCuerpo): CertificationRecord {
  return aCertificationRecord({
    ...cuerpo,
    grado: cuerpo.grado ?? 'Profesional',
    id,
    idTitulado: CURRENT_GRADUATE_ID,
    fechaCreacion: null,
  });
}

function cuerpoFormacion(formacion: FormacionAcademica): FormacionCuerpo {
  return {
    institucion: formacion.institucion.trim(),
    titulo: formacion.titulo.trim(),
    grado: formacion.grado,
    // El formulario guarda el año como texto y el DTO del backend exige un entero
    anioEgreso: Number(formacion.anioEgreso),
  };
}

// POST /api/v1/perfil/formacion-academica -> 201 con el registro creado, 400 por campo o 409 si ya existe
export async function crearFormacion(formacion: FormacionAcademica): Promise<EducationRecord> {
  return conDatosDePrueba(async () => {
    const creada = await apiFetch<FormacionApi>(`${PERFIL_URL}/formacion-academica`, {
      method: 'POST',
      body: JSON.stringify(cuerpoFormacion(formacion)),
    });
    return aEducationRecord(creada);
  }, () => formacionLocal(idLocal('education'), formacion));
}

// PUT /api/v1/perfil/formacion-academica/:id -> registro actualizado, 400 por campo
// o 409 si queda igual a otra formación (el propio registro no cuenta)
export async function actualizarFormacion(id: string, formacion: FormacionAcademica): Promise<EducationRecord> {
  return conDatosDePrueba(async () => {
    const actualizada = await apiFetch<FormacionApi>(`${PERFIL_URL}/formacion-academica/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cuerpoFormacion(formacion)),
    });
    return aEducationRecord(actualizada);
  }, () => formacionLocal(id, formacion));
}

function cuerpoExperiencia(experiencia: Experiencia): ExperienciaCuerpo {
  const cuerpo: ExperienciaCuerpo = {
    empresa: experiencia.empresa.trim(),
    cargo: experiencia.cargo.trim(),
    fechaInicio: experiencia.fechaInicio,
  };
  // Trabajo actual: fechaFin no se envía (ni vacía ni null), porque @IsDateString rechazaría ""
  if (experiencia.fechaFin) cuerpo.fechaFin = experiencia.fechaFin;
  return cuerpo;
}

// POST /api/v1/perfil/experiencia-laboral -> 201 con el registro creado o 400 por campo
export async function crearExperiencia(experiencia: Experiencia): Promise<ExperienceRecord> {
  return conDatosDePrueba(async () => {
    const creada = await apiFetch<ExperienciaApi>(`${PERFIL_URL}/experiencia-laboral`, {
      method: 'POST',
      body: JSON.stringify(cuerpoExperiencia(experiencia)),
    });
    return aExperienceRecord(creada);
  }, () => experienciaLocal(idLocal('experience'), experiencia));
}

// PUT /api/v1/perfil/experiencia-laboral/:id -> registro actualizado o 400 por campo.
// Sin fechaFin el backend la guarda como null (trabajo actual) en vez de conservar la anterior
export async function actualizarExperiencia(id: string, experiencia: Experiencia): Promise<ExperienceRecord> {
  return conDatosDePrueba(async () => {
    const actualizada = await apiFetch<ExperienciaApi>(`${PERFIL_URL}/experiencia-laboral/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cuerpoExperiencia(experiencia)),
    });
    return aExperienceRecord(actualizada);
  }, () => experienciaLocal(id, experiencia));
}

// GET /api/v1/perfil -> registros de las 3 secciones y descripción profesional del egresado
export async function obtenerResumenPerfil(): Promise<ResumenPerfil> {
  const perfil = await apiFetch<PerfilApi>(PERFIL_URL);
  return {
    records: {
      education: perfil.formacionAcademica.registros.map(aEducationRecord),
      experience: perfil.experienciaLaboral.registros.map(aExperienceRecord),
      certification: perfil.certificaciones.registros.map(aCertificationRecord),
    },
    description: perfil.descripcionProfesional?.trim() ?? '',
  };
}

// GET /api/v1/perfil/certificaciones/:id -> la certificación guardada, 404 si no existe o 403 si es de otro egresado
export async function obtenerCertificacion(id: string): Promise<CertificationRecord> {
  const certificacion = await apiFetch<CertificacionApi>(`${PERFIL_URL}/certificaciones/${id}`);
  return aCertificationRecord(certificacion);
}

// PUT /api/v1/perfil/certificaciones/:id -> el mismo registro actualizado (no crea otro), 400 por campo,
// 403 si es de otro egresado o 404 si ya no existe
export async function actualizarCertificacion(
  id: string,
  certificacion: { nombre: string; entidadEmisora: string; grado: string; anioEmision: string },
): Promise<CertificationRecord> {
  const cuerpo: CertificacionCuerpo = {
    nombre: certificacion.nombre.trim(),
    entidadEmisora: certificacion.entidadEmisora.trim(),
    grado: certificacion.grado,
    // El formulario guarda el año como texto y el esquema del backend exige un entero
    anioEmision: Number(certificacion.anioEmision),
  };
  return conDatosDePrueba(async () => {
    const actualizada = await apiFetch<CertificacionApi>(`${PERFIL_URL}/certificaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cuerpo),
    });
    return aCertificationRecord(actualizada);
  }, () => certificacionLocal(id, cuerpo));
}

// PUT /api/v1/perfil/descripcion-profesional -> la descripción guardada (recortada) o 400 si supera 5000
// caracteres. Solo cambia la del egresado con sesión; vacía la borra
export async function guardarDescripcion(descripcion: string): Promise<string> {
  return conDatosDePrueba(async () => {
    const guardada = await apiFetch<DescripcionApi>(`${PERFIL_URL}/descripcion-profesional`, {
      method: 'PUT',
      body: JSON.stringify({ descripcionProfesional: descripcion }),
    });
    return guardada.descripcionProfesional;
  }, () => descripcion.trim());
}

// GET /api/v1/perfil -> registros de las 3 secciones con el formato del estado del perfil
export async function obtenerPerfil(): Promise<ProfileRecords> {
  return (await obtenerResumenPerfil()).records;
}

function cuerpoCertificacion(certificacion: Certificacion): CertificacionCuerpo {
  const cuerpo: CertificacionCuerpo = {
    nombre: certificacion.nombre.trim(),
    entidadEmisora: certificacion.entidadEmisora.trim(),
    // El formulario guarda el año como texto y el backend exige un entero
    anioEmision: Number(certificacion.anioEmision),
  };
  if (certificacion.grado) cuerpo.grado = certificacion.grado;
  return cuerpo;
}

// POST /api/v1/perfil/certificaciones -> 201 con el registro creado (con su id) o 400 por campo
export async function crearCertificacion(certificacion: Certificacion): Promise<CertificationRecord> {
  return conDatosDePrueba(async () => {
    const creada = await apiFetch<CertificacionApi>(`${PERFIL_URL}/certificaciones`, {
      method: 'POST',
      body: JSON.stringify(cuerpoCertificacion(certificacion)),
    });
    return aCertificationRecord(creada);
  }, () => certificacionLocal(idLocal('certification'), cuerpoCertificacion(certificacion)));
}

function mensajeDeRespuesta(texto: string, porDefecto: string): string {
  try {
    return readApiError(JSON.parse(texto), porDefecto).message;
  } catch {
    return porDefecto;
  }
}

// POST /api/v1/perfil/certificaciones/:id/respaldo (multipart, campo "archivo").
// Usa XMLHttpRequest porque fetch no informa el avance de la subida; onProgreso recibe 0 a 100.
export async function subirRespaldo(
  id: string,
  archivo: File,
  onProgreso?: (porcentaje: number) => void,
): Promise<void> {
  // En la demo el respaldo queda solo en el navegador (backupUrl local del registro)
  return conDatosDePrueba(() => enviarRespaldo(id, archivo, onProgreso), () => onProgreso?.(100));
}

async function enviarRespaldo(
  id: string,
  archivo: File,
  onProgreso?: (porcentaje: number) => void,
): Promise<void> {
  let token: string;
  try {
    token = getAccessToken() ?? (await ensureAccessToken());
  } catch {
    throw new ApiError(401, 'Tu sesion expiro. Inicia sesion nuevamente');
  }
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(`${PERFIL_URL}/certificaciones/${id}/respaldo`));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) onProgreso?.(Math.round((evento.loaded / evento.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgreso?.(100);
        resolve();
      } else if (xhr.status === 401) {
        reject(new ApiError(401, 'Tu sesion expiro. Inicia sesion nuevamente'));
      } else {
        reject(new ApiError(xhr.status, mensajeDeRespuesta(xhr.responseText, 'No se pudo subir el respaldo')));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'No fue posible conectar con el servidor'));
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    xhr.send(formulario);
  });
}

// GET /api/v1/perfil/certificaciones/:id/respaldo/enlace (T10.1) -> enlace firmado que vence en 5 minutos.
// 403 si el respaldo es ajeno, 404 si la certificación no tiene respaldo
export type EnlaceRespaldoApi = {
  url: string;
  expiraEn: string;
};

// Se pide uno nuevo en cada apertura del visor: el anterior pudo haber vencido
export async function obtenerEnlaceRespaldo(idCertificacion: string): Promise<EnlaceRespaldoApi> {
  return conDatosDePrueba(
    () => apiFetch<EnlaceRespaldoApi>(`${PERFIL_URL}/certificaciones/${idCertificacion}/respaldo/enlace`),
    // Demo sin backend: se muestra la imagen de ejemplo de los registros de prueba
    () => ({ url: SAMPLE_BACKUP_URL, expiraEn: '' }),
  );
}

// El mismo enlace con descargar=1 hace que la API responda como adjunto y el navegador baje el JPG
export function enlaceDeDescarga(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}descargar=1`;
}
