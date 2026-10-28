import type { ApplicationPeriod } from '../../domain/policies/application-period.policy';
export interface SubmitRegistrationInput {
  sessionToken: string;
  fechaTitulacion?: string;
  fechaIngreso?: string;
  deseaMentor: boolean;
  tipoDocumento: string;
  rutaStorage: string;
  sizeBytes: number;
  mimeType?: string;
}

export interface IssueEmailCodeInput {
  email?: string;
  registrationId: string;
}

export interface VerifyEmailCodeInput extends IssueEmailCodeInput {
  code: string;
}

export interface UploadRegistrationDocumentInput {
  sessionToken: string;
  tipoDocumento: string;
}

export interface ActivateRegistrationInput {
  applicationId: string;
  activationToken: string;
  password: string;
}

export interface UploadedDocument {
  originalname: string;
  buffer: Buffer;
  size: number;
}

export interface ReviewInput {
  decision: 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';
  category?: string;
  note?: string;
}

export interface ApplicationQuery {
  page: number;
  pageSize: number;
  career?: string;
  status?: 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';
  search?: string;
  age?: 'within48' | 'over48';
  period?: ApplicationPeriod;
  year?: number;
  from?: string;
  to?: string;
}

export interface Notification {
  to: string;
  subject: string;
  text: string;
}

export interface UpdateObservedDataUseCaseInput {
  expectedVersion: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  carreraId: string;
  anioEgreso: number;
  deseaMentor?: boolean;
  fechaTitulacion?: string | null;
  fechaIngreso?: string | null;
}
