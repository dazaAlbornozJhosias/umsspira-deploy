import type { Credential } from '../../domain/entities/credential.entity';
export const CREDENTIAL_REPOSITORY = Symbol('CREDENTIAL_REPOSITORY');
export interface CredentialRepository {
  findByEmail(email: string): Promise<Credential | null>;
  rehash(credential: Credential, hash: string): Promise<void>;
  changePassword(credential: Credential, hash: string, now: Date): Promise<boolean>;
}
