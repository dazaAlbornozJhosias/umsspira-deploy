import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher.port';

const OPTIONS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;

export class Argon2PasswordHasher implements PasswordHasher {
  private readonly dummy = argon2.hash(randomBytes(32), OPTIONS);

  hash(password: string): Promise<string> {
    return argon2.hash(password, OPTIONS);
  }
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, OPTIONS);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    // También se calcula Argon2 cuando el correo no existe: no se omite su coste.
    const dummy = await this.dummy;
    const valid = await argon2.verify(hash ?? dummy, password);
    return hash !== null && valid;
  }
}
