import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AccessError } from '../../../../shared/security/errors/access-error';
import type { AccessClaims } from '../../application/contracts/access-claims';
import type { TokenService } from '../../application/ports/token-service.port';
import { refreshTokenSchema } from '../schemas/refresh-token.schema';

const claimsSchema = z.object({
  sub: z.uuid(),
  sid: z.uuid(),
  ver: z.number().int().positive(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
  jti: z.uuid(),
});

export interface JwtOptions {
  secret: string;
  issuer: string;
  audience: string;
  accessSeconds: number;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly options: JwtOptions) {}
  id(): string {
    return randomUUID();
  }
  secret(): string {
    return randomBytes(32).toString('base64url');
  }
  fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  matches(value: string, fingerprint: string): boolean {
    if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(this.fingerprint(value), 'hex'),
      Buffer.from(fingerprint, 'hex'),
    );
  }

  readRefreshSessionId(token: string): string {
    const result = refreshTokenSchema.safeParse(token.split('.'));
    if (!result.success) {
      throw new AccessError('UNAUTHENTICATED');
    }
    return result.data.sessionId;
  }

  issueAccess(claims: AccessClaims): string {
    return jwt.sign({ sid: claims.sessionId, ver: claims.credentialVersion }, this.options.secret, {
      algorithm: 'HS256',
      header: { alg: 'HS256', typ: 'at+jwt' },
      issuer: this.options.issuer,
      audience: this.options.audience,
      subject: claims.userId,
      jwtid: randomUUID(),
      expiresIn: this.options.accessSeconds,
    });
  }

  verifyAccess(token: string): AccessClaims {
    if (token.length > 4096) {
      throw new AccessError('UNAUTHENTICATED');
    }
    try {
      const verified = jwt.verify(token, this.options.secret, {
        algorithms: ['HS256'],
        issuer: this.options.issuer,
        audience: this.options.audience,
        complete: true,
        clockTolerance: 5,
        maxAge: this.options.accessSeconds,
      });
      if (verified.header.typ !== 'at+jwt') {
        throw new Error('Tipo de token inválido');
      }
      const claims = claimsSchema.parse(verified.payload);
      return { userId: claims.sub, sessionId: claims.sid, credentialVersion: claims.ver };
    } catch {
      throw new AccessError('UNAUTHENTICATED');
    }
  }
}
