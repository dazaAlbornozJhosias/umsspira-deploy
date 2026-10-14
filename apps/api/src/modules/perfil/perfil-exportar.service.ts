import { PerfilResumen, PerfilResumenService, ResumenRepositorio } from './perfil-resumen.service';

export interface ExportacionPerfil {
  contenido: string;
  nombreArchivo: string;
}

// Nombre usado en el archivo cuando el repositorio todavía no entrega el nombre del titulado
const NOMBRE_POR_DEFECTO = 'titulado';

// "Carlos Mendoza Ríos" -> "carlos_mendoza_rios"
export function nombreParaArchivo(nombre: string | null | undefined): string {
  const limpio = (nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return limpio || NOMBRE_POR_DEFECTO;
}

function fechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

// T5.3: perfil_[nombre_titulado]_[fecha_exportacion].json
export function nombreArchivoExportacion(nombre: string | null | undefined, fecha: Date): string {
  return `perfil_${nombreParaArchivo(nombre)}_${fechaISO(fecha)}.json`;
}

// T5.2 y T5.3: arma el JSON del perfil reutilizando la consulta de T3.1 (PerfilResumenService)
export class PerfilExportarService {
  private readonly resumen: PerfilResumenService;

  constructor(repositorio: ResumenRepositorio) {
    this.resumen = new PerfilResumenService(repositorio);
  }

  async exportar(tituladoId: string, ahora: Date = new Date()): Promise<ExportacionPerfil> {
    const perfil: PerfilResumen = await this.resumen.obtenerResumen(tituladoId);
    const documento = { fechaExportacion: fechaISO(ahora), ...perfil };

    return {
      // Indentación de 2 espacios
      contenido: JSON.stringify(documento, null, 2),
      nombreArchivo: nombreArchivoExportacion(perfil.titulado.nombre, ahora),
    };
  }
}
