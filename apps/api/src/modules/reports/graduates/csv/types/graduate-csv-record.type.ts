export type GraduateCsvStatus = 'VERIFICADO' | 'OBSERVADO';

export interface GraduateCsvRecord {
  numero: number;
  numeroRegistro: string;
  nombreCompleto: string;
  codigoSis: string;
  telefono: string;
  correoElectronico: string;
  fechaIngreso: string;
  fechaTitulacion: string;
  duracionEstudio: string;
  fechaRevision: string;
  motivoRechazo: string;
  estado: GraduateCsvStatus;
}
