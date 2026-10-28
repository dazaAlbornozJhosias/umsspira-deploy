import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class RenewActivationUseCase {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(actor: ActorContext, id: string) {
    const detail = await this.repository.find(actor, id);
    const code = this.security.code();
    await this.repository.renewActivation(
      actor,
      id,
      this.security.hash('activation', id + ':' + code),
      this.security.seal({
        to: detail.email,
        subject: 'Nuevo código de activación UMSSPIRA',
        text:
          'Activa tu cuenta con la solicitud ' +
          id +
          ' y el código ' +
          code +
          '. Vence en 24 horas. El código anterior queda invalidado.',
      }),
    );
    return { notificationStatus: 'EN_COLA', expiresInSeconds: 86400 };
  }
}
