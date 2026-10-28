export const REPORT_STATUSES = ['PENDIENTE', 'APROBADA', 'OBSERVADA', 'RECHAZADA'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface GraduateReportRecord {
  id: string;
  careerId: string;
  careerName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityNumber: string;
  identityComplement: string;
  issuedIn: string;
  sisCode: string;
  graduationYear: number | null;
  admissionDate: Date | null;
  graduationDate: Date | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  justification: string | null;
  wantsMentorship: boolean;
  status: ReportStatus;
}

export interface GraduateReportPage {
  records: GraduateReportRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardMetrics {
  totalApplications: number;
  approvedApplications: number;
  observedApplications: number;
  activeMentors: number;
}

export interface GraduateReport {
  records: GraduateReportRecord[];
  careerNames: string[];
  status: ReportStatus | null;
  generatedAt: Date;
}
