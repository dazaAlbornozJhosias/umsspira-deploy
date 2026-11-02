export interface ObservedApplicationObservation {
  categoria: string | null;
  justificacion: string | null;
  fecha: string | null;
}

export interface ObservedApplicationDocument {
  id: string;
  nombre: string;
  tipoDocumento: string;
  mime: string;
  sizeBytes: number;
}

export interface ObservedApplicationDetail {
  id: string;
  version: number;
  nombres: string;
  apellidos: string;
  ci: string;
  complementoCi?: string;
  expedidoEn: string;
  codigoSis: string;
  correo: string;
  telefono: string;
  carreraId: string;
  anioEgreso: number;
  deseaMentor: boolean;
  fechaTitulacion?: string | null;
  fechaIngreso?: string | null;
  observacion: ObservedApplicationObservation;
  documento: ObservedApplicationDocument | null;
}

export interface UpdateObservedDataResponse {
  id: string;
  version: number;
  requiresEmailVerification: boolean;
  message: string;
}

export interface ReplaceObservedDocumentResponse {
  id: string;
  documentoId: string;
  nombre: string;
  tipoDocumento: string;
  sizeBytes: number;
  message: string;
}

export interface SubmitCorrectionResponse {
  id: string;
  estado: string;
  version: number;
  message: string;
}
