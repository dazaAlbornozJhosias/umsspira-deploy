import type {
  DashboardMetrics,
  GraduateReport,
  GraduateReportPage,
  GraduateReportRecord,
} from '../../domain/entities/graduate-report';
import {
  careerDuration,
  reportDate,
  REPORT_LABELS,
} from '../../domain/policies/report-format.policy';

export function presentMetrics(metrics: DashboardMetrics) {
  return {
    totalGraduates: metrics.totalApplications,
    verifiedGraduates: metrics.approvedApplications,
    observedGraduates: metrics.observedApplications,
    activeMentors: metrics.activeMentors,
  };
}

export function presentGraduate(record: GraduateReportRecord) {
  return {
    id: record.id,
    idCarrera: record.careerId,
    carrera: record.careerName,
    nombre: record.firstName,
    apellido: record.lastName,
    telefono: record.phone,
    email: record.email,
    fechaTitulacion: record.graduationDate?.toISOString().slice(0, 10) ?? null,
    fechaIngreso: record.admissionDate?.toISOString().slice(0, 10) ?? null,
    ci: record.identityNumber,
    extensionCi: record.identityComplement,
    expedidoEn: record.issuedIn,
    anioEgreso: record.graduationYear,
    codSis: record.sisCode,
    deseaMentor: record.wantsMentorship,
    estado: record.status,
    fechaCreacion: record.submittedAt?.toISOString() ?? null,
    fechaRevision: record.reviewedAt?.toISOString() ?? null,
    justificacion: record.justification,
  };
}

export function presentGraduatePage(page: GraduateReportPage) {
  return {
    items: page.records.map(presentGraduate),
    total: page.total,
    page: page.page,
    limit: page.limit,
    totalPages: Math.ceil(page.total / page.limit),
  };
}

export function presentReport(report: GraduateReport) {
  return {
    careerNames: report.careerNames,
    status: report.status,
    total: report.records.length,
    generatedAt: report.generatedAt.toISOString(),
    graduates: report.records.map((record, index) => ({
      number: index + 1,
      id: record.id,
      fullName: record.lastName + ', ' + record.firstName,
      career: record.careerName,
      sisCode: record.sisCode,
      phone: record.phone,
      email: record.email,
      admissionDate: reportDate(record.admissionDate),
      graduationDate: reportDate(record.graduationDate),
      careerDuration: careerDuration(record.admissionDate, record.graduationDate),
      statusDate: reportDate(record.reviewedAt),
      status: record.status,
      statusLabel: REPORT_LABELS[record.status],
      justification: record.justification,
    })),
  };
}
