export interface RegistrationData {
  nombres: string;
  apellidos: string;
  ci: string;
  complementoCi: string;
  expedidoEn: 'LP' | 'CB' | 'SC' | 'OR' | 'PT' | 'TJ' | 'CH' | 'BE' | 'PD' | 'EX';
  correo: string;
  telefono: string;
  carreraId: string;
  anioEgreso: number;
  codigoSis: string;
}

export interface RegistrationDraft {
  id: string;
  data: RegistrationData;
  expiresAt: Date;
  verified: boolean;
  applicationId: string | null;
}

export interface RegistrationFile {
  id: string;
  draftId: string;
  documentType: string;
  name: string;
  mime: string;
  bytes: Uint8Array;
  size: number;
}

export type ApplicationStatus = 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';
