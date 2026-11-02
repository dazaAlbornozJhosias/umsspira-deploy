import type { ApplicationStatus } from './registration';

export interface ApplicationDetail {
  reviewSummary?: {
    observations: number; maxObservations: number; rejections: number; maxRejections: number;
    latestObservation: string | null; canObserve: boolean;
  };
  currentReviewer?: { name: string | null; email: string };
  id: string;
  code: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  ci: string;
  issuedIn: string;
  sisCode: string;
  career: string;
  careerId: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  phone: string;
  graduationYear: number | null;
  documentName: string;
  documentPath: string | null;
  documentFormat: string;
  reviewAuthor?: {
  id: string;
  name: string | null;
  email: string;
  reviewedAt: string;
  } | null;
}

export interface ApplicationPage {
  items: ApplicationDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApplicationMetrics {
  receivedToday: number;
  pending: number;
  urgent: number;
  resolvedToday: number;
  generatedAt: string;
  timeZone: string;
}

export interface ReviewResult {
  id: string;
  applicationId: string;
  decision: Exclude<ApplicationStatus, 'PENDIENTE'>;
  status: Exclude<ApplicationStatus, 'PENDIENTE'>;
  category: string | null;
  note: string | null;
  reviewedBy: string;
  reviewedByName: string | null;
  reviewedByEmail: string;
  reviewedAt: string;
  notificationStatus: 'EN_COLA';
}
