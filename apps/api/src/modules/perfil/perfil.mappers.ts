import {
  COLUMNAS,
  COLUMNAS_RESPALDO,
  COLUMNA_FECHA_CREACION,
  COLUMNA_ID,
  COLUMNA_TITULADO,
  Seccion,
} from './perfil.constants';

// Un registro de cualquier sección, con los nombres de la API (camelCase)
export interface Registro {
  id: string;
  idTitulado: string;
  fechaCreacion: string | null;
  [campo: string]: unknown;
}

export interface Respaldo {
  id: string;
  idCertificacion: string;
  tipo: string;
  archivoKey: string;
  fechaSubida: string | null;
}

export interface PerfilCompleto {
  formacionAcademica: Registro[];
  experienciaLaboral: Registro[];
  certificaciones: Registro[];
}

type Fila = Record<string, unknown>;

// Las fechas de la BD llegan como Date: se devuelven como AAAA-MM-DD
function aTextoFecha(valor: unknown): unknown {
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : valor;
}

// Fila de la BD -> objeto de la API
export function filaARegistro(seccion: Seccion, fila: Fila): Registro {
  const registro: Registro = {
    id: fila[COLUMNA_ID] as string,
    idTitulado: fila[COLUMNA_TITULADO] as string,
    fechaCreacion: aTextoFecha(fila[COLUMNA_FECHA_CREACION] ?? null) as string | null,
  };
  for (const [campoApi, columna] of Object.entries(COLUMNAS[seccion])) {
    registro[campoApi] = aTextoFecha(fila[columna] ?? null);
  }
  return registro;
}

// Datos de la API -> columnas y valores para el SQL (ignora campos que no son de la sección)
export function datosAColumnas(
  seccion: Seccion,
  datos: object,
): { columnas: string[]; valores: unknown[] } {
  const columnas: string[] = [];
  const valores: unknown[] = [];
  for (const [campoApi, columna] of Object.entries(COLUMNAS[seccion])) {
    if (campoApi in datos) {
      columnas.push(columna);
      valores.push((datos as Fila)[campoApi] ?? null);
    }
  }
  return { columnas, valores };
}

export function filaARespaldo(fila: Fila): Respaldo {
  return {
    id: fila[COLUMNA_ID] as string,
    idCertificacion: fila[COLUMNAS_RESPALDO.idCertificacion] as string,
    tipo: fila[COLUMNAS_RESPALDO.tipo] as string,
    archivoKey: fila[COLUMNAS_RESPALDO.archivoKey] as string,
    fechaSubida: (fila[COLUMNAS_RESPALDO.fechaSubida] ?? null) as string | null,
  };
}