import { NotFoundException } from '@nestjs/common';
import { PerfilCompleto, Registro, Respaldo } from './perfil.mappers';

// Cabecera del perfil: quién es el titulado
export interface DatosTitulado {
  nombre: string | null;
  carrera: string | null;
  promocion: number | string | null;
}

// Contrato que necesita HU3 del repositorio (PerfilRepository de HU1).
// obtenerDatosTitulado y listarRespaldos son opcionales mientras HU1 no los agregue:
// si faltan, la cabecera sale en null y el estado del respaldo como desconocido (null).
export interface ResumenRepositorio {
  obtenerPerfilCompleto(tituladoId: string): Promise<PerfilCompleto>;
  obtenerDatosTitulado?(tituladoId: string): Promise<DatosTitulado | null>;
  listarRespaldos?(idsCertificacion: string[]): Promise<Respaldo[]>;
}

export interface EstadoRespaldo {
  tieneRespaldo: boolean | null;
  tipo: string | null;
  fechaSubida: string | null;
}

export interface Seccion<T> {
  total: number;
  registros: T[];
}

export interface PerfilResumen {
  titulado: { id: string } & DatosTitulado;
  formacionAcademica: Seccion<Registro>;
  experienciaLaboral: Seccion<Registro>;
  certificaciones: Seccion<Registro & { respaldo: EstadoRespaldo }>;
}

// Campo que define "más reciente" en cada sección
const CAMPO_FECHA = {
  formacionAcademica: 'anioEgreso',
  experienciaLaboral: 'fechaInicio',
  certificaciones: 'anioEmision',
} as const;

// Ordena del más reciente al más antiguo; los registros sin fecha van al final.
// Sirve para años (número) y para fechas AAAA-MM-DD (texto). En empate se respeta el orden
// del repositorio (fecha_creacion DESC), porque sort es estable.
export function ordenarPorReciente<T extends Registro>(registros: T[], campo: string): T[] {
  const valor = (r: T) => (r[campo] ?? null) as number | string | null;
  return [...registros].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (va === vb) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return va < vb ? 1 : -1;
  });
}

function seccion<T>(registros: T[]): Seccion<T> {
  return { total: registros.length, registros };
}

// Lo crea PerfilResumenController con el PerfilRepository (no hace falta tocar perfil.module.ts)
export class PerfilResumenService {
  constructor(private readonly repositorio: ResumenRepositorio) {}

  // T3.1: datos del titulado + las 3 secciones ordenadas, con total y estado de respaldo
  async obtenerResumen(tituladoId: string): Promise<PerfilResumen> {
    const [perfil, datos] = await Promise.all([
      this.repositorio.obtenerPerfilCompleto(tituladoId),
      this.obtenerDatosTitulado(tituladoId),
    ]);

    const certificaciones = ordenarPorReciente(
      perfil.certificaciones,
      CAMPO_FECHA.certificaciones,
    );
    const respaldos = await this.obtenerRespaldos(certificaciones.map((c) => c.id));

    return {
      titulado: { id: tituladoId, ...datos },
      formacionAcademica: seccion(
        ordenarPorReciente(perfil.formacionAcademica, CAMPO_FECHA.formacionAcademica),
      ),
      experienciaLaboral: seccion(
        ordenarPorReciente(perfil.experienciaLaboral, CAMPO_FECHA.experienciaLaboral),
      ),
      certificaciones: seccion(
        certificaciones.map((c) => ({ ...c, respaldo: estadoRespaldo(c.id, respaldos) })),
      ),
    };
  }

  private async obtenerDatosTitulado(tituladoId: string): Promise<DatosTitulado> {
    if (!this.repositorio.obtenerDatosTitulado) {
      return { nombre: null, carrera: null, promocion: null };
    }
    const datos = await this.repositorio.obtenerDatosTitulado(tituladoId);
    if (!datos) {
      throw new NotFoundException('No se encontró el titulado');
    }
    return datos;
  }

  // null = el repositorio todavía no sabe leer respaldos (estado desconocido)
  private async obtenerRespaldos(ids: string[]): Promise<Respaldo[] | null> {
    if (!this.repositorio.listarRespaldos) return null;
    if (ids.length === 0) return [];
    return this.repositorio.listarRespaldos(ids);
  }
}

function estadoRespaldo(idCertificacion: string, respaldos: Respaldo[] | null): EstadoRespaldo {
  if (respaldos === null) {
    return { tieneRespaldo: null, tipo: null, fechaSubida: null };
  }
  const respaldo = respaldos.find((r) => r.idCertificacion === idCertificacion);
  return {
    tieneRespaldo: Boolean(respaldo),
    tipo: respaldo?.tipo ?? null,
    fechaSubida: respaldo?.fechaSubida ?? null,
  };
}
