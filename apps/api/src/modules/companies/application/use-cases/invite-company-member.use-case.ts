import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { AccessError } from '../../../../shared/security/errors/access-error';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { CompanyNotFoundError } from '../../domain/errors/company-not-found.error';
import { InvitationEmailInUseError } from '../../domain/errors/company-invitation.errors';
import type { InvitationMailComposer } from '../contracts/create-company-invitation.input';
import type { CompanyMemberInvitationRepository } from '../ports/company-member-invitation-repository.port';
import { generateInvitationToken, INVITATION_VALIDITY_DAYS } from '../security/invitation-token';

export interface InviteCompanyMemberInput {
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Reclutador';
}

export class InviteCompanyMemberUseCase {
  constructor(
    private readonly repository: CompanyMemberInvitationRepository,
    private readonly composeMail: InvitationMailComposer,
    private readonly webUrl: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, companyId: string, input: InviteCompanyMemberInput) {
    if (actor.role !== 'empresa' || !actor.scopes.companyIds.includes(companyId)) {
      throw new AccessError('FORBIDDEN');
    }
    const companyName = await this.repository.findCompanyName(companyId);
    if (companyName === null) {
      throw new CompanyNotFoundError();
    }
    const name = input.nombre.trim();
    const email = input.correo.trim().toLowerCase();
    const role = input.rol === 'Administrador' ? 'administrador' : 'reclutador';
    const { token, tokenHash } = generateInvitationToken();
    const base = this.webUrl.replace(/\/+$/, '');
    const mail = this.composeMail({
      companyName,
      activationUrl: `${base}/company-invitation/${token}`,
      logoUrl: `${base}/umsspira-logo.png`,
    });
    const createdAt = this.now();
    const result = await this.repository.create({
      companyId,
      actorId: actor.id,
      name,
      email,
      role,
      tokenHash,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + INVITATION_VALIDITY_DAYS * 86400000),
      mail: { to: email, ...mail },
    });
    if (result.status === 'forbidden') {
      throw new AccessError('FORBIDDEN');
    }
    if (result.status === 'company_not_found') {
      throw new CompanyNotFoundError();
    }
    if (result.status === 'email_in_use') {
      throw new InvitationEmailInUseError(email);
    }
    if (result.status === 'already_member' || result.status === 'pending') {
      throw new BusinessRuleError(
        'conflict',
        'COMPANY_MEMBER_INVITATION_CONFLICT',
        result.status === 'already_member'
          ? 'Este usuario ya pertenece a la empresa'
          : 'Ya existe una invitación pendiente para este correo',
      );
    }
    return {
      id: result.invitationId,
      id_usuario: null,
      nombre: name,
      correo: email,
      rol: input.rol,
      estado: 'Pendiente' as const,
      esTitular: false,
    };
  }
}
