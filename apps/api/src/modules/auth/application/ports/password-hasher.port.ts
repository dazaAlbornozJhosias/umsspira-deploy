export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string | null): Promise<boolean>;
  needsRehash(hash: string): boolean;
}
