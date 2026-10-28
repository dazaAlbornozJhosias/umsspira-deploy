import type { ActorContext } from '../../src/shared/security/contexts/actor-context';
import type { Credential } from '../../src/modules/auth/domain/entities/credential.entity';
import type { AuthSession } from '../../src/modules/auth/domain/entities/auth-session.entity';
import type { CredentialRepository } from '../../src/modules/auth/application/ports/credential-repository.port';
import type {
  SessionRepository,
  RotationResult,
} from '../../src/modules/auth/application/ports/session-repository.port';
import type { UserReader } from '../../src/modules/user/application/ports/user-reader.port';
import { ROLE_PERMISSIONS } from '../../src/modules/user/domain/policies/access.policy';
import {
  DEMO_ACCOUNTS,
  DEMO_CAREER_ID,
  DEMO_COMPANY_ID,
  DEMO_GRADUATE_ID,
} from '../../scripts/seed/demo-accounts';

interface TestUser {
  actor: ActorContext;
  credential: Credential;
  enabled: boolean;
}

export class InMemoryAuthStore implements CredentialRepository, SessionRepository, UserReader {
  readonly users = new Map<string, TestUser>();
  readonly sessions = new Map<string, AuthSession>();
  readonly refreshes = new Map<string, { sessionId: string; consumed: boolean }>();

  constructor(private readonly hashes: ReadonlyMap<string, string>) {
    this.reset();
  }

  reset(): void {
    this.users.clear();
    this.sessions.clear();
    this.refreshes.clear();
    for (const account of DEMO_ACCOUNTS) {
      this.users.set(account.id, {
        enabled: true,
        credential: {
          userId: account.id,
          email: account.email,
          passwordHash: this.hashes.get(account.email)!,
          version: 1,
        },
        actor: {
          id: account.id,
          email: account.email,
          name: account.name,
          role: account.role,
          credentialVersion: 1,
          permissions: [...ROLE_PERMISSIONS[account.role]],
          scopes: {
            companyIds: account.role === 'empresa' ? [DEMO_COMPANY_ID] : [],
            graduateId: account.role === 'titulado' ? DEMO_GRADUATE_ID : null,
            careerIds: account.role === 'administrador' ? [DEMO_CAREER_ID] : [],
          },
        },
      });
    }
  }

  async findByEmail(email: string): Promise<Credential | null> {
    const user = [...this.users.values()].find((item) => item.credential.email === email);
    return user ? { ...user.credential } : null;
  }

  async findActor(userId: string): Promise<ActorContext | null> {
    const user = this.users.get(userId);
    return user?.enabled ? structuredClone(user.actor) : null;
  }

  async rehash(credential: Credential, hash: string): Promise<void> {
    const current = this.users.get(credential.userId)?.credential;
    if (
      current?.version === credential.version &&
      current.passwordHash === credential.passwordHash
    ) {
      current.passwordHash = hash;
    }
  }

  async changePassword(credential: Credential, hash: string, now: Date): Promise<boolean> {
    const user = this.users.get(credential.userId);
    if (
      !user ||
      user.credential.version !== credential.version ||
      user.credential.passwordHash !== credential.passwordHash
    ) {
      return false;
    }
    user.credential.passwordHash = hash;
    user.credential.version++;
    user.actor.credentialVersion++;
    await this.revokeAll(credential.userId, now);
    return true;
  }

  async create(session: AuthSession, refreshHash: string): Promise<boolean> {
    const user = this.users.get(session.userId);
    if (!user?.enabled || user.credential.version !== session.credentialVersion) {
      return false;
    }
    this.sessions.set(session.id, { ...session });
    this.refreshes.set(refreshHash, { sessionId: session.id, consumed: false });
    return true;
  }

  async find(id: string): Promise<AuthSession | null> {
    return this.sessions.get(id) ?? null;
  }

  async findRefresh(sessionId: string, hash: string) {
    const token = this.refreshes.get(hash);
    const session = this.sessions.get(sessionId);
    return token?.sessionId === sessionId && session ? { session, consumed: token.consumed } : null;
  }

  async rotate(
    sessionId: string,
    oldHash: string,
    newHash: string,
    now: Date,
  ): Promise<RotationResult> {
    const session = this.sessions.get(sessionId);
    const token = this.refreshes.get(oldHash);
    if (
      !session ||
      !token ||
      token.sessionId !== sessionId ||
      session.revokedAt ||
      session.expiresAt <= now
    ) {
      return 'invalid';
    }
    if (token.consumed) {
      session.revokedAt = now;
      return 'reused';
    }
    token.consumed = true;
    session.renewedAt = now;
    this.refreshes.set(newHash, { sessionId, consumed: false });
    return 'rotated';
  }

  async revoke(id: string, userId: string, now: Date, _reason: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session || session.userId !== userId || session.revokedAt) {
      return false;
    }
    session.revokedAt = now;
    return true;
  }

  async revokeAll(userId: string, now: Date): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = now;
      }
    }
  }

  async list(userId: string, now: Date): Promise<AuthSession[]> {
    return [...this.sessions.values()]
      .filter(
        (session) => session.userId === userId && !session.revokedAt && session.expiresAt > now,
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 100);
  }
}
