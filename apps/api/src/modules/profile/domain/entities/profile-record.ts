import type { ProfessionalDescription } from './professional-description';

export const PROFILE_SECTIONS = [
  'formacion-academica',
  'experiencia-laboral',
  'certificaciones',
] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export interface ProfileRecordBase {
  id: string;
  graduateId: string;
  createdAt: Date | null;
}

export interface EducationRecord extends ProfileRecordBase {
  kind: 'education';
  institution: string;
  title: string;
  degree: string | null;
  graduationYear: number;
}

export interface ExperienceRecord extends ProfileRecordBase {
  kind: 'experience';
  company: string;
  position: string;
  startDate: Date;
  endDate: Date | null;
}

export interface CertificationRecord extends ProfileRecordBase {
  kind: 'certification';
  name: string;
  issuer: string;
  degree: string;
  issuedYear: number | null;
  backup: CertificationBackup | null;
}

export interface CertificationBackup {
  id: string;
  certificationId: string;
  kind: string;
  key: string;
  uploadedAt: Date | null;
}

export type ProfileRecord = EducationRecord | ExperienceRecord | CertificationRecord;

export interface ProfileSnapshot {
  graduate: {
    id: string;
    name: string | null;
    career: string | null;
    cohort: null;
  };
  education: EducationRecord[];
  experience: ExperienceRecord[];
  certifications: CertificationRecord[];
  description: ProfessionalDescription;
}
