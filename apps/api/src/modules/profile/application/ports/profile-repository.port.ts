import type { StoredFile } from '../../../../shared/files/contracts/uploaded-file';
import type {
  CertificationBackup,
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecord,
  ProfileSection,
  ProfileSnapshot,
} from '../../domain/entities/profile-record';
import type { ProfessionalDescription } from '../../domain/entities/professional-description';
import type {
  CertificationInput,
  EducationInput,
  ExperienceInput,
  ProfileChange,
  ProfileScope,
} from '../contracts/profile-inputs';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface BackupOwner {
  graduateId: string;
  userId: string | null;
  hasBackup: boolean;
}

export interface ProfileRepository {
  summary(scope: ProfileScope): Promise<ProfileSnapshot>;
  createEducation(scope: ProfileScope, input: EducationInput): Promise<EducationRecord>;
  createExperience(scope: ProfileScope, input: ExperienceInput): Promise<ExperienceRecord>;
  createCertification(scope: ProfileScope, input: CertificationInput): Promise<CertificationRecord>;
  find(scope: ProfileScope, section: ProfileSection, id: string): Promise<ProfileRecord>;
  update(scope: ProfileScope, id: string, change: ProfileChange): Promise<ProfileRecord>;
  remove(scope: ProfileScope, section: ProfileSection, id: string): Promise<void>;
  saveBackup(
    scope: ProfileScope,
    certificationId: string,
    file: StoredFile,
  ): Promise<CertificationBackup>;
  readBackup(scope: ProfileScope, certificationId: string): Promise<StoredFile>;
  findBackupOwner(certificationId: string): Promise<BackupOwner | null>;
  readBackupFile(certificationId: string): Promise<StoredFile>;
  findDescription(scope: ProfileScope): Promise<ProfessionalDescription>;
  // Actualiza la fila de perfil_area del titulado o la crea sin área; no recalcula el radar (Épica 3)
  saveDescription(scope: ProfileScope, text: string): Promise<ProfessionalDescription>;
}
