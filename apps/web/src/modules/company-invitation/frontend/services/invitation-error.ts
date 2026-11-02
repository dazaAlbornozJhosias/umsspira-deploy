// Formato del token: 32 bytes en base64url = 43 caracteres (debe coincidir con el backend).
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type InvitationFailureReason = 'invalid' | 'expired' | 'used' | 'unavailable' | 'validation';

export class InvitationError extends Error {
  constructor(
    public readonly reason: InvitationFailureReason,
    message: string,
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}