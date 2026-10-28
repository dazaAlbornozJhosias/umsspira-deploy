import type {
  RegistrationData,
  RegistrationDraft,
  RegistrationFile,
} from '../../domain/entities/registration';
import type { SubmitRegistrationInput } from '../contracts/registration-inputs';

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY');

export interface RegistrationRepository {
  listCareers(): Promise<{ id: string; nombre: string | null }[]>;
  createDraft(tokenHash: string, data: RegistrationData, expiresAt: Date): Promise<void>;
  updateDraft(tokenHash: string, data: RegistrationData): Promise<{ verifiedEmail: string | null }>;
  draftDocument(tokenHash: string): Promise<RegistrationFile>;
  findDraft(tokenHash: string): Promise<RegistrationDraft | null>;
  issueCode(
    tokenHash: string,
    hash: string,
    encryptedMail: string,
    expectedEmail?: string,
  ): Promise<string>;
  verifyCode(tokenHash: string, candidateHash: string, expectedEmail?: string): Promise<string>;
  saveFile(tokenHash: string, file: Omit<RegistrationFile, 'draftId'>): Promise<void>;
  submit(
    tokenHash: string,
    input: SubmitRegistrationInput,
  ): Promise<{ id: string; estado: string }>;
}
