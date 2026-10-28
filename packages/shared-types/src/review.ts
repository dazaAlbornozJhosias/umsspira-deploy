export type ReviewDecision = 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';

export type ApplicationStatus =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'OBSERVADA'
  | 'RECHAZADA';

export type CreateReviewRequest = {
  decision: ReviewDecision;
  category?: string; // obligatoria si OBSERVADA o RECHAZADA
  note?: string; // de 10 a 500 caracteres si OBSERVADA o RECHAZADA
  notifyDean?: boolean;
};

export type ReviewResponse = {
  id: string;
  applicationId: string;
  decision: ReviewDecision;
  status: ApplicationStatus;
  category: string | null;
  note: string | null;
  reviewedBy: string;
  reviewedAt: string; // fecha en formato ISO
};