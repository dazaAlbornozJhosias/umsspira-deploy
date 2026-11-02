import type { UserReader } from '../../../user/application/ports/user-reader.port';
import {
  RECOVERY_EMAIL_LIMIT,
  RECOVERY_LINK_MINUTES,
  RECOVERY_ORIGIN_LIMIT,
  RECOVERY_WINDOW_MS,
  recoveryExpiry,
} from '../../domain/policies/password-recovery.policy';
import type { PasswordRecoveryOptions } from '../contracts/password-recovery-options';
import type { CredentialRepository } from '../ports/credential-repository.port';
import type {
  PasswordRecoveryRepository,
  RecoveryRequestResult,
} from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';

export const RECOVERY_MAIL_SUBJECT = 'Restablece tu contraseña de UMSSPIRA';

export function recoveryMailBody(link: string): string {
  return [
    'Hola,',
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en UMSSPIRA.',
    '',
    `Abre este enlace para elegir una nueva contraseña. Vence en ${RECOVERY_LINK_MINUTES} minutos y solo puede usarse una vez:`,
    link,
    '',
    'Si no fuiste tú, ignora este correo: tu contraseña no cambiará.',
  ].join('\n');
}

// Solicita el enlace de recuperación (CA-12.1 a CA-12.4).
// Nunca revela si la cuenta existe, si está activa o si se superó el límite: el resultado es siempre el mismo.
export class RequestPasswordRecoveryUseCase {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly users: UserReader,
    private readonly repository: PasswordRecoveryRepository,
    private readonly tokens: TokenService,
    private readonly options: PasswordRecoveryOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { email: string; origin: string }): Promise<void> {
    const now = this.now();
    const originHash = this.tokens.fingerprint(`recovery-origin:${input.origin}`);
    const counts = await this.repository.countRecentRequests(
      input.email,
      originHash,
      new Date(now.getTime() - RECOVERY_WINDOW_MS),
    );
    if (counts.byEmail >= RECOVERY_EMAIL_LIMIT || counts.byOrigin >= RECOVERY_ORIGIN_LIMIT) {
      await this.record(input, originHash, null, 'rechazado_rate', now);
      return;
    }

    // Sin cuenta de acceso (por ejemplo, sin activar) se trata igual que un correo inexistente.
    const credential = await this.credentials.findByEmail(input.email);
    if (!credential) {
      await this.record(input, originHash, null, 'rechazado_no_existe', now);
      return;
    }
    const actor = await this.users.findActor(credential.userId);
    if (!actor) {
      await this.record(input, originHash, credential.userId, 'rechazado_inactivo', now);
      return;
    }

    const token = this.tokens.secret();
    const link = `${this.options.webBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const issued = await this.repository.issue({
      userId: credential.userId,
      email: credential.email,
      tokenHash: this.tokens.fingerprint(token),
      expiresAt: recoveryExpiry(now),
      subject: RECOVERY_MAIL_SUBJECT,
      body: recoveryMailBody(link),
      now,
    });
    // Si otra solicitud simultánea ya creó el enlace, no se crea otro ni se informa distinto.
    await this.record(input, originHash, credential.userId, issued ? 'solicitado' : 'rechazado_rate', now);
  }

  private record(
    input: { email: string },
    originHash: string,
    userId: string | null,
    result: RecoveryRequestResult,
    at: Date,
  ): Promise<void> {
    return this.repository.recordRequest({ email: input.email, originHash, userId, result, at });
  }
}