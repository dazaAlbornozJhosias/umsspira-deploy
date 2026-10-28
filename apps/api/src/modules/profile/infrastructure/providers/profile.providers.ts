import type { Provider } from '@nestjs/common';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
} from '../../application/ports/profile-repository.port';
import {
  BACKUP_LINK_SIGNER,
  type BackupLinkSigner,
} from '../../application/ports/backup-link-signer.port';
import { PrismaProfileRepository } from '../repositories/prisma-profile.repository';
import { HmacBackupLinkSigner } from '../security/hmac-backup-link-signer';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { CreateEducationUseCase } from '../../application/use-cases/create-education.use-case';
import { CreateExperienceUseCase } from '../../application/use-cases/create-experience.use-case';
import { CreateCertificationUseCase } from '../../application/use-cases/create-certification.use-case';
import { GetProfileRecordUseCase } from '../../application/use-cases/get-profile-record.use-case';
import { UpdateProfileRecordUseCase } from '../../application/use-cases/update-profile-record.use-case';
import { DeleteProfileRecordUseCase } from '../../application/use-cases/delete-profile-record.use-case';
import { ReadCertificationBackupUseCase } from '../../application/use-cases/read-certification-backup.use-case';
import { ExportProfileUseCase } from '../../application/use-cases/export-profile.use-case';
import { UploadCertificationBackupUseCase } from '../../application/use-cases/upload-certification-backup.use-case';
import { CreateBackupLinkUseCase } from '../../application/use-cases/create-backup-link.use-case';
import { ReadSignedBackupUseCase } from '../../application/use-cases/read-signed-backup.use-case';
import { GetProfessionalDescriptionUseCase } from '../../application/use-cases/get-professional-description.use-case';
import { SaveProfessionalDescriptionUseCase } from '../../application/use-cases/save-professional-description.use-case';

export const profileProviders: Provider[] = [
  PrismaProfileRepository,
  { provide: PROFILE_REPOSITORY, useExisting: PrismaProfileRepository },
  HmacBackupLinkSigner,
  { provide: BACKUP_LINK_SIGNER, useExisting: HmacBackupLinkSigner },
  {
    provide: GetProfileUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new GetProfileUseCase(repository),
  },
  {
    provide: CreateEducationUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new CreateEducationUseCase(repository),
  },
  {
    provide: CreateExperienceUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new CreateExperienceUseCase(repository),
  },
  {
    provide: CreateCertificationUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new CreateCertificationUseCase(repository),
  },
  {
    provide: GetProfileRecordUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new GetProfileRecordUseCase(repository),
  },
  {
    provide: UpdateProfileRecordUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new UpdateProfileRecordUseCase(repository),
  },
  {
    provide: DeleteProfileRecordUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new DeleteProfileRecordUseCase(repository),
  },
  {
    provide: ReadCertificationBackupUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new ReadCertificationBackupUseCase(repository),
  },
  {
    provide: ExportProfileUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new ExportProfileUseCase(repository),
  },
  {
    provide: UploadCertificationBackupUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) => new UploadCertificationBackupUseCase(repository),
  },
  {
    provide: CreateBackupLinkUseCase,
    inject: [PROFILE_REPOSITORY, BACKUP_LINK_SIGNER],
    useFactory: (repository: ProfileRepository, signer: BackupLinkSigner) =>
      new CreateBackupLinkUseCase(repository, signer),
  },
  {
    provide: ReadSignedBackupUseCase,
    inject: [PROFILE_REPOSITORY, BACKUP_LINK_SIGNER],
    useFactory: (repository: ProfileRepository, signer: BackupLinkSigner) =>
      new ReadSignedBackupUseCase(repository, signer),
  },
  {
    provide: GetProfessionalDescriptionUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) =>
      new GetProfessionalDescriptionUseCase(repository),
  },
  {
    provide: SaveProfessionalDescriptionUseCase,
    inject: [PROFILE_REPOSITORY],
    useFactory: (repository: ProfileRepository) =>
      new SaveProfessionalDescriptionUseCase(repository),
  },
];
