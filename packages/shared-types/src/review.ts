export type ReviewDecision = 'APPROVED' | 'OBSERVED' | 'REJECTED';

export type ApplicationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'OBSERVED'
  | 'REJECTED';

export type CreateReviewRequest = {
  decision: ReviewDecision;
  category?: string; // obligatoria si OBSERVED o REJECTED
  note?: string; // de 10 a 500 caracteres si OBSERVED o REJECTED
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