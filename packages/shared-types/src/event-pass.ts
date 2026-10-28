export type EventPassStatus = 'ACTIVO' | 'INVALIDADO' | 'VENCIDO';

export interface EventPassQrPayload {
  v: 1;
  token: string;
}

export interface EventPassDto {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrToken: string;
  status: EventPassStatus;
  isValidForAccess: boolean;
  issuedAt: string;
  expiresAt: string | null;
}